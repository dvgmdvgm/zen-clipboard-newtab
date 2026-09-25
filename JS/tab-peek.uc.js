// ==UserScript==
// @name           Tab Peek
// @description    In the collapsed sidebar, hovering a tab unfolds it into a pill with its title (the tab itself stays visible); split views and folders unfold as a whole.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenTabPeek) return;
  window.__zenTabPeek = true;

  const HTML = 'http://www.w3.org/1999/xhtml';
  const enabled = () => Services.prefs.getBoolPref('zen-clipboard-newtab.tab-peek', true);
  const collapsed = () => document.documentElement.getAttribute('zen-sidebar-expanded') !== 'true';
  const make = (tag, cls) => {
    const e = document.createElementNS(HTML, tag);
    if (cls) e.className = cls;
    return e;
  };

  const peek = make('div');
  peek.id = 'zen-tab-peek';
  peek.hidden = true;
  document.documentElement.append(peek);

  let shown = [], hideTimer = 0;

  // A split view or a folder unfolds as a whole; collapsed folder children have no height and are skipped.
  function tabsFor(tab) {
    const list = (tab.group?.tabs || []).filter((t) => !t.hidden && t.getBoundingClientRect().height > 0);
    return list.length ? list : [tab];
  }

  function row(tab, rect, gap, iconWidth) {
    const r = make('div', 'peek-row');
    r.style.height = rect.height + 'px';
    r.style.marginTop = gap + 'px';
    r.toggleAttribute('selected', tab.selected);

    // The icon part is see-through and lets the pointer through: the real tab, with Zen's own
    // close button, stays visible and clickable underneath.
    const icon = make('div', 'peek-icon');
    icon.style.width = iconWidth + 'px';

    const label = make('span', 'peek-label');
    label.textContent = tab.label;
    label.addEventListener('click', () => { gBrowser.selectedTab = tab; });
    label.addEventListener('auxclick', (e) => { if (e.button === 1) gBrowser.removeTab(tab, { animate: true }); });
    label.addEventListener('contextmenu', (e) => e.preventDefault());
    r.append(icon, label);
    return r;
  }

  function show(tab) {
    const tabs = tabsFor(tab);
    if (!peek.hidden && !peek.classList.contains('closing') && tabs.length === shown.length && tabs.every((t, i) => t === shown[i])) return;
    shown = tabs;

    const rects = tabs.map((t) => t.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top));
    const left = Math.min(...rects.map((r) => r.left));
    const iconWidth = Math.max(...rects.map((r) => r.width));
    let prevBottom = top;
    peek.replaceChildren(...tabs.map((t, i) => {
      const r = row(t, rects[i], rects[i].top - prevBottom, iconWidth);
      prevBottom = rects[i].bottom;
      return r;
    }));
    peek.classList.toggle('group', tabs.length > 1);
    peek.style.setProperty('--peek-icon', iconWidth + 'px');

    const wasOpen = !peek.hidden && !peek.classList.contains('closing');
    const from = wasOpen ? peek.getBoundingClientRect().width : iconWidth;
    peek.hidden = false;
    peek.classList.remove('closing');
    peek.style.left = left + 'px';
    peek.style.top = top + 'px';
    peek.style.width = 'max-content';
    const to = peek.getBoundingClientRect().width;
    peek.style.width = from + 'px';
    peek.getBoundingClientRect(); // commit the start width so the change animates
    peek.style.width = to + 'px';
    peek.dataset.iconWidth = iconWidth;
  }

  function hide(now = false) {
    clearTimeout(hideTimer);
    if (peek.hidden) return;
    if (now) { peek.hidden = true; shown = []; return; }
    peek.classList.add('closing');
    peek.style.width = peek.dataset.iconWidth + 'px';
    hideTimer = setTimeout(() => { peek.hidden = true; peek.classList.remove('closing'); shown = []; }, 180);
  }
  const hideSoon = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 140); };

  window.addEventListener('mouseover', (e) => {
    if (peek.contains(e.target)) return clearTimeout(hideTimer);
    const tab = e.target.closest?.('.tabbrowser-tab');
    if (tab && enabled() && collapsed() && tab.closest('#navigator-toolbox')) {
      clearTimeout(hideTimer);
      return show(tab);
    }
    if (!peek.hidden) hideSoon();
  }, true);
  window.addEventListener('mouseout', (e) => { if (!e.relatedTarget && !peek.hidden) hideSoon(); }, true);

  // Anything that moves or changes the tabs under the pill makes it stale.
  for (const type of ['wheel', 'dragstart', 'resize']) window.addEventListener(type, () => hide(true), true);
  for (const type of ['TabClose', 'TabMove']) gBrowser.tabContainer.addEventListener(type, () => hide(true));
  // Title, icon or selection changed: redraw in place.
  for (const type of ['TabSelect', 'TabAttrModified']) gBrowser.tabContainer.addEventListener(type, (e) => {
    if (peek.hidden || peek.classList.contains('closing')) return;
    if (type === 'TabAttrModified' && !shown.includes(e.target)) return;
    const first = shown[0];
    shown = [];
    show(first);
  });
})();
