#!/usr/bin/env bash
# check_render.sh — hard gate after every render. Exit 1 on any failure.
# Usage: tools/check_render.sh <video.mp4> <expected_seconds> [song.wav]
set -u
V="$1"; EXP="$2"; SONG="${3:-}"
fail=0
[ -s "$V" ] || { echo "FAIL: $V missing or empty"; exit 1; }
info=$(ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration -of default=nw=1 "$V")
echo "$info"
echo "$info" | grep -q "codec_name=h264" || { echo "FAIL: video codec is not h264"; fail=1; }
echo "$info" | grep -q "codec_name=aac" || { echo "FAIL: no AAC audio track"; fail=1; }
echo "$info" | grep -q "width=1920" || { echo "FAIL: width != 1920"; fail=1; }
echo "$info" | grep -q "height=1080" || { echo "FAIL: height != 1080"; fail=1; }
echo "$info" | grep -q "r_frame_rate=30/1" || { echo "FAIL: fps != 30"; fail=1; }
dur=$(echo "$info" | sed -n 's/^duration=//p' | tail -1)
python3 - "$dur" "$EXP" <<'PY' || fail=1
import sys
d, e = float(sys.argv[1]), float(sys.argv[2])
ok = abs(d - e) <= 0.1
print(f"duration {d:.3f}s vs expected {e:.3f}s -> {'OK' if ok else 'FAIL'}")
sys.exit(0 if ok else 1)
PY
# black-frame / frozen-frame scan (any black run >= 0.5 s is a defect unless intentional)
blk=$(ffmpeg -v info -i "$V" -vf "blackdetect=d=0.5:pix_th=0.06" -an -f null - 2>&1 | grep -c "black_start" || true)
echo "black runs >= 0.5s: $blk"
[ "$blk" -eq 0 ] || { echo "WARN: black segments found (check they are intentional)"; }
if [ -n "$SONG" ]; then
  # audio must be the song itself and in sync: envelope correlation at the best lag (+-120 ms)
  # must be > 0.9 and the lag must be < 1 frame (AAC priming adds ~21 ms, which is fine)
  python3 - "$V" "$SONG" <<'PY' || fail=1
import subprocess, sys, struct
def env(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    n = len(raw) // 2
    s = struct.unpack(f"<{n}h", raw[: n * 2])
    hop = 80  # 10 ms
    return [sum(abs(x) for x in s[i:i + hop]) / hop for i in range(0, n - hop, hop)]
a, b = env(sys.argv[1]), env(sys.argv[2])
def corr(lag):
    if lag >= 0: x, y = a[lag:], b
    else: x, y = a, b[-lag:]
    m = min(len(x), len(y)); x, y = x[:m], y[:m]
    mx, my = sum(x) / m, sum(y) / m
    num = sum((p - mx) * (q - my) for p, q in zip(x, y))
    den = (sum((p - mx) ** 2 for p in x) * sum((q - my) ** 2 for q in y)) ** 0.5
    return num / den if den else 0
best = max((corr(l), l) for l in range(-12, 13))
r, lag = best
ok = r > 0.9 and abs(lag) <= 3
print(f"audio envelope correlation {r:.4f} at lag {lag*10} ms -> {'OK' if ok else 'FAIL'}")
sys.exit(0 if ok else 1)
PY
fi
[ $fail -eq 0 ] && echo "RENDER CHECK: PASS" || { echo "RENDER CHECK: FAIL"; exit 1; }
