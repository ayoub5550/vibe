// util.js — deterministic helpers shared by every module. No clocks, no Math.random.
// Differs from mirror-mirror: the beat grid is VARIABLE (MV.SONG.beats from tools/voice_pulse.py:
// 3 feet per hemistich of the poem), so U.tb / U.beatAt interpolate through that list.
window.MV = window.MV || {};
(function () {
  const U = {};
  const S = MV.SONG;

  U.W = 1920;
  U.H = 1080;
  U.FPS = 30;
  U.DURATION = S.excerpt_seconds; // 166.40 s: the recitation + the pad's natural end
  U.TAIL = 1.0; // silent title tail (AGENTS.md section 11: title AFTER the last word)
  U.TOTAL = Math.round((U.DURATION + U.TAIL) * 100) / 100; // 167.40 s

  // ---- math ----
  U.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  U.lerp = (a, b, k) => a + (b - a) * k;
  U.inv = (a, b, x) => U.clamp((x - a) / (b - a));
  U.smooth = (k) => k * k * (3 - 2 * k);
  U.mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  U.TAU = Math.PI * 2;
  U.deg = Math.PI / 180;
  U.bell = (x, a, b, fade = 0.25) => U.inv(a, a + fade, x) * (1 - U.inv(b - fade, b, x)); // 0→1→0 window

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
    outBack: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
    outElastic: (k) =>
      k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
    inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    inOutBack: (k) => {
      const c2 = 1.70158 * 0.55;
      return k < 0.5
        ? (Math.pow(2 * k, 2) * ((c2 + 1) * 2 * k - c2)) / 2
        : (Math.pow(2 * k - 2, 2) * ((c2 + 1) * (k * 2 - 2) + c2) + 2) / 2;
    },
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
  U.noise1 = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const a = U.hash(i, seed) * 2 - 1, b = U.hash(i + 1, seed) * 2 - 1;
    return a + (b - a) * U.smooth(f);
  };

  // ---- the poem's pulse: variable beat list (feet), piecewise linear ----
  const B = S.beats;
  U.BEATS = B;
  U.BP = S.beat_period; // mean foot length (0.79 s), only for rough scaling
  U.tb = (k) => {
    if (k <= 0) return B[0] + k * (B[1] - B[0]);
    const n = B.length - 1;
    if (k >= n) return B[n] + (k - n) * (B[n] - B[n - 1]);
    const i = Math.floor(k);
    return B[i] + (k - i) * (B[i + 1] - B[i]);
  };
  U.beatAt = (t) => {
    const n = B.length - 1;
    if (t <= B[0]) return (t - B[0]) / (B[1] - B[0]);
    if (t >= B[n]) return n + (t - B[n]) / (B[n] - B[n - 1]);
    let lo = 0, hi = n;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (B[m] <= t) lo = m; else hi = m;
    }
    return lo + (t - B[lo]) / (B[lo + 1] - B[lo]);
  };
  U.beatPulse = (t, len = 0.25) => {
    const b = U.beatAt(t), i = Math.floor(b);
    const dt = t - U.tb(i);
    return Math.exp(-dt / (len / 3));
  };
  // pulse after a list of event times (word onsets, line onsets, custom hits)
  U.eventPulse = (t, times, len = 0.25) => {
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

  // ---- lyric helpers (Arabic: compare without diacritics, tatweel or punctuation) ----
  U.norm = (w) => w.replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[.,،؟?!]/g, "").trim();
  U.LINES = S.lines;
  U.WORD_ONSETS = [];
  for (const l of S.lines) for (const w of l.words) U.WORD_ONSETS.push(w[1]);
  U.findWord = (word, after = 0) => {
    const q = U.norm(word);
    for (const l of S.lines) for (const w of l.words) if (w[1] >= after && U.norm(w[0]) === q) return w[1];
    return null;
  };
  // word `idx` (0-based) of line `li`: [text, start, end]
  U.word = (li, idx) => S.lines[li].words[idx];
  U.lineStart = (li) => S.lines[li].s;
  U.lineEnd = (li) => S.lines[li].e;

  MV.U = U;
})();
