#!/usr/bin/env python3
"""sprite_atlas.py: pack a PNG frame sequence (e.g. a Blender render) into one atlas + JSON.

Usage:
    python3 tools/sprite_atlas.py "<dir>/card_*.png" <project>/assets/blender/card_atlas.png [--max 4096]
Writes card_atlas.png (RGBA) and card_atlas.json:
    {"frames": N, "cols": C, "rows": R, "w": W, "h": H, "fps": 30}
Drawing it in the composition (deterministic, frame index from t only):
    const i = Math.floor(t * A.fps) % A.frames;           // or clamp for a one-shot
    ctx.drawImage(img, (i % A.cols) * A.w, Math.floor(i / A.cols) * A.h, A.w, A.h, x, y, dw, dh);
or as a three.js texture: tex.repeat.set(1/cols, 1/rows); tex.offset.set(col/cols, 1 - (row+1)/rows).
Why an atlas and not <video>: one image file loads once, keeps alpha, and every frame is an exact
function of t. That is the engine contract (M2). Needs Pillow (`uv run --with pillow`).
"""
import argparse
import glob
import json
import math
import os

from PIL import Image


def main():
    p = argparse.ArgumentParser()
    p.add_argument("pattern")
    p.add_argument("out")
    p.add_argument("--max", type=int, default=4096, help="max atlas edge (GPU texture limit)")
    p.add_argument("--fps", type=int, default=30)
    a = p.parse_args()
    files = sorted(glob.glob(a.pattern))
    if not files:
        raise SystemExit(f"no frames match {a.pattern}")
    first = Image.open(files[0])
    w, h = first.size
    cols = max(1, min(len(files), a.max // w))
    rows = math.ceil(len(files) / cols)
    if rows * h > a.max:
        raise SystemExit(f"{len(files)} frames of {w}x{h} do not fit in {a.max}px; render smaller or split")
    atlas = Image.new("RGBA", (cols * w, rows * h), (0, 0, 0, 0))
    for i, f in enumerate(files):
        atlas.paste(Image.open(f).convert("RGBA"), ((i % cols) * w, (i // cols) * h))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    atlas.save(a.out, optimize=True)
    meta = {"frames": len(files), "cols": cols, "rows": rows, "w": w, "h": h, "fps": a.fps}
    with open(os.path.splitext(a.out)[0] + ".json", "w") as fh:
        json.dump(meta, fh)
    print(json.dumps({"atlas": a.out, **meta, "bytes": os.path.getsize(a.out)}))


main()
