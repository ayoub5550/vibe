#!/usr/bin/env bash
# render_all.sh: re-render every Blender asset of mawt and pack the atlases (one command, AGENTS.md 4b).
#   bash projects/mawt/blender/render_all.sh        (from the repo root)
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT=/work/data/vibe/mawt/blender
A=projects/mawt/assets/blender
mkdir -p "$OUT" "$A"
rm -f "$OUT"/*.png
bash tools/install_blender.sh >/dev/null
tools/blender_run.sh projects/mawt/blender/cage.py  -- --out $OUT/cage      --frames 24 --w 320 --h 400 --mode spin
tools/blender_run.sh projects/mawt/blender/cage.py  -- --out $OUT/cageburst --frames 32 --w 480 --h 480 --mode burst
tools/blender_run.sh projects/mawt/blender/rifle.py -- --out $OUT/rifle     --frames 48 --w 384 --h 192
for n in cage cageburst rifle; do
  (cd /work && uv run --with pillow python repos/vibe/tools/sprite_atlas.py "$OUT/${n}_0*.png" repos/vibe/$A/${n}_atlas.png)
done
python3 projects/mawt/blender/atlas_js.py
