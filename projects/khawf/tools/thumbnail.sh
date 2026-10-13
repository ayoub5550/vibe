#!/usr/bin/env bash
# thumbnail.sh: rebuild the YouTube thumbnail (1280x720 JPG) of «الخوف».
#   bash projects/khawf/tools/thumbnail.sh [out.jpg] [t=54.8]      (from the repo root, ~10 s)
# 1. tools/frames.cjs renders frame t straight from the composition (no MP4 needed): the dream beast
#    chasing the youth in the blue desert (shot 21, «كالوحش في الحلم»).
# 2. ffmpeg scales it to 1280x720 -> projects/khawf/tools/bg.png (scratch file, deleted at the end).
# 3. The HyperFrames Chrome screenshots tools/thumbnail.html (bg + Amiri 700 type), ffmpeg writes the JPG.
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT="${1:-reference/khawf/thumbnail.jpg}"
T="${2:-54.8}"
TMP=$(mktemp -d)
D=projects/khawf/tools
node tools/frames.cjs projects/khawf "$T" "$TMP" >/dev/null
SRC=$(ls "$TMP"/*.png | head -1)
ffmpeg -v error -y -i "$SRC" -vf scale=1280:720:flags=lanczos "$D/bg.png"
/usr/local/bin/hyperframes-chrome --headless=new --no-sandbox --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1280,720 --virtual-time-budget=3000 --screenshot="$TMP/thumb.png" "file://$PWD/$D/thumbnail.html" 2>/dev/null
ffmpeg -v error -y -i "$TMP/thumb.png" -q:v 3 "$OUT"
rm -rf "$TMP" "$D/bg.png"
echo "thumbnail: $OUT ($(du -k "$OUT" | cut -f1) KB)"
