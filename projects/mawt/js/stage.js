// stage.js — the three.js world: one ruined Arab city in cel-shaded anime style.
//   * MeshToonMaterial with a 3-step gradient map (MV.toonRamp) + inverted-hull ink outlines
//     (a back-face black copy of every mesh, grown by a constant world thickness per axis)
//   * blocks with window textures and war cracks, rooftop water tanks, the domed "palaces" (القصور),
//     tin huts (الخصص), a flat roof stage with a parapet, the row of shrouded dead (الصف), a sky dome
//   * character billboards (Canvas-2D slots), sprites, additive glows, dynamic canvases (Blender atlases)
// Immediate mode (M3): W.reset() hides everything every frame, then the active shot (or each manga
// panel) switches on and positions only what it needs. W.renderView() renders into a panel rect.
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const W = (MV.World = {});
  const CC = MV.CHAR_CANVAS;
  const ASPECT = CC.w / CC.h;
  const FOOT = (CC.h - CC.groundY) / CC.h;
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const footGeo = new THREE.PlaneGeometry(1, 1);
  footGeo.translate(0, 0.5 - FOOT, 0);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);
  const domeGeo = new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const roofGeo = new THREE.ConeGeometry(0.72, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const capGeo = new THREE.CapsuleGeometry(0.32, 1.25, 6, 12);
  const INKMAT = new THREE.MeshBasicMaterial({ color: 0x120d1c, side: THREE.BackSide });

  function basic(map, o = {}) { return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, depthWrite: false }, o)); }
  function addm(map, o = {}) { return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }, o)); }
  const toonCache = {};
  function toon(color, map) {
    const key = color + (map ? map.uuid : "");
    return toonCache[key] || (toonCache[key] = new THREE.MeshToonMaterial({ color, map: map || null, gradientMap: MV.toonRamp() }));
  }
  // mesh + inverted hull outline (constant world thickness th on every axis)
  function inked(geo, mat, sx, sy, sz, th = 0.09) {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    const o = new THREE.Mesh(geo, INKMAT);
    o.scale.set(1 + (2 * th) / sx, 1 + (2 * th) / sy, 1 + (2 * th) / sz);
    m.add(o);
    return m;
  }
  W.inked = inked;
  W.toon = toon;

  const pools = {};
  function pool(name, n, make) { pools[name] = { items: Array.from({ length: n }, make), used: 0 }; }
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
    renderer.autoClear = false;
    W.renderer = renderer;
    const scene = (W.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x0b0a24);
    scene.fog = new THREE.Fog(0x2a1f5c, 40, 160);
    W.camera = new THREE.PerspectiveCamera(40, U.W / U.H, 0.1, 900);
    W.amb = new THREE.HemisphereLight(0xb8b0ff, 0x302040, 1.1);
    scene.add(W.amb);
    W.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    W.sun.position.set(-30, 50, 40);
    scene.add(W.sun);

    // sky dome (inside-facing sphere), one material per sky
    W.skyMats = {};
    for (const k of ["night", "dusk", "dawn", "storm", "paper", "mnight"]) W.skyMats[k] = new THREE.MeshBasicMaterial({ map: MV.skyTex(k), side: THREE.BackSide, fog: false, depthWrite: false });
    W.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), W.skyMats.night);
    W.sky.renderOrder = -100;
    scene.add(W.sky);
    W.sunDisc = new THREE.Mesh(planeGeo, addm(MV.glowTex(), { color: 0xffd080, fog: false }));
    W.sunDisc.renderOrder = -90;
    scene.add(W.sunDisc);

    // ground (street) + city
    const city = (W.city = new THREE.Group());
    scene.add(city);
    const ground = new THREE.Mesh(planeGeo, toon(0x9a8aa0));
    ground.rotation.x = -Math.PI / 2;
    ground.scale.set(600, 600, 1);
    city.add(ground);
    W.ground = ground;
    const road = new THREE.Mesh(planeGeo, toon(0x857a92));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.scale.set(600, 9, 1);
    city.add(road);
    const r = U.rng(7);
    const wall = [0xd9c7a8, 0xc9b49a, 0xb7a9c9, 0xe0d2b8, 0xa89ab0, 0xcab08a];
    W.blocks = [];
    for (const zRow of [-9, -18, -30, -46, -66, -90]) {
      for (let x = -90; x < 90; x += 6 + r() * 4) {
        const kind = r();
        const w = 4 + r() * 3, d = 4 + r() * 3;
        const far = Math.abs(zRow) > 25 ? 1.6 : 1;
        if (kind < 0.12 && zRow < 0) {
          // palace: tall base, columns, dome (القصور)
          const h = 9 + r() * 6;
          const b = inked(boxGeo, toon(0xf0e2c0, MV.windowTex(9)), w + 2, h, d + 2);
          b.position.set(x, h / 2, zRow);
          city.add(b);
          const dm = inked(domeGeo, toon(r() < 0.5 ? 0x3fb4c9 : 0xffd36b), w * 1.1, w * 1.1, w * 1.1);
          dm.position.set(x, h, zRow);
          city.add(dm);
          const mn = inked(cylGeo, toon(0xf0e2c0), 0.9, h + 7, 0.9);
          mn.position.set(x + w * 0.7, (h + 7) / 2, zRow + d * 0.4);
          city.add(mn);
          W.blocks.push(b);
        } else if (kind < 0.3 && zRow > -40) {
          // tin hut (خُص): low box + pyramid roof
          const h = 2.4 + r() * 1.2;
          const b = inked(boxGeo, toon(0x9a8a7a), w * 0.6, h, d * 0.6);
          b.position.set(x, h / 2, zRow);
          city.add(b);
          const rf = inked(roofGeo, toon(0x7a6a8a), w * 0.75, 1.4, d * 0.75);
          rf.position.set(x, h + 0.7, zRow);
          city.add(rf);
        } else {
          const h = (3.5 + r() * 12) * far;
          const b = inked(boxGeo, toon(wall[Math.floor(r() * wall.length)], MV.windowTex(Math.floor(r() * 4))), w, h, d);
          b.position.set(x, h / 2, zRow);
          city.add(b);
          W.blocks.push(b);
          if (r() < 0.5) { // rooftop water tank
            const tk = inked(cylGeo, toon(r() < 0.5 ? 0x2a2a3a : 0x3a6fb0), 1.1, 1.2, 1.1, 0.06);
            tk.position.set(x + (r() - 0.5) * w * 0.5, h + 0.6, zRow + (r() - 0.5) * d * 0.4);
            city.add(tk);
          }
          if (r() < 0.25) { // rubble at the foot
            const rb = inked(boxGeo, toon(0x8a7a8a), 1.6, 0.8, 1.2, 0.06);
            rb.position.set(x + w * 0.4, 0.4, zRow + d * 0.6);
            rb.rotation.set(0.2, r() * 3, 0.3);
            city.add(rb);
          }
        }
      }
    }

    // the roof stage: slab + parapet + water tanks + an antenna (where the hero stands)
    const roof = (W.roof = new THREE.Group());
    scene.add(roof);
    const slab = inked(boxGeo, toon(0xc9b49a), 26, 1, 14);
    slab.position.set(0, -0.5, -2);
    roof.add(slab);
    for (const [x, z, w, d] of [[0, -8.8, 26, 0.5], [-12.8, -2, 0.5, 14], [12.8, -2, 0.5, 14]]) {
      const pp = inked(boxGeo, toon(0xb7a080), w, 1.1, d, 0.06);
      pp.position.set(x, 0.55, z);
      roof.add(pp);
    }
    for (const [x, z] of [[-9, -6.5], [-6.6, -6.8]]) {
      const tk = inked(cylGeo, toon(0x2a2a3a), 1.6, 1.8, 1.6, 0.06);
      tk.position.set(x, 1.6, z);
      roof.add(tk);
      const st = inked(boxGeo, toon(0x5a5a6a), 1.6, 0.7, 1.6, 0.05);
      st.position.set(x, 0.35, z);
      roof.add(st);
    }
    const ant = inked(cylGeo, toon(0x3a3a4a), 0.12, 6, 0.12, 0.04);
    ant.position.set(9.5, 3, -7);
    roof.add(ant);

    // the row of shrouded dead (الصف): white capsules lying side by side
    const row = (W.row = new THREE.Group());
    scene.add(row);
    W.rowItems = [];
    for (let i = 0; i < 14; i++) {
      const c = inked(capGeo, new THREE.MeshToonMaterial({ color: 0xf4efe4, emissive: 0x6a6070, gradientMap: MV.toonRamp() }), 1, 1, 1, 0.05);
      c.rotation.set(Math.PI / 2, 0, 0);
      c.position.set(-13 + i * 2, 0.33, 0);
      row.add(c);
      W.rowItems.push(c);
    }

    // character slots: canvas + texture
    W.slots = [];
    for (let i = 0; i < 6; i++) {
      const c = MV.canvas(CC.w, CC.h);
      W.slots.push({ c, g: c.getContext("2d"), tex: MV.tex(c, { mips: false }) });
    }
    const dummy = MV.glowTex();
    pool("chr", 24, () => { const m = new THREE.Mesh(footGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
    pool("spr", 40, () => { const m = new THREE.Mesh(planeGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
    pool("addv", 30, () => { const m = new THREE.Mesh(planeGeo, addm(dummy)); m.visible = false; scene.add(m); return m; });
    W.dyns = {};
    pool("dyn", 16, () => { const m = new THREE.Mesh(planeGeo, basic(dummy)); m.visible = false; scene.add(m); return m; });
  };

  // ---------------------------------------------------------------- per-frame reset
  W.reset = function () {
    for (const k in pools) {
      const p = pools[k];
      for (const m of p.items) { m.visible = false; m.rotation.set(0, 0, 0); m.renderOrder = 0; }
      p.used = 0;
    }
    W.city.visible = false;
    W.city.position.set(0, 0, 0);
    W.roof.visible = false;
    W.row.visible = false;
    W.sky.visible = false;
    W.sunDisc.visible = false;
    W.scene.background.set(0x0b0a24);
    W.cam([0, 2, 12], [0, 2, 0], 40);
  };
  W.cam = function (pos, look, fov = 40, roll = 0, aspect) {
    const c = W.camera;
    c.position.set(pos[0], pos[1], pos[2]);
    c.up.set(Math.sin(roll), Math.cos(roll), 0);
    c.lookAt(look[0], look[1], look[2]);
    const asp = aspect || U.W / U.H;
    if (c.fov !== fov || c.aspect !== asp) { c.fov = fov; c.aspect = asp; c.updateProjectionMatrix(); }
  };

  // set the city: mode street | roof, sky night|dusk|dawn|storm, light colours, fog
  W.setCity = function (o = {}) {
    W.city.visible = true;
    W.sky.visible = true;
    const sky = o.sky || "night";
    W.sky.material = W.skyMats[sky];
    const L = {
      night: [0x9a90ff, 0x201838, 1.0, 0x8a80ff, 1.4, 0x2a1f5c],
      dusk: [0xffb0a0, 0x402050, 1.0, 0xffb070, 2.4, 0x9a3a6a],
      dawn: [0xd8f0ff, 0x806070, 1.2, 0xfff0d0, 2.4, 0xbfe0f0],
      storm: [0x8070b0, 0x100818, 0.9, 0xb070a0, 1.5, 0x2a1838],
      // manga panels: bright paper light so walls print as white / tone and only shadows go black
      paper: [0xffffff, 0x8a8a96, 2.2, 0xffffff, 2.6, 0xe6e3ea],
      mnight: [0xf0f0ff, 0x6a6a7a, 2.0, 0xffffff, 2.4, 0x2a2834],
    }[sky];
    W.amb.color.set(L[0]); W.amb.groundColor.set(L[1]); W.amb.intensity = L[2];
    W.sun.color.set(L[3]); W.sun.intensity = L[4];
    W.scene.fog.color.set(o.fog || L[5]);
    W.scene.fog.near = o.fogNear || 40;
    W.scene.fog.far = o.fogFar || 170;
    W.scene.background.set(L[5]);
    if (o.mode === "roof") { W.city.position.set(0, -14, -6); W.roof.visible = true; }
    if (o.row) W.row.visible = true;
    if (o.sun) { W.sunDisc.visible = true; W.sunDisc.position.set(o.sun[0], o.sun[1], o.sun[2]); W.sunDisc.scale.set(o.sun[3], o.sun[3], 1); W.sunDisc.lookAt(W.camera.position); }
  };

  // ---------------------------------------------------------------- characters
  W.drawSlot = function (i, fn) {
    const s = W.slots[i];
    const J = fn(s.g);
    s.tex.needsUpdate = true;
    s.joints = J;
    return J;
  };
  W.char = function (i, x, y, z, h, o = {}) {
    const m = take("chr");
    if (!m) return null;
    m.material.map = W.slots[i].tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.material.color.set(o.color || 0xffffff);
    m.material.fog = o.fog !== false;
    m.position.set(x, y, z);
    m.scale.set(h * ASPECT * (o.flip ? -1 : 1), h, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    m.renderOrder = o.order || 2;
    if (o.face !== false) m.quaternion.copy(W.camera.quaternion), o.rot && m.rotateZ(o.rot);
    return m;
  };
  W.sprite = function (tex, x, y, z, w, h, o = {}) {
    const m = take(o.additive ? "addv" : "spr");
    if (!m) return null;
    m.material.map = tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.material.color.set(o.color || 0xffffff);
    m.position.set(x, y, z);
    m.scale.set(w, h, 1);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rot || 0);
    if (o.face) m.quaternion.copy(W.camera.quaternion);
    m.renderOrder = o.order || 3;
    return m;
  };
  W.glow = (x, y, z, size, color = 0xffd9a0, opacity = 0.6) => W.sprite(MV.glowTex(), x, y, z, size, size, { additive: true, color, opacity, order: 4, face: true });

  // dynamic canvas plane by key (w x h px); draw(g, w, h) repaints everything every use
  W.dyn = function (key, w, h, draw, x, y, z, worldH, o = {}) {
    let d = W.dyns[key];
    if (!d) { const c = MV.canvas(w, h); d = W.dyns[key] = { c, g: c.getContext("2d"), tex: MV.tex(c, { mips: false }) }; }
    d.g.setTransform(1, 0, 0, 1, 0, 0);
    d.g.clearRect(0, 0, w, h);
    draw(d.g, w, h);
    d.tex.needsUpdate = true;
    const m = take("dyn");
    if (!m) return null;
    m.material.map = d.tex;
    m.material.opacity = o.opacity === undefined ? 1 : o.opacity;
    m.position.set(x, y + (o.bottom ? worldH / 2 : 0), z);
    m.scale.set(((worldH * w) / h) * (o.flip ? -1 : 1), worldH, 1);
    if (o.face !== false) m.quaternion.copy(W.camera.quaternion);
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
  W.atlas = function (name, frame, x, y, z, worldH, o = {}) {
    const A = MV.ATLAS[name];
    return W.dyn((o.key || name) + "@" + (o.slot || 0), A.w, A.h, (g, w, h) => W.drawAtlas(g, name, frame, 0, 0, w, h), x, y, z, worldH, o);
  };
  // cyclic atlas frame from time: `rate` loops per second
  W.loopFrame = (name, t, rate = 1) => {
    const A = MV.ATLAS[name];
    return ((Math.floor(t * rate * A.frames) % A.frames) + A.frames) % A.frames;
  };

  // render the current world into a rect of the frame (manga panel) or the full frame
  W.renderView = function (rect, clear = true) {
    const R = W.renderer;
    const [x, y, w, h] = rect || [0, 0, U.W, U.H];
    R.setScissorTest(true);
    R.setViewport(x, U.H - y - h, w, h);
    R.setScissor(x, U.H - y - h, w, h);
    if (clear) { R.setClearColor(W.scene.background, 1); R.clear(true, true, true); }
    R.render(W.scene, W.camera);
    R.setScissorTest(false);
    R.setViewport(0, 0, U.W, U.H);
  };
  // world -> screen px (for 2D overlays that follow a 3D point); rect = panel rect or full frame
  W.project = function (x, y, z, rect) {
    const v = new THREE.Vector3(x, y, z).project(W.camera);
    const [rx, ry, rw, rh] = rect || [0, 0, U.W, U.H];
    return [rx + (v.x * 0.5 + 0.5) * rw, ry + (-v.y * 0.5 + 0.5) * rh, v.z];
  };
  W.clearAll = function (hex = 0xf4efe4) {
    const R = W.renderer;
    R.setScissorTest(false);
    R.setViewport(0, 0, U.W, U.H);
    R.setClearColor(hex, 1);
    R.clear(true, true, true);
  };
})();
