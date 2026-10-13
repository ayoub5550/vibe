// overlay.js — 2D canvas drawn above the WebGL canvas every frame: bloom, grade, grain, flashes,
// letterbox and the "UI" graphics (viewfinder, counters, credits, quotes, title).
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const O = (MV.Overlay = {});
  const W = U.W, H = U.H;

  O.init = function (canvasEl, glCanvas) {
    O.c = canvasEl;
    O.g = canvasEl.getContext("2d");
    O.gl = glCanvas;
    // small buffer for cheap bloom
    O.small = MV.canvas(480, 270);
    O.sg = O.small.getContext("2d");
    // vignette
    O.vig = MV.canvas(W, H);
    const vg = O.vig.getContext("2d");
    const grd = vg.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.5)");
    vg.fillStyle = grd;
    vg.fillRect(0, 0, W, H);
    // grain tiles (4 variants, picked by frame)
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

  // The overlay is OPAQUE: it starts as a copy of the GL frame, so every pass below composites on
  // the real image. (Draft 1 drew bloom onto a transparent canvas: its crushed-black pixels then
  // veiled the whole frame at the bloom alpha, a hidden 30-40% darkening. Never do that again.)
  // lift = midtone lift: screen the frame with itself (x + lift*(x - x^2)), about +1 stop in the mids.
  O.begin = function (lift = 0.6) {
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

  O.bloom = function (amount = 0.55) {
    if (amount <= 0) return;
    const sg = O.sg, g = O.g;
    sg.globalCompositeOperation = "copy";
    // crude threshold: crush darks with contrast/brightness before blurring
    sg.filter = "contrast(2.4) brightness(0.55) blur(5px)";
    sg.drawImage(O.gl, 0, 0, 480, 270);
    sg.filter = "none";
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = amount;
    g.drawImage(O.small, 0, 0, W, H);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  };

  O.vignette = function (a = 1) {
    O.g.globalAlpha = a;
    O.g.drawImage(O.vig, 0, 0);
    O.g.globalAlpha = 1;
  };

  O.grainPass = function (t, a = 0.06) {
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

  // black = fade (source-over). Any other colour = an EXPOSURE flash (colour-dodge): brights blow
  // out, blacks stay black, so the hit reads as light instead of a milky wash.
  O.flash = function (color, a) {
    if (a <= 0.003) return;
    const g = O.g;
    if (color === "#000" || color === "#000000" || color === "black") {
      g.globalAlpha = U.clamp(a);
      g.fillStyle = color;
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
    g.globalAlpha = U.clamp(a) * 0.12;
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

  // text helper on the overlay
  O.text = function (str, x, y, o = {}) {
    const g = O.g;
    g.save();
    g.globalAlpha = o.alpha !== undefined ? o.alpha : 1;
    g.font = o.font || "900 120px 'Big Shoulders Display'";
    g.textAlign = o.align || "center";
    g.textBaseline = o.baseline || "middle";
    if (o.tracking) g.letterSpacing = o.tracking;
    if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.scale) { g.translate(x, y); g.scale(o.scale, o.scale); x = 0; y = 0; }
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 30; }
    if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.strokeText(str, x, y); }
    g.fillStyle = o.color || "#fff";
    g.fillText(str, x, y);
    g.restore();
  };

  // ---- viewfinder / crop UI ("they gon' crop you out the frame")
  O.viewfinder = function (t, box, o = {}) {
    const g = O.g;
    g.save();
    const red = o.color || "#ff3b30";
    g.strokeStyle = red;
    g.lineWidth = 5;
    const [x, y, w, h] = box;
    const L = Math.min(w, h) * 0.18;
    g.beginPath();
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      g.moveTo(cx, cy + sy * L); g.lineTo(cx, cy); g.lineTo(cx + sx * L, cy);
    }
    g.stroke();
    g.setLineDash([14, 10]);
    g.lineWidth = 2;
    g.strokeRect(x, y, w, h);
    g.setLineDash([]);
    // rule of thirds
    g.globalAlpha = 0.35;
    for (let i = 1; i < 3; i++) {
      g.beginPath(); g.moveTo(x + (w * i) / 3, y); g.lineTo(x + (w * i) / 3, y + h); g.stroke();
      g.beginPath(); g.moveTo(x, y + (h * i) / 3); g.lineTo(x + w, y + (h * i) / 3); g.stroke();
    }
    g.globalAlpha = 1;
    // REC + timecode
    const on = Math.floor(t * 2) % 2 === 0;
    if (on) { g.fillStyle = red; g.beginPath(); g.arc(110, 96, 16, 0, U.TAU); g.fill(); }
    O.text("REC", 140, 98, { font: "700 40px 'Josefin Sans'", align: "left", color: "#fff" });
    const f = Math.floor(t * U.FPS);
    const tc = `00:${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}`;
    O.text(tc, W - 110, 98, { font: "700 40px 'Josefin Sans'", align: "right", color: "#fff", tracking: "4px" });
    O.text(o.label || "CROP 2.39:1", x + 8, y - 26, { font: "700 30px 'Josefin Sans'", align: "left", color: red, tracking: "3px" });
    g.restore();
  };

  // ---- big counter with tally marks ("count all my regrets")
  O.counter = function (n, x, y, a = 1, o = {}) {
    const g = O.g;
    g.save();
    g.globalAlpha = a;
    O.text(String(n), x, y, { font: "900 260px 'Big Shoulders Display'", color: "#f8de94", glow: "rgba(255,190,80,0.9)", blur: 40 });
    // tally marks under the number
    const groups = Math.floor(n / 5), rest = n % 5;
    let cx = x - ((groups + (rest ? 1 : 0)) * 90) / 2 + 10;
    g.strokeStyle = "#e3b553";
    g.lineWidth = 7;
    g.lineCap = "round";
    const ty = y + 170;
    for (let i = 0; i < groups + (rest ? 1 : 0); i++) {
      const k = i < groups ? 5 : rest;
      for (let j = 0; j < Math.min(4, k); j++) { g.beginPath(); g.moveTo(cx + j * 16, ty - 34); g.lineTo(cx + j * 16, ty + 34); g.stroke(); }
      if (k === 5) { g.beginPath(); g.moveTo(cx - 10, ty + 26); g.lineTo(cx + 60, ty - 26); g.stroke(); }
      cx += 90;
    }
    g.restore();
  };

  // ---- film strip border with sprockets
  O.filmStrip = function (t, a = 1, speed = 120) {
    const g = O.g;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = "#07070a";
    g.fillRect(0, 0, W, 120);
    g.fillRect(0, H - 120, W, 120);
    g.fillStyle = "#e9e1cf";
    const off = (t * speed) % 80;
    for (let x = -off; x < W + 80; x += 80) {
      MV.roundRect(g, x + 18, 34, 40, 52, 8); g.fill();
      MV.roundRect(g, x + 18, H - 86, 40, 52, 8); g.fill();
    }
    g.restore();
  };

  // ---- credits list ("the credits never roll")
  O.credits = function (lines, scroll, a = 1) {
    const g = O.g;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = "rgba(3,5,12,0.45)";
    g.fillRect(W * 0.56, 120, W * 0.44, H - 240);
    let y = 260 - scroll;
    for (const [role, name] of lines) {
      if (y > 140 && y < H - 140) {
        O.text(role, W * 0.74 - 24, y, { font: "400 44px Limelight", align: "right", color: "#e3b553" });
        O.text(name, W * 0.74 + 24, y, { font: "700 40px 'Josefin Sans'", align: "left", color: "#f4ecd8", tracking: "3px" });
      }
      y += 86;
    }
    g.restore();
  };

  // ---- quote, words revealed at word timestamps
  O.quote = function (t, words, x, y, o = {}) {
    // words: [[text, startTime], ...] laid out on one or two centred lines
    const g = O.g;
    g.save();
    g.font = o.font || "400 70px Limelight";
    const space = 22;
    const lines = o.lines || [words];
    let ly = y;
    for (const line of lines) {
      const widths = line.map((w) => g.measureText(w[0]).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (line.length - 1);
      let lx = x - total / 2;
      line.forEach((w, i) => {
        const k = U.clamp((t - w[1]) / 0.18);
        if (k > 0) {
          g.globalAlpha = k * (o.alpha !== undefined ? o.alpha : 1);
          g.fillStyle = o.color || "#f4ecd8";
          g.shadowColor = o.glow || "rgba(255,190,80,0.7)";
          g.shadowBlur = 24;
          g.textAlign = "left";
          g.textBaseline = "middle";
          g.fillText(w[0], lx, ly + (1 - U.ease.outCubic(k)) * 30);
        }
        lx += widths[i] + space;
      });
      ly += o.lineH || 96;
    }
    g.restore();
  };

  // ---- chromatic split of the GL frame (glitch)
  O.glitch = function (t, amt) {
    if (amt <= 0) return;
    const g = O.g;
    const off = 6 + amt * 30;
    g.save();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.35 * amt;
    g.drawImage(O.gl, off, 0);
    g.drawImage(O.gl, -off, 0);
    g.restore();
    const r = U.rng(Math.floor(t * 30) + 7);
    g.save();
    for (let i = 0; i < 6 * amt; i++) {
      const y = r() * H, h = 10 + r() * 60, dx = (r() - 0.5) * 120 * amt;
      g.drawImage(O.gl, 0, y, W, h, dx, y, W, h);
    }
    g.restore();
  };
})();
