# Tab Clicks — Sine mod for Zen Browser

Two tab tweaks, each with its own on/off switch in the mod settings (Sine → Tab Clicks → settings). Switching applies immediately.

- **Right-click the new tab button** → a new tab opens with the clipboard: a URL opens directly, other text is searched with your default engine (the private-window engine in private windows). Empty clipboard or Shift+right-click shows the usual menu.
- **Double-click any tab** → it closes (active or not). The close, audio and icon buttons keep their own behaviour. While this is on, Zen's rename-on-double-click is replaced; rename from the tab context menu instead.

Works with `#tabs-newtab-button`, `#vertical-tabs-newtab-button` and `#new-tab-button` (Zen 1.22).

## Install

1. In Zen: Settings → Sine → "add your own locally from a GitHub repo" → `dvgmdvgm/zen-clipboard-newtab` → Install.
2. Open `about:config`, set `sine.allow-unsafe-js` to `true` — otherwise Sine runs JS only from store mods.
3. Restart Zen.

Already installed an older version: Sine → Check for Updates, then restart Zen.

Offline alternative: close Zen and run `powershell -ExecutionPolicy Bypass -File install.ps1` in this folder, then do steps 2–3.

Disabling the whole mod takes effect after a restart; the two switches apply at once.
