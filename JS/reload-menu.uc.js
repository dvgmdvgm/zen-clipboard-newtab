// ==UserScript==
// @name           Reload Menu
// @description    Press and hold the reload button for a menu: normal reload, hard reload, empty cache and hard reload.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenReloadMenu) return;
  window.__zenReloadMenu = true;

  const XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
  const HOLD_MS = 500; // same delay as Firefox's own back/forward click-and-hold
  const enabled = () => Services.prefs.getBoolPref('zen-clipboard-newtab.reload-menu', true);

  const popup = document.createElementNS(XUL, 'menupopup');
  popup.id = 'zen-reload-menu';
  const item = (label, key, run) => {
    const mi = document.createElementNS(XUL, 'menuitem');
    mi.setAttribute('label', label);
    if (key) mi.setAttribute('key', key); // shows the browser's own shortcut next to the label
    mi.addEventListener('command', run);
    popup.append(mi);
  };
  item('Normal reload', 'key_reload', () => BrowserCommands.reload());
  item('Hard reload', 'key_reload_skip_cache', () => BrowserCommands.reloadSkipCache());
  // Like Chrome, empties the whole cache, not just this site's: a page often loads from other origins.
  item('Empty cache and hard reload', null, () =>
    Services.clearData.deleteData(Ci.nsIClearDataService.CLEAR_ALL_CACHES, () => BrowserCommands.reloadSkipCache()));
  document.getElementById('mainPopupSet').append(popup);

  // Delegated on the window, so the button keeps working after being moved in Customize.
  let timer = 0;
  let held = false;
  const cancel = () => clearTimeout(timer);
  window.addEventListener('mousedown', (e) => {
    const button = e.target.closest?.('#reload-button');
    if (!button) return;
    held = false;
    if (e.button !== 0 || button.disabled || !enabled()) return;
    cancel();
    timer = setTimeout(() => {
      held = true;
      popup.openPopup(button, 'after_start');
    }, HOLD_MS);
    button.addEventListener('mouseleave', cancel, { once: true });
  }, true);
  window.addEventListener('mouseup', cancel, true);

  // After a hold, the release must not also reload the page.
  window.addEventListener('click', (e) => {
    if (!held || !e.target.closest?.('#reload-button')) return;
    held = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();
