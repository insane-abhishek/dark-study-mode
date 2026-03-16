/**
 * Dark Study Mode - Content Script
 * 
 * Detects video and PDF elements, applies dark-mode CSS filters,
 * handles hover-to-restore behavior, observes DOM mutations for
 * dynamically loaded content, and responds to keyboard shortcuts.
 */

// Firefox compatibility polyfill
if (typeof browser === "undefined") {
  var browser = chrome;
}

(() => {
  'use strict';

  // ─── CSS Filter Constants ───────────────────────────────────────────
  const VIDEO_FILTER = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)';
  const PDF_FILTER   = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.05)';

  // ─── State ──────────────────────────────────────────────────────────
  let settings = {
    videoDarkMode: true,
    pdfDarkMode: true,
    blacklist: []
  };

  let isBlacklisted = false;
  const processedElements = new WeakSet();

  // ─── Utility: Check if current site is blacklisted ──────────────────
  function checkBlacklist() {
    const hostname = window.location.hostname;
    isBlacklisted = settings.blacklist.some(domain => {
      // Support both exact match and subdomain matching
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  }

  // ─── Load Settings from chrome.storage ──────────────────────────────
  function loadSettings(callback) {
    chrome.storage.sync.get({
      videoDarkMode: true,
      pdfDarkMode: true,
      blacklist: []
    }, (result) => {
      settings = result;
      checkBlacklist();
      if (callback) callback();
    });
  }

  // ─── Apply dark filter to a video element ───────────────────────────
  function applyVideoFilter(video) {
    if (!settings.videoDarkMode || isBlacklisted) return;
    if (processedElements.has(video)) return;

    processedElements.add(video);

    // Apply the dark filter
    video.style.filter = VIDEO_FILTER;
    video.style.transition = 'filter 0.3s ease';

    // Hover: restore original colors temporarily
    video.addEventListener('mouseenter', () => {
      if (settings.videoDarkMode && !isBlacklisted) {
        video.style.filter = 'none';
      }
    });

    video.addEventListener('mouseleave', () => {
      if (settings.videoDarkMode && !isBlacklisted) {
        video.style.filter = VIDEO_FILTER;
      }
    });
  }

  // ─── Remove dark filter from a video element ───────────────────────
  function removeVideoFilter(video) {
    video.style.filter = '';
    video.style.transition = '';
    processedElements.delete(video);
  }

  // ─── Detect if an embed/iframe/object contains a PDF ────────────────
  function isPDFElement(element) {
    const src = element.src || element.data || '';
    const type = element.type || '';

    // Check explicit type attribute
    if (type.toLowerCase() === 'application/pdf') return true;

    // Check source URL patterns
    if (src) {
      const url = src.toLowerCase();
      if (url.endsWith('.pdf')) return true;
      if (url.includes('pdf') && (url.includes('viewer') || url.includes('render'))) return true;
      // Google Docs PDF viewer
      if (url.includes('docs.google.com') && url.includes('/viewer')) return true;
      // Chrome's built-in PDF viewer
      if (url.includes('chrome-extension://') && url.includes('pdf')) return true;
    }

    return false;
  }

  // ─── Apply dark filter to a PDF element ─────────────────────────────
  function applyPDFFilter(element) {
    if (!settings.pdfDarkMode || isBlacklisted) return;
    if (processedElements.has(element)) return;

    processedElements.add(element);

    element.style.filter = PDF_FILTER;
    element.style.transition = 'filter 0.3s ease';
  }

  // ─── Remove dark filter from a PDF element ──────────────────────────
  function removePDFFilter(element) {
    element.style.filter = '';
    element.style.transition = '';
    processedElements.delete(element);
  }

  // ─── Scan the DOM for video and PDF elements ────────────────────────
  function scanAndApply() {
    if (isBlacklisted) return;

    // Process all video elements
    if (settings.videoDarkMode) {
      document.querySelectorAll('video').forEach(applyVideoFilter);
    }

    // Process all potential PDF containers
    if (settings.pdfDarkMode) {
      const pdfSelectors = 'embed, iframe, object';
      document.querySelectorAll(pdfSelectors).forEach((el) => {
        if (isPDFElement(el)) {
          applyPDFFilter(el);
        }
      });
    }
  }

  // ─── Remove all applied filters ────────────────────────────────────
  function removeAllFilters() {
    document.querySelectorAll('video').forEach(removeVideoFilter);
    document.querySelectorAll('embed, iframe, object').forEach(removePDFFilter);
  }

  // ─── Refresh: remove and re-apply based on current settings ─────────
  function refresh() {
    // Remove filters from all elements that might have them
    document.querySelectorAll('video').forEach((video) => {
      if (processedElements.has(video)) {
        removeVideoFilter(video);
      }
    });

    document.querySelectorAll('embed, iframe, object').forEach((el) => {
      if (processedElements.has(el)) {
        removePDFFilter(el);
      }
    });

    // Re-apply based on current settings
    scanAndApply();
  }

  // ─── MutationObserver: watch for dynamically added elements ─────────
  const observer = new MutationObserver((mutations) => {
    if (isBlacklisted) return;

    let shouldScan = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if the added node IS a video/embed/iframe/object
          if (node.tagName === 'VIDEO') {
            applyVideoFilter(node);
          } else if (['EMBED', 'IFRAME', 'OBJECT'].includes(node.tagName)) {
            if (isPDFElement(node)) applyPDFFilter(node);
          }

          // Check if it CONTAINS relevant elements
          if (node.querySelector) {
            const videos = node.querySelectorAll('video');
            const pdfContainers = node.querySelectorAll('embed, iframe, object');

            if (videos.length > 0 || pdfContainers.length > 0) {
              shouldScan = true;
              break;
            }
          }
        }
      }
    }

    // If we detected nested elements, do a full targeted scan
    if (shouldScan) {
      scanAndApply();
    }
  });

  // ─── Start observing the document ───────────────────────────────────
  function startObserving() {
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // ─── Listen for settings changes from popup or background ───────────
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;

    if (changes.videoDarkMode !== undefined) {
      settings.videoDarkMode = changes.videoDarkMode.newValue;
    }
    if (changes.pdfDarkMode !== undefined) {
      settings.pdfDarkMode = changes.pdfDarkMode.newValue;
    }
    if (changes.blacklist !== undefined) {
      settings.blacklist = changes.blacklist.newValue;
      checkBlacklist();
    }

    refresh();
  });

  // ─── Listen for messages from background script ─────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleVideoDarkMode') {
      settings.videoDarkMode = !settings.videoDarkMode;

      // Persist the change
      chrome.storage.sync.set({ videoDarkMode: settings.videoDarkMode });

      refresh();
      sendResponse({ videoDarkMode: settings.videoDarkMode });
    }

    if (message.action === 'getStatus') {
      sendResponse({
        videoDarkMode: settings.videoDarkMode,
        pdfDarkMode: settings.pdfDarkMode,
        isBlacklisted: isBlacklisted,
        hostname: window.location.hostname
      });
    }

    // Return true to indicate async response
    return true;
  });

  // ─── Initialize ─────────────────────────────────────────────────────
  loadSettings(() => {
    scanAndApply();
    startObserving();
  });
})();
