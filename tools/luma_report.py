#!/usr/bin/env python3
"""luma_report.py: exposure gate. Per-second mean luma (0-255) of a render; flags dark stretches.
Usage: python3 tools/luma_report.py <video.mp4> [--min 60] [--hook-from 54.46 --hook-min 80] [--fps N]
Seconds are real seconds at any frame rate: the fps is read from the file (ffprobe) unless --fps is given.
Targets (AGENTS.md section 11): shot mean 60-90, hooks 80+. Ultracode stills average ~77.
Only needs ffmpeg + numpy-free stdlib.
"""
import argparse, statistics, subprocess, sys


def probe_fps(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                          "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    try:
        num, den = out.split("/") if "/" in out else (out, "1")
        return max(1, round(float(num) / float(den)))
    except ValueError:
        return 30


def per_second_luma(path, w=96, h=54, fps=30):
    # decode tiny grey frames (every frame), average each second (fps frames)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h},format=gray",
                          "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    n = w * h
    frames = [sum(raw[i:i + n]) / n for i in range(0, len(raw) - n + 1, n)]
    secs = [statistics.mean(frames[i:i + fps]) for i in range(0, len(frames), fps)]
    return frames, secs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--min", type=float, default=60)
    ap.add_argument("--hook-from", type=float, default=None, help="seconds where the loud hooks start")
    ap.add_argument("--hook-min", type=float, default=80)
    ap.add_argument("--fps", type=int, default=None, help="frames per second (default: read from the file)")
    a = ap.parse_args()
    fps = a.fps or probe_fps(a.video)
    frames, secs = per_second_luma(a.video, fps=fps)
    print(f"frames {len(frames)} at {fps} fps  median frame luma {statistics.median(frames):.1f}  "
          f"p10 {sorted(frames)[len(frames)//10]:.1f}  p90 {sorted(frames)[len(frames)*9//10]:.1f}")
    bad = []
    line = []
    for s, v in enumerate(secs):
        target = a.hook_min if (a.hook_from is not None and s >= a.hook_from) else a.min
        flag = "" if v >= target else "*"
        if flag:
            bad.append(s)
        line.append(f"{s:3d}s {v:5.1f}{flag}")
    for i in range(0, len(line), 8):
        print("  ".join(line[i:i + 8]))
    print(f"seconds below target: {len(bad)}/{len(secs)} -> {bad}")


if __name__ == "__main__":
    sys.exit(main())
