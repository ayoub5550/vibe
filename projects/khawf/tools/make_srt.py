#!/usr/bin/env python3
"""make_srt.py: Arabic caption track for YouTube from analysis/song.json (one cue per hemistich).

    python3 projects/khawf/tools/make_srt.py > reference/khawf/khawf_ar.srt

Timing rule (the one used for the published kit, 2026-10-13):
    start = line.s - 0.10 s                       (on screen just before the first spoken word)
    end   = min(next_line.s - 0.10, line.e + 1.6)  (never overlaps the next cue)
    the last hemistich ends at 161.6 s (FINALE_END in js/shots.js, where the title card starts)
plus one title cue 161.8-167.3 s: «الخوف — تميم البرغوثي».
Output is UTF-8 with LF line endings. Stdlib only.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SONG = os.path.join(HERE, "..", "analysis", "song.json")
FINALE_END = 161.6
TITLE = (161.8, 167.3, "الخوف — تميم البرغوثي")


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cues(lines):
    out = []
    for i, ln in enumerate(lines):
        start = ln["s"] - 0.10
        if i + 1 < len(lines):
            end = min(lines[i + 1]["s"] - 0.10, ln["e"] + 1.6)
        else:
            end = min(FINALE_END, ln["e"] + 1.6)
        out.append((start, end, ln["text"]))
    out.append(TITLE)
    return out


def main():
    lines = json.load(open(SONG, encoding="utf-8"))["lines"]
    buf = []
    for n, (a, b, text) in enumerate(cues(lines), 1):
        buf.append(f"{n}\n{ts(a)} --> {ts(b)}\n{text}\n")
    sys.stdout.write("\n".join(buf))


if __name__ == "__main__":
    main()
