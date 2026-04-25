# Omatchy Demo Video — Storyboard

> Target style: Nous Research "drop" videos — fast cuts, cinematic, terminal aesthetic
> Length: ~45–60 seconds
> Music: Electronic/ambient (user to source)

---

## Shot 1: Title Card (0:00–0:03)

**Visual:** `assets/title-card.png` — dark background, "OMATCHY" in large accent blue, subtitle centered
**Audio:** Fade in music
**Text overlay:** None (static image)

---

## Shot 2: The Desktop (0:03–0:08)

**Visual:** Wide screen capture. 3+ windows visible:
- Terminal (running `htop` or `neofetch` with catppuccin-dark colors)
- Browser (Hermes Dashboard, showing "Omatchy · Catppuccin Dark" badge)
- Editor/IDE (Zed, with catppuccin theme)
- Waybar at top showing catppuccin-dark styling
**Action:** Slow pan or static. Shows cohesive theming across all apps.
**Text overlay (ffmpeg):** `Your Omarchy theme. Everywhere.`

---

## Shot 3: The Badge (0:08–0:12)

**Visual:** Tight crop on Hermes Dashboard header-right slot
**Action:** Static. Shows 🔗 Omatchy · Catppuccin Dark badge with matching colors.
**Text overlay:** `Hermes Dashboard → Omarchy bridge active`

---

## Shot 4: Theme Switch #1 — Green CRT (0:12–0:25)

**Visual:** Split screen or full desktop
**Action:**
1. Terminal cursor blinks
2. Type: `omarchy-theme-set green-crt`
3. **Instant cut sequence:**
   - Frame 1: Terminal flashes green
   - Frame 2: Waybar shifts to green phosphor
   - Frame 3: Browser/Hermes Dashboard updates within 3s
   - Frame 4: All apps now green
**Text overlay:** `Change Omarchy...` → `...Hermes follows`
**Transition:** Fast hard cut between each frame

---

## Shot 5: Theme Switch #2 — Azure Glow (0:25–0:38)

**Visual:** Full desktop again
**Action:**
1. Type: `omarchy-theme-set azure-glow`
2. Same instant cut sequence — blue tones sweep across all windows
3. End on Hermes Dashboard showing 🔗 Omatchy · Azure Glow
**Text overlay:** `Any theme. Instant sync.`

---

## Shot 6: Technical Tease (0:38–0:45)

**Visual:** Terminal showing `cat ~/.config/omarchy/current/theme/colors.toml` on left,
`curl -s http://localhost:9119/api/plugins/omatchy/status | jq` on right
**Action:** Scroll or static. Shows the mapping in real-time.
**Text overlay:** `Direct CSS injection — no reload, no flicker`

---

## Shot 7: Outro (0:45–0:50)

**Visual:** Fade to dark. Logo + URL centered.
**Text:**
- `github.com/8bit64k/omatchy`
- `Built for Nous Research Hermes Hackathon`
- `Plugin + Theme — two features, one bridge`
**Audio:** Music fade out

---

## Recording Instructions

### Prerequisites
- ffmpeg (installed)
- Omarchy desktop running (Hyprland)
- Hermes Dashboard running on http://localhost:9119
- Omatchy plugin installed and active
- Browser open to dashboard
- Terminal open

### Quick Record
```bash
# 1. Arrange your windows (dashboard + terminal side by side or stacked)
# 2. Run:
./assets/record-demo.sh

# 3. While recording, in the terminal:
export PATH="$HOME/.local/share/omarchy/bin:$PATH"
omarchy-theme-set green-crt
# wait 5 seconds...
omarchy-theme-set azure-glow
# wait 5 seconds...
omarchy-theme-set catppuccin-dark

# 4. Press Ctrl+C to stop recording when done
```

### Post-Production Notes
- Speed up the theme transition cuts (they're instant in reality, but a 0.5s hard cut looks cinematic)
- Add text overlays in your editor of choice (DaVinci Resolve, Kdenlive, or ffmpeg drawtext)
- The title card is `assets/title-card.png` — hold for 3s at start
- Consider adding a subtle scanline or CRT flicker effect for the Green CRT switch

---

## Assets

| File | Description |
|------|-------------|
| `title-card.png` | Opening/closing title card (1920×1080) |
| `title-card-green.png` | Variant with green-crt phosphor colors |
| `storyboard.md` | This document |
| `record-demo.sh` | One-command screen recorder |
