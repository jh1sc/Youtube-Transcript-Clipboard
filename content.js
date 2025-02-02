let transcript = '';
let buttonContainer = null;

// Check visibility state on load
chrome.storage.local.get(['transcriptButtonVisible'], (result) => {
    // If it's the first time (undefined), set to visible
    const isVisible = result.transcriptButtonVisible === undefined ? true : result.transcriptButtonVisible;
    if (result.transcriptButtonVisible === undefined) {
        chrome.storage.local.set({ transcriptButtonVisible: true });
    }
    if (isVisible) {
        retrieveTranscript();
    }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleVisibility') {
        if (message.isVisible) {
            retrieveTranscript();
        } else if (buttonContainer) {
            buttonContainer.style.display = 'none';
        }
    }
});

function retrieveTranscript() {
    const videoId = new URLSearchParams(window.location.search).get('v');
    const YT_INITIAL_PLAYER_RESPONSE_RE =
        /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
    let player = window.ytInitialPlayerResponse;
    if (!player || videoId !== player.videoDetails?.videoId) {
        fetch('https://www.youtube.com/watch?v=' + videoId)
            .then(function (response) {
                return response.text();
            })
            .then(function (body) {
                const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
                if (!playerResponse) {
                    console.warn('Unable to parse playerResponse');
                    return;
                }
                player = JSON.parse(playerResponse[1]);
                const tracks = player.captions.playerCaptionsTracklistRenderer.captionTracks;
                tracks.sort(compareTracks);

                fetch(tracks[0].baseUrl + '&fmt=json3')
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (transcriptData) {
                        const parsedTranscript = transcriptData.events
                            .filter(function (x) {
                                return x.segs;
                            })
                            .map(function (x) {
                                return x.segs
                                    .map(function (y) {
                                        return y.utf8;
                                    })
                                    .join(' ');
                            })
                            .join(' ')
                            .replace(/[\u200B-\u200D\uFEFF]/g, '')
                            .replace(/\s+/g, ' ');

                        transcript = parsedTranscript;
                        createOrUpdateCopyButton();
                    });
            });
    }
}

function compareTracks(track1, track2) {
    const langCode1 = track1.languageCode;
    const langCode2 = track2.languageCode;

    if (langCode1 === 'en' && langCode2 !== 'en') {
        return -1;
    } else if (langCode1 !== 'en' && langCode2 === 'en') {
        return 1;
    } else if (track1.kind !== 'asr' && track2.kind === 'asr') {
        return -1;
    } else if (track1.kind === 'asr' && track2.kind !== 'asr') {
        return 1;
    }
    return 0;
}

function createOrUpdateCopyButton() {
    let copyButton = document.getElementById('transcript-copy-button');
    
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.id = 'transcript-button-container';
        buttonContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 8px;
        `;
        document.body.appendChild(buttonContainer);
    }

    if (!copyButton) {
        copyButton = document.createElement('button');
        copyButton.id = 'transcript-copy-button';
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span style="margin-left: 8px">Copy Transcript</span>
        `;

        copyButton.style.cssText = `
            padding: 10px 16px;
            background-color: #065fd4;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        `;

        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.backgroundColor = '#0056bf';
            copyButton.style.transform = 'translateY(-1px)';
            copyButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.backgroundColor = '#065fd4';
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });

        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(transcript);
                const originalContent = copyButton.innerHTML;
                copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style="margin-left: 8px">Copied!</span>
                `;
                setTimeout(() => {
                    copyButton.innerHTML = originalContent;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy transcript:', err);
                copyButton.innerText = 'Failed to copy';
                setTimeout(() => {
                    copyButton.innerHTML = originalContent;
                }, 2000);
            }
        });

        buttonContainer.appendChild(copyButton);
    }
}

// Listen for navigation events (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        chrome.storage.local.get(['transcriptButtonVisible'], (result) => {
            if (result.transcriptButtonVisible !== false) {
                retrieveTranscript();
            }
        });
    }
}).observe(document, { subtree: true, childList: true });