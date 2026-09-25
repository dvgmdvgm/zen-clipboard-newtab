// ==UserScript==
// @name           Clipboard New Tab
// @description    Right-click the new tab button to open the clipboard in a new tab: a URL opens, other text is searched.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenClipboardNewTab) return;
  window.__zenClipboardNewTab = true;

  const BUTTONS = '#tabs-newtab-button, #vertical-tabs-newtab-button, #new-tab-button';

  // Same path Firefox uses for middle-click paste on the new tab button (BrowserCommands.openTab).
  window.addEventListener('contextmenu', (e) => {
    if (e.shiftKey || !e.target.closest?.(BUTTONS)) return; // Shift+right-click keeps the usual menu
    let text = readFromClipboard();
    if (typeof UrlbarShared !== 'undefined') text = UrlbarShared.stripUnsafeProtocolOnPaste(text);
    text = text.replace(/\s*[\r\n]+\s*/g, ' ').trim();
    if (!text) return; // empty clipboard: show the usual menu
    e.preventDefault();
    e.stopPropagation();
    openTrustedLinkIn(text, 'tab', { allowThirdPartyFixup: true });
  }, true);
})();
