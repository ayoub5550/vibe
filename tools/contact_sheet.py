#!/usr/bin/env python3
"""contact_sheet.py — tile PNG frames (or a video) into labelled contact sheets for review.

Usage:
  python tools/contact_sheet.py frames <dir_with_pngs> <out_prefix> [--cols 4]
  python tools/contact_sheet.py video <file.mp4> <out_prefix> [--fps 2] [--cols 6]
Frames mode labels each tile with its file name (frames.cjs names files t<seconds>.png).
Video mode uses ffmpeg with burned-in timestamps (6x5 tiles = 15 s per sheet at 2 fps).
"""
import argparse, glob, os, subprocess


def frames(src, out, cols):
    from PIL import Image, ImageDraw
    files = sorted(glob.glob(os.path.join(src, "*.png")))
    W, H = 640, 360
    for k in range(0, len(files), cols * 4):
        fs = files[k:k + cols * 4]
        rows = (len(fs) + cols - 1) // cols
        img = Image.new("RGB", (cols * W, rows * H), "black")
        d = ImageDraw.Draw(img)
        for i, f in enumerate(fs):
            img.paste(Image.open(f).convert("RGB").resize((W, H)), ((i % cols) * W, (i // cols) * H))
            d.rectangle([(i % cols) * W, (i // cols) * H, (i % cols) * W + 160, (i // cols) * H + 26], fill="black")
            d.text(((i % cols) * W + 6, (i // cols) * H + 6), os.path.basename(f), fill="white")
        path = f"{out}_{k // (cols * 4) + 1:02d}.jpg"
        img.save(path, quality=88)
        print(path)


def video(src, out, fps, cols):
    rows = 5
    vf = (f"fps={fps},scale=480:-1,drawtext=text='%{{pts\\:hms}}':x=6:y=6:fontsize=20:"
          f"fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{rows}")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", vf, f"{out}_%02d.png"], check=True)
    print(sorted(glob.glob(f"{out}_*.png")))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["frames", "video"])
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--fps", type=float, default=2)
    ap.add_argument("--cols", type=int, default=0)
    a = ap.parse_args()
    if a.mode == "frames":
        frames(a.src, a.out, a.cols or 4)
    else:
        video(a.src, a.out, a.fps, a.cols or 6)
