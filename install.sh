#!/usr/bin/env bash
set -euo pipefail

echo "🔗 Omatchy Installer"
echo "=================="

# Resolve real home (handles Hermes profile isolation where $HOME → ~/.hermes/home)
_resolve_real_home() {
  local raw_home="$HOME"
  if [[ "$raw_home" == */.hermes/home ]]; then
    echo "${raw_home%/.hermes/home}"
  else
    echo "$raw_home"
  fi
}

HERMES_HOME="${HERMES_HOME:-$(_resolve_real_home)/.hermes}"

# 1. Theme
echo "✓ Installing dashboard theme..."
mkdir -p "$HERMES_HOME/dashboard-themes"
cp theme/omatchy.yaml "$HERMES_HOME/dashboard-themes/"

# 2. Plugin
echo "✓ Installing dashboard plugin..."
mkdir -p "$HERMES_HOME/plugins/omatchy/dashboard/dist"
cp plugin/manifest.json plugin/plugin_api.py "$HERMES_HOME/plugins/omatchy/dashboard/"
cp plugin/dist/index.js "$HERMES_HOME/plugins/omatchy/dashboard/dist/"

echo ""
echo "✅ Omatchy installed!"
echo ""
echo "Next steps:"
echo "  1. Restart Hermes dashboard:  hermes dashboard"
echo "  2. Select 'Omatchy' from the theme picker (top-right)"
echo "  3. Change your Omarchy theme and watch the dashboard follow 🎨"
echo ""
echo "Files installed to:"
echo "  $HERMES_HOME/dashboard-themes/omatchy.yaml"
echo "  $HERMES_HOME/plugins/omatchy/dashboard/"
