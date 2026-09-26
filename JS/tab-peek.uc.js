// ==UserScript==
// @name           Tab Peek
// @description    In the collapsed sidebar, hovering a tab slides its title out beside it, styled like the tab itself; split views and folders slide out whole.
// @include        main
// ==/UserScript==

(() => {
  if (window.__zenTabPeek) return;
  window.__zenTabPeek = true;

  const HTML = 'http://www.w3.org/1999/xhtml';
  const GAP = 6; // space between the tab and its pill, so Zen's own tab decorations stay untouched
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

  // ---- Reading the theme off the live tab ----

  // Canvas normalises any CSS color the engine knows into #rrggbb or rgba(...).
  const ctx = make('canvas').getContext('2d');
  function rgba(color) {
    ctx.fillStyle = '#00000000';
    ctx.fillStyle = color;
    const v = ctx.fillStyle;
    if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)).concat(1);
    const n = v.match(/[\d.]+/g)?.map(Number);
    return n?.length === 4 ? n : [0, 0, 0, 0];
  }

  // Theme base for fully transparent sidebars: resolve the theme's own surface color, else follow light/dark.
  function themeBase() {
    const probe = make('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;background-color:var(--zen-colors-tertiary, var(--toolbar-bgcolor))';
    document.documentElement.append(probe);
    const c = rgba(getComputedStyle(probe).backgroundColor);
    probe.remove();
    if (c[3] > 0.5) return [c[0], c[1], c[2], 1];
    return matchMedia('(prefers-color-scheme: dark)').matches ? [31, 31, 35, 1] : [245, 245, 247, 1];
  }

  // Themes fade a tab's hover border and glow in (Neo Zen: ~0.6s). Read where a running transition is
  // heading, not where it is, so the pill shows the finished look at once and the tab keeps its fade.
  const KEYFRAME_META = new Set(['offset', 'computedOffset', 'easing', 'composite']);
  function endStyle(el) {
    const s = getComputedStyle(el);
    const end = {};
    for (const a of el.getAnimations()) {
      for (const [k, v] of Object.entries(a.effect?.getKeyframes().at(-1) || {})) if (!KEYFRAME_META.has(k)) end[k] = v;
    }
    return new Proxy(s, { get: (t, k) => (k in end ? end[k] : t[k]) });
  }

  // The pill floats over web content, so it needs a solid fill: stack the tab's (often translucent)
  // background over its ancestors' until the result is opaque.
  function solidBackground(el) {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = rgba(endStyle(e).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 0.99) break;
    }
    if (!layers.length || layers.at(-1)[3] < 0.99) layers.push(themeBase());
    let [r, g, b] = layers.pop();
    for (const [lr, lg, lb, a] of layers.reverse()) {
      r = lr * a + r * (1 - a); g = lg * a + g * (1 - a); b = lb * a + b * (1 - a);
    }
    return [r, g, b].map(Math.round);
  }

  // WCAG contrast ratio between two [r, g, b] colors.
  function contrast(a, b) {
    const lum = ([r, g, b]) => {
      const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Keep the theme's text color; if the stacked fill doesn't read with it, fall back to the theme
  // surface, and only as a last resort pick black or white text.
  function readable(bg, text) {
    const fg = rgba(text).slice(0, 3);
    if (contrast(bg, fg) >= 3) return [bg, text];
    const base = themeBase().slice(0, 3);
    if (contrast(base, fg) >= 3) return [base, text];
    return [bg, contrast(bg, [0, 0, 0]) > contrast(bg, [255, 255, 255]) ? '#000' : '#fff'];
  }
  const css = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

  // bg is what draws the tab on screen: its .tab-background, or a split view's shared container.
  function lookOf(bg, tab) {
    const s = endStyle(bg);
    const label = endStyle(tab.querySelector('.tab-label') || tab);
    const visible = (style, width, color) => style !== 'none' && parseFloat(width) > 0 && rgba(color)[3] > 0;
    let border = `1px solid color-mix(in srgb, ${label.color} 22%, transparent)`;
    if (visible(s.borderTopStyle, s.borderTopWidth, s.borderTopColor)) border = `${s.borderTopWidth} solid ${s.borderTopColor}`;
    else if (visible(s.outlineStyle, s.outlineWidth, s.outlineColor)) border = `${s.outlineWidth} solid ${s.outlineColor}`;
    const [fill, color] = readable(solidBackground(bg), label.color);
    return {
      rect: bg.getBoundingClientRect(),
      css: {
        background: css(fill),
        border,
        borderRadius: s.borderRadius,
        boxShadow: (s.boxShadow !== 'none' ? s.boxShadow + ', ' : '') + '0 6px 18px rgba(0, 0, 0, .28)',
        color,
        fontFamily: label.fontFamily,
        fontSize: label.fontSize,
        fontWeight: label.fontWeight,
      },
    };
  }

  // ---- The pill ----

  let shown = [], units = [], hovered = null, hideTimer = 0;
  const texts = new Map(); // tab -> its title span in the pill

  // A split view or a folder slides out whole; collapsed folder children have no height and are skipped.
  function tabsFor(tab) {
    const list = (tab.group?.tabs || []).filter((t) => !t.hidden && t.getBoundingClientRect().height > 0);
    return list.length ? list : [tab];
  }

  // One pill per thing Zen draws as one tab: a lone tab, or a whole split view (one shared container).
  function unitsOf(tabs) {
    const units = [];
    for (const tab of tabs) {
      const split = tab.group?.hasAttribute('split-view-group') ? tab.group : null;
      const last = units.at(-1);
      if (split && last?.split === split) last.tabs.push(tab);
      else units.push({ split, tabs: [tab], box: split?.groupContainer });
    }
    return units;
  }

  // A split pill spans the container but wears a tab's own background, where themes put their
  // border and glow: the hovered tab's, else the selected one's, else the first's.
  const bgOf = (tab) => tab.querySelector('.tab-background') || tab;
  function lookFor(unit) {
    const tab = unit.tabs.find((t) => t === hovered) || unit.tabs.find((t) => t.selected) || unit.tabs[0];
    const look = lookOf(bgOf(tab), tab);
    if (unit.box) {
      look.rect = unit.box.getBoundingClientRect();
      look.css.borderRadius = tabRadius(bgOf(tab));
    }
    return look;
  }


  // Themes give tabs radii far above their height (Neo Zen: 50px), which a tab clips to a full round
  // end; a split pill is taller, so clip the radius the way a single tab row shows it.
  function tabRadius(face) {
    const lone = [...gBrowser.tabContainer.querySelectorAll('.tabbrowser-tab:not([zen-essential], tab-group[split-view-group] *) .tab-background')]
      .find((e) => e.getBoundingClientRect().height > 0) || face;
    return Math.min(parseFloat(getComputedStyle(lone).borderTopLeftRadius) || 0, lone.getBoundingClientRect().height / 2) + 'px';
  }

  // Tabs inside a folder or split view are boxed differently from a lone tab (a split's inner tab
  // backgrounds are inset in a shared container), so line pills up on the sidebar column instead:
  // the outermost folder/group box sits where a lone tab does, centred the same way.
  function rightEdge(unit, rect) {
    let outer = null;
    for (let e = unit.tabs[0].parentElement; e && e !== gBrowser.tabContainer; e = e.parentElement) {
      if (e.matches('tab-group, zen-folder')) outer = e;
    }
    if (!outer) return rect.right;
    const o = outer.getBoundingClientRect();
    return o.left + o.width / 2 + rect.width / 2;
  }

  function line(tab) {
    const l = make('div', 'peek-line');
    const text = make('span', 'peek-text');
    text.textContent = tab.label;
    texts.set(tab, text);
    l.append(text);
    l.addEventListener('click', () => { gBrowser.selectedTab = tab; });
    l.addEventListener('auxclick', (e) => { if (e.button === 1) gBrowser.removeTab(tab, { animate: true }); });
    l.addEventListener('contextmenu', (e) => e.preventDefault());
    return l;
  }

  function show(tab) {
    const tabs = tabsFor(tab);
    const open = !peek.hidden && !peek.classList.contains('closing');
    const prev = hovered;
    hovered = tab;
    if (open && tabs.length === shown.length && tabs.every((t, i) => t === shown[i])) {
      // Same pill, another tab in it: the hover look moves rows (the pill's CSS fades it across).
      if (prev !== tab) units.forEach((u, i) => Object.assign(peek.children[i].style, lookFor(u).css));
      return;
    }
    shown = tabs;

    units = unitsOf(tabs);
    const looks = units.map(lookFor);
    const top = Math.min(...looks.map((l) => l.rect.top));
    const right = Math.max(...units.map((u, i) => rightEdge(u, looks[i].rect)));
    let prevBottom = top;
    texts.clear();
    peek.replaceChildren(...units.map((u, i) => {
      const { rect, css } = looks[i];
      const r = make('div', 'peek-row');
      Object.assign(r.style, css, { height: rect.height + 'px', marginTop: rect.top - prevBottom + 'px' });
      r.append(...u.tabs.map(line));
      prevBottom = rect.bottom;
      return r;
    }));

    const from = open ? peek.getBoundingClientRect().width : 0;
    peek.hidden = false;
    peek.classList.remove('closing');
    peek.style.left = right + GAP + 'px';
    peek.style.top = top + 'px';
    peek.style.width = 'max-content';
    const to = peek.getBoundingClientRect().width;
    peek.style.width = from + 'px';
    peek.getBoundingClientRect(); // commit the start width so the change animates
    peek.style.width = to + 'px';
  }

  function hide(now = false) {
    clearTimeout(hideTimer);
    if (peek.hidden) return;
    if (now) { peek.hidden = true; shown = []; return; }
    peek.classList.add('closing');
    peek.style.width = '0px';
    hideTimer = setTimeout(() => { peek.hidden = true; peek.classList.remove('closing'); shown = []; }, 180);
  }
  const hideSoon = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 160); };

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
  // Title changes update in place; a new selection restyles the rows.
  gBrowser.tabContainer.addEventListener('TabAttrModified', (e) => {
    const text = texts.get(e.target);
    if (text) text.textContent = e.target.label;
  });
  gBrowser.tabContainer.addEventListener('TabSelect', () => {
    if (peek.hidden || peek.classList.contains('closing')) return;
    shown = [];
    show(hovered);
  });
})();
