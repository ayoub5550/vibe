// overlay.js — the 2D post pass drawn above the WebGL canvas every frame (opaque: it starts as a
// copy of the GL frame): midtone lift, bloom, Arabic kinetic type, letterbox, vignette, grain, flash.
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
    grd.addColorStop(1, "rgba(20,8,0,0.55)");
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
    gold: { a: "#fff0c4", b: "#e0aa4a", glow: "rgba(255,186,80,0.85)", edge: "#3a1f08" },
    red: { a: "#ff8a6a", b: "#b8221a", glow: "rgba(255,60,30,0.8)", edge: "#2a0604" },
    bone: { a: "#ffffff", b: "#efe2c4", glow: "rgba(255,236,200,0.7)", edge: "#2a1508" },
    silver: { a: "#ffffff", b: "#a9bde4", glow: "rgba(150,185,255,0.8)", edge: "#0b1030" },
    // on the bright parchment, pale words become cut-out ink with a light rim
    ink: { a: "#5a3418", b: "#1a0c05", glow: "rgba(255,244,220,0.95)", edge: "#fff3d6" },
    goldInk: { a: "#f2c25a", b: "#a8641c", glow: "rgba(255,244,220,0.9)", edge: "#2a1406" },
  };
  O.STY = STY;
  O.bright = false; // set per frame by main.js: true while the parchment screen is behind the type
  // Amiri stacks lam + jeem/hah/khah into one ligature that reads «انخوف»; a ZWJ keeps the joins
  // but breaks the ligature («الخوف»).
  O.shape = (str) => str.replace(/\u0644(?=[\u062C\u062D\u062E])/g, "\u0644\u200D");
  O.KEYFONT = "Amiri";
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
    if (O.bright && !o.keepStyle) sname = sname === "bone" || sname === "silver" ? "ink" : sname === "gold" ? "goldInk" : sname;
    const s = STY[sname];
    const size = o.size || 200;
    const g = O.g;
    const font = o.font || `700 ${size}px ${O.KEYFONT}`;
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
    if (o.plate !== false) {
      const R = w * 0.75 + 80;
      const pg = g.createRadialGradient(0, 0, 10, 0, 0, R);
      if (O.bright) {
        pg.addColorStop(0, `rgba(255,246,226,${0.42 * (o.plateA || 1) * kin * alpha})`);
        pg.addColorStop(1, "rgba(255,246,226,0)");
      } else {
        pg.addColorStop(0, `rgba(12,6,2,${0.5 * (o.plateA || 1) * kin * alpha})`);
        pg.addColorStop(1, "rgba(12,6,2,0)");
      }
      g.fillStyle = pg;
      g.save(); g.scale(1, 0.5); g.beginPath(); g.arc(0, 0, R, 0, U.TAU); g.fill(); g.restore();
    }
    g.globalAlpha = alpha;
    g.drawImage(sc, 0, 0, cw, ch, -cx, -cy, cw, ch);
    g.restore();
    return w * scl;
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
