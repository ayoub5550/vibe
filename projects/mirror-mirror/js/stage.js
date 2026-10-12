// stage.js — the Three.js world: a 3D stage built from playing cards for a 2D hero.
// Immediate-mode: every frame World.reset() hides/defaults everything, then the active shot
// switches on and positions only what it needs. No state survives between frames.
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const W = (MV.World = {});
  const CARD_W = 0.75, CARD_H = 1.05;
  W.CARD_W = CARD_W;
  W.CARD_H = CARD_H;

  // hero plane geometry (from the jester canvas)
  const JC = MV.JESTER_CANVAS;
  const HERO_H = 3.6, HERO_W = (HERO_H * JC.w) / JC.h;
  const HERO_FOOT = ((JC.h - JC.groundY) / JC.h) * HERO_H; // plane space below the ground line
  W.HERO_H = HERO_H;

  function basic(map, o = {}) {
    return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, side: THREE.FrontSide, depthWrite: true }, o));
  }
  function additive(map, o = {}) {
    return new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }, o));
  }
  const planeGeo = new THREE.PlaneGeometry(1, 1);

  // two-sided card: group with front (face) and back plane
  function makeCard(faceKey, backKey = "BACK3", res = 1, w = CARD_W, h = CARD_H) {
    const g = new THREE.Group();
    const front = new THREE.Mesh(planeGeo, basic(MV.cardTex(faceKey, res), { alphaTest: 0.05 }));
    front.scale.set(w, h, 1);
    const back = new THREE.Mesh(planeGeo, basic(MV.cardTex(backKey, res), { alphaTest: 0.05 }));
    back.scale.set(w, h, 1);
    back.rotation.y = Math.PI;
    back.position.z = -0.002;
    g.add(front, back);
    g.userData = { front, back, face: faceKey };
    return g;
  }
  W.makeCard = makeCard;

  W.init = function (canvasEl) {
    const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(1);
    renderer.setSize(U.W, U.H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1;
    W.renderer = renderer;
    const scene = (W.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x03050b);
    const cam = (W.cam = new THREE.PerspectiveCamera(38, U.W / U.H, 0.05, 600));
    cam.position.set(0, 2, 12);

    // ---------------- backdrop: starfield dome + gold lattice wall
    const stars = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: MV.starTex(), side: THREE.BackSide, depthWrite: false }));
    scene.add(stars);
    W.stars = stars;
    const lattice = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: MV.latticeTex(), transparent: true, depthWrite: false }));
    lattice.scale.set(140, 84, 1);
    lattice.position.set(0, 10, -40);
    scene.add(lattice);
    W.lattice = lattice;

    // ---------------- mirror floor + line overlay
    const floor = new MV.Reflector(new THREE.PlaneGeometry(160, 160), {
      textureWidth: 960, textureHeight: 540, tint: 0x4a86ff, strength: 0.9, base: 0x02040b, fadeRadius: 30,
      onPreReflect: () => W._preReflect && W._preReflect(),
      onPostReflect: () => W._postReflect && W._postReflect(),
    });
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    W.floor = floor;
    const floorLines = new THREE.Mesh(planeGeo, additive(MV.floorTex(), { opacity: 0.9 }));
    floorLines.rotation.x = -Math.PI / 2;
    floorLines.position.y = 0.012;
    floorLines.scale.set(26, 26, 1);
    scene.add(floorLines);
    W.floorLines = floorLines;

    // ---------------- sunburst arch + deco pillars
    const sun = new THREE.Mesh(planeGeo, additive(MV.sunburstTex(), { opacity: 1 }));
    sun.scale.set(34, 18.3, 1);
    sun.position.set(0, 8.4, -13);
    scene.add(sun);
    W.sun = sun;
    const pillars = new THREE.Group();
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xe3b553 });
    for (let i = 0; i < 10; i++) {
      const side = i < 5 ? -1 : 1, k = i % 5;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), goldMat);
      const h = 9 + k * 1.6;
      m.scale.y = h;
      m.position.set(side * (18.2 + k * 0.55), h / 2, -12.8 + k * 0.2);
      pillars.add(m);
    }
    scene.add(pillars);
    W.pillars = pillars;

    // ---------------- card walls (eye backs / faces), two layers that can flip
    const walls = new THREE.Group();
    W.wallCards = [];
    const rr = U.rng(11);
    // a wall = rows of cards laid along the segment P0->P1 (x,z); homeRot = front face looks at the stage
    const PITCH_X = CARD_W + 0.12, PITCH_Y = CARD_H + 0.14;
    const addWallLine = (p0, p1, rows, name) => {
      const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
      const len = Math.hypot(dx, dz);
      const ux = dx / len, uz = dz / len;
      // normal toward the origin
      let nx = -uz, nz = ux;
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      if (nx * -mx + nz * -mz < 0) { nx = -nx; nz = -nz; }
      const homeRot = Math.atan2(nx, nz);
      const cols = Math.floor(len / PITCH_X);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const face = MV.ALL_FACES[Math.floor(rr() * MV.ALL_FACES.length)];
          const card = makeCard(face, "BACK3", 0.8);
          const d = (c + 0.5) * PITCH_X;
          card.position.set(p0[0] + ux * d, 0.3 + r * PITCH_Y + CARD_H / 2, p0[1] + uz * d);
          card.userData.home = card.position.clone();
          card.userData.homeRot = homeRot;
          card.userData.seed = rr();
          card.userData.col = c;
          card.userData.row = r;
          card.userData.cols = cols;
          card.userData.wall = name;
          walls.add(card);
          W.wallCards.push(card);
        }
    };
    // back wall blocks either side of the sunburst arch, plus angled side walls
    addWallLine([-17.4, -12.2], [-8.2, -12.2], 9, "backL");
    addWallLine([8.2, -12.2], [17.4, -12.2], 9, "backR");
    addWallLine([-17.6, -11.6], [-23.5, 3.0], 9, "sideL");
    addWallLine([17.6, -11.6], [23.5, 3.0], 9, "sideR");
    scene.add(walls);
    W.walls = walls;
    // back-texture variants for blinking eyes
    W.backTex = [0, 1, 2, 3].map((i) => MV.cardTex("BACK" + i, 0.8));

    // ---------------- hero (2D canvas on a billboard plane) + shadow canvas
    W.heroCanvas = MV.canvas(JC.w, JC.h);
    W.heroCtx = W.heroCanvas.getContext("2d");
    W.heroTex = MV.tex(W.heroCanvas, { mips: false });
    W.shadowCanvas = MV.canvas(JC.w, JC.h);
    W.shadowCtx = W.shadowCanvas.getContext("2d");
    W.shadowTex = MV.tex(W.shadowCanvas, { mips: false });
    W.heroes = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: W.heroTex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide }));
      m.scale.set(HERO_W, HERO_H, 1);
      m.userData.useShadow = false;
      scene.add(m);
      W.heroes.push(m);
    }
    W._preReflect = () => {
      // the mirror world is darker: tame additive light so the floor stays deep blue
      W._sunOp = W.sun.material.opacity;
      W.sun.material.opacity = W._sunOp * 0.4;
      for (const m of W.glows) if (m.visible) { m.userData._op = m.material.opacity; m.material.opacity *= 0.3; }
      for (const h of W.heroes) if (h.visible) h.material.map = W.shadowTex;
      for (const m of W.texts) if (m.visible && m.userData.reflMap) { m.userData._map = m.material.map; m.material.map = m.userData.reflMap; }
    };
    W._postReflect = () => {
      W.sun.material.opacity = W._sunOp;
      for (const m of W.glows) if (m.visible && m.userData._op !== undefined) { m.material.opacity = m.userData._op; m.userData._op = undefined; }
      for (const h of W.heroes) if (h.visible) h.material.map = h.userData.useShadow ? W.shadowTex : W.heroTex;
      for (const m of W.texts) if (m.visible && m.userData.reflMap) m.material.map = m.userData._map;
    };

    // ---------------- hero-sized props
    W.bigCard = makeCard("JMIRROR", "BACK3", 3.2, 3.0, 4.2);
    scene.add(W.bigCard);
    W.mama = makeCard("QMAMA", "BACK3", 3.2, 5.0, 7.0);
    scene.add(W.mama);
    W.row = [];
    for (let i = 0; i < 9; i++) {
      const c = makeCard("KS", "BACK3", 1.6, 1.5, 2.1);
      scene.add(c);
      W.row.push(c);
    }
    W.rowKeys = { kings: ["KS", "KH", "KD", "KC", "KS", "KH", "KD", "KC", "KS"], queens: ["QH", "QD", "QS", "QC", "QH", "QD", "QS", "QC", "QH"] };
    W.fan = [];
    for (let i = 0; i < 13; i++) {
      const c = makeCard("FAKEHEART", "BACK3", 1.2, 1.3, 1.82);
      scene.add(c);
      W.fan.push(c);
    }
    // cage bars: tall slim cards
    W.cage = [];
    for (let i = 0; i < 14; i++) {
      const c = makeCard(MV.ALL_FACES[(i * 7) % 52], "BACK3", 1.2, 0.3, 5.6);
      scene.add(c);
      W.cage.push(c);
    }
    // graveyard cards
    W.graves = [];
    for (let i = 0; i < 16; i++) {
      const c = makeCard(["AS", "KS", "QS", "JS"][i % 4], "BACK3", 1, 1.1, 1.54);
      scene.add(c);
      W.graves.push(c);
    }
    // flying / tornado cards
    W.fly = [];
    for (let i = 0; i < 160; i++) {
      const c = makeCard(MV.ALL_FACES[(i * 11) % 52], "BACK3", 0.8, CARD_W * 0.9, CARD_H * 0.9);
      c.userData.seed = U.hash(i, 99);
      scene.add(c);
      W.fly.push(c);
    }
    // house of cards (A-frames)
    W.house = [];
    for (let i = 0; i < 60; i++) {
      const c = makeCard(MV.ALL_FACES[(i * 5 + 3) % 52], "BACK3", 0.8, 1.0, 1.4);
      scene.add(c);
      W.house.push(c);
    }

    // ---------------- mirrors (arched frames with glass + clone hero inside)
    W.mirrors = [];
    const frameTex = MV.tex(drawArchFrame());
    const glassTex = MV.tex(drawArchGlass());
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group();
      const glass = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, opacity: 0.9, depthWrite: false }));
      glass.scale.set(2.6, 4.6, 1);
      glass.position.set(0, 2.35, -0.05);
      const frame = new THREE.Mesh(planeGeo, basic(frameTex, { alphaTest: 0.1 }));
      frame.scale.set(2.9, 4.95, 1);
      frame.position.set(0, 2.45, 0.02);
      g.add(glass, frame);
      g.userData = { glass, frame };
      scene.add(g);
      W.mirrors.push(g);
    }

    // ---------------- giant eye (canvas redrawn per frame)
    W.eyeCanvas = MV.canvas(1600, 800);
    W.eyeCtx = W.eyeCanvas.getContext("2d");
    W.eyeTex = MV.tex(W.eyeCanvas, { mips: false });
    W.eye = new THREE.Mesh(planeGeo, basic(W.eyeTex, { depthWrite: false }));
    W.eye.scale.set(16, 8, 1);
    scene.add(W.eye);

    // ---------------- ruler 1..10
    W.ruler = new THREE.Mesh(planeGeo, basic(MV.tex(drawRuler()), { alphaTest: 0.05 }));
    scene.add(W.ruler);

    // ---------------- marionette strings (thin gold boxes) + control bar
    W.strings = [];
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.034, 1, 0.034), new THREE.MeshBasicMaterial({ color: 0xffeab0 }));
      scene.add(s);
      W.strings.push(s);
    }
    W.control = new THREE.Group();
    const cb1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.12), goldMat);
    const cb2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), goldMat);
    W.control.add(cb1, cb2);
    scene.add(W.control);

    // ---------------- glows, spotlights, sparks
    W.glowTex = MV.glowTex();
    W.blueGlowTex = MV.glowTex("rgba(150,205,255,1)", "rgba(80,140,255,0)");
    W.glows = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(planeGeo, additive(W.glowTex, { opacity: 0.8 }));
      scene.add(m);
      W.glows.push(m);
    }
    W.spots = [];
    const spotTex = MV.tex(drawSpotCone());
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(planeGeo, additive(spotTex, { opacity: 0.55, side: THREE.DoubleSide }));
      scene.add(m);
      W.spots.push(m);
    }
    W.sparks = [];
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(planeGeo, additive(W.glowTex, { opacity: 1 }));
      m.userData.seed = U.hash(i, 5);
      scene.add(m);
      W.sparks.push(m);
    }
    // ---------------- 3D text planes
    W.texts = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      scene.add(m);
      W.texts.push(m);
    }
    // crowns
    W.crowns = [];
    const crownTex = MV.tex(drawCrown());
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(planeGeo, basic(crownTex, { alphaTest: 0.1, side: THREE.DoubleSide }));
      scene.add(m);
      W.crowns.push(m);
    }
    W.ready = true;
  };

  // ------------------------------------------------------------- helper drawings
  function drawArchFrame() {
    const c = MV.canvas(580, 990), g = c.getContext("2d");
    const path = (inset) => {
      g.beginPath();
      g.moveTo(inset, 990 - inset);
      g.lineTo(inset, 290);
      g.quadraticCurveTo(inset, inset, 290, inset);
      g.quadraticCurveTo(580 - inset, inset, 580 - inset, 290);
      g.lineTo(580 - inset, 990 - inset);
      g.closePath();
    };
    g.lineJoin = "round";
    path(12); g.lineWidth = 22; g.strokeStyle = "#e3b553"; g.stroke();
    path(34); g.lineWidth = 6; g.strokeStyle = "#f8de94"; g.stroke();
    path(4); g.lineWidth = 6; g.strokeStyle = "#9a6c22"; g.stroke();
    // deco crest
    g.save();
    g.translate(290, 30);
    MV.drawEye(g, 0, 26, 110, 1, 0, 0, { lw: 5 });
    g.restore();
    for (const x of [60, 520]) MV.drawSuit(g, "D", x, 960, 40, 0, "#e3b553");
    return c;
  }
  function drawArchGlass() {
    const c = MV.canvas(520, 920), g = c.getContext("2d");
    g.beginPath();
    g.moveTo(0, 920);
    g.lineTo(0, 260);
    g.quadraticCurveTo(0, 0, 260, 0);
    g.quadraticCurveTo(520, 0, 520, 260);
    g.lineTo(520, 920);
    g.closePath();
    const grd = g.createLinearGradient(0, 0, 520, 920);
    grd.addColorStop(0, "rgba(40,80,170,0.85)");
    grd.addColorStop(0.5, "rgba(10,22,60,0.92)");
    grd.addColorStop(1, "rgba(30,60,140,0.85)");
    g.fillStyle = grd;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = "rgba(200,230,255,0.10)";
    g.beginPath(); g.moveTo(60, 920); g.lineTo(200, 0); g.lineTo(280, 0); g.lineTo(140, 920); g.fill();
    g.beginPath(); g.moveTo(300, 920); g.lineTo(400, 0); g.lineTo(430, 0); g.lineTo(330, 920); g.fill();
    g.restore();
    return c;
  }
  function drawRuler() {
    const c = MV.canvas(220, 1400), g = c.getContext("2d");
    MV.roundRect(g, 60, 10, 100, 1380, 14);
    g.fillStyle = "#0b1430";
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#e3b553";
    g.stroke();
    g.fillStyle = "#f8de94";
    g.textAlign = "right";
    g.textBaseline = "middle";
    for (let i = 0; i <= 100; i++) {
      const y = 1370 - i * 13.4;
      const major = i % 10 === 0;
      g.fillRect(60, y - (major ? 3 : 1.5), major ? 60 : i % 5 === 0 ? 40 : 24, major ? 6 : 3);
      if (major && i > 0) {
        g.font = "900 64px 'Big Shoulders Display', sans-serif";
        g.fillText(String(i / 10), 54, y);
      }
    }
    return c;
  }
  function drawSpotCone() {
    const c = MV.canvas(256, 1024), g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 1024);
    grd.addColorStop(0, "rgba(255,236,180,0.95)");
    grd.addColorStop(1, "rgba(255,200,110,0.0)");
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(118, 0); g.lineTo(138, 0); g.lineTo(256, 1024); g.lineTo(0, 1024);
    g.closePath();
    g.fill();
    return c;
  }
  function drawCrown() {
    const c = MV.canvas(256, 200), g = c.getContext("2d");
    g.beginPath();
    g.moveTo(20, 180); g.lineTo(10, 40); g.lineTo(70, 110); g.lineTo(128, 10); g.lineTo(186, 110); g.lineTo(246, 40); g.lineTo(236, 180);
    g.closePath();
    const grd = g.createLinearGradient(0, 0, 0, 200);
    grd.addColorStop(0, "#fff0b8"); grd.addColorStop(0.5, "#e3b553"); grd.addColorStop(1, "#9a6c22");
    g.fillStyle = grd;
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#5c3d0c";
    g.stroke();
    for (const [x, col] of [[70, "#c9302c"], [128, "#2b56b8"], [186, "#c9302c"]]) {
      g.beginPath(); g.arc(x, 150, 14, 0, U.TAU); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.stroke();
    }
    return c;
  }

  // ------------------------------------------------------------- per-frame reset
  W.reset = function () {
    const hideAll = (arr) => arr.forEach((o) => (o.visible = false));
    W.stars.visible = true;
    W.lattice.visible = false;
    W.lattice.material.opacity = 1;
    W.floor.visible = true;
    W.floor.material.uniforms.strength.value = 0.75;
    W.floorLines.visible = true;
    W.floorLines.material.opacity = 0.55;
    W.sun.visible = true;
    W.sun.material.opacity = 1;
    W.sun.scale.set(34, 18.3, 1);
    W.pillars.visible = true;
    W.walls.visible = true;
    for (const c of W.wallCards) {
      c.visible = true;
      c.position.copy(c.userData.home);
      c.rotation.set(0, c.userData.homeRot + Math.PI, 0); // default: backs (eyes) facing the stage
      c.scale.setScalar(1);
      c.userData.back.material.map = W.backTex[3];
    }
    hideAll(W.heroes);
    for (const h of W.heroes) {
      h.userData.useShadow = false;
      h.material.map = W.heroTex;
      h.material.opacity = 1;
      h.material.color.setRGB(1, 1, 1);
      h.scale.set(HERO_W, HERO_H, 1);
      h.rotation.set(0, 0, 0);
    }
    W.bigCard.visible = false;
    W.mama.visible = false;
    hideAll(W.row);
    hideAll(W.fan);
    hideAll(W.cage);
    hideAll(W.graves);
    hideAll(W.fly);
    hideAll(W.house);
    hideAll(W.mirrors);
    W.eye.visible = false;
    W.ruler.visible = false;
    hideAll(W.strings);
    W.control.visible = false;
    hideAll(W.glows);
    hideAll(W.spots);
    hideAll(W.sparks);
    hideAll(W.texts);
    hideAll(W.crowns);
    W.renderer.toneMappingExposure = 1;
    W.scene.background.setHex(0x03050b);
    W.cam.fov = 38;
    W.cam.up.set(0, 1, 0);
    W.heroCount = 0;
    W.textCount = 0;
    W.glowCount = 0;
  };

  // place hero #i at (x, z) with optional scale; billboard toward the camera on Y
  W.hero = function (x, z, s = 1, opts = {}) {
    const h = W.heroes[W.heroCount++];
    if (!h) return null;
    h.visible = true;
    h.scale.set(HERO_W * s * (opts.flip ? -1 : 1), HERO_H * s, 1);
    h.position.set(x, (HERO_H / 2 - HERO_FOOT) * s + (opts.y || 0), z);
    h.userData.useShadow = !!opts.shadow;
    h.material.map = opts.shadow ? W.shadowTex : W.heroTex;
    if (opts.opacity !== undefined) h.material.opacity = opts.opacity;
    h.userData.billboard = opts.billboard !== false;
    h.userData.s = s;
    return h;
  };
  // world position of a hero joint (canvas px -> world) for hero mesh h
  W.heroJointWorld = function (h, px, py) {
    const sx = h.scale.x, sy = h.scale.y;
    const lx = (px / JC.w - 0.5) * sx, ly = (0.5 - py / JC.h) * sy;
    const v = new THREE.Vector3(lx, ly, 0);
    v.applyQuaternion(h.quaternion);
    return v.add(h.position);
  };

  // 3D lyric word
  W.text = function (str, style, pos, height, o = {}) {
    const m = W.texts[W.textCount++];
    if (!m) return null;
    const tt = MV.textTex(str, style);
    m.material.map = tt.tex;
    m.material.opacity = o.opacity !== undefined ? o.opacity : 1;
    m.material.blending = o.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    m.material.needsUpdate = true;
    m.visible = m.material.opacity > 0.002;
    m.scale.set(height * tt.aspect * (o.sx || 1), height * (o.sy || 1), 1);
    m.position.set(pos[0], pos[1], pos[2]);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    m.userData.billboard = !!o.billboard;
    m.userData.reflMap = o.reflText ? MV.textTex(o.reflText, o.reflStyle || style).tex : null;
    m.material.depthTest = !o.onTop;
    m.renderOrder = o.onTop ? 20 : 0;
    return m;
  };

  W.glow = function (pos, size, opacity = 0.8, blue = false) {
    const m = W.glows[W.glowCount++];
    if (!m) return null;
    m.visible = true;
    m.material.map = blue ? W.blueGlowTex : W.glowTex;
    m.material.opacity = opacity;
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.set(size, size, 1);
    m.userData.billboard = true;
    return m;
  };

  W.camLook = function (pos, target, fov) {
    W.cam.position.set(pos[0], pos[1], pos[2]);
    if (fov) W.cam.fov = fov;
    W.cam.lookAt(target[0], target[1], target[2]);
  };

  W.render = function () {
    const cam = W.cam;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    // billboards (Y-axis for heroes, full for glows)
    const cp = cam.position;
    for (const h of W.heroes)
      if (h.visible && h.userData.billboard) h.rotation.set(0, Math.atan2(cp.x - h.position.x, cp.z - h.position.z), 0);
    for (const m of W.glows) if (m.visible) m.quaternion.copy(cam.quaternion);
    for (const m of W.sparks) if (m.visible) m.quaternion.copy(cam.quaternion);
    for (const m of W.texts) if (m.visible && m.userData.billboard) m.quaternion.copy(cam.quaternion);
    W.renderer.render(W.scene, cam);
  };
})();
