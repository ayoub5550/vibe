// util.js — deterministic helpers shared by every module. No clocks, no Math.random.
window.MV = window.MV || {};
(function () {
  const U = {};
  const S = MV.SONG;

  U.W = 1920;
  U.H = 1080;
  U.FPS = 30;
  U.DURATION = S.excerpt_seconds; // 79.22 s — the composition length

  // ---- math ----
  U.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  U.lerp = (a, b, k) => a + (b - a) * k;
  U.inv = (a, b, x) => U.clamp((x - a) / (b - a));
  U.smooth = (k) => k * k * (3 - 2 * k);
  U.mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  U.TAU = Math.PI * 2;
  U.deg = Math.PI / 180;

  // ---- easing (all map 0..1 -> 0..1) ----
  U.ease = {
    linear: (k) => k,
    inQuad: (k) => k * k,
    outQuad: (k) => 1 - (1 - k) * (1 - k),
    inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    outCubic: (k) => 1 - Math.pow(1 - k, 3),
    inCubic: (k) => k * k * k,
    inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outQuart: (k) => 1 - Math.pow(1 - k, 4),
    outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
    inOutExpo: (k) =>
      k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
    outBack: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
    outElastic: (k) =>
      k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
    inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  };

  // ---- seeded PRNG (mulberry32) + hash noise ----
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash = function (i, j = 0) {
    let n = (i * 374761393 + j * 668265263) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  // smooth 1D value noise in [-1, 1]
  U.noise1 = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const a = U.hash(i, seed) * 2 - 1, b = U.hash(i + 1, seed) * 2 - 1;
    return a + (b - a) * U.smooth(f);
  };

  // ---- beat grid (150 BPM, exact grid fitted to the audio) ----
  U.BPM = S.bpm;
  U.BP = S.beat_period; // 0.4 s
  U.B0 = S.beat_offset; // 0.06 s
  U.tb = (k) => U.B0 + k * U.BP; // time of beat k
  U.beatAt = (t) => (t - U.B0) / U.BP; // fractional beat index at time t
  // phase since the last beat (0..1) and the index of that beat
  U.beatInfo = (t) => {
    const b = U.beatAt(t);
    const i = Math.floor(b);
    return { i, f: b - i, b };
  };
  // decaying pulse that fires at every beat: 1 at the hit, -> 0 after `len` seconds
  U.beatPulse = (t, len = 0.22, every = 1) => {
    const b = U.beatAt(t) / every;
    const f = b - Math.floor(b);
    const dt = f * U.BP * every;
    return dt < 0 ? 0 : Math.exp(-dt / (len / 3));
  };
  // pulse after a list of event times (kicks / snares / custom hits)
  U.eventPulse = (t, times, len = 0.25) => {
    // binary search last event <= t
    let lo = 0, hi = times.length - 1, idx = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (times[m] <= t) { idx = m; lo = m + 1; } else hi = m - 1;
    }
    if (idx < 0) return 0;
    const dt = t - times[idx];
    return dt > len * 2 ? 0 : Math.exp(-dt / (len / 3));
  };
  U.energyAt = (t) => {
    const e = S.beat_energy;
    const b = U.clamp(U.beatAt(t), 0, e.length - 1.001);
    const i = Math.floor(b);
    return U.lerp(e[i], e[Math.min(i + 1, e.length - 1)], b - i);
  };

  // ---- keyframe tracks: [[time, value(s)], ...] with optional per-key ease ----
  // keys: [{t, v, e}] where v is number or array; e is ease name for the segment ending at that key
  U.track = function (keys, t) {
    if (t <= keys[0].t) return keys[0].v;
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].t) {
        const a = keys[i - 1], b = keys[i];
        const k = (U.ease[b.e || "inOutCubic"])((t - a.t) / (b.t - a.t));
        if (Array.isArray(a.v)) return a.v.map((x, j) => x + (b.v[j] - x) * k);
        return a.v + (b.v - a.v) * k;
      }
    }
    return keys[keys.length - 1].v;
  };

  // lyric helpers
  U.wordsBetween = (t0, t1) => {
    const out = [];
    for (const l of S.lines) for (const w of l.words) if (w[1] >= t0 && w[1] < t1) out.push(w);
    return out;
  };
  U.findWord = (word, after = 0) => {
    for (const l of S.lines)
      for (const w of l.words)
        if (w[1] >= after && w[0].toLowerCase().replace(/[^a-z0-9-]/g, "") === word.toLowerCase()) return w[1];
    return null;
  };

  MV.U = U;
})();
