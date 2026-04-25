# Omatchy 🔗

> *Your Omarchy desktop theme, alive in Hermes.*

**Omatchy** ("O-matchy") is a Hermes Agent dashboard plugin + theme pair that dynamically mirrors your [Omarchy](https://github.com/omarchy/) Linux desktop theme into the Hermes web dashboard. Change your Omarchy theme — the dashboard updates within 3 seconds. No reload. No manual config. It just follows.

Built for the **Nous Research Hermes Dashboard Pop-Up Hackathon** to showcase both **custom themes** and **dashboard plugins** working in tandem.

---

## Demo

<!-- Replace with your actual video link -->
[![Omatchy Demo](assets/demo-thumb.png)](https://youtu.be/REPLACE_ME)

> **The pitch:** Widescreen Linux desktop. Six apps. One theme. Change it in Omarchy — watch every window (including Hermes Dashboard) shift in real-time. That's Omatchy.

---

## What It Does

| Feature | Description |
|---------|-------------|
| 🔌 **Plugin** | Hidden background plugin that polls your Omarchy theme state every 3s |
| 🎨 **Theme** | Base `omatchy` theme installed in Hermes; plugin overrides it dynamically |
| ⚡ **Live Sync** | Direct CSS variable injection — no page reload, no flicker |
| 🖥️ **Omarchy-Aware** | Reads `colors.toml`, Waybar fonts, handles official + custom themes |
| 🌓 **Light/Dark** | Auto-detects luminance and adjusts midground contrast guard |
| 🔤 **Font Bridge** | Scrapes your system mono font (JetBrainsMono Nerd Font, etc.) into dashboard |

---

## Installation

```bash
# 1. Clone
git clone https://github.com/8bit64k/omatchy.git
cd omatchy

# 2. Install theme
cp theme/omatchy.yaml ~/.hermes/dashboard-themes/

# 3. Install plugin
mkdir -p ~/.hermes/plugins/omatchy/dashboard
cp plugin/manifest.json plugin/plugin_api.py ~/.hermes/plugins/omatchy/dashboard/
cp plugin/dist/index.js ~/.hermes/plugins/omatchy/dashboard/dist/

# 4. Restart Hermes dashboard
hermes dashboard

# 5. Select "Omatchy" from the theme picker (top-right)
```

> **Note:** Because the dashboard caches plugin API routes at startup, a restart is required after first install. This affects all plugins.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Omarchy Desktop                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Hyprland   │  │   Waybar    │  │  ~/.config/omarchy/...  │  │
│  │  borders    │  │   font CSS  │  │  colors.toml            │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────────┘  │
│         │                │                    │                 │
│         └────────────────┴────────────────────┘                 │
│                          │                                      │
│                    omarchy-theme-set                            │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │ writes
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hermes Agent Dashboard                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Plugin Backend  (plugin_api.py)                         │   │
│  │  • Reads ~/.config/omarchy/current/theme.name            │   │
│  │  • Reads colors.toml (current → user → stock search)     │   │
│  │  • Scrapes Waybar/Kitty/Ghostty for font-family          │   │
│  │  • Maps palette → Hermes theme JSON                      │   │
│  │  • Serves GET /api/plugins/omatchy/status                │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │ HTTP (3s poll)                      │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Plugin Frontend  (dist/index.js)                        │   │
│  │  • Hidden tab, header-right slot badge                   │   │
│  │  • Polls /status, compares omarchyTheme                  │   │
│  │  • Injects CSS variables directly into :root             │   │
│  │  • Skips React re-render if theme unchanged              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼ CSS vars                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Dashboard Chrome  (ThemeProvider + :root overrides)     │   │
│  │  • --background, --midground, --foreground               │   │
│  │  • --color-primary, --color-accent, --color-ring         │   │
│  │  • --theme-font-sans, --theme-font-mono                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Mapping Algorithm

Omarchy themes use a simple `colors.toml` (background, foreground, accent, 16 ANSI colors). Hermes themes use a layered palette (background, midground, foreground, warmGlow) plus semantic color overrides (primary, destructive, success, warning).

The bridge maps them like this:

| Omarchy | → | Hermes |
|---------|---|--------|
| `background` | | `palette.background` |
| `cursor` / `accent` | | `palette.midground` (luminance-adjusted for contrast) |
| `foreground` | | `palette.foreground` |
| `accent` | | `colorOverrides.primary`, `accent`, `ring` |
| `color1` (red) | | `colorOverrides.destructive` |
| `color2` (green) | | `colorOverrides.success` |
| `color3` (yellow) | | `colorOverrides.warning` |
| `accent` @ 22% opacity | | `palette.warmGlow` |
| Waybar `font-family` | | `typography.fontSans` + `fontMono` |

### Contrast Guard

The midground layer is tricky: on dark themes it must be lighter than background; on light themes, darker. Omatchy computes luminance and auto-adjusts:

```python
is_light = _luminance(bg) > 0.5
midground = cursor if cursor != bg else accent

if is_light and _luminance(midground) > 0.5:
    midground = _darken(midground, 0.35)
elif not is_light and _luminance(midground) < 0.5:
    midground = _lighten(midground, 0.35)

# Final safety: ensure |bg - mid| > 0.25
if abs(_luminance(bg) - _luminance(midground)) < 0.25:
    midground = _lighten(bg, 0.5) if not is_light else _darken(bg, 0.5)
```

This means **custom Omarchy themes work out of the box** — no pre-registration, no manual color tuning.

---

## Plugin API

```http
GET /api/plugins/omatchy/status
```

**Response:**

```json
{
  "omarchyTheme": "catppuccin-dark",
  "installed": true,
  "palette": {
    "background": {"hex": "#1e1e2e", "alpha": 1.0},
    "midground": {"hex": "#f5e0dc", "alpha": 1.0},
    "foreground": {"hex": "#cdd6f4", "alpha": 0.0},
    "warmGlow": "rgba(137, 180, 250, 0.22)",
    "noiseOpacity": 0.8
  },
  "typography": {
    "fontSans": "JetBrainsMono Nerd Font, system-ui, ...",
    "fontMono": "JetBrainsMono Nerd Font, ui-monospace, ...",
    "baseSize": "15px",
    "lineHeight": "1.55",
    "letterSpacing": "0"
  },
  "layout": {
    "radius": "0.5rem",
    "density": "comfortable"
  },
  "layoutVariant": "standard",
  "colorOverrides": {
    "primary": "#89b4fa",
    "primaryForeground": "#1e1e2e",
    "accent": "#89b4fa",
    "ring": "#89b4fa",
    "border": "rgba(137, 180, 250, 0.18)",
    "destructive": "#f38ba8",
    "success": "#a6e3a1",
    "warning": "#f9e2af"
  }
}
```

If Omarchy is not installed, `installed: false` and a safe fallback theme is returned so the dashboard never breaks.

---

## Frontend Strategy

Most plugins that want to change the theme would call `api.setTheme()` — but that requires the theme to be pre-registered in Hermes's theme list. Omatchy bypasses this entirely by **injecting CSS variables directly into `:root`**:

```js
const vars = {
  "--background": `color-mix(in srgb, ${bg.hex} ${bg.alpha*100}%, transparent)`,
  "--color-primary": accent,
  "--theme-font-sans": fontSans,
  // ... etc
};
for (const [k, v] of Object.entries(vars)) {
  document.documentElement.style.setProperty(k, v);
}
```

This has three advantages:
1. **Any custom Omarchy theme works instantly** — no YAML generation, no registration
2. **No React re-render storm** — CSS vars apply globally without component updates
3. **Survives dashboard navigation** — `:root` persists across route changes

The tradeoff: the theme picker still shows "Omatchy" as the active theme (the base theme), but the visual appearance is overridden by the plugin. If the plugin is disabled, the base theme remains as a safe neutral dark fallback.

---

## Why This Wins

| Hackathon Criteria | How Omatchy Delivers |
|--------------------|----------------------|
| **Custom Theme** | `omatchy.yaml` — a real, installable Hermes dashboard theme |
| **Dashboard Plugin** | Hidden slot-only plugin with backend API + frontend polling |
| **Useful** | If you use Omarchy + Hermes, this eliminates theme drift between desktop and dashboard |
| **Technical Depth** | Color science (luminance, contrast guards), direct CSS injection, multi-source font scraping |
| **Polish** | Header badge with pretty-printed theme names, hover tooltips, graceful fallback when Omarchy absent |

---

## Roadmap

- [x] v1.0 — Palette + font sync, header badge, contrast guard
- [ ] v1.1 — Hyprland border style injection (gradient borders, radius from `hyprland.conf`)
- [ ] v1.2 — Window gap / shadow density from `looknfeel.conf`
- [ ] v2.0 — **TUI skin bridge** — extend to Hermes TUI (`/skin` command) so terminal and web match
- [ ] v2.1 — Wallpaper blur/accent extraction for `warmGlow` tuning

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built with ⚡ by [8bit64k](https://github.com/8bit64k) for the Nous Research Hermes Dashboard Pop-Up Hackathon.*
