# Tab Tweaks — Sine mod for Zen Browser

Four tweaks, each with its own on/off switch in the mod settings (Sine → Tab Tweaks → settings). Switching applies immediately.

- **Right-click the new tab button** → a new tab opens with the clipboard: a URL opens directly, other text is searched with your default engine (the private-window engine in private windows). Empty clipboard or Shift+right-click shows the usual menu.
- **Double-click any tab** → it closes (active or not). The close, audio and icon buttons keep their own behaviour. While this is on, Zen's rename-on-double-click is replaced; rename from the tab context menu instead.
- **Collapsed sidebar: hover a tab** → its title slides out in a pill beside it. A split view or a folder slides out whole. Click a title to switch to that tab, middle-click it to close. The pill never covers the tab, so Zen's own close button, dragging and the right-click menu stay as they are. Its look is read from the tab at hover time — background, border, corner radius, height, font and text color — so it follows whatever theme or mods you use; translucent tabs are blended into a solid fill, with a readable fallback from the theme.
- **Press and hold the reload button** → a menu, as in Chrome: *Normal reload* (Ctrl+R), *Hard reload* (Ctrl+Shift+R, bypasses the cache), *Empty cache and hard reload* (clears the browser's whole cache, then hard-reloads). A plain click still reloads as before.

Works with `#tabs-newtab-button`, `#vertical-tabs-newtab-button` and `#new-tab-button` (Zen 1.22).

## Install

1. In Zen: Settings → Sine → "add your own locally from a GitHub repo" → `dvgmdvgm/zen-clipboard-newtab` → Install.
2. Open `about:config`, set `sine.allow-unsafe-js` to `true` — otherwise Sine runs JS only from store mods.
3. Restart Zen.

Already installed an older version: Sine → Check for Updates, then restart Zen.

Offline alternative: close Zen and run `powershell -ExecutionPolicy Bypass -File install.ps1` in this folder, then do steps 2–3.

Disabling the whole mod takes effect after a restart; the switches apply at once.
