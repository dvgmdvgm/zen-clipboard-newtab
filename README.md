# Clipboard New Tab — Sine mod for Zen Browser

Right-click the new tab button → a new tab opens with what is in the clipboard: a URL opens directly, any other text is searched with your default search engine (the private-window engine in private windows). Empty clipboard or Shift+right-click shows the usual context menu.

Works on `#tabs-newtab-button`, `#vertical-tabs-newtab-button` and `#new-tab-button` (Zen 1.22).

## Install

1. In Zen: Settings → Sine → "add your own locally from a GitHub repo" → `dvgmdvgm/zen-clipboard-newtab` → Install.
2. Open `about:config`, set `sine.allow-unsafe-js` to `true` — otherwise Sine runs JS only from store mods.
3. Restart Zen.

Offline alternative: close Zen and run `powershell -ExecutionPolicy Bypass -File install.ps1` in this folder, then do step 2–3.

Disabling the mod takes effect after a restart.
