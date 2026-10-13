// textures.js — every image in the video is drawn here or in chars.js with Canvas 2D (no bitmaps,
// no AI images), except the three Blender atlases (assets/blender, built by blender/*.py from primitives).
//
// ART DIRECTION (AGENTS.md step 7) — ANIME / MANGA
//   World: one ruined, living Arab city at the end of a war (flat rooftops, water tanks, domes of the
//   "palaces", tin huts), seen first as a black-and-white MANGA (paper, screentone dots, hatching,
//   panel borders, gutters) and, from «يا موت» on, as a cel-shaded COLOUR ANIME (three.js toon
//   shading with a 3-step gradient map + inverted-hull ink outlines; Canvas-2D characters with bold
//   ink lines and one flat shadow tone).
//   Palette (6 core + 1 accent family):
//     ink        #120d1c  (all outlines, manga blacks)     paper   #f4efe4 (manga page, highlights)
//     scarf red  #e8283c  (the hero's scarf: life, the colour burst)
//     dusk violet #3b2a6b / #6b4bb0 (Death's cloak, night)  sunset orange #ff8a3d (anime sky, energy)
//     sky teal   #3fb4c9  (dawn, freedom)
//     accent family: bone/gold #ffd36b / #fff2c4 (key words, the cage brass, highlights)
//   Type: Lalezar 400 (manga sound effects + punchy key words, proofed: all dots render) and
//   Amiri 700 (poem key words + the title card; ZWJ after lam before jeem/hah/khah, O.shape).
//   Finish: screentone pass in manga mode, bloom + speed lines + impact frames (black/white invert)
//   + colour-dodge flashes in colour mode, vignette, light grain.
window.MV = window.MV || {};
(function () {
  const U = MV.U;

  const P = (MV.P = {
    ink: "#120d1c", paper: "#f4efe4", red: "#e8283c", red2: "#a3122a", violet: "#3b2a6b", violet2: "#6b4bb0",
    orange: "#ff8a3d", orange2: "#ffc070", teal: "#3fb4c9", teal2: "#9be3ea", gold: "#ffd36b", gold2: "#fff2c4",
    skin: "#ffd9bf", skin2: "#e9a98c", hair: "#1c1830", hair2: "#3c3a78", white: "#fbf8f2", white2: "#c9c3d9",
    navy: "#1f2440", navy2: "#11142a", bone: "#f2ead8", bone2: "#b9ad96",
  });

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  MV.canvas = canvas;

  function tex(c, opts = {}) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = opts.mips !== false;
    t.minFilter = opts.mips === false ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
    if (opts.nearest) { t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; }
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    return t;
  }
  MV.tex = tex;

  const cache = {};
  const cached = (key, fn) => cache[key] || (cache[key] = fn());
  MV.cached = cached;

  MV.roundRect = function (g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  MV.glowTex = () => cached("glow", () => {
    const c = canvas(128, 128), g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return tex(c);
  });

  // three.js toon gradient: 3 hard steps (shadow / base / light), nearest-filtered
  MV.toonRamp = () => cached("ramp", () => {
    const d = new Uint8Array([70, 70, 70, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  });

  // window grid for the city blocks (lit / dark / broken windows); one cached texture per variant
  MV.windowTex = (v) => cached("win" + v, () => {
    const c = canvas(256, 256), g = c.getContext("2d");
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 256, 256);
    const r = U.rng(40 + v);
    for (let y = 18; y < 240; y += 56) for (let x = 16; x < 240; x += 58) {
      const k = r();
      g.fillStyle = k < 0.2 ? "#ffe39a" : k < 0.75 ? "#5a5470" : "#26223a";
      g.fillRect(x, y, 34, 30);
      g.strokeStyle = "#1a1528";
      g.lineWidth = 4;
      g.strokeRect(x, y, 34, 30);
      if (k > 0.9) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 34, y + 30); g.stroke(); }
    }
    // a few cracks (war damage) drawn as ink zigzags
    g.strokeStyle = "#1a1528";
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      let x = r() * 256, y = r() * 80;
      g.beginPath(); g.moveTo(x, y);
      for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 40; y += 20 + r() * 20; g.lineTo(x, y); }
      g.stroke();
    }
    return tex(c, { repeat: [1, 1] });
  });

  // anime skies (big gradient + clouds with ink rims). k: night | dusk | dawn | storm
  MV.skyTex = (k) => cached("sky" + k, () => {
    const c = canvas(1024, 512), g = c.getContext("2d");
    const S = {
      night: ["#0b0a24", "#2a1f5c", "#5b3f8e"],
      dusk: ["#2b1a5e", "#c9417a", "#ffb15c"],
      dawn: ["#3a7fd0", "#9fd8ee", "#ffe2a6"],
      storm: ["#14101f", "#3b2a6b", "#8a3a5a"],
      paper: ["#e9e6ee", "#f7f4f0", "#fbf9f4"],
      mnight: ["#050308", "#15121c", "#3a3644"],
    }[k];
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, S[0]);
    grd.addColorStop(0.62, S[1]);
    grd.addColorStop(1, S[2]);
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 512);
    const r = U.rng(k.length * 31);
    if (k === "night" || k === "storm" || k === "mnight") {
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,250,230,${0.3 + r() * 0.7})`; g.fillRect(r() * 1024, r() * 300, 2, 2); }
    }
    // flat anime clouds: stacked ellipses, lit top, ink rim
    const cl = k === "dawn" || k === "paper" ? ["#ffffff", "#bfc3d4"] : k === "dusk" ? ["#ffd2a0", "#d95a7c"] : ["#4a3a80", "#2a2054"];
    for (let i = 0; i < 9; i++) {
      const x = r() * 1024, y = 150 + r() * 220, s = 40 + r() * 60;
      g.beginPath();
      for (let j = 0; j < 5; j++) g.ellipse(x + (j - 2) * s * 0.7, y - Math.sin((j / 4) * Math.PI) * s * 0.4, s * 0.62, s * 0.45, 0, 0, U.TAU);
      g.fillStyle = cl[1];
      g.fill();
      g.save(); g.translate(0, -s * 0.12);
      g.beginPath();
      for (let j = 0; j < 5; j++) g.ellipse(x + (j - 2) * s * 0.7, y - Math.sin((j / 4) * Math.PI) * s * 0.4, s * 0.5, s * 0.36, 0, 0, U.TAU);
      g.fillStyle = cl[0];
      g.fill();
      g.restore();
    }
    return tex(c);
  });

  // screentone dot tiles for the manga pass (fixed to the screen like real tone sheets)
  MV.toneTile = (pitch, r, ang = 45) => cached(`tone${pitch}_${r}_${ang}`, () => {
    const s = 64, c = canvas(s, s), g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#000";
    // dots on a lattice rotated by ang, wrapped so the tile repeats (pitch divides 64*sqrt2 approx)
    const ca = Math.cos(ang * U.deg), sa = Math.sin(ang * U.deg);
    for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) {
      const x = (i * ca - j * sa) * pitch, y = (i * sa + j * ca) * pitch;
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
        const px = x + ox, py = y + oy;
        if (px > -r && px < s + r && py > -r && py < s + r) { g.beginPath(); g.arc(px, py, r, 0, U.TAU); g.fill(); }
      }
    }
    return c;
  });
  // diagonal hatching tile
  MV.hatchTile = () => cached("hatch", () => {
    const s = 16, c = canvas(s, s), g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "#000";
    g.lineWidth = 2.2;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * s, s); g.lineTo(k * s + s, 0); g.stroke(); }
    return c;
  });

  // flat-bread (khubz) disc used by the monkey shot
  MV.drawBread = function (g, x, y, r, rot = 0) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.beginPath();
    g.ellipse(0, 0, r, r * 0.92, 0, 0, U.TAU);
    g.fillStyle = "#e9b56a";
    g.fill();
    g.lineWidth = Math.max(3, r * 0.08);
    g.strokeStyle = P.ink;
    g.stroke();
    g.fillStyle = "#b9763a";
    for (let i = 0; i < 7; i++) { const a = i * 2.3, d = r * 0.55 * ((i * 37) % 10) / 10; g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.12, r * 0.08, a, 0, U.TAU); g.fill(); }
    g.restore();
  };

  // a kite (طائرة ورقية): diamond with a cross spar and a bow tail
  MV.drawKite = function (g, x, y, s, rot, t, colA = P.red, colB = P.gold) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.lineJoin = "round";
    // tail
    g.strokeStyle = P.ink;
    g.lineWidth = s * 0.03;
    g.beginPath();
    g.moveTo(0, s * 0.9);
    for (let i = 1; i <= 14; i++) g.lineTo(Math.sin(i * 0.8 + t * 6) * s * 0.18, s * 0.9 + i * s * 0.12);
    g.stroke();
    for (let i = 2; i <= 14; i += 3) {
      const bx = Math.sin(i * 0.8 + t * 6) * s * 0.18, by = s * 0.9 + i * s * 0.12;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - s * 0.12, by - s * 0.07); g.lineTo(bx - s * 0.12, by + s * 0.07); g.closePath();
      g.moveTo(bx, by); g.lineTo(bx + s * 0.12, by - s * 0.07); g.lineTo(bx + s * 0.12, by + s * 0.07); g.closePath();
      g.fillStyle = colA; g.fill(); g.lineWidth = s * 0.02; g.stroke();
    }
    const quad = (pts, col) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fillStyle = col; g.fill(); };
    const T = [0, -s], R = [s * 0.62, -s * 0.15], B = [0, s * 0.9], L = [-s * 0.62, -s * 0.15], C = [0, -s * 0.15];
    quad([T, R, C], colA); quad([T, C, L], colB); quad([C, R, B], colB); quad([C, B, L], colA);
    g.beginPath(); g.moveTo(...T); g.lineTo(...R); g.lineTo(...B); g.lineTo(...L); g.closePath();
    g.lineWidth = s * 0.05; g.strokeStyle = P.ink; g.stroke();
    g.beginPath(); g.moveTo(...T); g.lineTo(...B); g.moveTo(...L); g.lineTo(...R); g.lineWidth = s * 0.03; g.stroke();
    g.restore();
  };

  // anime speed lines (radial focus lines) around (cx, cy); closed-form from seed + t
  MV.speedLines = function (g, cx, cy, rIn, o = {}) {
    const n = o.n || 90, col = o.color || "#000", alpha = o.alpha === undefined ? 1 : o.alpha;
    const f = Math.floor((o.t || 0) * 30); // re-dealt 30x per second: lines flicker like hand-drawn ones
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = col;
    const R = 2400;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU + (U.hash(i, f) - 0.5) * 0.06;
      const w = (0.004 + U.hash(i, f + 7) * 0.012) * (o.width || 1);
      const r0 = rIn * (0.8 + U.hash(i, f + 3) * 0.6);
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
      g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
      g.closePath();
      g.fill();
    }
    g.restore();
  };
  // parallel speed lines (motion streaks) in direction ang
  MV.streaks = function (g, ang, o = {}) {
    const n = o.n || 40, col = o.color || "#fff", f = Math.floor((o.t || 0) * 30);
    g.save();
    g.translate(960, 540);
    g.rotate(ang);
    g.fillStyle = col;
    g.globalAlpha = o.alpha === undefined ? 0.8 : o.alpha;
    for (let i = 0; i < n; i++) {
      const y = (U.hash(i, 3) - 0.5) * 1300, len = 300 + U.hash(i, f) * 900, x = (U.hash(i, f + 9) - 0.5) * 2600;
      const th = 2 + U.hash(i, 5) * 6;
      g.beginPath();
      g.moveTo(x - len / 2, y);
      g.lineTo(x + len / 2, y - th / 2);
      g.lineTo(x + len / 2, y + th / 2);
      g.closePath();
      g.fill();
    }
    g.restore();
  };
})();
