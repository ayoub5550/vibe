// textures.js — every image in the video is drawn here with Canvas 2D (no bitmaps, no AI images).
window.MV = window.MV || {};
(function () {
  const U = MV.U;

  // ---------------------------------------------------------------- palette
  const P = (MV.P = {
    void: "#04060d",
    navy: "#0a1230",
    navy2: "#13204f",
    ink: "#0e0e14",
    gold: "#e3b553",
    gold2: "#f8de94",
    goldDeep: "#9a6c22",
    cream: "#f4ecd8",
    cream2: "#e2d6bb",
    red: "#c9302c",
    redDeep: "#8c1b18",
    blue: "#2b56b8",
    blueDeep: "#163275",
    ice: "#c4ebff",
    glowBlue: "#7cc4ff",
    skin: "#fbf6ee",
  });
  // the "shadow self" palette: every costume colour mapped into blues
  MV.SHADOW = {
    red: "#78b2ff", redDeep: "#3f74dc", blue: "#3361d0", blueDeep: "#1a3f96",
    gold: "#c4ecff", gold2: "#e6f7ff", goldDeep: "#5a93e0", cream: "#dcefff",
    skin: "#d8ecff", ink: "#0a1a3d",
  };

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
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    return t;
  }
  MV.tex = tex;

  // ---------------------------------------------------------------- suits
  // all suit paths are drawn centred at (0,0) inside a 1x1 box
  function suitPath(g, suit) {
    g.beginPath();
    if (suit === "H") {
      g.moveTo(0, 0.42);
      g.bezierCurveTo(-0.62, -0.05, -0.42, -0.62, 0, -0.26);
      g.bezierCurveTo(0.42, -0.62, 0.62, -0.05, 0, 0.42);
    } else if (suit === "D") {
      g.moveTo(0, -0.5);
      g.quadraticCurveTo(0.12, -0.12, 0.38, 0);
      g.quadraticCurveTo(0.12, 0.12, 0, 0.5);
      g.quadraticCurveTo(-0.12, 0.12, -0.38, 0);
      g.quadraticCurveTo(-0.12, -0.12, 0, -0.5);
    } else if (suit === "S") {
      g.moveTo(0, -0.46);
      g.bezierCurveTo(0.6, 0.0, 0.42, 0.42, 0.06, 0.18);
      g.lineTo(0.16, 0.46);
      g.lineTo(-0.16, 0.46);
      g.lineTo(-0.06, 0.18);
      g.bezierCurveTo(-0.42, 0.42, -0.6, 0.0, 0, -0.46);
    } else if (suit === "C") {
      g.arc(0, -0.2, 0.19, 0, U.TAU);
      g.moveTo(0.38, 0.06);
      g.arc(0.2, 0.06, 0.19, 0, U.TAU);
      g.moveTo(-0.02, 0.06);
      g.arc(-0.2, 0.06, 0.19, 0, U.TAU);
      g.moveTo(0.06, 0.05);
      g.lineTo(0.15, 0.46);
      g.lineTo(-0.15, 0.46);
      g.lineTo(-0.06, 0.05);
    }
    g.closePath();
  }
  MV.suitPath = suitPath;
  const SUIT_COLOR = { H: P.red, D: P.red, S: P.ink, C: P.ink };

  function drawSuit(g, suit, x, y, s, rot = 0, color) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(s, s);
    suitPath(g, suit);
    g.fillStyle = color || SUIT_COLOR[suit];
    g.fill();
    g.restore();
  }
  MV.drawSuit = drawSuit;

  // ---------------------------------------------------------------- card frame helpers
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  MV.roundRect = roundRect;

  function cardBase(g, w, h, fill) {
    g.clearRect(0, 0, w, h);
    roundRect(g, 2, 2, w - 4, h - 4, w * 0.06);
    g.fillStyle = fill || P.cream;
    g.fill();
    g.lineWidth = Math.max(2, w * 0.008);
    g.strokeStyle = "rgba(60,40,10,0.55)";
    g.stroke();
  }

  // pip layouts for number cards (x,y in card fractions inside the pip box; flip = rotate 180)
  const PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.5, 0.12], [0.5, 0.88, 1]],
    3: [[0.5, 0.12], [0.5, 0.5], [0.5, 0.88, 1]],
    4: [[0.22, 0.12], [0.78, 0.12], [0.22, 0.88, 1], [0.78, 0.88, 1]],
    5: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.5], [0.22, 0.88, 1], [0.78, 0.88, 1]],
    6: [[0.22, 0.12], [0.78, 0.12], [0.22, 0.5], [0.78, 0.5], [0.22, 0.88, 1], [0.78, 0.88, 1]],
    7: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.31], [0.22, 0.5], [0.78, 0.5], [0.22, 0.88, 1], [0.78, 0.88, 1]],
    8: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.31], [0.22, 0.5], [0.78, 0.5], [0.5, 0.69, 1], [0.22, 0.88, 1], [0.78, 0.88, 1]],
    9: [[0.22, 0.1], [0.78, 0.1], [0.22, 0.37], [0.78, 0.37], [0.5, 0.5], [0.22, 0.63, 1], [0.78, 0.63, 1], [0.22, 0.9, 1], [0.78, 0.9, 1]],
    10: [[0.22, 0.1], [0.78, 0.1], [0.5, 0.24], [0.22, 0.37], [0.78, 0.37], [0.22, 0.63, 1], [0.78, 0.63, 1], [0.5, 0.76, 1], [0.22, 0.9, 1], [0.78, 0.9, 1]],
  };

  function cornerIndex(g, w, h, label, suit, color) {
    const fs = w * 0.15;
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.font = `400 ${fs}px Limelight, serif`;
    for (const flip of [0, 1]) {
      g.save();
      if (flip) { g.translate(w, h); g.rotate(Math.PI); }
      g.fillText(label, w * 0.11, h * 0.115);
      if (suit) drawSuit(g, suit, w * 0.11, h * 0.165, w * 0.085, 0, color);
      g.restore();
    }
  }

  // ---------------------------------------------------------------- number / ace cards
  MV.drawNumberCard = function (g, w, h, rank, suit) {
    cardBase(g, w, h);
    const color = SUIT_COLOR[suit];
    const label = rank === 1 ? "A" : String(rank);
    cornerIndex(g, w, h, label, suit, color);
    if (rank === 1) {
      // ace: one big suit inside a gold sunburst medallion
      g.save();
      g.translate(w / 2, h / 2);
      g.strokeStyle = P.gold;
      g.lineWidth = w * 0.006;
      for (let i = 0; i < 36; i++) {
        g.rotate(U.TAU / 36);
        g.beginPath();
        g.moveTo(0, w * 0.2);
        g.lineTo(0, w * 0.34);
        g.stroke();
      }
      g.restore();
      drawSuit(g, suit, w / 2, h / 2, w * 0.36, 0, color);
      return;
    }
    const bx = w * 0.2, by = h * 0.12, bw = w * 0.6, bh = h * 0.76;
    for (const p of PIPS[rank]) drawSuit(g, suit, bx + p[0] * bw, by + p[1] * bh, w * 0.16, p[2] ? Math.PI : 0, color);
  };

  // ---------------------------------------------------------------- court-card bust (J / Q / K / mirror-J)
  // Draws a half-length figure whose waist sits on y=0 and head points up (-y). Unit: card width.
  function bust(g, w, kind, pal) {
    const s = w;
    g.lineJoin = "round";
    g.lineCap = "round";
    const ink = pal.ink || P.ink;
    const lw = s * 0.012;
    // body / tunic (harlequin split)
    g.save();
    g.beginPath();
    g.moveTo(-0.3 * s, 0);
    g.lineTo(-0.26 * s, -0.24 * s);
    g.quadraticCurveTo(0, -0.33 * s, 0.26 * s, -0.24 * s);
    g.lineTo(0.3 * s, 0);
    g.closePath();
    g.clip();
    const cell = 0.075 * s;
    for (let yy = -0.4 * s; yy < 0.05 * s; yy += cell) {
      for (let xx = -0.4 * s; xx < 0.4 * s; xx += cell) {
        const ix = Math.round(xx / cell), iy = Math.round(yy / cell);
        const left = xx < 0;
        g.fillStyle = (ix + iy) % 2 === 0 ? (left ? pal.red : pal.blue) : (left ? pal.redDeep : pal.blueDeep);
        g.beginPath();
        g.moveTo(xx, yy - cell * 0.5);
        g.lineTo(xx + cell * 0.5, yy);
        g.lineTo(xx, yy + cell * 0.5);
        g.lineTo(xx - cell * 0.5, yy);
        g.closePath();
        g.fill();
      }
    }
    g.restore();
    g.beginPath();
    g.moveTo(-0.3 * s, 0);
    g.lineTo(-0.26 * s, -0.24 * s);
    g.quadraticCurveTo(0, -0.33 * s, 0.26 * s, -0.24 * s);
    g.lineTo(0.3 * s, 0);
    g.lineWidth = lw;
    g.strokeStyle = ink;
    g.stroke();
    // gold placket
    g.fillStyle = pal.gold;
    g.fillRect(-0.025 * s, -0.27 * s, 0.05 * s, 0.27 * s);
    // ruff collar
    g.beginPath();
    const rn = 11;
    for (let i = 0; i <= rn; i++) {
      const a = Math.PI + (i / rn) * Math.PI;
      const r = i % 2 ? 0.13 * s : 0.17 * s;
      g.lineTo(Math.cos(a) * r, -0.27 * s + Math.sin(a) * r * 0.42 + 0.03 * s);
    }
    g.closePath();
    g.fillStyle = pal.cream || P.cream;
    g.fill();
    g.lineWidth = lw * 0.8;
    g.strokeStyle = ink;
    g.stroke();
    // head
    const hy = -0.43 * s;
    g.beginPath();
    g.ellipse(0, hy, 0.105 * s, 0.13 * s, 0, 0, U.TAU);
    g.fillStyle = pal.skin || P.skin;
    g.fill();
    g.lineWidth = lw;
    g.strokeStyle = ink;
    g.stroke();
    // face
    g.fillStyle = ink;
    g.beginPath(); g.arc(-0.04 * s, hy - 0.01 * s, 0.012 * s, 0, U.TAU); g.fill();
    g.beginPath(); g.arc(0.04 * s, hy - 0.01 * s, 0.012 * s, 0, U.TAU); g.fill();
    g.strokeStyle = ink;
    g.lineWidth = lw * 0.7;
    g.beginPath(); g.arc(0, hy + 0.045 * s, 0.03 * s, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.fillStyle = "rgba(201,48,44,0.35)";
    g.beginPath(); g.arc(-0.065 * s, hy + 0.035 * s, 0.022 * s, 0, U.TAU); g.fill();
    g.beginPath(); g.arc(0.065 * s, hy + 0.035 * s, 0.022 * s, 0, U.TAU); g.fill();
    // headwear
    if (kind === "J") {
      // two-horned jester hat with bells
      for (const sd of [-1, 1]) {
        g.beginPath();
        g.moveTo(0, hy - 0.11 * s);
        g.quadraticCurveTo(sd * 0.1 * s, hy - 0.33 * s, sd * 0.26 * s, hy - 0.2 * s);
        g.quadraticCurveTo(sd * 0.12 * s, hy - 0.2 * s, sd * 0.08 * s, hy - 0.08 * s);
        g.closePath();
        g.fillStyle = sd < 0 ? pal.red : pal.blue;
        g.fill();
        g.lineWidth = lw;
        g.strokeStyle = ink;
        g.stroke();
        g.beginPath();
        g.arc(sd * 0.265 * s, hy - 0.19 * s, 0.03 * s, 0, U.TAU);
        g.fillStyle = pal.gold;
        g.fill();
        g.stroke();
      }
      g.fillStyle = pal.gold;
      g.fillRect(-0.11 * s, hy - 0.13 * s, 0.22 * s, 0.035 * s);
      g.strokeRect(-0.11 * s, hy - 0.13 * s, 0.22 * s, 0.035 * s);
    } else {
      // crown (Q has hair, K has beard)
      if (kind === "Q") {
        g.fillStyle = pal.gold2 || P.gold2;
        g.beginPath();
        g.ellipse(-0.1 * s, hy + 0.04 * s, 0.045 * s, 0.14 * s, 0.15, 0, U.TAU);
        g.ellipse(0.1 * s, hy + 0.04 * s, 0.045 * s, 0.14 * s, -0.15, 0, U.TAU);
        g.fill();
      }
      if (kind === "K") {
        g.fillStyle = pal.cream2 || P.cream2;
        g.beginPath();
        g.moveTo(-0.08 * s, hy + 0.05 * s);
        g.quadraticCurveTo(0, hy + 0.22 * s, 0.08 * s, hy + 0.05 * s);
        g.closePath();
        g.fill();
        g.lineWidth = lw * 0.7;
        g.strokeStyle = ink;
        g.stroke();
      }
      g.beginPath();
      g.moveTo(-0.11 * s, hy - 0.1 * s);
      g.lineTo(-0.12 * s, hy - 0.24 * s);
      g.lineTo(-0.06 * s, hy - 0.16 * s);
      g.lineTo(0, hy - 0.27 * s);
      g.lineTo(0.06 * s, hy - 0.16 * s);
      g.lineTo(0.12 * s, hy - 0.24 * s);
      g.lineTo(0.11 * s, hy - 0.1 * s);
      g.closePath();
      g.fillStyle = pal.gold;
      g.fill();
      g.lineWidth = lw;
      g.strokeStyle = ink;
      g.stroke();
      g.fillStyle = kind === "Q" ? pal.red : pal.blue;
      g.beginPath(); g.arc(0, hy - 0.15 * s, 0.02 * s, 0, U.TAU); g.fill();
    }
  }

  MV.drawCourtCard = function (g, w, h, kind, suit, opts = {}) {
    cardBase(g, w, h);
    const color = suit ? SUIT_COLOR[suit] : P.gold;
    const top = opts.topPal || P;
    const bot = opts.botPal || P;
    // inner frame
    const fx = w * 0.17, fy = h * 0.1, fw = w * 0.66, fh = h * 0.8;
    g.save();
    roundRect(g, fx, fy, fw, fh, w * 0.02);
    g.clip();
    // background rays
    g.fillStyle = opts.mirror ? "#0f1e4d" : "#f1e2bd";
    g.fillRect(fx, fy, fw, fh / 2);
    g.fillStyle = opts.mirror ? "#0b1638" : "#efdcb1";
    g.fillRect(fx, fy + fh / 2, fw, fh / 2);
    g.strokeStyle = opts.mirror ? "rgba(124,196,255,0.35)" : "rgba(154,108,34,0.35)";
    g.lineWidth = w * 0.004;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * U.TAU;
      g.beginPath();
      g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 + Math.cos(a) * w, h / 2 + Math.sin(a) * w);
      g.stroke();
    }
    // top half bust
    g.save();
    g.translate(w / 2, h / 2);
    bust(g, fw * 1.05, kind, top);
    g.restore();
    // bottom half bust (rotated 180°)
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(Math.PI);
    bust(g, fw * 1.05, kind, bot);
    g.restore();
    g.restore();
    // center divider + frame
    g.strokeStyle = P.gold;
    g.lineWidth = w * 0.012;
    roundRect(g, fx, fy, fw, fh, w * 0.02);
    g.stroke();
    g.beginPath();
    g.moveTo(fx, h / 2);
    g.lineTo(fx + fw, h / 2);
    g.stroke();
    cornerIndex(g, w, h, kind, suit, color);
    if (opts.mirror) {
      // eye pips instead of a suit for the Jack of Mirrors
      for (const flip of [0, 1]) {
        g.save();
        if (flip) { g.translate(w, h); g.rotate(Math.PI); }
        MV.drawEye(g, w * 0.11, h * 0.17, w * 0.13, 1, 0, 0, { stroke: P.ink });
        g.restore();
      }
    }
  };

  // ---------------------------------------------------------------- the eye (card backs + giant eye)
  // (x,y) centre, s = eye width, open 0..1, look offsets in -1..1
  MV.drawEye = function (g, x, y, s, open = 1, lx = 0, ly = 0, o = {}) {
    const hh = s * 0.32 * Math.max(0.02, open);
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.moveTo(-s / 2, 0);
    g.quadraticCurveTo(0, -hh * 2, s / 2, 0);
    g.quadraticCurveTo(0, hh * 2, -s / 2, 0);
    g.closePath();
    g.save();
    g.clip();
    g.fillStyle = o.white || "#fbf7ec";
    g.fillRect(-s, -s, 2 * s, 2 * s);
    const ir = s * 0.21;
    const ix = lx * s * 0.18, iy = ly * s * 0.06;
    const grd = g.createRadialGradient(ix, iy, ir * 0.1, ix, iy, ir);
    grd.addColorStop(0, o.iris2 || "#f8de94");
    grd.addColorStop(0.6, o.iris || "#d39b35");
    grd.addColorStop(1, o.irisEdge || "#7a4d12");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(ix, iy, ir, 0, U.TAU);
    g.fill();
    g.strokeStyle = "rgba(90,55,10,0.6)";
    g.lineWidth = Math.max(1, s * 0.008);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * U.TAU;
      g.beginPath();
      g.moveTo(ix + Math.cos(a) * ir * 0.45, iy + Math.sin(a) * ir * 0.45);
      g.lineTo(ix + Math.cos(a) * ir * 0.95, iy + Math.sin(a) * ir * 0.95);
      g.stroke();
    }
    g.fillStyle = "#0a0a0e";
    g.beginPath();
    g.arc(ix, iy, ir * (o.pupil || 0.42), 0, U.TAU);
    g.fill();
    if (o.inIris) o.inIris(g, ix, iy, ir);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.beginPath();
    g.arc(ix - ir * 0.32, iy - ir * 0.34, ir * 0.13, 0, U.TAU);
    g.fill();
    g.restore();
    g.lineWidth = o.lw || Math.max(2, s * 0.035);
    g.strokeStyle = o.stroke || P.gold;
    g.stroke();
    if (o.lashes) {
      g.lineWidth = Math.max(2, s * 0.02);
      for (let i = -3; i <= 3; i++) {
        const a = -Math.PI / 2 + i * 0.28;
        g.beginPath();
        g.moveTo(Math.cos(a) * s * 0.38, -hh * 0.9 + Math.sin(a) * s * 0.02);
        g.lineTo(Math.cos(a) * s * 0.5, -hh * 1.2 + Math.sin(a) * s * 0.12);
        g.stroke();
      }
    }
    g.restore();
  };

  // ---------------------------------------------------------------- card back (navy, gold deco, eye)
  MV.drawCardBack = function (g, w, h, open = 1) {
    cardBase(g, w, h, P.navy);
    g.strokeStyle = P.gold;
    g.lineWidth = w * 0.014;
    roundRect(g, w * 0.07, h * 0.05, w * 0.86, h * 0.9, w * 0.04);
    g.stroke();
    g.lineWidth = w * 0.006;
    roundRect(g, w * 0.11, h * 0.08, w * 0.78, h * 0.84, w * 0.03);
    g.stroke();
    // deco fan rays from the eye
    g.save();
    roundRect(g, w * 0.11, h * 0.08, w * 0.78, h * 0.84, w * 0.03);
    g.clip();
    g.strokeStyle = "rgba(227,181,83,0.35)";
    g.lineWidth = w * 0.004;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * U.TAU;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * w * 0.26, h / 2 + Math.sin(a) * w * 0.26);
      g.lineTo(w / 2 + Math.cos(a) * w, h / 2 + Math.sin(a) * w);
      g.stroke();
    }
    g.restore();
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.25, 0, U.TAU);
    g.fillStyle = P.navy2;
    g.fill();
    g.lineWidth = w * 0.01;
    g.strokeStyle = P.gold;
    g.stroke();
    MV.drawEye(g, w / 2, h / 2, w * 0.4, open, 0, 0, { lw: w * 0.012 });
    // corner diamonds
    for (const [cx, cy] of [[0.2, 0.13], [0.8, 0.13], [0.2, 0.87], [0.8, 0.87]]) drawSuit(g, "D", w * cx, h * cy, w * 0.08, 0, P.gold);
  };

  // ---------------------------------------------------------------- cached card textures
  const cache = {};
  MV.cardTex = function (key, res = 1) {
    const ck = key + "@" + res;
    if (cache[ck]) return cache[ck];
    const w = Math.round(300 * res), h = Math.round(420 * res);
    const c = canvas(w, h), g = c.getContext("2d");
    const m = key.match(/^(\d+|A|J|Q|K)([SHDC])$/);
    if (key === "BACK0" || key === "BACK1" || key === "BACK2" || key === "BACK3") MV.drawCardBack(g, w, h, [0.02, 0.35, 0.7, 1][+key[4]]);
    else if (key === "JMIRROR") MV.drawCourtCard(g, w, h, "J", null, { topPal: P, botPal: MV.SHADOW, mirror: true });
    else if (key === "QMAMA") MV.drawCourtCard(g, w, h, "Q", "H");
    else if (m && "JQK".includes(m[1])) MV.drawCourtCard(g, w, h, m[1], m[2]);
    else if (m) MV.drawNumberCard(g, w, h, m[1] === "A" ? 1 : +m[1], m[2]);
    else if (key === "FAKEHEART") {
      // "fake love": hearts that are really upside-down red spades
      cardBase(g, w, h);
      cornerIndex(g, w, h, "♡", null, P.red);
      for (const p of PIPS[6]) drawSuit(g, "S", w * 0.2 + p[0] * w * 0.6, h * 0.12 + p[1] * h * 0.76, w * 0.16, Math.PI, P.red);
    }
    const t = tex(c);
    cache[ck] = t;
    return t;
  };
  MV.ALL_FACES = (() => {
    const out = [];
    for (const s of "SHDC") {
      out.push("A" + s);
      for (let r = 2; r <= 10; r++) out.push(r + s);
      out.push("J" + s, "Q" + s, "K" + s);
    }
    return out;
  })();

  // ---------------------------------------------------------------- environment textures
  MV.latticeTex = function () {
    const c = canvas(512, 512), g = c.getContext("2d");
    g.fillStyle = "#070a16";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(227,181,83,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 256); g.lineTo(256, 0); g.lineTo(512, 256); g.lineTo(256, 512); g.closePath();
    g.moveTo(-256, 256); g.lineTo(0, 0);
    g.stroke();
    g.strokeStyle = "rgba(227,181,83,0.18)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(512, 512); g.moveTo(512, 0); g.lineTo(0, 512);
    g.stroke();
    g.fillStyle = "rgba(248,222,148,0.8)";
    for (const [x, y] of [[256, 0], [0, 256], [512, 256], [256, 512]]) { g.beginPath(); g.arc(x, y, 5, 0, U.TAU); g.fill(); }
    return tex(c, { repeat: [10, 6] });
  };

  // radial sunburst arch (transparent, use additive blending)
  MV.sunburstTex = function () {
    const W = 2048, H = 1100;
    const c = canvas(W, H), g = c.getContext("2d");
    const cx = W / 2, cy = H - 40;
    g.clearRect(0, 0, W, H);
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 950);
    glow.addColorStop(0, "rgba(255,214,120,0.5)");
    glow.addColorStop(0.35, "rgba(227,170,70,0.22)");
    glow.addColorStop(1, "rgba(227,170,70,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i <= 96; i++) {
      const a = Math.PI + (i / 96) * Math.PI;
      const long = i % 2 === 0;
      g.strokeStyle = long ? "rgba(255,226,150,0.9)" : "rgba(240,190,90,0.55)";
      g.lineWidth = long ? 3.2 : 1.6;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * 230, cy + Math.sin(a) * 230);
      g.lineTo(cx + Math.cos(a) * (long ? 1000 : 860), cy + Math.sin(a) * (long ? 1000 : 860));
      g.stroke();
    }
    for (const [r, lw, al] of [[1010, 10, 0.95], [1035, 3, 0.7], [700, 3, 0.5], [235, 8, 1], [205, 2, 0.8]]) {
      g.strokeStyle = `rgba(255,220,140,${al})`;
      g.lineWidth = lw;
      g.beginPath();
      g.arc(cx, cy, r, Math.PI, U.TAU);
      g.stroke();
    }
    return tex(c);
  };

  MV.floorTex = function () {
    const S = 2048;
    const c = canvas(S, S), g = c.getContext("2d");
    g.clearRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2;
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * U.TAU;
      g.strokeStyle = i % 2 ? "rgba(90,150,255,0.18)" : "rgba(120,180,255,0.35)";
      g.lineWidth = i % 2 ? 2 : 3;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
      g.lineTo(cx + Math.cos(a) * S * 0.72, cy + Math.sin(a) * S * 0.72);
      g.stroke();
    }
    for (const [r, lw, col] of [[150, 10, "rgba(227,181,83,0.95)"], [175, 3, "rgba(227,181,83,0.8)"], [330, 3, "rgba(120,180,255,0.45)"], [520, 2, "rgba(120,180,255,0.3)"], [760, 2, "rgba(120,180,255,0.22)"]]) {
      g.strokeStyle = col;
      g.lineWidth = lw;
      g.beginPath();
      g.arc(cx, cy, r, 0, U.TAU);
      g.stroke();
    }
    return tex(c);
  };

  MV.glowTex = function (inner = "rgba(255,230,170,1)", outer = "rgba(255,190,90,0)") {
    const c = canvas(256, 256), g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.25, inner.replace(/[\d.]+\)$/, "0.45)"));
    grd.addColorStop(1, outer);
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return tex(c);
  };

  MV.starTex = function () {
    const c = canvas(2048, 1024), g = c.getContext("2d");
    g.fillStyle = "#03050b";
    g.fillRect(0, 0, 2048, 1024);
    const r = U.rng(7);
    for (let i = 0; i < 900; i++) {
      const x = r() * 2048, y = r() * 1024, s = r() < 0.08 ? 2.2 : 1.1;
      g.fillStyle = `rgba(${200 + r() * 55},${200 + r() * 40},255,${0.25 + r() * 0.6})`;
      g.beginPath();
      g.arc(x, y, s, 0, U.TAU);
      g.fill();
    }
    return tex(c);
  };

  // text plane texture: returns {tex, aspect}
  const textCache = {};
  MV.textTex = function (text, o = {}) {
    const key = JSON.stringify([text, o]);
    if (textCache[key]) return textCache[key];
    const font = o.font || "900 220px 'Big Shoulders Display'";
    const pad = o.pad || 60;
    const m = canvas(8, 8).getContext("2d");
    m.font = font;
    if (o.tracking) m.letterSpacing = o.tracking;
    const tw = Math.ceil(m.measureText(text).width);
    const size = parseInt(font.match(/(\d+)px/)[1], 10);
    const W = tw + pad * 2, H = Math.ceil(size * 1.25) + pad * 2;
    const c = canvas(W, H), g = c.getContext("2d");
    g.font = font;
    if (o.tracking) g.letterSpacing = o.tracking;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const x = W / 2, y = H / 2 + size * 0.04;
    if (o.glow) {
      g.shadowColor = o.glow;
      g.shadowBlur = o.glowBlur || 40;
      g.fillStyle = o.glow;
      g.fillText(text, x, y);
      g.shadowBlur = 0;
    }
    if (o.gradient) {
      const grd = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
      o.gradient.forEach((col, i) => grd.addColorStop(i / (o.gradient.length - 1), col));
      g.fillStyle = grd;
    } else g.fillStyle = o.color || P.ice;
    if (o.stroke) {
      g.lineWidth = o.strokeW || 6;
      g.strokeStyle = o.stroke;
      g.strokeText(text, x, y);
    }
    g.fillText(text, x, y);
    if (o.strike) {
      // negation bar through the word (e.g. "I ain't PERFECT")
      g.shadowColor = o.strike;
      g.shadowBlur = 24;
      g.fillStyle = o.strike;
      g.save();
      g.translate(x, y);
      g.rotate(-0.06);
      g.fillRect(-tw / 2 - 20, -size * 0.07, tw + 40, size * 0.14);
      g.restore();
      g.shadowBlur = 0;
    }
    const res = { tex: tex(c, { mips: true }), aspect: W / H, w: W, h: H };
    textCache[key] = res;
    return res;
  };
})();
