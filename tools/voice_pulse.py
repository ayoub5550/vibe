#!/usr/bin/env python3
"""voice_pulse.py: the beat grid for SPOKEN WORD / POETRY, where the music bed has no steady pulse.

When to use it instead of analyze_song.py: run analyze_song.py first. If its `on_grid` values sit at
chance level (about 0.1 for every band) and the onset autocorrelation has no clear peak, the backing
track is a drone or pad with no beat (khawf: autocorrelation peak 0.054, on_grid 0.09). Forcing a
constant BPM onto such audio gives cuts that land on nothing. In recited Arabic poetry the clock is
the metre: each hemistich (shatr) has a fixed number of feet (taf'ilat). So this tool puts
`--feet` beats evenly across every sung line (line start to line end), fills the pauses between
lines with beats of about the same length, and writes a song_raw.json with the same schema as
analyze_song.py (plus "pulse": "voice" and a variable "beats" list). build_song_js.py and util.js
read that list, so U.beatAt / U.tb stay valid and every line starts exactly on a beat.

  cd /work && uv run --with librosa python repos/vibe/tools/voice_pulse.py <song.wav> <words.json> <lyrics.txt> \
      --feet 3 --out <analysis/song_raw.json>

kicks  = every word onset (the "hits" the hero can pose on)
snares = every line (hemistich) onset (the cut points)
checks = music autocorrelation peak (proof there is no beat), beat length min/mean/max, lines on grid.
"""
import argparse, json
import numpy as np
import librosa


def lines_from(lyrics_path, words):
    out, i = [], 0
    for ln in open(lyrics_path, encoding="utf-8"):
        ln = ln.strip()
        if not ln or (ln.startswith("[") and ln.endswith("]")):
            continue
        n = len(ln.split())
        ws = words[i:i + n]
        i += n
        out.append((ws[0]["timestamp"][0], ws[-1]["timestamp"][1]))
    assert i == len(words), f"{len(words) - i} words left over"
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("words"); ap.add_argument("lyrics")
    ap.add_argument("--feet", type=int, default=3)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    y, sr = librosa.load(a.audio, sr=22050, mono=True)
    dur = len(y) / sr
    words = json.load(open(a.words))
    lines = lines_from(a.lyrics, words)

    beats = []
    for li, (s, e) in enumerate(lines):
        d = (e - s) / a.feet
        if li == 0:  # lead-in before the first line, same foot length
            k = 1
            while s - k * d >= 0:
                beats.insert(0, s - k * d); k += 1
        beats += [s + j * d for j in range(a.feet)]
        nxt = lines[li + 1][0] if li + 1 < len(lines) else dur
        last = s + (a.feet - 1) * d
        n = max(1, int(round((nxt - last) / d)))  # beats from the last foot to the next line start
        if li + 1 == len(lines):
            n = int((dur - last) // d) + 1
        step = (nxt - last) / n if li + 1 < len(lines) else d
        beats += [last + j * step for j in range(1, n if li + 1 < len(lines) else n)]
    beats = sorted(set(round(b, 4) for b in beats if 0 <= b < dur))
    per = np.diff(beats)

    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    energy = []
    for i, b in enumerate(beats):
        b1 = beats[i + 1] if i + 1 < len(beats) else dur
        sel = (rt >= b) & (rt < b1)
        energy.append(float(rms[sel].mean()) if sel.any() else 0.0)
    e = np.array(energy)
    e = ((e - e.min()) / (e.max() - e.min() + 1e-9)).round(3).tolist()

    # proof that the backing track has no beat: harmonic/percussive split, onset autocorrelation
    hop = 256
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    ac = librosa.autocorrelate(oenv - oenv.mean(), max_size=int(3 * sr / hop)); ac /= ac[0]
    lo = int(0.25 * sr / hop)
    peak = float(ac[lo:].max())
    b = np.array(beats)
    on_grid = sum(1 for s, _ in lines if np.min(np.abs(b - s)) < 0.005) / len(lines)

    out = {
        "pulse": "voice", "feet_per_line": a.feet,
        "duration": round(dur, 3), "bpm": round(60 / float(per.mean()), 3),
        "beat_period": round(float(per.mean()), 5), "beat_offset": beats[0],
        "beats": beats, "beat_energy": e,
        "kicks": [round(w["timestamp"][0], 3) for w in words],
        "snares": [round(s, 3) for s, _ in lines],
        "hats": [],
        "words": [{"w": w["text"], "s": round(w["timestamp"][0], 3), "e": round(w["timestamp"][1], 3),
                   "beat": round(float(np.interp(w["timestamp"][0], b, np.arange(len(b)))), 2)} for w in words],
        "checks": {"music_autocorr_peak": round(peak, 3), "beat_len_min": round(float(per.min()), 3),
                   "beat_len_mean": round(float(per.mean()), 3), "beat_len_max": round(float(per.max()), 3),
                   "lines_on_grid": round(on_grid, 3), "n_lines": len(lines)},
    }
    json.dump(out, open(a.out, "w"), ensure_ascii=False, indent=1)
    print(f"duration {dur:.3f}s  beats {len(beats)}  mean beat {per.mean():.3f}s  lines {len(lines)}")
    print("checks:", json.dumps(out["checks"]))


if __name__ == "__main__":
    main()
