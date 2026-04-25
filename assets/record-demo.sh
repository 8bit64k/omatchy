#!/usr/bin/env bash
# Omatchy Demo Screen Recorder
# Usage: ./record-demo.sh [output.mp4]

set -euo pipefail

OUTPUT="${1:-omatchy-demo-$(date +%Y%m%d-%H%M%S).mp4}"
DISPLAY_SIZE="${DISPLAY_SIZE:-1920x1080}"
DISPLAY="${DISPLAY:-:1}"

echo "🎥 Omatchy Demo Recorder"
echo "========================"
echo "Output: $OUTPUT"
echo "Display: $DISPLAY ($DISPLAY_SIZE)"
echo ""
echo "Press Enter to start recording (you'll have 3s to get ready)..."
read -r

sleep 3

echo "🔴 RECORDING STARTED"
echo "Press Ctrl+C to stop"

# Record with ffmpeg using x11grab
# Using ultrafast preset for minimal CPU impact; re-encode later if needed
ffmpeg -f x11grab \
  -video_size "$DISPLAY_SIZE" \
  -i "$DISPLAY" \
  -framerate 30 \
  -c:v libx264 \
  -preset ultrafast \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT" 2>/dev/null

echo ""
echo "✅ Recording saved to: $OUTPUT"
echo ""
echo "Next steps:"
echo "  1. Trim start/end in your video editor"
echo "  2. Add title card: assets/title-card.png (hold 3s)"
echo "  3. Add text overlays per storyboard.md"
echo "  4. Add music and export"
