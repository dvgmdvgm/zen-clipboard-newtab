// ==UserScript==
// @name           Tab Clicks
// @description    Right-click the new tab button to open the clipboard in a new tab; double-click any tab to close it. Both are toggled in the mod settings.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenClipboardNewTab) return;
  window.__zenClipboardNewTab = true;

  // Read on every click, so toggling in Sine settings applies without a restart.
  const on = (pref) => Services.prefs.getBoolPref(`zen-clipboard-newtab.${pref}`, true);

  const NEW_TAB_BUTTONS = '#tabs-newtab-button, #vertical-tabs-newtab-button, #new-tab-button';

  // Same path Firefox uses for middle-click paste on the new tab button (BrowserCommands.openTab).
  window.addEventListener('contextmenu', (e) => {
    if (e.shiftKey || !e.target.closest?.(NEW_TAB_BUTTONS) || !on('rmb-paste')) return; // Shift+right-click keeps the usual menu
    let text = readFromClipboard();
    if (typeof UrlbarShared !== 'undefined') text = UrlbarShared.stripUnsafeProtocolOnPaste(text);
    text = text.replace(/\s*[\r\n]+\s*/g, ' ').trim();
    if (!text) return; // empty clipboard: show the usual menu
    e.preventDefault();
    e.stopPropagation();
    openTrustedLinkIn(text, 'tab', { allowThirdPartyFixup: true });
  }, true);

  // Right-click the Zen menu button opens Settings, as in Chrome; Shift+right-click keeps the toolbar menu.
  window.addEventListener('contextmenu', (e) => {
    if (e.shiftKey || !e.target.closest?.('#PanelUI-menu-button') || !on('menu-rmb-settings')) return;
    e.preventDefault();
    e.stopPropagation();
    openPreferences();
  }, true);

  // Captured on the window, so it runs before the tab's own handler and Zen's rename-on-double-click.
  const SKIP = '.tab-close-button, .tab-icon-overlay, .tab-audio-button, .tab-reset-button, .tab-reset-pin-button, input';
  window.addEventListener('dblclick', (e) => {
    if (e.button !== 0 || !on('dblclick-close')) return;
    const tab = e.target.closest?.('.tabbrowser-tab');
    if (!tab || e.target.closest(SKIP) || tab.closing) return;
    e.preventDefault();
    e.stopPropagation();
    gBrowser.removeTab(tab, { animate: true, triggeringEvent: e });
  }, true);
})();
