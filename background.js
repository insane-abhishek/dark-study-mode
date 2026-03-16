/**
 * Dark Study Mode - Background Service Worker (MV3)
 *
 * Handles:
 * - Keyboard shortcut commands (Alt+D to toggle video dark mode)
 * - Extension installation defaults
 * - Badge updates to show extension status
 */

// Firefox compatibility polyfill
if (typeof browser === "undefined") {
  var browser = chrome;
}

// ─── Set default settings on installation ─────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      videoDarkMode: true,
      pdfDarkMode: true,
      blacklist: []
    }, () => {
      console.log('[Dark Study Mode] Default settings initialized.');
    });
  }
});

// ─── Handle keyboard shortcut commands ────────────────────────────────
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-dark-video') {
    // Send toggle message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleVideoDarkMode' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[Dark Study Mode] Could not reach content script:', chrome.runtime.lastError.message);
            return;
          }

          if (response) {
            // Update badge to reflect current state
            updateBadge(tabs[0].id, response.videoDarkMode);
          }
        });
      }
    });
  }
});

// ─── Update extension badge to show status ────────────────────────────
function updateBadge(tabId, isEnabled) {
  const text = isEnabled ? 'ON' : 'OFF';
  const color = isEnabled ? '#6C5CE7' : '#636e72';

  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// ─── Listen for messages from popup ───────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    updateBadge(message.tabId, message.isEnabled);
    sendResponse({ success: true });
  }
  return true;
});
