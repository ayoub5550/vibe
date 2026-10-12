#!/usr/bin/env python3
"""Song analysis for beat-synced music videos.

The AI cannot hear the song, so this turns the audio into numbers the agent can
choreograph against: exact tempo + beat phase (grid search on onset strength),
bar/line grid, per-beat energy, kick/snare/hat hits, loud/quiet sections and the
lyrics (word timestamps) when a words JSON is given.

Usage:
  python tools/analyze_song.py song.wav --words words.json --out analysis/song.json
  (words.json = [{"text": "Mirror,", "timestamp": [0.06, 0.32]}, ...]  e.g. from
   ElevenLabs scribe / Whisper word timestamps)

Run (from /work so uv finds the project):
  cd /work && uv run --with librosa python /work/repos/vibe/tools/analyze_song.py <song.wav> --words <words.json> --out <song_raw.json>

Besides the grid it prints the checks the agent must read before trusting it:
  grid_contrast   mean onset strength on the beats / on the off-beats (half a beat later).
                  >= 1.3 means the phase is right (Mirror Mirror: see song_raw.json "checks").
  tempo_candidates  the half-time and double-time readings with their scores; pick the one that
                  matches how a dancer would nod (hip-hop/trap often has a half-time feel:
                  snare on beat 3 of 4 at the fast tempo == snare on 2 and 4 at half tempo).
  on_grid         share of detected kicks / snares / hats within +-40 ms of a beat after
                  --check-from (set it to where the full drums start; band-peak detection is
                  crude: 808 bass notes count as kicks, so kicks score lower than snares).
Tempo range: the default 60-200 BPM search prefers the HALF-time reading when every other beat
is stronger (Mirror Mirror: 75 instead of 150). For hip-hop / pop / EDM run with
--bpm-lo 90 --bpm-hi 180 so the grid is the pulse the hats and the dancer follow.
"""
import argparse, json
import numpy as np
import librosa


def grid_search_tempo(oenv, sr, hop, lo=60.0, hi=200.0):
    """Return (bpm, offset) maximising mean onset strength on the beat grid.
    Coarse pass over [lo, hi] then fine pass +-1.5 BPM around the winner."""
    t_end = len(oenv) * hop / sr

    def score(bpm, off):
        p = 60.0 / bpm
        grid = np.arange(off, t_end, p)
        idx = np.clip(np.round(grid * sr / hop).astype(int), 0, len(oenv) - 1)
        return float(oenv[idx].mean())

    best = (0.0, 120.0, 0.0)
    for bpm in np.arange(lo, hi, 0.5):
        p = 60.0 / bpm
        for off in np.arange(0, p, 0.01):
            s = score(bpm, off)
            if s > best[0]:
                best = (s, bpm, off)
    _, b0, _ = best
    for bpm in np.arange(b0 - 1.5, b0 + 1.5, 0.02):
        p = 60.0 / bpm
        for off in np.arange(0, p, 0.0025):
            s = score(bpm, off)
            if s > best[0]:
                best = (s, bpm, off)
    return best[1], best[2]


def grid_score(oenv, sr, hop, bpm, off):
    t_end = len(oenv) * hop / sr
    grid = np.arange(off, t_end, 60.0 / bpm)
    idx = np.clip(np.round(grid * sr / hop).astype(int), 0, len(oenv) - 1)
    return float(oenv[idx].mean())


def best_offset(oenv, sr, hop, bpm):
    p = 60.0 / bpm
    return max((grid_score(oenv, sr, hop, bpm, o), o) for o in np.arange(0, p, 0.0025))


def on_grid(events, beats, t_from, tol=0.04):
    ev = [e for e in events if e >= t_from]
    if not ev:
        return None
    b = np.array(beats)
    return round(sum(1 for e in ev if np.min(np.abs(b - e)) <= tol) / len(ev), 3)


def band_hits(S, freqs, times, lo, hi, pct, min_gap):
    sig = S[(freqs >= lo) & (freqs < hi)].sum(0)
    sig = sig / (sig.max() + 1e-9)
    thr = np.percentile(sig, pct)
    out = []
    for i in range(1, len(sig) - 1):
        if sig[i] > thr and sig[i] >= sig[i - 1] and sig[i] >= sig[i + 1]:
            if not out or times[i] - out[-1][0] > min_gap:
                out.append((float(times[i]), float(sig[i])))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--words", help="JSON list of {text, timestamp:[s,e]}")
    ap.add_argument("--out", required=True)
    ap.add_argument("--bpm-lo", type=float, default=60)
    ap.add_argument("--bpm-hi", type=float, default=200)
    ap.add_argument("--check-from", type=float, default=0.0,
                    help="seconds; compute on_grid only after the full drums are in (e.g. the drop)")
    a = ap.parse_args()

    y, sr = librosa.load(a.audio, sr=22050, mono=True)
    dur = len(y) / sr
    hop = 256
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    bpm, off = grid_search_tempo(oenv, sr, hop, a.bpm_lo, a.bpm_hi)
    period = 60.0 / bpm
    n_beats = int(np.floor((dur - off) / period)) + 1
    beats = [round(off + i * period, 4) for i in range(n_beats)]

    yh, yp = librosa.effects.hpss(y)
    S = np.abs(librosa.stft(yp, n_fft=2048, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    times = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=512)
    kicks = band_hits(S, freqs, times, 30, 150, 88, 0.18)
    snares = band_hits(S, freqs, times, 150, 2500, 90, 0.18)
    hats = band_hits(S, freqs, times, 5000, 11000, 90, 0.08)

    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    energy = []
    for b in beats:
        sel = (rt >= b) & (rt < b + period)
        energy.append(float(rms[sel].mean()) if sel.any() else 0.0)
    e = np.array(energy)
    e = ((e - e.min()) / (e.max() - e.min() + 1e-9)).round(3).tolist()

    # ---- checks the agent must read (see docstring)
    main_score = grid_score(oenv, sr, hop, bpm, off)
    contrast = main_score / max(1e-9, grid_score(oenv, sr, hop, bpm, off + period / 2))
    cands = []
    for mult in (0.5, 2.0):
        cb = bpm * mult
        if 40 <= cb <= 300:
            sc, co = best_offset(oenv, sr, hop, cb)
            cands.append({"bpm": round(cb, 3), "offset": round(float(co), 4), "score_vs_main": round(sc / main_score, 3)})
    t_drums = a.check_from
    checks = {
        "grid_contrast": round(contrast, 3),
        "tempo_candidates": cands,
        "drums_in_from": t_drums,
        "on_grid": {"kicks": on_grid([k for k, _ in kicks], beats, t_drums),
                    "snares": on_grid([x for x, _ in snares], beats, t_drums),
                    "hats": on_grid([h for h, _ in hats], beats, t_drums)},
    }

    words = []
    if a.words:
        for w in json.load(open(a.words)):
            t = w["text"].strip()
            if not t:
                continue
            s, en = w["timestamp"]
            words.append({"w": t, "s": round(s, 3), "e": round(en, 3),
                          "beat": round((s - off) / period, 2)})

    out = {
        "duration": round(dur, 3),
        "bpm": round(bpm, 3),
        "beat_period": round(period, 5),
        "beat_offset": round(off, 4),
        "beats": beats,
        "beat_energy": e,
        "kicks": [round(k, 3) for k, _ in kicks],
        "snares": [round(s, 3) for s, _ in snares],
        "hats": [round(h, 3) for h, _ in hats],
        "words": words,
        "checks": checks,
    }
    json.dump(out, open(a.out, "w"), indent=1)
    print(f"duration {dur:.3f}s  bpm {bpm:.3f}  offset {off:.4f}s  beats {n_beats}  words {len(words)}")
    print("checks:", json.dumps(checks))


if __name__ == "__main__":
    main()
