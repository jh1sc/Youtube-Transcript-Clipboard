# Youtube-Transcript-Clipboard
A Chrome extension that allows you to copy YouTube video transcripts to your clipboard with one click.

## Features
- Toggle the visibility of the transcript copy button.
- Fetch and display the video transcript on YouTube.
- Copy the transcript to the clipboard with a single click.

## Installation
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the folder containing the extension files.

## How It Works
- Once installed, the extension will display a "Copy Transcript" button on YouTube videos that have captions.
- Click the button to copy the transcript to your clipboard.
- You can toggle the visibility of the button by clicking the extension icon in the toolbar.

## Permissions
- `activeTab`: Allows the extension to interact with the currently active tab.
- `scripting`: Executes scripts to modify the webpage.
- `clipboardWrite`: Enables copying text to the clipboard.
- `storage`: Stores settings such as button visibility state.
