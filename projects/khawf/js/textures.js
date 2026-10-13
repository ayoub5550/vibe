// textures.js — every image in the video is drawn here with Canvas 2D (no bitmaps, no AI images),
// except the four Blender atlases (assets/blender, built by blender/*.py from primitives).
//
// ART DIRECTION (AGENTS.md step 7)
//   World: خيال الظل, an Arab shadow theatre (parchment screen in a carved pointed arch, lantern
//   light) plus the night desert (فلاة) built as layered paper-cut dunes.
//   Palette (6 core + 1 accent family):
//     lamp amber  #f2c879  (screen light, truth glow)    henna red  #b8322a  (fear, lies, blood)
//     brass gold  #e0aa4a  (key words, crowns, frames)   indigo     #1d2357  (night, desert)
//     turquoise   #1f8a8a  ("we", the people, enamel)    bone       #f3ead8  (age, grey hair, mirror light)
//     accent family: moon silver-blues #9fb4dc / #dfe8f8 (mirrors, ghosts, the dream)
//   Type: Amiri 700 (key words + title; Aref Ruqaa dropped its dots in Chrome), Amiri 400 (credits).
//   Gold = truth/central words, red = fear's violence and lies, bone = neutral.
//   Finish: bloom on the lamp and brass, warm vignette, light grain, colour-dodge flashes on violence.
window.MV = window.MV || {};
(function () {
  const U = MV.U;

  const P = (MV.P = {
    amber: "#f2c879", amber2: "#ffe2a8", red: "#b8322a", redDeep: "#7a1712", gold: "#e0aa4a",
    gold2: "#ffd98a", indigo: "#1d2357", indigo2: "#2e3a7c", teal: "#1f8a8a", teal2: "#38b3a8",
    bone: "#f3ead8", ink: "#24120a", night: "#0b0f26", silver: "#9fb4dc", silver2: "#dfe8f8",
    saffron: "#e8a33a", skin: "#e2a872", wood: "#3a1f10", wood2: "#5c3418",
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
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    return t;
  }
  MV.tex = tex;

  MV.roundRect = function (g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  // pointed (Islamic) arch path: base y0 (bottom), half width w, springing height hs above base
  MV.archPath = function (g, cx, y0, w, hs, cRatio = 0.38) {
    const c = cRatio * w, r = w + c, ys = y0 - hs;
    const a1 = Math.acos(c / r);
    g.moveTo(cx - w, y0);
    g.lineTo(cx - w, ys);
    // left arc: centre (cx + c, ys), from angle PI (point (cx-w)) up to apex
    g.arc(cx + c, ys, r, Math.PI, Math.PI + a1, false);
    g.arc(cx - c, ys, r, -a1, 0, false);
    g.lineTo(cx + w, y0);
    g.closePath();
  };

  // eight-point star (two squares) centred at x,y with radius r
  MV.star8 = function (g, x, y, r, rot = 0) {
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = rot + (i * Math.PI) / 8;
      const rr = i % 2 ? r * 0.62 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
  };

  // girih-like lattice: 8-point stars and crosses on a square grid (mashrabiya / tiles)
  MV.lattice = function (g, x0, y0, w, h, s, color, lw) {
    g.save();
    g.beginPath();
    g.rect(x0, y0, w, h);
    g.clip();
    g.strokeStyle = color;
    g.lineWidth = lw;
    for (let y = y0 - s; y < y0 + h + s; y += s)
      for (let x = x0 - s; x < x0 + w + s; x += s) {
        MV.star8(g, x, y, s * 0.42, Math.PI / 8);
        g.stroke();
        g.beginPath();
        g.moveTo(x + s * 0.42, y); g.lineTo(x + s * 0.58, y);
        g.moveTo(x, y + s * 0.42); g.lineTo(x, y + s * 0.58);
        g.stroke();
      }
    g.restore();
  };

  // ------------------------------------------------------------------ cached textures
  const cache = {};
  function cached(key, fn) {
    if (!cache[key]) cache[key] = fn();
    return cache[key];
  }
  MV.texCache = cached;

  // parchment screen (white-ish; tinted per shot by the material colour)
  MV.parchmentTex = () => cached("parch", () => {
    // tone-mapped (draft 1 clipped to flat white over 20-35 % of the frame - critic P1): the centre
    // peaks around 215 luma once lit, the edges fall to ~140; fibres and stitched seams stay visible
    const W = 2048, H = 1152, c = canvas(W, H), g = c.getContext("2d");
    const grd = g.createRadialGradient(W / 2, H * 0.48, 60, W / 2, H * 0.5, W * 0.6);
    grd.addColorStop(0, "#ecd7ae");
    grd.addColorStop(0.5, "#dcbf8e");
    grd.addColorStop(1, "#a07246");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    // fibres
    const r = U.rng(7);
    g.globalAlpha = 0.1;
    for (let i = 0; i < 3200; i++) {
      const x = r() * W, y = r() * H, l = 10 + r() * 70, a = r() * Math.PI;
      g.strokeStyle = r() < 0.6 ? "#7a5228" : "#fff4dc";
      g.lineWidth = 1 + r() * 1.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    // mottled translucency (thin and thick patches of the skin)
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * H, rr = 60 + r() * 220;
      const m = g.createRadialGradient(x, y, 0, x, y, rr);
      m.addColorStop(0, r() < 0.5 ? "rgba(120,80,40,0.10)" : "rgba(255,240,210,0.08)");
      m.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = 1;
      g.fillStyle = m;
      g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    // stitched panel seams
    g.globalAlpha = 0.28;
    g.strokeStyle = "#5a3818";
    g.lineWidth = 3;
    for (const x of [W / 3, (2 * W) / 3]) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, H); g.stroke();
      for (let y = 10; y < H; y += 26) { g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 9, y + 8); g.stroke(); }
    }
    g.globalAlpha = 1;
    return tex(c);
  });

  // carved wooden proscenium with a pointed-arch opening and mashrabiya side panels (alpha hole)
  MV.prosceniumTex = () => cached("prosc", () => {
    const W = 2400, H = 1400, c = canvas(W, H), g = c.getContext("2d");
    const wood = g.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, "#5c3418");
    wood.addColorStop(0.5, "#40220f");
    wood.addColorStop(1, "#2a1508");
    g.fillStyle = wood;
    g.fillRect(0, 0, W, H);
    // side mashrabiya panels
    for (const x0 of [40, W - 360]) {
      g.fillStyle = "#1c0e05";
      g.fillRect(x0, 120, 320, H - 220);
      MV.lattice(g, x0, 120, 320, H - 220, 64, "#b98a4a", 7);
    }
    // gold trim around the opening
    g.save();
    g.beginPath();
    MV.archPath(g, W / 2, H - 70, 830, 760, 0.3);
    g.lineWidth = 46;
    g.strokeStyle = "#e0aa4a";
    g.stroke();
    g.lineWidth = 16;
    g.strokeStyle = "#7a4e1c";
    g.stroke();
    g.restore();
    // star band along the top
    g.fillStyle = "#e0aa4a";
    for (let x = 420; x < W - 400; x += 70) { MV.star8(g, x, 60, 18); g.fill(); }
    // cut the opening
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    MV.archPath(g, W / 2, H - 70, 808, 760, 0.3);
    g.fill();
    g.globalCompositeOperation = "source-over";
    return tex(c);
  });

  // night / dawn sky (gradient + stars), 2048x1024
  MV.skyTex = (kind) => cached("sky" + kind, () => {
    const W = 2048, H = 1024, c = canvas(W, H), g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, H);
    if (kind === "dawn") {
      grd.addColorStop(0, "#1b2350"); grd.addColorStop(0.45, "#4a4a8c"); grd.addColorStop(0.75, "#c07a6a"); grd.addColorStop(1, "#f2c879");
    } else if (kind === "abyss") {
      grd.addColorStop(0, "#020309"); grd.addColorStop(0.6, "#0b1030"); grd.addColorStop(1, "#28306a");
    } else {
      grd.addColorStop(0, "#131a45"); grd.addColorStop(0.55, "#2c3778"); grd.addColorStop(1, "#7c7fc0");
    }
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    const r = U.rng(kind === "abyss" ? 31 : 11);
    const n = kind === "dawn" ? 260 : 900;
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = Math.pow(r(), 1.6) * H * 0.8, s = r() < 0.06 ? 2.6 : 1 + r();
      g.globalAlpha = (0.4 + r() * 0.6) * (1 - y / H);
      g.fillStyle = r() < 0.15 ? "#ffe2a8" : "#ffffff";
      g.beginPath(); g.arc(x, y, s, 0, U.TAU); g.fill();
    }
    g.globalAlpha = 1;
    return tex(c);
  });

  MV.moonTex = () => cached("moon", () => {
    const S = 512, c = canvas(S, S), g = c.getContext("2d");
    const glow = g.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2);
    glow.addColorStop(0, "rgba(255,244,220,0.6)");
    glow.addColorStop(1, "rgba(255,244,220,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, S, S);
    const d = g.createRadialGradient(S * 0.45, S * 0.45, 10, S / 2, S / 2, S * 0.2);
    d.addColorStop(0, "#fffaf0");
    d.addColorStop(1, "#efe0bd");
    g.fillStyle = d;
    g.beginPath(); g.arc(S / 2, S / 2, S * 0.2, 0, U.TAU); g.fill();
    g.globalAlpha = 0.12;
    g.fillStyle = "#9a8a6a";
    const r = U.rng(3);
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(S / 2 + (r() - 0.5) * 120, S / 2 + (r() - 0.5) * 120, 8 + r() * 18, 0, U.TAU); g.fill(); }
    g.globalAlpha = 1;
    return tex(c);
  });

  // paper-cut dune layer: silhouette with a lit rim. idx picks the seed/profile.
  MV.duneTex = (idx, fill, rim) => cached("dune" + idx + fill, () => {
    const W = 2048, H = 512, c = canvas(W, H), g = c.getContext("2d");
    const r = U.rng(50 + idx);
    const ph = [r() * 6, r() * 6, r() * 6];
    const yAt = (x) => {
      const u = x / W;
      return H * (0.42 + 0.16 * Math.sin(u * 6.28 * 1.3 + ph[0]) + 0.09 * Math.sin(u * 6.28 * 3.1 + ph[1]) + 0.04 * Math.sin(u * 6.28 * 7 + ph[2]));
    };
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, yAt(x));
    g.lineTo(W, H);
    g.closePath();
    const grd = g.createLinearGradient(0, H * 0.2, 0, H);
    grd.addColorStop(0, fill);
    grd.addColorStop(1, shade(fill, -0.35));
    g.fillStyle = grd;
    g.fill();
    g.beginPath();
    for (let x = 0; x <= W; x += 8) g.lineTo(x, yAt(x) + 2);
    g.strokeStyle = rim;
    g.lineWidth = 6;
    g.stroke();
    return tex(c);
  });

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.round(U.clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255));
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  }
  MV.shade = shade;

  // sand ground: ripples, tileable
  MV.sandTex = () => cached("sand", () => {
    const S = 1024, c = canvas(S, S), g = c.getContext("2d");
    g.fillStyle = "#d9b27a";
    g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.16;
    for (let i = 0; i < 40; i++) {
      const y0 = (i / 40) * S;
      g.beginPath();
      for (let x = 0; x <= S; x += 16) g.lineTo(x, y0 + 8 * Math.sin((x / S) * U.TAU * 2 + i * 1.7));
      g.strokeStyle = i % 2 ? "#8a6236" : "#fff2d4";
      g.lineWidth = 5;
      g.stroke();
    }
    g.globalAlpha = 1;
    return tex(c, { repeat: [10, 10] });
  });

  // radial glow sprite (white, tinted by material colour)
  MV.glowTex = () => cached("glow", () => {
    const S = 256, c = canvas(S, S), g = c.getContext("2d");
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    return tex(c);
  });

  // dark wooden stage floor with a warm light pool
  MV.floorTex = () => cached("floor", () => {
    const S = 1024, c = canvas(S, S), g = c.getContext("2d");
    g.fillStyle = "#2a1508";
    g.fillRect(0, 0, S, S);
    g.globalAlpha = 0.35;
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "#3a1f10" : "#241206";
      g.fillRect(0, (i * S) / 16, S, S / 16 - 3);
    }
    g.globalAlpha = 1;
    // rug band with stars
    g.fillStyle = "#7a1712";
    g.fillRect(0, S * 0.08, S, S * 0.12);
    g.fillStyle = "#e0aa4a";
    for (let x = 30; x < S; x += 64) { MV.star8(g, x, S * 0.14, 18); g.fill(); }
    return tex(c, { repeat: [3, 1] });
  });

  // ---------------------------------------------------------------- props (white-on-alpha shapes etc.)
  function shape(key, w, h, draw) {
    return cached(key, () => {
      const c = canvas(w, h), g = c.getContext("2d");
      draw(g, w, h);
      return tex(c);
    });
  }
  MV.shapeTex = shape;

  // giant grasping hand silhouette (for "من يدنا"), fingers up
  MV.handTex = () => shape("hand", 512, 768, (g, w, h) => {
    g.fillStyle = "#000";
    g.beginPath();
    g.ellipse(w / 2, h * 0.72, 150, 190, 0, 0, U.TAU);
    g.fill();
    const fingers = [[-120, -0.42, 210], [-50, -0.5, 270], [25, -0.52, 290], [100, -0.46, 250]];
    for (const [dx, , len] of fingers) {
      MV.roundRect(g, w / 2 + dx - 30, h * 0.62 - len, 62, len + 40, 30);
      g.fill();
    }
    g.save();
    g.translate(w / 2 - 150, h * 0.7);
    g.rotate(-0.8);
    MV.roundRect(g, -34, -180, 68, 200, 34);
    g.fill();
    g.restore();
    g.fillRect(w / 2 - 110, h * 0.8, 220, h * 0.2);
  });

  // a fallen figure, chalk outline ("crime without criminal")
  MV.chalkTex = () => shape("chalk", 1024, 512, (g, w, h) => {
    g.strokeStyle = "#fff8ea";
    g.lineWidth = 9;
    g.lineJoin = "round";
    g.setLineDash([26, 10]);
    g.beginPath();
    g.ellipse(170, 240, 60, 70, 0, 0, U.TAU);
    g.stroke();
    g.beginPath();
    g.moveTo(230, 210); g.lineTo(330, 120); g.lineTo(420, 90); g.lineTo(430, 130); g.lineTo(350, 170);
    g.lineTo(560, 200); g.lineTo(760, 120); g.lineTo(790, 160); g.lineTo(620, 250); g.lineTo(840, 300);
    g.lineTo(830, 345); g.lineTo(570, 310); g.lineTo(380, 330); g.lineTo(300, 420); g.lineTo(265, 395);
    g.lineTo(320, 300); g.lineTo(230, 270);
    g.closePath();
    g.stroke();
  });

  // a bare footprint (heel, arch, ball, five toes) with a pale rim of pushed-up sand, so it reads
  // as a foot even at a grazing angle (draft 1's two ellipses read as blobs)
  MV.footprintTex = () => shape("foot", 128, 256, (g) => {
    const sole = () => {
      g.beginPath();
      g.moveTo(52, 236);
      g.bezierCurveTo(26, 230, 28, 186, 40, 160);
      g.bezierCurveTo(48, 140, 34, 120, 32, 98);
      g.bezierCurveTo(30, 66, 56, 56, 74, 58);
      g.bezierCurveTo(98, 60, 104, 84, 100, 104);
      g.bezierCurveTo(96, 132, 84, 150, 84, 178);
      g.bezierCurveTo(84, 212, 78, 238, 52, 236);
      g.closePath();
    };
    const toes = [[40, 44, 9], [56, 34, 10], [72, 32, 10], [87, 38, 9], [98, 50, 8]];
    g.strokeStyle = "rgba(255,240,215,0.7)"; g.lineWidth = 8;
    sole(); g.stroke();
    for (const [x, y, r] of toes) { g.beginPath(); g.arc(x, y, r + 3, 0, U.TAU); g.stroke(); }
    g.fillStyle = "rgba(48,28,14,0.92)";
    sole(); g.fill();
    for (const [x, y, r] of toes) { g.beginPath(); g.arc(x, y, r, 0, U.TAU); g.fill(); }
  });

  // the dream beast: a horned, clawed shadow with long reaching arms (black on alpha; eyes are holes)
  MV.beastTex = () => shape("beast", 1024, 1024, (g, w, h) => {
    g.fillStyle = "#000";
    // body: hunched, tapering to the ground
    g.beginPath();
    g.moveTo(300, 1024);
    g.bezierCurveTo(300, 820, 330, 600, 420, 470);
    g.bezierCurveTo(470, 420, 560, 420, 610, 470);
    g.bezierCurveTo(700, 600, 730, 820, 724, 1024);
    g.closePath();
    g.fill();
    // head + horns
    g.beginPath();
    g.ellipse(512, 380, 120, 105, 0, 0, U.TAU);
    g.fill();
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(512 + s * 60, 310);
      g.bezierCurveTo(512 + s * 120, 200, 512 + s * 220, 160, 512 + s * 250, 40);
      g.bezierCurveTo(512 + s * 200, 150, 512 + s * 150, 230, 512 + s * 110, 340);
      g.closePath();
      g.fill();
      // arm reaching up and out, three long claws
      g.beginPath();
      g.moveTo(512 + s * 90, 520);
      g.bezierCurveTo(512 + s * 260, 520, 512 + s * 340, 420, 512 + s * 380, 250);
      g.lineTo(512 + s * 420, 260);
      g.bezierCurveTo(512 + s * 390, 460, 512 + s * 300, 600, 512 + s * 110, 640);
      g.closePath();
      g.fill();
      for (let c = 0; c < 3; c++) {
        const bx = 512 + s * (372 + c * 22), by = 256 + c * 6;
        g.beginPath();
        g.moveTo(bx - 10 * s, by);
        g.quadraticCurveTo(bx + s * (10 + c * 18), by - 80, bx + s * (40 + c * 30), by - 150 + c * 20);
        g.quadraticCurveTo(bx + s * (8 + c * 14), by - 60, bx + 14 * s, by + 4);
        g.closePath();
        g.fill();
      }
    }
    g.globalCompositeOperation = "destination-out";
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(512 + s * 46, 385, 30, 13, s * -0.35, 0, U.TAU); g.fill(); }
    g.beginPath(); g.moveTo(450, 440); g.lineTo(574, 440); g.lineTo(512, 470); g.closePath(); g.fill();
    g.globalCompositeOperation = "source-over";
  });

  // balance scale parts (leather-puppet style, brass)
  MV.beamTex = () => shape("beam", 1024, 128, (g, w, h) => {
    g.fillStyle = P.gold; g.strokeStyle = P.ink; g.lineWidth = 8;
    MV.roundRect(g, 20, 44, w - 40, 40, 20); g.fill(); g.stroke();
    g.fillStyle = "#fff3d0";
    for (let x = 80; x < w - 60; x += 70) { g.beginPath(); g.arc(x, 64, 7, 0, U.TAU); g.fill(); }
  });
  MV.panTex = () => shape("pan", 512, 640, (g, w, h) => {
    g.strokeStyle = P.ink; g.lineWidth = 6;
    g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(70, 470); g.moveTo(w / 2, 10); g.lineTo(w - 70, 470); g.stroke();
    g.fillStyle = P.gold;
    g.beginPath(); g.moveTo(40, 470); g.quadraticCurveTo(w / 2, 660, w - 40, 470); g.closePath(); g.fill(); g.stroke();
  });
  MV.postTex = () => shape("post", 256, 1024, (g, w, h) => {
    g.fillStyle = P.wood2; g.strokeStyle = P.ink; g.lineWidth = 8;
    MV.roundRect(g, 100, 60, 56, h - 120, 20); g.fill(); g.stroke();
    g.fillStyle = P.gold;
    g.beginPath(); g.moveTo(40, h - 20); g.lineTo(w - 40, h - 20); g.lineTo(w / 2 + 40, h - 110); g.lineTo(w / 2 - 40, h - 110); g.closePath(); g.fill(); g.stroke();
    MV.star8(g, w / 2, 70, 50); g.fill(); g.stroke();
  });
  // a heavy weight (crimes) labelled with nothing, just mass
  MV.weightTex = () => shape("weight", 384, 384, (g, w, h) => {
    g.fillStyle = "#2a1508"; g.strokeStyle = P.ink; g.lineWidth = 8;
    g.beginPath(); g.moveTo(60, h - 30); g.lineTo(w - 60, h - 30); g.lineTo(w - 110, 110); g.lineTo(110, 110); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(w / 2, 90, 46, 0, U.TAU); g.lineWidth = 18; g.strokeStyle = "#2a1508"; g.stroke();
    g.fillStyle = P.red;
    MV.star8(g, w / 2, 240, 60); g.fill();
  });

  // dais / throne for "the night the slave judges his master"
  MV.daisTex = () => shape("dais", 1024, 640, (g, w, h) => {
    g.fillStyle = P.wood2; g.strokeStyle = P.ink; g.lineWidth = 10;
    g.beginPath(); g.moveTo(120, h - 20); g.lineTo(w - 120, h - 20); g.lineTo(w - 200, 300); g.lineTo(200, 300); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = P.teal;
    g.fillRect(230, 340, w - 460, 70);
    g.fillStyle = P.gold;
    for (let x = 270; x < w - 240; x += 80) { MV.star8(g, x, 375, 22); g.fill(); }
    g.fillStyle = P.red;
    g.beginPath(); MV.archPath(g, w / 2, 300, 170, 120, 0.4); g.fill(); g.stroke();
  });

  // doorway arch for the guest (frame only, alpha inside)
  MV.doorTex = () => shape("door", 768, 1024, (g, w, h) => {
    g.fillStyle = P.wood;
    g.fillRect(0, 0, w, h);
    MV.lattice(g, 0, 0, w, h, 96, "#8a5a2a", 6);
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); MV.archPath(g, w / 2, h, 250, 560, 0.35); g.fill();
    g.globalCompositeOperation = "source-over";
    g.beginPath(); MV.archPath(g, w / 2, h, 262, 566, 0.35);
    g.lineWidth = 22; g.strokeStyle = P.gold; g.stroke();
  });

})();
