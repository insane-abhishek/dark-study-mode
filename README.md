# 🌙 Dark Study Mode — Chrome Extension

Reduce glare from bright lecture videos and white-background PDFs. Automatically applies GPU-accelerated dark mode filters so you can study comfortably in a dark environment.

---

## Features

| Feature | Description |
|---|---|
| **Video Dark Mode** | Inverts bright lecture slides in `<video>` elements across YouTube, Coursera, Udemy, and more |
| **Hover Restore** | Hover over a video to temporarily see original colors; move away to re-apply dark mode |
| **PDF Dark Mode** | Detects embedded PDFs (`<embed>`, `<iframe>`, `<object>`) and applies color inversion |
| **Keyboard Shortcut** | Press `Alt + D` to toggle video dark mode on any page |
| **Site Blacklist** | Disable the extension on specific domains via the popup |
| **Persistent Settings** | All preferences stored with `chrome.storage.sync` |

---

## Installation (Developer / Unpacked)

1. **Download or clone** this project to your computer.

2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **"Load unpacked"**.

5. Select the `dark-study-mode/` folder (the one containing `manifest.json`).

6. The extension icon will appear in your toolbar. Pin it for easy access.

---

## Testing

### Video Dark Mode
1. Go to [youtube.com](https://youtube.com) and play any lecture/presentation video.
2. The video should appear with inverted (dark) colors.
3. **Hover** over the video → original colors should restore.
4. **Move mouse away** → dark filter reapplies.
5. Press **Alt + D** → toggles the filter on/off.

### PDF Dark Mode
1. Open any page with an embedded PDF (e.g., a Google Docs PDF viewer or a site with `<embed src="file.pdf">`).
2. The PDF should appear with inverted colors for dark-mode reading.

### Popup Controls
1. Click the extension icon in the toolbar.
2. Toggle **Video Dark Mode** on/off.
3. Toggle **PDF Dark Mode** on/off.
4. Toggle **Disable on This Site** to blacklist/whitelist the current domain.

### Keyboard Shortcut
- Press `Alt + D` on any page to toggle video dark mode.
- If the shortcut conflicts with another extension, go to `chrome://extensions/shortcuts` to reassign it.

---

## Publishing to Chrome Web Store

1. **Prepare assets:**
   - 128×128 icon (already included)
   - At least one 1280×800 or 640×400 screenshot
   - A short description (40 chars) and detailed description

2. **Create a ZIP** of the `dark-study-mode/` folder:
   ```bash
   zip -r dark-study-mode.zip dark-study-mode/
   ```

3. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

4. Pay the one-time **$5 developer registration fee** (if you haven't already).

5. Click **"New Item"**, upload the ZIP, fill in listing details, and submit for review.

6. Review typically takes **1–3 business days**.

---

## Project Structure

```
dark-study-mode/
├── manifest.json      # MV3 extension manifest
├── background.js      # Service worker (shortcuts, badge, defaults)
├── content.js         # Content script (filters, detection, observer)
├── content.css        # GPU-accelerated filter CSS classes
├── popup.html         # Popup UI markup
├── popup.js           # Popup logic and storage management
├── popup.css          # Dark-themed popup styles
├── README.md          # This file
└── icons/
    ├── icon16.png     # Toolbar icon (16×16)
    ├── icon48.png     # Extensions page icon (48×48)
    └── icon128.png    # Web Store / install icon (128×128)
```

---

## Technical Notes

- **GPU Acceleration**: Filters use `will-change: filter` and `transform: translateZ(0)` to ensure GPU compositing.
- **MutationObserver**: Efficiently watches for dynamically loaded video/PDF elements without polling.
- **No Performance Impact**: Filters are CSS-only; no canvas manipulation or frame-by-frame processing.
- **Manifest V3**: Uses the modern service worker architecture (no persistent background page).

---

## License

MIT — free to use, modify, and distribute.
