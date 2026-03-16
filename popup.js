/**
 * Dark Study Mode - Popup Script
 *
 * Manages the popup UI state: reads settings from chrome.storage,
 * handles toggle changes, and manages the site blacklist.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM References ──────────────────────────────────────────────
  const videoDarkModeToggle = document.getElementById('videoDarkMode');
  const pdfDarkModeToggle   = document.getElementById('pdfDarkMode');
  const blacklistToggle     = document.getElementById('blacklistSite');
  const currentSiteLabel    = document.getElementById('currentSite');
  const statusDot           = document.getElementById('statusDot');
  const statusText          = document.getElementById('statusText');

  let currentHostname = '';

  // ─── Get the Current Tab's Hostname ──────────────────────────────
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        currentHostname = url.hostname;
        currentSiteLabel.textContent = currentHostname;
      } catch {
        currentSiteLabel.textContent = 'N/A';
      }
    } else {
      currentSiteLabel.textContent = 'N/A';
    }

    // Load settings after we have the hostname
    loadSettings();
  });

  // ─── Load Settings from Storage ──────────────────────────────────
  function loadSettings() {
    chrome.storage.sync.get({
      videoDarkMode: true,
      pdfDarkMode: true,
      blacklist: []
    }, (settings) => {
      videoDarkModeToggle.checked = settings.videoDarkMode;
      pdfDarkModeToggle.checked   = settings.pdfDarkMode;

      // Check if current site is blacklisted
      const isBlacklisted = settings.blacklist.some(domain =>
        currentHostname === domain || currentHostname.endsWith('.' + domain)
      );
      blacklistToggle.checked = isBlacklisted;

      updateStatus(settings.videoDarkMode, settings.pdfDarkMode, isBlacklisted);
    });
  }

  // ─── Update Status Indicator ─────────────────────────────────────
  function updateStatus(videoOn, pdfOn, isBlacklisted) {
    if (isBlacklisted) {
      statusDot.classList.add('inactive');
      statusText.classList.add('inactive');
      statusText.textContent = 'Disabled on This Site';
    } else if (videoOn || pdfOn) {
      statusDot.classList.remove('inactive');
      statusText.classList.remove('inactive');
      statusText.textContent = 'Active';
    } else {
      statusDot.classList.add('inactive');
      statusText.classList.add('inactive');
      statusText.textContent = 'All Filters Off';
    }
  }

  // ─── Video Dark Mode Toggle Handler ──────────────────────────────
  videoDarkModeToggle.addEventListener('change', () => {
    const enabled = videoDarkModeToggle.checked;
    chrome.storage.sync.set({ videoDarkMode: enabled }, () => {
      updateStatus(enabled, pdfDarkModeToggle.checked, blacklistToggle.checked);

      // Update badge on active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.runtime.sendMessage({
            action: 'updateBadge',
            tabId: tabs[0].id,
            isEnabled: enabled || pdfDarkModeToggle.checked
          });
        }
      });
    });
  });

  // ─── PDF Dark Mode Toggle Handler ────────────────────────────────
  pdfDarkModeToggle.addEventListener('change', () => {
    const enabled = pdfDarkModeToggle.checked;
    chrome.storage.sync.set({ pdfDarkMode: enabled }, () => {
      updateStatus(videoDarkModeToggle.checked, enabled, blacklistToggle.checked);
    });
  });

  // ─── Blacklist Toggle Handler ────────────────────────────────────
  blacklistToggle.addEventListener('change', () => {
    const shouldBlacklist = blacklistToggle.checked;

    chrome.storage.sync.get({ blacklist: [] }, (settings) => {
      let blacklist = settings.blacklist;

      if (shouldBlacklist) {
        // Add to blacklist if not already present
        if (!blacklist.includes(currentHostname)) {
          blacklist.push(currentHostname);
        }
      } else {
        // Remove from blacklist
        blacklist = blacklist.filter(d => d !== currentHostname);
      }

      chrome.storage.sync.set({ blacklist }, () => {
        updateStatus(videoDarkModeToggle.checked, pdfDarkModeToggle.checked, shouldBlacklist);
      });
    });
  });
});
