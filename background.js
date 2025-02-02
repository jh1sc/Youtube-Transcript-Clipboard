chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('youtube.com')) {
        chrome.storage.local.get(['transcriptButtonVisible'], (result) => {
            // If no stored value, treat as visible
            const currentState = result.transcriptButtonVisible === undefined ? true : result.transcriptButtonVisible;
            const newState = !currentState;
            
            chrome.storage.local.set({ transcriptButtonVisible: newState }, () => {
                // Send message to content script to update button visibility
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'toggleVisibility', 
                    isVisible: newState 
                });
            });
        });
    }
});