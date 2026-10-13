// stage.js — the three.js world: the shadow theatre (parchment screen in a carved arch, lanterns,
// wooden stage) and the night desert (sky, moon, paper-cut dune layers, sand), plus pools for
// puppets, their shadows, sprites, Blender-atlas sprites, mirrors and glowing dots.
// Immediate mode (M3): W.reset() hides everything every frame, then the active shot switches on
// and positions only what it needs. No state survives between frames.
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const W = (MV.World = {});
  const PC = MV.PUPPET_CANVAS;
  const ASPECT = PC.w / PC.h;
  const FOOT = (PC.h - PC.groundY) / PC.h; // plane space below the ground line

  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const footGeo = new THREE.PlaneGeometry(1, 1);
  footGeo.translate(0, 0.5 - FOOT, 0); // origin at the puppet's ground line
  const bottomGeo = new THREE.PlaneGeometry(1, 1);
  bottomGeo.translate(0, 0.5, 0); // origin at bottom centre

  function basic(map, o = {}) {
    return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, depthWrite: false }, o));
  }
  function add(map, o = {}) {
    return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }, o));
  }
  const pools = {};
  function pool(name, n, make) {
    pools[name] = { items: Array.from({ length: n }, make), used: 0 };
    return pools[name];
  }
  function take(name) {
    const p = pools[name];
    if (p.used >= p.items.length) { console.warn("pool full: " + name); return null; }
    const m = p.items[p.used++];
    m.visible = true;
    return m;
  }

  W.init = function (canvasEl) {
    const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(U.W, U.H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    W.renderer = renderer;
    const scene = (W.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x05060d);
    W.camera = new THREE.PerspectiveCamera(38, U.W / U.H, 0.05, 900);
    const dummy = MV.glowTex();

    // ---------------- theatre
    const th = (W.theatre = new THREE.Group());
    scene.add(th);
    W.screen = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: MV.parchmentTex() }));
    W.screen.scale.set(16, 9, 1);
    W.screen.position.set(0, 4.5, 0);
    W.screen.renderOrder = -10;
    th.add(W.screen);
    W.hot = new THREE.Mesh(planeGeo, add(MV.glowTex(), { color: 0xffd9a0, opacity: 0.55 }));
    W.hot.position.z = 0.003;
    W.hot.renderOrder = -9;
    th.add(W.hot);
    W.prosc = new THREE.Mesh(planeGeo, basic(MV.prosceniumTex(), { depthWrite: true, alphaTest: 0.5 }));
    W.prosc.scale.set(24, 14, 1);
    W.prosc.position.set(0, 6.3, 0.9);
    W.prosc.renderOrder = 5;
    th.add(W.prosc);
    W.stageFloor = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: MV.floorTex(), color: 0xb08060 }));
    W.stageFloor.rotation.x = -Math.PI / 2;
    W.stageFloor.scale.set(40, 24, 1);
    W.stageFloor.position.set(0, -0.72, 12);
    th.add(W.stageFloor);

    // ---------------- desert
    const de = (W.desert = new THREE.Group());
    scene.add(de);
    W.skies = {};
    ["night", "dawn", "abyss"].forEach((k, i) => {
      const m = new THREE.Mesh(planeGeo, basic(MV.skyTex(k), { opacity: 1, depthWrite: false }));
      m.scale.set(420, 210, 1);
      m.position.set(0, 60, -120 + i * 0.5);
      m.renderOrder = -20 + i;
      de.add(m);
      W.skies[k] = m;
    });
    W.moon = new THREE.Mesh(planeGeo, basic(MV.moonTex(), { depthWrite: false }));
    W.moon.renderOrder = -15;
    de.add(W.moon);
    W.dunes = [];
    const duneSpec = [
      [0, "#8c8fc8", "#e6dcff", -70, 160, 30], [1, "#6c6fae", "#f2d9a8", -48, 120, 22],
      [2, "#50528f", "#ffd98a", -30, 90, 15], [3, "#3a3b72", "#ffcf7a", -16, 60, 9],
    ];
    for (const [i, fill, rim, z, w, h] of duneSpec) {
      const m = new THREE.Mesh(bottomGeo, basic(MV.duneTex(i, fill, rim), { depthWrite: false }));
      m.scale.set(w, h, 1);
      m.position.set(0, -h * 0.28, z);
      m.renderOrder = -14 + i;
      de.add(m);
      W.dunes.push(m);
    }
    W.ground = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: MV.sandTex(), color: 0x9a8fb8 }));
    W.ground.rotation.x = -Math.PI / 2;
    W.ground.scale.set(400, 400, 1);
    W.ground.position.set(0, 0, 0);
    W.ground.renderOrder = -12;
    de.add(W.ground);

    // ---------------- puppet slots: leather canvas + derived shadow canvas
    W.slots = [];
    for (let i = 0; i < 5; i++) {
      const c = MV.canvas(PC.w, PC.h), sc = MV.canvas(PC.w / 2, PC.h / 2);
      W.slots.push({ c, g: c.getContext("2d"), tex: MV.tex(c, { mips: false }), sc, sg: sc.getContext("2d"), stex: MV.tex(sc, { mips: false }) });
    }
    pool("pup", 30, () => { const m = new THREE.Mesh(footGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
    pool("shd", 20, () => { const m = new THREE.Mesh(footGeo, basic(dummy, { color: 0x1a0d06 })); m.visible = false; scene.add(m); return m; });
    pool("spr", 60, () => { const m = new THREE.Mesh(planeGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
    pool("sprB", 30, () => { const m = new THREE.Mesh(bottomGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
    pool("addv", 40, () => { const m = new THREE.Mesh(planeGeo, add(dummy)); m.visible = false; scene.add(m); return m; });
    // dynamic canvases (Blender atlas frames, mirrors, animated props): persistent per key, redrawn
    // completely each frame they are used (frame = f(t))
    W.dyns = {};
    pool("dyn", 24, () => { const m = new THREE.Mesh(planeGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });

    // glowing dots (embers, sand, white hairs, stars): one Points cloud, positions rebuilt per frame
    const N = 900;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.PointsMaterial({ size: 0.12, map: MV.glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    W.dots = new THREE.Points(geo, mat);
    W.dots.frustumCulled = false;
    scene.add(W.dots);
    W.dotN = 0;
    W.DOTMAX = N;
  };

  // ---------------------------------------------------------------- per-frame reset
  W.reset = function () {
    for (const k in pools) {
      const p = pools[k];
      for (const m of p.items) { m.visible = false; m.rotation.set(0, 0, 0); m.renderOrder = 0; }
      p.used = 0;
    }
    W.theatre.visible = false;
    W.desert.visible = false;
    W.dotN = 0;
    W.dots.material.size = 0.12;
    W.scene.background.set(0x05060d);
    W.renderer.toneMappingExposure = 1;
    W.cam([0, 4.5, 15.5], [0, 4.5, 0], 38);
  };

  W.cam = function (pos, look, fov = 38, roll = 0) {
    const c = W.camera;
    c.position.set(pos[0], pos[1], pos[2]);
    c.up.set(Math.sin(roll), Math.cos(roll), 0);
    c.lookAt(look[0], look[1], look[2]);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
  };

  // theatre: tint = screen colour (amber default), hot = [x, y, size, intensity] lamp hotspot
  W.setTheatre = function (o = {}) {
    W.theatre.visible = true;
    W.screen.material.color.set(o.tint || 0xffe7bf);
    const h = o.hot || [0, 4.6, 14, 0.55];
    W.hot.position.set(h[0], h[1], 0.003);
    W.hot.scale.set(h[2], h[2] * 0.75, 1);
    W.hot.material.opacity = h[3] * 0.5; // halved after draft 1 (the hotspot clipped to white)
    W.hot.material.color.set(o.hotColor || 0xffd9a0);
    W.prosc.visible = o.prosc !== false;
    W.stageFloor.visible = o.prosc !== false;
    W.scene.background.set(o.bg || 0x0a0603);
  };

  // desert: sky = night | dawn | abyss (or [a, b, k] crossfade), sand = ground tint, moon [x, y, size]
  W.setDesert = function (o = {}) {
    W.desert.visible = true;
    const sky = o.sky || "night";
    for (const k in W.skies) W.skies[k].visible = false;
    if (Array.isArray(sky)) {
      W.skies[sky[0]].visible = true; W.skies[sky[0]].material.opacity = 1;
      W.skies[sky[1]].visible = true; W.skies[sky[1]].material.opacity = sky[2];
    } else { W.skies[sky].visible = true; W.skies[sky].material.opacity = 1; }
    const mo = o.moon === undefined ? [-38, 34, 26] : o.moon;
    W.moon.visible = !!mo;
    if (mo) { W.moon.position.set(mo[0], mo[1], -100); W.moon.scale.set(mo[2], mo[2], 1); W.moon.material.opacity = mo[3] === undefined ? 1 : mo[3]; }
    const dt = o.duneTint || 0xffffff;
    W.dunes.forEach((d, i) => { d.material.color.set(dt); d.visible = !(o.hideDunes && o.hideDunes.includes(i)); d.position.x = (o.duneX || 0) * (0.2 + i * 0.25); });
    W.ground.material.color.set(o.sand || 0x9a8fb8);
    W.ground.visible = o.ground !== false;
    W.scene.background.set(0x131a45);
  };

  // ---------------------------------------------------------------- puppets
  // draw a puppet into slot i (leather) and derive its shadow (black, blurred)
  W.drawSlot = function (i, kind, pose, o = {}, t = 0, blur = 4) {
    const s = W.slots[i];
    const J = MV.drawPuppet(s.g, kind, pose, o, t);
    s.tex.needsUpdate = true;
    s.sg.clearRect(0, 0, s.sc.width, s.sc.height);
    s.sg.filter = `brightness(0) blur(${blur}px)`;
    s.sg.drawImage(s.c, 0, 0, s.sc.width, s.sc.height);
    s.sg.filter = "none";
    s.stex.needsUpdate = true;
    s.joints = J;
    return J;
  };
  // leather puppet plane: x, y = ground point, h = canvas height in world units
  W.puppet = function (i, x, y, z, h, o = {}) {
    const m = take("pup");
    if (!m) return null;
    m.material.map = W.slots[i].tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.material.color.set(o.color || 0xffffff);
    m.position.set(x, y, z);
    m.scale.set(h * ASPECT * (o.flip ? -1 : 1), h, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    m.renderOrder = o.order || 2;
    return m;
  };
  W.shadow = function (i, x, y, z, h, o = {}) {
    const m = take("shd");
    if (!m) return null;
    m.material.map = W.slots[i].stex;
    m.material.opacity = o.opacity === undefined ? 0.85 : o.opacity;
    m.material.color.set(o.color || 0x1a0d06);
    m.position.set(x, y, z);
    m.scale.set(h * ASPECT * (o.flip ? -1 : 1) * (o.sx || 1), h, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    m.renderOrder = o.order || 1;
    return m;
  };
  // shadow lying on the desert floor behind a standing puppet (light in front, low)
  W.groundShadow = function (i, x, z, h, len = 1.4, o = {}) {
    const m = take("shd");
    if (!m) return null;
    m.material.map = W.slots[i].stex;
    m.material.opacity = o.opacity === undefined ? 0.55 : o.opacity;
    m.material.color.set(o.color || 0x0b0a20);
    m.position.set(x, 0.02, z);
    m.scale.set(h * ASPECT * (o.flip ? -1 : 1), h * len, 1);
    m.rotation.set(-Math.PI / 2, 0, o.rot || 0);
    m.renderOrder = -11;
    return m;
  };

  // ---------------------------------------------------------------- sprites
  W.sprite = function (tex, x, y, z, w, h, o = {}) {
    const m = take(o.additive ? "addv" : o.bottom ? "sprB" : "spr");
    if (!m) return null;
    m.material.map = tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.material.color.set(o.color || 0xffffff);
    m.position.set(x, y, z);
    m.scale.set(w, h, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    m.renderOrder = o.order || 3;
    return m;
  };
  W.glow = function (x, y, z, size, color = 0xffd9a0, opacity = 0.6, order = 4) {
    return W.sprite(MV.glowTex(), x, y, z, size, size, { additive: true, color, opacity, order });
  };
  W.dot = function (x, y, z, r, g, b) {
    if (W.dotN >= W.DOTMAX) return;
    const pa = W.dots.geometry.attributes.position.array, ca = W.dots.geometry.attributes.color.array;
    const i = W.dotN++ * 3;
    pa[i] = x; pa[i + 1] = y; pa[i + 2] = z;
    ca[i] = r; ca[i + 1] = g; ca[i + 2] = b;
  };

  // dynamic canvas plane by key (w x h px). draw(g, w, h) must repaint everything.
  W.dyn = function (key, w, h, draw, x, y, z, worldH, o = {}) {
    let d = W.dyns[key];
    if (!d) {
      const c = MV.canvas(w, h);
      d = W.dyns[key] = { c, g: c.getContext("2d"), tex: MV.tex(c, { mips: false }) };
    }
    d.g.setTransform(1, 0, 0, 1, 0, 0);
    d.g.clearRect(0, 0, w, h);
    draw(d.g, w, h);
    d.tex.needsUpdate = true;
    const m = take("dyn");
    if (!m) return null;
    m.material.map = d.tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.material.color.set(o.color || 0xffffff);
    m.position.set(x, y + (o.bottom ? worldH / 2 : 0), z);
    m.scale.set((worldH * w) / h * (o.flip ? -1 : 1), worldH, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    m.renderOrder = o.order || 3;
    return m;
  };

  // Blender atlas frame -> canvas (2D drawImage from the hidden <img>; never a WebGL texture from an <img>)
  W.atlasImg = {};
  W.drawAtlas = function (g, name, frame, dx, dy, dw, dh) {
    const A = MV.ATLAS[name];
    let img = W.atlasImg[name];
    if (!img) img = W.atlasImg[name] = document.getElementById("atl-" + name);
    if (!img || !img.complete || !img.naturalWidth) return;
    const i = U.clamp(Math.floor(frame), 0, A.frames - 1);
    g.drawImage(img, (i % A.cols) * A.w, Math.floor(i / A.cols) * A.h, A.w, A.h, dx, dy, dw, dh);
  };
  // cyclic atlas (lantern, crown) by time; one-shot (hourglass) by 0..1 progress
  W.atlas = function (name, frame, x, y, z, worldH, o = {}) {
    const A = MV.ATLAS[name];
    return W.dyn((o.key || name) + "@" + (o.slot || 0), A.w, A.h, (g, w, h) => W.drawAtlas(g, name, frame, 0, 0, w, h), x, y, z, worldH, o);
  };
  W.loopFrame = (name, t, rate = 1, off = 0) => {
    const A = MV.ATLAS[name];
    return ((Math.floor(t * A.fps * rate) + off) % A.frames + A.frames) % A.frames;
  };

  // mirror: Blender frame at `angle` (deg, -80..80) with content(g, w, h) drawn inside the opening
  W.mirror = function (key, angle, x, y, z, worldH, content, o = {}) {
    const A = MV.ATLAS.mirror, op = MV.MIRROR_OPENING;
    const fi = Math.round(((angle - op.angle_from) / (op.angle_to - op.angle_from)) * (A.frames - 1));
    const cos = Math.cos(angle * U.deg);
    return W.dyn("mirror-" + key, A.w, A.h, (g, w, h) => {
      g.save();
      g.beginPath();
      op.opening.forEach(([u, v], i) => {
        const px = (0.5 + (u - 0.5) * cos) * w, py = v * h;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      });
      g.closePath();
      g.clip();
      // silver backing so an "empty" mirror still reads as glass
      const grd = g.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, o.glassA || "#c9d6ee");
      grd.addColorStop(1, o.glassB || "#7d8db8");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      if (content) {
        g.translate(w / 2, 0);
        g.scale(cos, 1);
        g.translate(-w / 2, 0);
        content(g, w, h);
      }
      // glass sheen
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "screen";
      const sh = g.createLinearGradient(0, 0, w, h * 0.6);
      sh.addColorStop(0.3, "rgba(255,255,255,0)");
      sh.addColorStop(0.45, "rgba(255,255,255,0.22)");
      sh.addColorStop(0.55, "rgba(255,255,255,0)");
      g.fillStyle = sh;
      g.fillRect(0, 0, w, h);
      g.restore();
      W.drawAtlas(g, "mirror", fi, 0, 0, w, h);
    }, x, y, z, worldH, o);
  };

  W.render = function () {
    const geo = W.dots.geometry;
    geo.setDrawRange(0, W.dotN);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    W.renderer.render(W.scene, W.camera);
  };
})();
