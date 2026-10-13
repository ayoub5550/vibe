// overlay.js — the 2D post pass drawn above the WebGL canvas every frame (opaque: it starts as a
// copy of the GL frame). From projects/khawf (lift, bloom, Arabic kinetic type, letterbox, vignette,
// grain, colour-dodge flash) plus the anime/manga passes: O.manga (screentone halftone made of native
// canvas threshold filters), O.panelFrame (paper gutters + ink borders), O.impact (black/white
// negative impact frame), O.sfx (big outlined sound-effect lettering), speed lines and streaks.
window.MV = window.MV || {};
(function () {
  const U = MV.U;
  const O = (MV.Overlay = {});
  const W = U.W, H = U.H;

  O.init = function (canvasEl, glCanvas) {
    O.c = canvasEl;
    O.g = canvasEl.getContext("2d");
    O.gl = glCanvas;
    O.small = MV.canvas(480, 270);
    O.sg = O.small.getContext("2d");
    O.vig = MV.canvas(W, H);
    const vg = O.vig.getContext("2d");
    const grd = vg.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.05);
    grd.addColorStop(0, "rgba(20,8,0,0)");
    grd.addColorStop(1, "rgba(10,4,20,0.55)");
    vg.fillStyle = grd;
    vg.fillRect(0, 0, W, H);
    O.grain = [0, 1, 2, 3].map((s) => {
      const c = MV.canvas(256, 256), g = c.getContext("2d");
      const img = g.createImageData(256, 256);
      const r = U.rng(100 + s);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (r() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    });
  };

  O.begin = function (lift = 0.4) {
    const g = O.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "copy";
    g.drawImage(O.gl, 0, 0, W, H);
    if (lift > 0) {
      g.globalCompositeOperation = "screen";
      g.globalAlpha = Math.min(1, lift);
      g.drawImage(O.gl, 0, 0, W, H);
      if (lift > 1) { g.globalAlpha = lift - 1; g.drawImage(O.gl, 0, 0, W, H); }
      g.globalAlpha = 1;
    }
    g.globalCompositeOperation = "source-over";
  };

  O.bloom = function (amount = 0.4) {
    if (amount <= 0) return;
    const sg = O.sg, g = O.g;
    sg.globalCompositeOperation = "copy";
    sg.filter = "contrast(2.6) brightness(0.5) blur(6px)";
    sg.drawImage(O.c, 0, 0, 480, 270);
    sg.filter = "none";
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = amount;
    g.drawImage(O.small, 0, 0, W, H);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  };

  O.vignette = function (a = 1) {
    if (a <= 0) return;
    O.g.globalAlpha = a;
    O.g.drawImage(O.vig, 0, 0);
    O.g.globalAlpha = 1;
  };

  O.grainPass = function (t, a = 0.05) {
    const g = O.g;
    const f = Math.floor(t * U.FPS);
    const tile = O.grain[f % 4];
    g.globalAlpha = a;
    g.globalCompositeOperation = "overlay";
    const ox = (f * 73) % 256, oy = (f * 151) % 256;
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) g.drawImage(tile, x, y);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  };

  // black = fade; any other colour = colour-dodge exposure hit (AGENTS.md section 12)
  O.flash = function (color, a) {
    if (a <= 0.003) return;
    const g = O.g;
    if (color === "#000" || color === "black") {
      g.globalAlpha = U.clamp(a);
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
      return;
    }
    const c = parseInt(color.slice(1), 16);
    const k = U.clamp(a) * 0.82;
    const r = ((c >> 16) & 255) * k, gg = ((c >> 8) & 255) * k, b = (c & 255) * k;
    g.globalCompositeOperation = "color-dodge";
    g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = U.clamp(a) * 0.1;
    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  };

  O.letterbox = function (h) {
    if (h <= 0) return;
    O.g.fillStyle = "#000";
    O.g.fillRect(0, 0, W, h);
    O.g.fillRect(0, H - h, W, h);
  };

  // ---------------------------------------------------------------- Arabic kinetic type
  // Key words are set in Amiri 700 (Naskh). Draft 1 used Aref Ruqaa: its final qaf and several
  // dot marks did not render in Chrome («حق» read «حه», the title read «الحوف») - critic P0.
  const STY = {
    manga: { a: "#16101e", b: "#000000", glow: "rgba(255,255,255,0)", edge: "#ffffff", edgeW: 0.16 },
    mangaRed: { a: "#ff3048", b: "#a3122a", glow: "rgba(255,255,255,0)", edge: "#ffffff", edgeW: 0.16 },
    white: { a: "#ffffff", b: "#e8e4f4", glow: "rgba(120,90,255,0.6)", edge: "#120d1c", edgeW: 0.12 },
    gold: { a: "#fff0c4", b: "#e0aa4a", glow: "rgba(255,186,80,0.85)", edge: "#3a1f08" },
    red: { a: "#ff8a6a", b: "#b8221a", glow: "rgba(255,60,30,0.8)", edge: "#2a0604" },
    bone: { a: "#ffffff", b: "#efe2c4", glow: "rgba(255,236,200,0.7)", edge: "#2a1508" },
    silver: { a: "#ffffff", b: "#a9bde4", glow: "rgba(150,185,255,0.8)", edge: "#0b1030" },
    // on the bright parchment, pale words become cut-out ink with a light rim
    ink: { a: "#5a3418", b: "#1a0c05", glow: "rgba(255,244,220,0.95)", edge: "#fff3d6" },
    goldInk: { a: "#f2c25a", b: "#a8641c", glow: "rgba(255,244,220,0.9)", edge: "#2a1406" },
  };
  O.STY = STY;
  // Amiri stacks lam + jeem/hah/khah into one ligature that reads «انخوف»; a ZWJ keeps the joins
  // but breaks the ligature («الخوف»).
  O.shape = (str) => str.replace(/\u0644(?=[\u062C\u062D\u062E])/g, "\u0644\u200D");
  O.KEYFONT = "Amiri";
  O.SFXFONT = "Lalezar";
  O.scratch = null;
  // word(str, x, y, o): o.t (now), o.t0 (sung onset), o.t1 (exit), o.size px, o.style, o.font,
  // o.plate (soft plate: dark at night, a warm halo on the screen), o.outline (stroke only),
  // o.strike (0..1 strike-through), o.rot
  // Reveal: ink "writes" from right to left over 0.32 s (Arabic direction) through a feathered
  // 90 px edge (a hard clip sliced the glyphs - critic P2), with a small overshoot.
  O.word = function (str, x, y, o = {}) {
    const t = o.t, t0 = o.t0 === undefined ? -1e9 : o.t0;
    if (t < t0 - 0.12) return;
    const kin = U.clamp((t - (t0 - 0.12)) / 0.32);
    const out = o.t1 !== undefined ? U.clamp((t - o.t1) / 0.25) : 0;
    if (out >= 1) return;
    str = O.shape(str);
    let sname = o.style || "gold";
    const s = STY[sname];
    const size = o.size || 200;
    const g = O.g;
    const font = o.font || (o.lalezar ? `400 ${size}px ${O.SFXFONT}` : `700 ${size}px ${O.KEYFONT}`);
    g.save();
    g.font = font;
    g.direction = "rtl";
    const w = g.measureText(str).width;
    g.restore();
    // draw the finished word into a scratch canvas, then mask the reveal
    const pad = Math.ceil(size * 0.5);
    const cw = Math.ceil(w + pad * 2 + 100), ch = Math.ceil(size * 2.2);
    if (!O.scratch || O.scratch.width < cw || O.scratch.height < ch) {
      O.scratch = MV.canvas(Math.max(cw, O.scratch ? O.scratch.width : 0), Math.max(ch, O.scratch ? O.scratch.height : 0));
    }
    const sc = O.scratch, sg = sc.getContext("2d");
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.globalCompositeOperation = "source-over";
    sg.globalAlpha = 1;
    sg.clearRect(0, 0, cw, ch);
    sg.font = font;
    sg.direction = "rtl";
    sg.textAlign = "center";
    sg.textBaseline = "middle";
    sg.lineJoin = "round";
    const cx = cw / 2, cy = ch / 2;
    if (s.edgeW) { // manga lettering: a thick outer stroke first (white on paper, ink on colour)
      sg.lineWidth = size * s.edgeW;
      sg.strokeStyle = s.edge;
      sg.strokeText(str, cx, cy);
      if (s.edge === "#ffffff") { sg.lineWidth = size * 0.05; sg.strokeStyle = "#000"; }
    }
    const fg = sg.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5);
    fg.addColorStop(0, s.a);
    fg.addColorStop(1, s.b);
    if (o.outline) {
      sg.shadowColor = s.glow; sg.shadowBlur = 24;
      sg.lineWidth = size * 0.05;
      sg.strokeStyle = s.edge;
      sg.strokeText(str, cx, cy);
      sg.shadowBlur = 0;
    } else {
      sg.shadowColor = s.glow; sg.shadowBlur = size * 0.2;
      sg.lineWidth = size * 0.05;
      sg.strokeStyle = s.edge;
      sg.strokeText(str, cx, cy);
      sg.shadowBlur = 0;
      sg.fillStyle = fg;
      sg.fillText(str, cx, cy);
    }
    if (o.strike) {
      sg.strokeStyle = "#e0301e";
      sg.lineWidth = size * 0.07;
      sg.lineCap = "round";
      sg.beginPath(); sg.moveTo(cx + w / 2 + 20, cy - size * 0.05); sg.lineTo(cx + w / 2 + 20 - (w + 40) * U.ease.outCubic(o.strike), cy + size * 0.12); sg.stroke();
    }
    // feathered right-to-left reveal mask
    if (kin < 1) {
      const F = 90;
      const edge = cx + w / 2 + 50 - (w + 100 + F) * U.ease.outCubic(kin); // moves right -> left
      const mg = sg.createLinearGradient(edge, 0, edge + F, 0);
      mg.addColorStop(0, "rgba(0,0,0,0)");
      mg.addColorStop(1, "rgba(0,0,0,1)");
      sg.globalCompositeOperation = "destination-in";
      sg.fillStyle = mg;
      sg.fillRect(0, 0, cw, ch);
      sg.globalCompositeOperation = "source-over";
    }
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    const scl = (0.86 + 0.14 * U.ease.outBack(kin)) * (1 + out * 0.1);
    g.scale(scl, scl);
    const alpha = (o.alpha === undefined ? 1 : o.alpha) * (1 - out);
    if (o.plate === true || (o.plate === undefined && !s.edgeW)) {
      const R = w * 0.75 + 80;
      const pg = g.createRadialGradient(0, 0, 10, 0, 0, R);
      pg.addColorStop(0, `rgba(10,6,20,${0.5 * (o.plateA || 1) * kin * alpha})`);
      pg.addColorStop(1, "rgba(10,6,20,0)");
      g.fillStyle = pg;
      g.save(); g.scale(1, 0.5); g.beginPath(); g.arc(0, 0, R, 0, U.TAU); g.fill(); g.restore();
    }
    g.globalAlpha = alpha;
    g.drawImage(sc, 0, 0, cw, ch, -cx, -cy, cw, ch);
    g.restore();
    return w * scl;
  };


  // ---------------------------------------------------------------- manga screentone pass
  // Converts the current frame to a black-and-white manga print with native canvas filters only:
  //   gray -> threshold masks (filter brightness(b) contrast(60) = hard threshold at 0.5/b)
  //   white paper, light tone (small dots) where luma < tLight, dark tone (big dots) where luma < tMid,
  //   solid ink where luma < tDark. The tone tiles are fixed to the screen like real tone sheets.
  // o.mask(g): optional, called on the finished manga layer with destination-out to punch holes
  // (the colour burst at «يا موت»).
  let MC = null;
  function mc() {
    if (MC) return MC;
    const mk = () => { const c = MV.canvas(W, H); return { c, g: c.getContext("2d") }; };
    MC = { out: mk(), m: mk() };
    MC.light = MC.out.g.createPattern(MV.toneTile(8, 1.7), "repeat");
    MC.dark = MC.out.g.createPattern(MV.toneTile(8, 3.0), "repeat");
    MC.hatch = MC.out.g.createPattern(MV.hatchTile(), "repeat");
    return MC;
  }
  O.manga = function (o = {}) {
    const M = mc(), g = O.g, og = M.out.g, mg = M.m.g;
    const tL = o.tLight || 0.72, tM = o.tMid || 0.5, tD = o.tDark || 0.24;
    og.setTransform(1, 0, 0, 1, 0, 0);
    og.globalCompositeOperation = "source-over";
    og.globalAlpha = 1;
    og.fillStyle = "#f4efe4";
    og.fillRect(0, 0, W, H);
    const layer = (thr, pat) => {
      // mask: black where luma < thr, white elsewhere
      mg.setTransform(1, 0, 0, 1, 0, 0);
      mg.globalCompositeOperation = "copy";
      mg.filter = `grayscale(1) brightness(${(0.5 / thr).toFixed(3)}) contrast(60)`;
      mg.drawImage(O.c, 0, 0);
      mg.filter = "none";
      if (pat) {
        // keep the tone only where the mask is black: lighten(mask, toneTile)
        mg.globalCompositeOperation = "lighten";
        mg.fillStyle = pat;
        mg.fillRect(0, 0, W, H);
      }
      mg.globalCompositeOperation = "source-over";
      og.globalCompositeOperation = "multiply";
      og.drawImage(M.m.c, 0, 0);
    };
    layer(tL, M.light);
    layer(tM, M.dark);
    layer(tD, null);
    og.globalCompositeOperation = "source-over";
    if (o.mask) { og.globalCompositeOperation = "destination-out"; o.mask(og); og.globalCompositeOperation = "source-over"; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    g.drawImage(M.out.c, 0, 0);
    g.globalAlpha = 1;
  };

  // paper gutters + ink borders around panel rects [[x,y,w,h], ...] (page = full frame)
  O.panelFrame = function (rects, o = {}) {
    const g = O.g;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.beginPath();
    g.rect(0, 0, W, H);
    for (const r of rects) if (r) g.rect(r[0] + r[2], r[1], -r[2], r[3]); // counter-clockwise holes
    g.fillStyle = o.paper || "#f4efe4";
    g.fill("nonzero");
    if (o.border !== false) {
      g.lineWidth = o.lw || 7;
      g.strokeStyle = "#0a0710";
      g.lineJoin = "miter";
      for (const r of rects) if (r && !r.noBorder) { g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.stroke(); }
    }
    g.restore();
  };

  // impact frame: high-contrast black/white negative of the current frame (a = 0..1 mix)
  O.impact = function (a = 1, invert = true) {
    if (a <= 0.01) return;
    const M = mc(), mg = M.m.g, g = O.g;
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.globalCompositeOperation = "copy";
    mg.filter = `grayscale(1) contrast(8)${invert ? " invert(1)" : ""}`;
    mg.drawImage(O.c, 0, 0);
    mg.filter = "none";
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = U.clamp(a);
    g.drawImage(M.m.c, 0, 0);
    g.globalAlpha = 1;
  };

  // big manga sound effect: Lalezar, thick outline, slight rotation, pop-in from t0
  O.sfx = function (str, x, y, o = {}) {
    const t = o.t, t0 = o.t0 || 0;
    if (t < t0) return;
    const k = U.clamp((t - t0) / 0.14);
    const out = o.t1 !== undefined ? U.clamp((t - o.t1) / 0.2) : 0;
    if (out >= 1) return;
    const g = O.g, size = o.size || 220;
    str = O.shape(str);
    g.save();
    g.translate(x + (o.shake ? Math.sin(t * 80) * o.shake : 0), y);
    g.rotate(o.rot || 0);
    const s = (0.6 + 0.4 * U.ease.outBack(k)) * (1 + out * 0.3);
    g.scale(s * (o.sx || 1), s);
    g.globalAlpha = 1 - out;
    g.font = `400 ${size}px ${O.SFXFONT}`;
    g.direction = o.ltr ? "ltr" : "rtl";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = size * 0.2;
    g.strokeStyle = o.outer || "#ffffff";
    g.strokeText(str, 0, 0);
    g.lineWidth = size * 0.09;
    g.strokeStyle = o.inner || "#0a0710";
    g.strokeText(str, 0, 0);
    g.fillStyle = o.color || "#0a0710";
    g.fillText(str, 0, 0);
    g.restore();
  };

  // small Latin/Arabic line (credits)
  O.text = function (str, x, y, o = {}) {
    const g = O.g;
    g.save();
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    g.font = o.font || "400 40px Amiri";
    g.direction = o.rtl ? "rtl" : "ltr";
    if (o.rtl) str = O.shape(str);
    g.textAlign = o.align || "center";
    g.textBaseline = "middle";
    if (o.tracking) g.letterSpacing = o.tracking;
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 24; }
    if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.strokeText(str, x, y); }
    g.fillStyle = o.color || "#fff";
    g.fillText(str, x, y);
    g.restore();
  };
})();
