#!/usr/bin/env python3
"""align_excerpt.py — find and cut the exact song excerpt a video was built on.

The audio file itself is NOT committed (YouTube Audio Library licence: use inside videos, no
standalone redistribution). Instead each project stores a fingerprint (onset-strength envelope,
derived numbers only). Download the full track yourself, then let this tool find the excerpt.

  fingerprint:  python tools/align_excerpt.py fingerprint excerpt.wav analysis/fingerprint.json
  cut:          python tools/align_excerpt.py cut full_track.mp3 analysis/fingerprint.json assets/song.wav

`cut` prints the offset it found and the match score; score must be > 0.6 (a true match is
usually > 0.8). Output: 48 kHz stereo WAV, exactly the fingerprint duration, 10 ms fade-in,
150 ms fade-out — identical treatment to the original cut.
Requires: librosa numpy soundfile scipy
"""
import json, subprocess, sys
import numpy as np
import librosa

SR, HOP = 22050, 256


def onset_env(path):
    y, sr = librosa.load(path, sr=SR, mono=True)
    e = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
    return (e - e.mean()) / (e.std() + 1e-9), len(y) / SR


def fingerprint(src, out):
    e, dur = onset_env(src)
    json.dump({"sr": SR, "hop": HOP, "duration": round(dur, 3), "env": [round(float(v), 3) for v in e]}, open(out, "w"))
    print(f"fingerprint: {len(e)} frames, {dur:.3f}s -> {out}")


def cut(full, fp_path, out):
    fp = json.load(open(fp_path))
    ref = np.array(fp["env"], dtype=np.float32)
    e, dur_full = onset_env(full)
    if len(e) < len(ref):
        sys.exit("full track is shorter than the excerpt")
    from scipy.signal import fftconvolve
    xc = fftconvolve(e, ref[::-1], mode="valid") / len(ref)
    best = int(np.argmax(xc))
    score = float(xc[best])
    off = best * HOP / SR
    print(f"best offset {off:.3f}s  score {score:.3f}  (full track {dur_full:.1f}s)")
    if score < 0.6:
        sys.exit("no confident match: wrong track/version? (score < 0.6)")
    d = fp["duration"]
    af = f"afade=t=in:st=0:d=0.01,afade=t=out:st={d - 0.15:.3f}:d=0.15"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{off:.4f}", "-t", f"{d:.3f}", "-i", full,
                    "-af", af, "-ar", "48000", "-ac", "2", out], check=True)
    print(f"wrote {out} ({d:.3f}s)")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    if sys.argv[1] == "fingerprint":
        fingerprint(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "cut":
        cut(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
