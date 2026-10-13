#!/usr/bin/env bash
# render_all.sh: re-render every Blender asset of khawf and pack the atlases (one command, AGENTS.md 4b).
#   bash projects/khawf/blender/render_all.sh        (from the repo root; about 3-4 min on 17 CPUs)
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT=/work/data/vibe/khawf/blender
A=projects/khawf/assets/blender
mkdir -p "$OUT" "$A"
bash tools/install_blender.sh >/dev/null
tools/blender_run.sh projects/khawf/blender/lantern.py   -- --out $OUT/lantern   --frames 48 --w 384 --h 512
tools/blender_run.sh projects/khawf/blender/mirror.py    -- --out $OUT/mirror    --frames 49 --w 384 --h 480
tools/blender_run.sh projects/khawf/blender/crown.py     -- --out $OUT/crown     --frames 48 --w 384 --h 384
tools/blender_run.sh projects/khawf/blender/hourglass.py -- --out $OUT/hourglass --frames 48 --w 384 --h 512
for n in lantern mirror crown hourglass; do
  (cd /work && uv run --with pillow python repos/vibe/tools/sprite_atlas.py "$OUT/${n}_0*.png" repos/vibe/$A/${n}_atlas.png)
done
cp $OUT/mirror_opening.json $A/mirror_opening.json
python3 projects/khawf/blender/atlas_js.py
