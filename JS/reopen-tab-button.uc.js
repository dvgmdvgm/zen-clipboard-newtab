// ==UserScript==
// @name           Reopen Tab Button
// @description    Adds a "Reopen closed tab" button to Customize Toolbar.
// @include        main
// ==/UserScript==

(() => {
  const ID = 'zen-reopen-closed-tab-button';
  // Widgets are app-wide: the first window registers it, later windows get their instance from CustomizableUI.
  if (CustomizableUI.getWidget(ID)?.provider === CustomizableUI.PROVIDER_API) return;
  CustomizableUI.createWidget({
    id: ID,
    type: 'button',
    label: 'Reopen closed tab',
    tooltiptext: 'Reopen closed tab (Ctrl+Shift+T)',
    onCreated: (node) => { node.style.listStyleImage = 'url("chrome://global/skin/icons/undo.svg")'; },
    // The Ctrl+Shift+T command: finds the window the tab was closed in (undoCloseTab(window) only looks at the current one).
    onCommand: (e) => e.target.ownerDocument.getElementById('History:RestoreLastClosedTabOrWindowOrSession').doCommand(),
  });
})();
