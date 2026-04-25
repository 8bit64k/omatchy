# Changelog

## [1.0.0] - 2026-04-25

### Added
- Initial release for Nous Research Hermes Dashboard Pop-Up Hackathon
- `omatchy.yaml` base theme (neutral dark)
- Hidden slot-only dashboard plugin (`header-right` badge)
- Backend API: `GET /api/plugins/omatchy/status`
  - Reads Omarchy `colors.toml` with fallback search paths
  - Scrapes system font from Waybar CSS / Kitty / Ghostty
  - Luminance-aware contrast guard for midground layer
  - Maps 16-color ANSI palette to semantic colors
- Frontend: 3-second polling with direct `:root` CSS variable injection
  - No page reload required
  - Skips re-render if theme unchanged
  - Pretty-printed theme name badge
- Graceful fallback when Omarchy is not installed
