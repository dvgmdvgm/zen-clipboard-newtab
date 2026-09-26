// ==UserScript==
// @name           Mini Media Player
// @description    Mirrors the mini player switch onto the window, where userChrome.css picks it up.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenMediaMini) return;
  window.__zenMediaMini = true;

  // CSS from a Sine mod is loaded from file://, where -moz-pref() media queries don't apply, so the switch travels as an attribute.
  const PREF = 'zen-clipboard-newtab.media-mini';
  const sync = () => document.documentElement.toggleAttribute('tab-tweaks-media-mini', Services.prefs.getBoolPref(PREF, true));
  sync();
  Services.prefs.addObserver(PREF, sync);
  window.addEventListener('unload', () => Services.prefs.removeObserver(PREF, sync));
})();
