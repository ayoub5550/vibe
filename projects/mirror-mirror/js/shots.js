// shots.js — the edit. One entry per shot; cuts land exactly on beats (t = 0.06 + 0.4*b).
// Every visual is a literal reading of the lyric under it (see storyboard.md).
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, E = U.ease, tb = U.tb;
  const fw = (word, after) => U.findWord(word, after); // time of a sung word

  // ---------------------------------------------------------------- text styles
  const ICE = { font: "900 220px 'Big Shoulders Display'", color: "#eefaff", glow: "rgba(124,196,255,1)", glowBlur: 46, tracking: "6px" };
  const GOLD = { font: "900 220px 'Big Shoulders Display'", gradient: ["#fff6cf", "#f0c463", "#a8741f"], glow: "rgba(255,180,60,0.85)", glowBlur: 40, tracking: "6px" };
  const RED = { font: "900 220px 'Big Shoulders Display'", color: "#ff5040", glow: "rgba(255,40,30,0.95)", glowBlur: 46, tracking: "6px" };
  const DECO = { font: "400 190px Limelight", gradient: ["#fff6cf", "#e3b553", "#9a6c22"], glow: "rgba(255,190,80,0.7)", glowBlur: 30 };
  const SMALL = { font: "700 110px 'Josefin Sans'", color: "#f8de94", glow: "rgba(255,190,80,0.6)", glowBlur: 24, tracking: "26px" };
  const MIRRORED = Object.assign({}, ICE, { glow: "rgba(90,150,255,1)", color: "#cfe6ff" });

  // ---------------------------------------------------------------- helpers
  function cam(ctx, keys, o = {}) {
    // keys: [k, pos, target, fov, ease]
    const k = ctx.k;
    let i = 0;
    while (i < keys.length - 1 && k > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const span = b[0] - a[0];
    const kk = span > 0 ? (E[b[4] || "inOutCubic"])(U.clamp((k - a[0]) / span)) : 1;
    const pos = U.mix(a[1], b[1], kk), tgt = U.mix(a[2], b[2], kk);
    const fov = U.lerp(a[3] || 38, b[3] || 38, kk);
    if (o.shake) {
      const s = o.shake;
      pos[0] += U.noise1(ctx.t * 1.7, 1) * s; pos[1] += U.noise1(ctx.t * 1.9, 2) * s * 0.6;
      tgt[0] += U.noise1(ctx.t * 1.3, 3) * s * 0.5; tgt[1] += U.noise1(ctx.t * 1.1, 4) * s * 0.4;
    }
    let f = fov;
    if (o.punch) f -= o.punch * Math.max(U.eventPulse(ctx.t, MV.SONG.kicks, 0.18), 0.6 * U.eventPulse(ctx.t, MV.SONG.snares, 0.16));
    W.camLook(pos, tgt, f);
  }
  function orbit(ctx, radius, h, a0, a1, target, fov, ease = "inOutSine") {
    const a = U.lerp(a0, a1, E[ease](ctx.k));
    W.camLook([target[0] + Math.sin(a) * radius, h, target[2] + Math.cos(a) * radius], target, fov);
  }
  function voidSet() {
    W.sun.visible = false;
    W.pillars.visible = false;
    W.walls.visible = false;
    W.floorLines.visible = false;
    W.lattice.visible = true;
  }
  // pop a word in at time t0 (scale overshoot), optional exit at t1
  function word(ctx, str, style, t0, pos, h, o = {}) {
    const t = ctx.t;
    if (t < t0 - 0.001) return null;
    const k = U.clamp((t - t0) / (o.inDur || 0.22));
    let op = E.outCubic(k);
    if (o.t1 !== undefined) op *= 1 - U.clamp((t - o.t1) / (o.outDur || 0.2));
    if (op <= 0.003) return null;
    const pop = o.noPop ? 1 : 1 + (1 - E.outBack(k)) * 0.35;
    const p = pos.slice();
    if (o.rise) p[1] += (1 - E.outExpo(k)) * o.rise;
    if (o.drift) p[1] += (t - t0) * o.drift;
    return W.text(str, style, p, h * pop, Object.assign({ opacity: op }, o));
  }
  function flashAt(ctx, t0, color = "#fff6dc", peak = 0.85, len = 0.35) {
    const dt = ctx.t - t0;
    if (dt >= 0 && dt < len) ctx.post.flash = [color, peak * (1 - dt / len)];
  }
  function fadeIn(ctx, len = 0.25) {
    if (ctx.lt < len) ctx.post.flash = ["#000", 1 - ctx.lt / len];
  }
  // eye-wall: every card back opens in a wave from the stage centre starting at t0
  function eyeWave(ctx, t0, speed = 0.06) {
    for (const c of W.wallCards) {
      const d = Math.abs(c.userData.col - (c.userData.cols || 10) / 2) + c.userData.row * 0.6;
      const k = U.clamp((ctx.t - t0 - d * speed) / 0.25);
      c.userData.back.material.map = W.backTex[Math.min(3, Math.floor(k * 3.999))];
    }
  }
  function eyesClosed() {
    for (const c of W.wallCards) c.userData.back.material.map = W.backTex[0];
  }
  // eyes blink at random-but-seeded moments
  function eyeBlink(ctx) {
    for (const c of W.wallCards) {
      const ph = (ctx.t * 0.5 + c.userData.seed * 7) % 4;
      c.userData.back.material.map = W.backTex[ph < 0.12 ? 0 : ph < 0.2 ? 1 : 3];
    }
  }
  function wallFaces(ctx, fn) {
    for (const c of W.wallCards) {
      const f = U.clamp(fn(c));
      c.rotation.y = c.userData.homeRot + Math.PI * (1 - E.inOutCubic(f));
    }
  }
  function sparksRise(ctx, n, center, spread, speed = 0.6, size = 0.08, op = 0.9) {
    for (let i = 0; i < Math.min(n, W.sparks.length); i++) {
      const m = W.sparks[i];
      const s = m.userData.seed;
      const life = 4;
      const ph = ((ctx.t * speed + s * life) % life) / life;
      m.visible = true;
      m.position.set(center[0] + (U.hash(i, 1) - 0.5) * spread, center[1] + ph * spread * 0.8, center[2] + (U.hash(i, 2) - 0.5) * spread * 0.6);
      const sz = size * (0.5 + U.hash(i, 3));
      m.scale.set(sz, sz, 1);
      m.material.opacity = op * Math.sin(ph * Math.PI);
    }
  }
  function sparksBurst(ctx, t0, center, n = 60, power = 4, size = 0.1) {
    const dt = ctx.t - t0;
    if (dt < 0 || dt > 1.4) return;
    for (let i = 0; i < Math.min(n, W.sparks.length); i++) {
      const m = W.sparks[i];
      const a = U.hash(i, 7) * U.TAU, e = (U.hash(i, 8) - 0.3) * 1.2, sp = power * (0.4 + U.hash(i, 9));
      const d = sp * E.outCubic(U.clamp(dt / 1.2));
      m.visible = true;
      m.position.set(center[0] + Math.cos(a) * Math.cos(e) * d, center[1] + Math.sin(e) * d - dt * dt * 1.5, center[2] + Math.sin(a) * Math.cos(e) * d * 0.6);
      const sz = size * (0.6 + U.hash(i, 10));
      m.scale.set(sz, sz, 1);
      m.material.opacity = 1 - dt / 1.4;
    }
  }
  function spot(i, x, z, op, h = 9, w = 3.2) {
    const s = W.spots[i];
    op *= 0.5;
    s.visible = op > 0.01;
    s.material.opacity = op;
    z -= 0.9; // cone hangs just behind the hero so it never washes over him
    s.position.set(x, h / 2, z);
    W.glow([x, 0.05, z + 0.9], 3.2, op * 0.9);
    s.scale.set(w, h, 1);
    s.rotation.set(Math.PI, 0, 0);
    // face the camera around Y
    s.rotation.y = Math.atan2(W.cam.position.x - x, W.cam.position.z - z);
  }
  function stageLights(ctx, amount = 1) {
    W.sun.material.opacity = amount;
    W.glow([0, 0.3, -12.5], 12, 0.35 * amount);
  }
  function bigCardAt(pos, rx = 0, ry = 0, rz = 0, s = 1) {
    const c = W.bigCard;
    c.visible = true;
    c.position.set(pos[0], pos[1], pos[2]);
    c.rotation.set(rx, ry, rz);
    c.scale.setScalar(s);
    return c;
  }
  function setCardFace(card, key, res = 1.6) {
    const tex = MV.cardTex(key, res);
    if (card.userData.front.material.map !== tex) {
      card.userData.front.material.map = tex;
      card.userData.front.material.needsUpdate = true;
    }
  }
  function heroGrow(ctx, t0, t1, s0, s1) {
    return U.lerp(s0, s1, E.outBack(U.clamp((ctx.t - t0) / (t1 - t0))));
  }
  function ruler(x, z, height, op = 1) {
    W.ruler.visible = op > 0.01;
    W.ruler.material.opacity = op;
    W.ruler.scale.set((height * 220) / 1400, height, 1);
    W.ruler.position.set(x, height / 2, z);
    W.ruler.rotation.set(0, 0, 0);
  }
  function drawGiantEye(ctx, open, lx, ly) {
    const g = W.eyeCtx, c = W.eyeCanvas;
    g.clearRect(0, 0, c.width, c.height);
    // gold halo rays
    g.save();
    g.translate(800, 400);
    g.strokeStyle = "rgba(255,214,120,0.55)";
    for (let i = 0; i < 64; i++) {
      g.rotate(U.TAU / 64);
      g.lineWidth = i % 2 ? 2 : 5;
      g.beginPath();
      g.moveTo(0, 250);
      g.lineTo(0, i % 2 ? 360 : 400);
      g.stroke();
    }
    g.restore();
    MV.drawEye(g, 800, 400, 1250, open, lx, ly, {
      lw: 18, lashes: true, stroke: "#e3b553",
      inIris: (gg, ix, iy, ir) => {
        gg.save();
        gg.globalAlpha = 0.85;
        const h = ir * 1.25, w = (h * MV.JESTER_CANVAS.w) / MV.JESTER_CANVAS.h;
        gg.drawImage(W.heroCanvas, ix - w / 2, iy - h * 0.62, w, h);
        gg.restore();
      },
    });
    W.eyeTex.needsUpdate = true;
  }
  function eyePlane(pos, w, h) {
    W.eye.visible = true;
    W.eye.position.set(pos[0], pos[1], pos[2]);
    W.eye.scale.set(w, h, 1);
    W.eye.rotation.set(0, 0, 0);
  }
  function mirrorAt(i, x, z, ry = 0, s = 1) {
    const m = W.mirrors[i];
    m.visible = true;
    m.position.set(x, 0, z);
    m.rotation.set(0, ry, 0);
    m.scale.setScalar(s);
    return m;
  }
  // strings from a control bar above the hero to wrists + head
  function marionette(ctx, h, pose, cut = 0) {
    const J = MV.jesterJoints(pose);
    const CX = MV.JESTER_CANVAS.w / 2;
    const sx = (x) => CX + (x - CX) * pose.spin;
    const pts = [[sx(J.wrL[0]), J.wrL[1]], [sx(J.wrR[0]), J.wrR[1]], [sx(J.neckTop[0]), J.neckTop[1] - 70]];
    const barY = h.position.y + W.HERO_H * h.userData.s * 0.62 + 0.9;
    W.control.visible = true;
    W.control.position.set(h.position.x + U.noise1(ctx.t * 2, 9) * 0.15, barY, h.position.z);
    W.control.rotation.set(0, 0, U.noise1(ctx.t * 2.4, 3) * 0.12);
    pts.forEach((p, i) => {
      const end = W.heroJointWorld(h, p[0], p[1]);
      const top = new THREE.Vector3(h.position.x + [-1.2, 1.2, 0][i], barY, h.position.z);
      const s = W.strings[i];
      const len = top.distanceTo(end) * (1 - cut);
      if (len < 0.02) return;
      s.visible = true;
      const dirv = end.clone().sub(top).normalize();
      s.position.copy(top).add(dirv.clone().multiplyScalar(len / 2));
      s.scale.set(1, len, 1);
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirv.clone().negate());
    });
  }
  function cardsOnSphere(ctx, radius, center, open, rotSpeed = 0.03) {
    const n = W.fly.length;
    for (let i = 0; i < n; i++) {
      const c = W.fly[i];
      const y = 1 - (i / (n - 1)) * 1.2; // upper dome mostly
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.39996 + ctx.t * rotSpeed;
      c.visible = true;
      c.position.set(center[0] + Math.cos(a) * r * radius, center[1] + y * radius * 0.7 + radius * 0.25, center[2] + Math.sin(a) * r * radius);
      c.lookAt(center[0], center[1] + 2, center[2]);
      c.rotateY(Math.PI); // backs (eyes) look inward
      c.scale.setScalar(2.2);
      c.userData.back.material.map = W.backTex[open];
    }
  }

  // ---------------------------------------------------------------- the shots
  const B = (b) => Math.max(0, tb(b));
  const S = [];
  const shot = (b0, b1, name, apply) => S.push({ t0: B(b0), t1: b1 === "end" ? U.DURATION : B(b1), name, apply });

  // ===== HOOK 1 ======================================================
  shot(-1, 4.5, "01 card intro — Mirror, mirror on the wall", (ctx) => {
    voidSet();
    W.floor.material.uniforms.strength.value = 0.7;
    const t = ctx.t;
    bigCardAt([0, 2.45, 0], Math.sin(t * 1.3) * 0.04, U.lerp(-0.42, 0.12, E.outCubic(ctx.k)), 0);
    W.glow([0, 2.5, -1], 9, 0.28);
    ctx.post.bloom = 0.22;
    cam(ctx, [[0, [0, 2.45, 3.3], [0, 2.45, 0], 30], [0.62, [0, 2.6, 10.6], [0, 2.5, 0], 34, "outCubic"], [1, [0.4, 2.7, 11.2], [0, 2.5, 0], 34, "linear"]]);
    word(ctx, "MIRROR", ICE, fw("mirror"), [-3.75, 2.6, 0.4], 1.15, { ry: 0.22 });
    word(ctx, "MIRROR", MIRRORED, fw("mirror", 0.3), [3.75, 2.6, 0.4], 1.15, { ry: -0.22, sx: -1 });
    word(ctx, "ON THE WALL", SMALL, fw("on"), [0, 5.15, 0.2], 0.42);
    fadeIn(ctx, 0.3);
    ctx.choreo = [{ b: -2, pose: "neutral" }];
  });

  shot(4.5, 9, "02 flip — Tell me who gon' rise and fall", (ctx) => {
    voidSet();
    const tRise = fw("rise"), tFall = fw("fall");
    const flip = E.outBack(U.clamp((ctx.t - (tRise - 0.25)) / 0.5));
    const drop = E.inCubic(U.clamp((ctx.t - tFall) / 0.45));
    bigCardAt([0, 2.45 - drop * 5.2, 0], flip * Math.PI, 0.1 * Math.sin(ctx.t), 0);
    W.glow([0, 2.4, -1], 8, 0.45 * (1 - drop));
    cam(ctx, [[0, [-2.6, 1.0, 9.4], [0, 2.6, 0], 40], [1, [2.4, 1.5, 8.6], [0, 2.4, 0], 40, "linear"]], { shake: 0.05 });
    word(ctx, "RISE", GOLD, tRise, [-3.2, 3.2, 0.6], 1.3, { drift: 1.2 });
    word(ctx, "FALL", ICE, tFall, [3.2, 2.6, 0.6], 1.3, { drift: -2.6, noPop: true });
    flashAt(ctx, tFall, "#cfe6ff", 0.35, 0.25);
  });

  shot(9, 12.6, "03 run — I been runnin' from my flaws", (ctx) => {
    stageLights(ctx, 0.45);
    eyeBlink(ctx);
    const z = U.lerp(-11, 1.2, ctx.k);
    W.hero(0, z, 1);
    ctx.choreo = [{ b: 0, move: "run" }];
    // flaws: cards shake loose from the walls and tumble after him
    for (let i = 0; i < 40; i++) {
      const c = W.fly[i];
      const t0 = ctx.lt * 1.0 - U.hash(i, 3) * 0.6;
      if (t0 < 0) continue;
      c.visible = true;
      c.position.set((U.hash(i, 4) - 0.5) * 9, 6 - t0 * t0 * 9 + U.hash(i, 6) * 2, z - 3 - U.hash(i, 5) * 6);
      c.rotation.set(t0 * 5 * (U.hash(i, 7) - 0.5), t0 * 4, t0 * 3);
      c.scale.setScalar(1.3);
    }
    cam(ctx, [[0, [0.6, 1.5, -4.2], [0, 1.6, -11], 44], [1, [-0.4, 1.7, 7.4], [0, 1.6, 1], 40, "linear"]]);
    word(ctx, "FLAWS", RED, fw("flaws"), [0, 4.2, z - 3], 1.2, { rise: -0.6 });
  });

  shot(12.6, 16.8, "04 tall — Still, I'm standin' ten feet tall", (ctx) => {
    stageLights(ctx, 0.9);
    eyeBlink(ctx);
    const tTen = fw("ten"), tTall = fw("tall");
    const s = heroGrow(ctx, tTen - 0.1, tTall + 0.25, 1.0, 1.6);
    W.hero(0, 0, s);
    ctx.choreo = [{ b: 0, pose: "hips" }, { b: U.beatAt(tTen) - 0.3, pose: "lookUp" }, { b: U.beatAt(tTall) - 0.2, pose: "tall" }];
    const rk = E.outExpo(U.clamp((ctx.t - (tTen - 0.6)) / 0.5));
    ruler(1.75 * s, 0.4, 4.6 * s, rk);
    cam(ctx, [[0, [0.4, 0.8, 5.6], [0, 2.2, 0], 46], [1, [0, 0.45, 7.4], [0, 3.6, 0], 52, "inOutQuad"]]);
    word(ctx, "10", GOLD, tTen, [-1.9 * s, 3.6 * s, -0.5], 1.2);
    flashAt(ctx, tTall, "#fff3cf", 0.4, 0.3);
    sparksRise(ctx, 40, [0, 0.2, 0], 5, 0.5, 0.07);
  });

  shot(16.8, 21.8, "05 mirror lies — Mirror, mirror, don't you lie", (ctx) => {
    stageLights(ctx, 0.35);
    eyeBlink(ctx);
    const tLie = fw("lie");
    mirrorAt(0, 1.55, -0.35, -0.12, 1.0);
    W.hero(-1.45, 0.6, 0.95);
    W.hero(1.52, -0.42, 0.86, { shadow: true, flip: true, billboard: false }).rotation.y = -0.12;
    ctx.choreo = [{ b: 0, pose: "mirrorTouchR" }, { b: 2, move: "frameMirror" }];
    // after "lie" the reflection stops copying him
    if (ctx.t > tLie - 0.05) ctx.shadowPose = MV.pose(Math.floor((ctx.t - tLie) / 0.4) % 2 ? "crossArms" : "shrug");
    cam(ctx, [[0, [-0.4, 2.0, 7.0], [0.1, 2.1, 0], 40], [1, [0.3, 2.1, 6.0], [0.2, 2.1, 0], 40, "linear"]]);
    word(ctx, "LIE", RED, tLie, [1.55, 4.1, 0.1], 0.75);
  });

  shot(21.8, 25.6, "06 giant eye — I can see it in my eyes", (ctx) => {
    stageLights(ctx, 0.5);
    const tSee = fw("see");
    const open = E.outCubic(U.clamp((ctx.t - tSee + 0.15) / 0.45));
    drawGiantEye(ctx, open, Math.sin(ctx.t * 1.6) * 0.5, Math.sin(ctx.t * 2.1) * 0.2);
    eyePlane([0, 4.6, -10.5], 24, 12);
    W.sun.visible = false;
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, pose: "lookUp" }, { b: 3, move: "groove" }];
    eyeWave(ctx, tSee, 0.05);
    cam(ctx, [[0, [0, 4.6, -4.0], [0, 4.6, -10.5], 34], [0.55, [0, 2.6, 6], [0, 3.2, -4], 38, "inOutCubic"], [1, [0, 2.3, 9.5], [0, 3.0, -4], 38, "linear"]]);
  });

  shot(25.6, 29.8, "07 surface — Truth gon' surface every time", (ctx) => {
    stageLights(ctx, 0.75);
    eyeBlink(ctx);
    const tSurf = fw("surface"), tEvery = fw("every", 11), tTime = fw("time", 11.5);
    W.hero(0, -1.2, 1);
    ctx.choreo = [{ b: 0, move: "groove" }];
    const k = E.outExpo(U.clamp((ctx.t - (tSurf - 0.15)) / 0.6));
    W.text("SURFACE", ICE, [0, -1.0 + k * 1.75, 0.9], 1.25, { opacity: k > 0 ? 1 : 0 });
    word(ctx, "EVERY", GOLD, tEvery, [-2.6, 2.9, 0.4], 0.6, { ry: 0.3 });
    word(ctx, "TIME", GOLD, tTime, [2.6, 2.9, 0.4], 0.6, { ry: -0.3 });
    cam(ctx, [[0, [0, 0.4, 7.6], [0, 1.1, 0], 40], [1, [0, 0.75, 6.2], [0, 1.35, 0], 40, "linear"]]);
    flashAt(ctx, tSurf, "#cfe6ff", 0.25, 0.3);
  });

  shot(29.8, 32.6, "08 lights dim — Even when the lights dim", (ctx) => {
    const tE = fw("even"), tW = fw("when", 12), tL = fw("lights"), tD = fw("dim");
    const offs = [tE, tW, tL];
    for (let i = 0; i < 3; i++) spot(i, [-2.6, 2.6, 0][i], [0.0, 0.0, -0.4][i], ctx.t < offs[i] ? 0.8 : 0);
    const lastSpot = ctx.t < tD ? 0.85 : 0.85 * Math.max(0.25, 1 - (ctx.t - tD) / 0.3);
    spot(3, 0, 0.3, lastSpot, 9, 3.6);
    const dim = ctx.t < tL ? 1 : U.lerp(1, 0.32, U.clamp((ctx.t - tL) / 0.5));
    ctx.post.exposure = dim;
    stageLights(ctx, 0.45 * dim);
    eyeBlink(ctx);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, pose: "neutral" }, { b: 1, pose: "lookUp" }, { b: 2.4, pose: "crossArms" }];
    cam(ctx, [[0, [0, 2.2, 9.4], [0, 2.0, 0], 38], [1, [0, 2.1, 8.4], [0, 2.0, 0], 38, "linear"]]);
  });

  // ===== VERSE A (quiet) =============================================
  shot(32.6, 38.8, "09 shadow dance — Dancin' with my shadow in a room full of gold", (ctx) => {
    const tGold = fw("gold");
    const gold = U.lerp(0.55, 1.0, U.clamp((ctx.t - (tGold - 1.2)) / 1.2));
    stageLights(ctx, gold);
    eyeBlink(ctx);
    W.hero(-1.15, 0, 1);
    W.hero(1.15, 0, 1, { shadow: true, flip: true });
    ctx.choreo = [{ b: 0, move: "step" }];
    cam(ctx, [[0, [0, 7.5, 18], [0, 3.2, -3], 40], [1, [0, 2.3, 8.4], [0, 2.0, 0], 40, "outCubic"]]);
    sparksRise(ctx, 70, [0, 0, -2], 14, 0.35, 0.09, 0.8);
    flashAt(ctx, B(32.6), "#ffe6a8", 0.6, 0.4);
    word(ctx, "GOLD", DECO, tGold, [0, 6.4, -4], 1.6, { noPop: false });
  });

  shot(38.8, 47.6, "10 counting regrets — Tryna count all my regrets like the stories I told", (ctx) => {
    stageLights(ctx, 0.8);
    eyeBlink(ctx);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, move: "count" }];
    const startB = 39, n = Math.max(0, Math.floor(ctx.b - startB) + 1);
    // flip the back-left wall cards one per beat (regrets turning face-up)
    let idx = 0;
    wallFaces(ctx, (c) => {
      if (c.userData.wall !== "backL" || c.userData.row !== 3) return 0;
      const myB = startB + c.userData.col;
      return (ctx.b - myB) / 0.5;
    });
    orbit(ctx, 7.0, 2.2, -0.4, 0.4, [0, 1.9, 0], 40);
    const count = Math.min(n, 9);
    if (count > 0) ctx.overlay.push((O) => O.counter(count, 1920 * 0.78, 1080 * 0.3, U.clamp((ctx.t - tb(startB)) / 0.2)));
  });

  shot(47.6, 54.6, "11 mama — Mama said, Boy, don't sell your soul for applause", (ctx) => {
    stageLights(ctx, 0.7);
    eyeBlink(ctx);
    const tMama = fw("mama"), tAp = fw("applause");
    const rise = E.outCubic(U.clamp((ctx.t - (tMama - 0.3)) / 0.9));
    const m = W.mama;
    m.visible = true;
    m.position.set(0, U.lerp(-4.2, 3.9, rise), -3.2);
    m.rotation.set(0, Math.sin(ctx.t * 0.8) * 0.06, 0);
    W.glow([0, 4, -3.6], 12, 0.5 * rise);
    W.hero(0, 0.6, 1);
    ctx.choreo = [{ b: 0, move: "groove" }, { b: U.beatAt(tAp) - 0.2, pose: "bow" }];
    cam(ctx, [[0, [0, 1.6, 10.6], [0, 2.4, -1], 40], [1, [0, 1.9, 9.6], [0, 2.7, -1], 40, "linear"]]);
    const words = MV.SONG.lines[10].words; // the Mama line
    const pick = (w) => words.find((x) => x[0].toLowerCase().includes(w));
    const L1 = [["DON'T", pick("don")[1]], ["SELL", pick("sell")[1]], ["YOUR", pick("your")[1]], ["SOUL", pick("soul")[1]]];
    const L2 = [["FOR", pick("for")[1]], ["APPLAUSE", pick("applause")[1]]];
    ctx.overlay.push((O, t) => {
      const g = O.g, grd = g.createLinearGradient(0, 760, 0, 1080);
      grd.addColorStop(0, "rgba(3,5,12,0)"); grd.addColorStop(0.45, "rgba(3,5,12,0.78)"); grd.addColorStop(1, "rgba(3,5,12,0.9)");
      g.fillStyle = grd; g.fillRect(0, 760, 1920, 320);
      O.quote(t, null, 1920 / 2, 905, { lines: [L1, L2], font: "400 58px Limelight", lineH: 76 });
    });
    sparksBurst(ctx, tAp, [0, 3.2, 0.5], 70, 5);
  });

  shot(54.6, 63, "12 silence — But the silence louder now than a million gods", (ctx) => {
    const tMil = fw("million");
    ctx.post.exposure = 0.78;
    ctx.post.bloom = 0.3;
    stageLights(ctx, 0.35);
    W.walls.visible = true;
    if (ctx.t < tMil) eyesClosed(); else eyeWave(ctx, tMil, 0.012);
    cardsOnSphere(ctx, 19, [0, 0, 0], ctx.t < tMil ? 0 : 3, 0.02);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, pose: "neutral" }, { b: 3, pose: "lookUp" }];
    ctx.mouthScale = 0.6;
    cam(ctx, [[0, [0, 2.0, 8.4], [0, 2.0, 0], 38], [1, [0, 7.5, 13.5], [0, 3.6, 0], 50, "inOutCubic"]]);
    word(ctx, "A MILLION", ICE, tMil, [0, 7.4, 2.0], 1.5, { billboard: true, onTop: true });
    flashAt(ctx, tMil, "#cfe6ff", 0.3, 0.4);
  });

  // ===== VERSE B (full drums from b64) ==============================
  shot(63, 70.8, "13 kings fall — I seen kings fall quick for a hit on the reels", (ctx) => {
    stageLights(ctx, 1);
    eyeBlink(ctx);
    const tKings = fw("kings"), tFall = fw("fall", 25), tHit = fw("hit");
    W.row.forEach((c, i) => {
      c.visible = true;
      setCardFace(c, W.rowKeys.kings[i]);
      const x = -8 + i * 2.0;
      const ft = tFall + i * 0.07;
      const f = E.inQuad(U.clamp((ctx.t - ft) / 0.35));
      c.position.set(x, 0, -2.6);
      c.rotation.set(-f * (Math.PI / 2 - 0.05), 0, 0);
      // pivot at the bottom edge: offset the group so it rotates around its foot
      c.position.y = Math.cos(f * (Math.PI / 2 - 0.05)) * 1.05;
      c.position.z = -2.6 - Math.sin(f * (Math.PI / 2 - 0.05)) * 1.05;
    });
    W.hero(0, 0.8, 1);
    ctx.choreo = [{ b: 0, pose: "crossArms" }, { b: 1, move: "hype" }];
    cam(ctx, [[0, [-2.8, 1.5, 7.4], [0, 1.9, -1], 42], [1, [2.6, 2.2, 6.9], [0, 1.9, -1], 42, "linear"]], { shake: 0.06, punch: 2.2 });
    flashAt(ctx, B(64), "#fff3d6", 0.9, 0.35);
    word(ctx, "KINGS", GOLD, tKings, [0, 4.5, -3], 1.05, { t1: tHit - 0.2 });
    if (ctx.t > tHit - 0.05) ctx.overlay.push((O, t) => O.filmStrip(t, U.clamp((t - tHit + 0.05) / 0.12), 300));
  });

  shot(70.8, 79, "14 queens trade crowns — Seen queens trade crowns for a six-figure deal", (ctx) => {
    stageLights(ctx, 1);
    eyeBlink(ctx);
    const tTrade = fw("trade"), tDeal = fw("deal"), tSix = fw("six-figure");
    W.row.forEach((c, i) => {
      if (i > 6) return;
      c.visible = true;
      setCardFace(c, W.rowKeys.queens[i]);
      const a = (i - 3) * 0.32;
      c.position.set(Math.sin(a) * 6.5, 1.25, -3.8 + (1 - Math.cos(a)) * 6.5);
      c.rotation.set(0, -a, 0);
      // crowns lift off each queen and spiral into one pile above the hero
      const cr = W.crowns[i];
      cr.visible = true;
      const k = E.inOutCubic(U.clamp((ctx.t - tTrade - i * 0.05) / 1.1));
      const sx = c.position.x, sy = 2.75, sz = c.position.z;
      const ang = k * 2.5 + i;
      cr.position.set(U.lerp(sx, Math.cos(ang) * 0.9, k), U.lerp(sy, 5.2 + i * 0.12, k), U.lerp(sz, Math.sin(ang) * 0.9 - 0.5, k));
      cr.rotation.set(0, ctx.t * 2 + i, 0);
      cr.scale.set(0.9, 0.7, 1);
    });
    W.hero(0, 0.6, 1);
    ctx.choreo = [{ b: 0, move: "strike" }];
    cam(ctx, [[0, [2.4, 1.9, 8.0], [0, 2.4, -1], 42], [1, [-2.4, 2.2, 7.4], [0, 2.4, -1], 42, "linear"]], { shake: 0.05, punch: 2 });
    if (ctx.t > tSix - 0.1) {
      const v = Math.floor(U.lerp(100000, 999999, E.outExpo(U.clamp((ctx.t - tSix) / 0.9))));
      const txt = "$" + v.toLocaleString("en-US");
      ctx.overlay.push((O) => O.text(txt, 1920 / 2, 150, { font: "900 130px 'Big Shoulders Display'", color: "#f8de94", glow: "rgba(255,180,60,0.95)", blur: 36, tracking: "4px" }));
    }
    flashAt(ctx, tDeal, "#fff0c0", 0.35, 0.25);
  });

  shot(79, 86.8, "15 pray — I don't blame 'em, I just pray for 'em", (ctx) => {
    const tBlame = fw("blame"), tPray = fw("pray");
    stageLights(ctx, 0.45);
    eyeBlink(ctx);
    spot(0, 0, 0.0, 0.8, 9, 3.4);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, move: "groove" }, { b: U.beatAt(tBlame) - 0.3, pose: "shrug" }, { b: U.beatAt(tPray) - 0.4, pose: "pray" }];
    cam(ctx, [[0, [0, 2.1, 6.6], [0, 1.9, 0], 36], [1, [0, 1.5, 5.2], [0, 1.6, 0], 36, "linear"]]);
    sparksRise(ctx, 60, [0, 0.5, 0], 4, 0.45, 0.06, 0.9);
    word(ctx, "PRAY", DECO, tPray, [2.3, 2.7, -1.2], 0.6);
  });

  shot(86.8, 94.8, "16 cage / graveyard — We all one mistake from the cage or the graveyard", (ctx) => {
    const tCage = fw("cage"), tGrave = fw("graveyard");
    stageLights(ctx, ctx.t < tGrave ? 0.9 : 0.45);
    eyeBlink(ctx);
    const drop = E.outBack(U.clamp((ctx.t - tCage + 0.12) / 0.32));
    W.cage.forEach((c, i) => {
      c.visible = true;
      const a = (i / W.cage.length) * U.TAU;
      c.position.set(Math.sin(a) * 1.75, U.lerp(14, 2.8, drop), Math.cos(a) * 1.75);
      c.rotation.set(0, a + Math.PI, 0);
    });
    const gk = E.outCubic(U.clamp((ctx.t - tGrave) / 0.5));
    W.graves.forEach((c, i) => {
      if (gk <= 0) return;
      c.visible = true;
      const a = (i / W.graves.length) * U.TAU + 0.2;
      const r = 4.2 + U.hash(i, 2) * 3.5;
      c.position.set(Math.sin(a) * r, U.lerp(-1.2, 0.55, gk), Math.cos(a) * r - 1);
      c.rotation.set((U.hash(i, 3) - 0.5) * 0.4, a + Math.PI, (U.hash(i, 4) - 0.5) * 0.5);
    });
    if (ctx.t > tGrave) ctx.post.exposure = U.lerp(1, 0.7, gk);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, move: "strike" }, { b: U.beatAt(tCage), pose: "grip" }, { b: U.beatAt(tGrave), pose: "lookUp" }];
    cam(ctx, [[0, [0, 2.2, 8.8], [0, 2.4, 0], 40], [1, [2.0, 3.4, 7.2], [0, 2.2, 0], 40, "linear"]], { punch: 1.6 });
    word(ctx, "THE CAGE", ICE, tCage, [0, 6.4, -1], 1.25, { t1: tGrave - 0.1 });
    word(ctx, "GRAVEYARD", Object.assign({}, ICE, { color: "#d9ecff" }), tGrave, [0, 6.2, -1], 1.0);
    flashAt(ctx, tCage, "#e6f4ff", 0.5, 0.25);
  });

  shot(94.8, 102.8, "17 movie — Livin' like a movie, but the credits never roll", (ctx) => {
    const tCred = fw("credits"), tNever = fw("never");
    stageLights(ctx, 0.85);
    eyeBlink(ctx);
    W.hero(-1.7, 0, 1);
    ctx.choreo = [{ b: 0, move: "groove" }];
    cam(ctx, [[0, [-1.0, 2.0, 7.6], [-0.5, 2.0, 0], 38], [1, [-0.9, 2.1, 7.0], [-0.5, 2.0, 0], 38, "linear"]], { shake: 0.04 });
    ctx.post.letterbox = 0;
    ctx.overlay.push((O, t) => O.filmStrip(t, 1, 160));
    const lines = [["THE JACK", "HIMSELF"], ["THE SHADOW", "ALSO HIMSELF"], ["MAMA", "QUEEN OF HEARTS"], ["THE KINGS", "FALLEN"], ["THE QUEENS", "SOLD"], ["A MILLION", "EYES"], ["THE DECK", "52 + ONE"]];
    let scroll = 0;
    if (ctx.t > tCred - 0.3) scroll = Math.min(ctx.t - (tCred - 0.3), tNever - (tCred - 0.3)) * 260;
    const stuck = ctx.t > tNever ? U.noise1(ctx.t * 30, 2) * 4 * Math.max(0, 1 - (ctx.t - tNever) * 2) : 0;
    ctx.overlay.push((O) => O.credits(lines, scroll + stuck, 1));
    if (ctx.t > tNever) ctx.overlay.push((O) => O.text("NEVER ROLL", 1920 * 0.78, 1080 - 190, { font: "900 64px 'Big Shoulders Display'", color: "#ff5040", glow: "rgba(255,40,30,0.8)", blur: 20, tracking: "10px" }));
  });

  shot(102.8, 110.6, "18 crop — They gon' crop you out the frame if you ever lose control", (ctx) => {
    const tCrop = fw("crop"), tFrame = fw("frame"), tLose = fw("lose");
    stageLights(ctx, 0.9);
    eyeBlink(ctx);
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, move: "frameMirror" }, { b: U.beatAt(tLose), pose: "fall" }];
    const pan = E.inOutCubic(U.clamp((ctx.t - (tFrame + 0.1)) / 0.9));
    cam(ctx, [[0, [0, 2.0, 8.6], [0, 2.0, 0], 38], [1, [0, 2.0, 8.2], [0, 2.0, 0], 38, "linear"]], { shake: ctx.t > tLose ? 0.25 : 0.03 });
    W.cam.position.x += pan * 5.2;
    W.cam.lookAt(pan * 5.2, 2.0, 0);
    const tight = E.inOutCubic(U.clamp((ctx.t - tCrop) / (tFrame - tCrop + 0.2)));
    const bw = U.lerp(1700, 520, tight), bh = U.lerp(920, 720, tight);
    const bx = 1920 / 2 - bw / 2, by = 1080 / 2 - bh / 2 + 20;
    ctx.overlay.push((O, t) => O.viewfinder(t, [bx, by, bw, bh], { label: ctx.t < tFrame ? "CROP" : "OUT OF FRAME" }));
    if (ctx.t > tLose) ctx.post.glitch = U.clamp(1 - (ctx.t - tLose) / 0.9) * 0.9;
  });

  shot(110.6, 114.2, "19 truth/hate — I just talk truth, they call it hate", (ctx) => {
    const tTruth = fw("truth", 44), tHate = fw("hate");
    stageLights(ctx, 0.7);
    eyeBlink(ctx);
    W.hero(-2.0, -2.8, 1);
    ctx.choreo = [{ b: 0, pose: "pointOutR" }, { b: U.beatAt(tHate) - 0.2, pose: "shrug" }];
    const k = E.outExpo(U.clamp((ctx.t - tTruth + 0.1) / 0.4));
    if (k > 0) W.text("TRUTH", GOLD, [1.1, 0.78, 0.3], 1.45, { opacity: k, reflText: "HATE", reflStyle: RED });
    W.floor.material.uniforms.strength.value = 1.15;
    cam(ctx, [[0, [0.3, 0.75, 6.8], [0.2, 0.5, 0], 40], [1, [0.6, 0.55, 6.0], [0.3, 0.35, 0], 40, "linear"]]);
    if (ctx.t > tHate) flashAt(ctx, tHate, "#ff3b30", 0.25, 0.3);
  });

  shot(114.2, 118.2, "20 fake love — But the fake love louder than a eight", (ctx) => {
    const tFake = fw("fake"), tEight = fw("eight");
    stageLights(ctx, 0.9);
    eyeBlink(ctx);
    const open = E.outBack(U.clamp((ctx.t - tFake + 0.1) / 0.45));
    W.fan.forEach((c, i) => {
      c.visible = true;
      const a = (i - 6) * 0.2 * open;
      c.position.set(Math.sin(a) * 2.6, 1.0 + Math.cos(a) * 2.6, -1.4 - i * 0.004);
      c.rotation.set(0, 0, -a);
    });
    const kick = U.eventPulse(ctx.t, MV.SONG.kicks, 0.2);
    word(ctx, "8", Object.assign({}, GOLD, { font: "900 420px 'Big Shoulders Display'" }), tFake - 0.3, [0, 4.2, -6], 7.5 * (1 + kick * 0.08), { noPop: true, opacity: 0.55 });
    W.hero(0, 0.5, 1);
    ctx.choreo = [{ b: 0, move: "hype" }];
    cam(ctx, [[0, [0, 2.4, 9.4], [0, 2.7, -1], 40], [1, [0, 2.7, 8.2], [0, 2.9, -1], 40, "linear"]], { punch: 2.8, shake: 0.05 });
    word(ctx, "FAKE LOVE", RED, tFake, [0, 5.25, -0.6], 0.95);
    flashAt(ctx, tEight, "#ffd9d0", 0.55, 0.3);
  });

  shot(118.2, 126.2, "21 scar / L — Every scar got a sermon in it, every L got a learn in it", (ctx) => {
    const tScar = fw("scar"), tSermon = fw("sermon"), tL = fw("l"), tLearn = fw("learn");
    stageLights(ctx, 0.8);
    eyeBlink(ctx);
    bigCardAt([1.9, 2.55, -2.2], 0, -0.18 + Math.sin(ctx.t * 0.9) * 0.08, 0, 1.15);
    // the scar: a glowing slash across the big card
    const sk = E.outExpo(U.clamp((ctx.t - tScar) / 0.25));
    if (sk > 0) {
      const g1 = W.glow([1.9, 2.55, -1.8], 0.1, 1);
      g1.userData.billboard = false;
      g1.scale.set(5.2 * sk, 0.24, 1);
      g1.rotation.set(0, -0.18, 0.75);
      W.glow([1.9, 2.55, -1.7], 6 * sk, 0.4);
    }
    sparksBurst(ctx, tSermon, [1.9, 2.5, -1.4], 60, 4);
    W.hero(-1.4, 0.8, 1);
    ctx.choreo = [{ b: 0, move: "strike" }];
    cam(ctx, [[0, [-1.3, 2.2, 8.0], [0, 2.4, -1], 40], [1, [1.3, 2.2, 7.4], [0, 2.4, -1], 40, "linear"]], { punch: 2 });
    if (ctx.t > tL - 0.05 && ctx.t < tLearn) word(ctx, "L", GOLD, tL, [-3.6, 3.0, 0], 2.2);
    word(ctx, "LEARN", GOLD, tLearn, [-3.4, 3.4, 0], 1.3);
    word(ctx, "SERMON", DECO, tSermon, [-3.2, 4.3, -1], 0.6, { t1: tL - 0.2 });
  });

  shot(126.2, 131, "22 imperfect reflections — I ain't perfect, I just pity how I lived it", (ctx) => {
    stageLights(ctx, 0.6);
    eyeBlink(ctx);
    for (let i = 0; i < 3; i++) {
      mirrorAt(i, (i - 1) * 3.3, -2.6, (1 - i) * 0.18, 1.05);
      W.hero((i - 1) * 3.3, -2.5, 0.9, { shadow: true, flip: i % 2 === 0, billboard: false }).rotation.y = (1 - i) * 0.18;
    }
    W.hero(0, 1.3, 1);
    ctx.choreo = [{ b: 0, move: "frameMirror" }];
    // reflections lag behind him: imperfect copies
    ctx.shadowPose = MV.choreoPose([{ b: 0, move: "frameMirror" }], ctx.b - 0.75);
    cam(ctx, [[0, [0, 2.3, 10.4], [0, 2.3, -1], 40], [1, [0, 2.1, 8.8], [0, 2.2, -1], 40, "linear"]]);
    word(ctx, "PERFECT", Object.assign({}, ICE, { color: "#d6e9ff" }), fw("perfect"), [0, 6.0, -2.6], 0.9, { t1: fw("lived") });
  });

  shot(131, 136, "23 marionette — If the game rigged, then I still pivot, uh", (ctx) => {
    const tRig = fw("rigged"), tPiv = fw("pivot"), tUh = fw("uh");
    stageLights(ctx, 0.85);
    eyeBlink(ctx);
    const h = W.hero(0, 0, 1);
    const spin = U.clamp((ctx.t - tPiv + 0.05) / 0.42);
    ctx.choreo = [{ b: 0, move: "puppet" }, { b: U.beatAt(tPiv) - 0.1, pose: "crossArms" }, { b: U.beatAt(tUh) - 0.05, pose: "strikeR" }];
    ctx.poseMod = (p) => { if (spin > 0 && spin < 1) p.spin = Math.cos(spin * U.TAU); };
    ctx.afterPose = (p) => {
      if (ctx.t < tPiv + 0.12) marionette(ctx, h, p, 0);
      else marionette(ctx, h, p, E.outCubic(U.clamp((ctx.t - tPiv - 0.12) / 0.3)));
    };
    sparksBurst(ctx, tPiv + 0.12, [0, 4.1, 0.2], 70, 3.5);
    cam(ctx, [[0, [0, 2.9, 7.0], [0, 2.9, 0], 44], [1, [0, 2.5, 6.0], [0, 2.5, 0], 44, "linear"]], { punch: 2 });
    word(ctx, "RIGGED", RED, tRig, [-2.3, 4.4, -0.5], 0.7, { t1: tPiv });
    word(ctx, "PIVOT", GOLD, tPiv, [2.3, 4.4, -0.5], 0.7);
    flashAt(ctx, tUh, "#fff6dc", 0.55, 0.3);
  });

  // ===== HOOK 2 ======================================================
  shot(136, 144.8, "24 mirror hall — Mirror, mirror on the wall / who gon' rise and fall", (ctx) => {
    const tWall = fw("wall", 54), tRise = fw("rise", 54), tFall = fw("fall", 54);
    stageLights(ctx, 1);
    eyeBlink(ctx);
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.33;
      const x = Math.sin(a) * 7.2, z = -2.4 - Math.cos(a) * 7.2 + 7.2 - 2.2;
      mirrorAt(i, x, z, -a, 1.0);
      W.hero(x, z + 0.06, 0.86, { shadow: true, flip: i % 2 === 1, billboard: false }).rotation.y = -a;
    }
    W.hero(0, 1.6, 1);
    ctx.choreo = [{ b: 0, move: "wave" }, { b: U.beatAt(tRise) - 0.3, pose: "star" }, { b: U.beatAt(tFall) - 0.1, pose: "fall" }];
    if (ctx.t < tb(140.6)) cam(ctx, [[0, [0, 2.8, 13.5], [0, 2.4, -2], 40], [1, [0, 2.6, 12.5], [0, 2.4, -2], 40, "linear"]], { punch: 1.6 });
    else {
      const k2 = U.clamp((ctx.t - tb(140.6)) / (ctx.dur - (tb(140.6) - B(136))));
      W.camLook([U.lerp(-6.5, -4.5, k2), 1.15, U.lerp(7.5, 6.8, k2)], [0, 2.3, -1.5], 40);
    }
    word(ctx, "THE WALL", ICE, tWall, [0, 6.5, -4], 1.3, { t1: tRise - 0.3 });
    flashAt(ctx, B(136), "#e9f6ff", 0.7, 0.35);
    flashAt(ctx, tb(140.6), "#fff6dc", 0.3, 0.2);
  });

  shot(144.8, 152.8, "25 run then tall — runnin' from my flaws / standin' ten feet tall", (ctx) => {
    const tStill = fw("still", 58), tTen = fw("ten", 58), tTall = fw("tall", 58);
    stageLights(ctx, 0.95);
    eyeBlink(ctx);
    if (ctx.t < tStill - 0.1) {
      const k = U.clamp((ctx.t - ctx.t + ctx.lt) / (tStill - 0.1 - B(144.8)));
      const z = U.lerp(-10, 0, k);
      W.hero(0, z, 1);
      ctx.choreo = [{ b: 0, move: "run" }];
      W.camLook([0.3 + U.noise1(ctx.t * 3, 1) * 0.1, 1.6, z + 6.4], [0, 1.7, z - 1], 42);
      for (let i = 0; i < 40; i++) {
        const c = W.fly[i];
        const tt = ctx.lt - U.hash(i, 3) * 0.6;
        if (tt < 0) continue;
        c.visible = true;
        c.position.set((U.hash(i, 4) - 0.5) * 10, 7 - tt * tt * 8, z - 4 - U.hash(i, 5) * 6);
        c.rotation.set(tt * 4, tt * 5, tt * 2);
        c.scale.setScalar(1.3);
      }
      word(ctx, "FLAWS", RED, fw("flaws", 58), [0, 4.3, z - 3.5], 1.2);
    } else {
      const s = heroGrow(ctx, tTen - 0.1, tTall + 0.25, 1, 1.6);
      W.hero(0, 0, s);
      ctx.choreo = [{ b: 0, pose: "hips" }, { b: U.beatAt(tTall) - 0.25, pose: "tall" }];
      ruler(1.75 * s, 0.4, 4.6 * s, E.outExpo(U.clamp((ctx.t - tStill) / 0.4)));
      W.camLook([0.2, 0.45, 7.2], [0, 3.5, 0], 52);
      word(ctx, "10", GOLD, tTen, [-1.9 * s, 3.6 * s, -0.5], 1.2);
      flashAt(ctx, tStill - 0.1, "#fff6dc", 0.4, 0.2);
      flashAt(ctx, tTall, "#fff3cf", 0.4, 0.3);
    }
  });

  shot(152.8, 161.8, "26 the eye watches — Mirror, mirror, don't you lie / I can see it in my eyes", (ctx) => {
    const tLie = fw("lie", 60), tSee = fw("see", 62), tEyes = fw("eyes", 63);
    stageLights(ctx, 0.6);
    W.sun.visible = false;
    const open = ctx.t < tLie ? 0.55 : E.outCubic(U.clamp((ctx.t - tLie) / 0.5)) * 0.45 + 0.55;
    drawGiantEye(ctx, open, Math.sin(ctx.t * 1.9) * 0.6, Math.cos(ctx.t * 1.3) * 0.25);
    eyePlane([0, 5.0, -11], 26, 13);
    for (const c of W.wallCards) {
      const wave = Math.sin(ctx.b * Math.PI * 0.5 - c.userData.col * 0.5 + c.userData.row * 0.3);
      c.userData.back.material.map = W.backTex[wave > 0.4 ? 3 : wave > -0.2 ? 2 : 0];
    }
    W.hero(0, 0, 1);
    ctx.choreo = [{ b: 0, move: "wave" }, { b: U.beatAt(tSee) - 0.3, pose: "pointUpR" }];
    const dive = E.inExpo(U.clamp((ctx.t - (tEyes - 0.1)) / (B(161.8) - tEyes + 0.1)));
    cam(ctx, [[0, [0, 2.3, 10.2], [0, 2.8, -4], 38], [1, [0, 2.6, 8.6], [0, 3.0, -4], 38, "linear"]], { punch: 1.5 });
    if (dive > 0) W.camLook([0, U.lerp(2.6, 5.0, dive), U.lerp(8.6, -8.5, dive)], [0, 5.0, -11], 38);
    if (dive > 0.75) ctx.post.flash = ["#ffffff", (dive - 0.75) * 4];
  });

  shot(161.8, 168.6, "27 shadow surfaces — Truth gon' surface every time / Even when the lights dim", (ctx) => {
    const tSurf = fw("surface", 64), tLights = fw("lights", 66), tDim = fw("dim", 66);
    const dim = ctx.t < tLights ? 1 : U.lerp(1, 0.35, U.clamp((ctx.t - tLights) / 0.5));
    ctx.post.exposure = dim;
    stageLights(ctx, 0.8 * dim);
    eyeBlink(ctx);
    W.hero(-1.0, 0, 1);
    const rise = E.outCubic(U.clamp((ctx.t - (tSurf - 0.3)) / 0.8));
    W.hero(1.0, 0, 1, { shadow: true, flip: true, y: U.lerp(-3.8, 0, rise) });
    ctx.choreo = [{ b: 0, move: "groove" }, { b: U.beatAt(tLights) - 0.2, pose: "mirrorTouchR" }];
    const k = E.outExpo(U.clamp((ctx.t - (tSurf - 0.15)) / 0.6));
    W.text("SURFACE", ICE, [0, -1.0 + k * 1.75, -1.6], 1.5, { opacity: k > 0 ? 1 : 0 });
    if (ctx.t > tLights) {
      spot(0, -1.0, 0.0, 0.9 * Math.max(0.3, dim), 9, 3);
      spot(1, 1.0, 0.0, 0.9 * Math.max(0.3, dim), 9, 3);
    }
    cam(ctx, [[0, [0, 0.9, 8.0], [0, 1.4, 0], 40], [1, [0, 1.8, 6.8], [0, 1.9, 0], 40, "linear"]]);
    flashAt(ctx, B(161.8), "#ffffff", 0.9, 0.3);
  });

  // ===== HOOK 3 (climax) =============================================
  shot(168.6, 176.8, "28 card tornado — Mirror, mirror on the wall / rise and fall", (ctx) => {
    const tRise = fw("rise", 68), tFall = fw("fall", 68);
    stageLights(ctx, 1);
    ctx.post.bloom = 0.7;
    eyeBlink(ctx);
    for (let i = 0; i < W.fly.length; i++) {
      const c = W.fly[i];
      const s = c.userData.seed;
      // vortex above the dancers' heads (y 3.9..12) widening with height; never between lens and hero
      const h = (s * 8.5 + ctx.t * 0.9) % 8.5;
      const r = 1.8 + h * 0.62 + U.hash(i, 2) * 0.8;
      const a = s * U.TAU * 3 + ctx.t * (1.7 - h * 0.08);
      c.visible = true;
      c.position.set(Math.cos(a) * r, 3.9 + h, Math.sin(a) * r);
      c.rotation.set(ctx.t * 2 + i, -a, ctx.t * 1.3);
      c.scale.setScalar(1.1);
    }
    W.hero(-0.9, 0.2, 1);
    W.hero(0.9, 0.2, 1, { shadow: true, flip: true });
    ctx.choreo = [{ b: 0, move: "strike" }, { b: U.beatAt(tRise) - 0.3, pose: "star" }, { b: U.beatAt(tFall) - 0.1, move: "hype" }];
    orbit(ctx, 8.0, 1.5, -0.2, U.TAU * 0.55, [0, 2.8, 0], 46, "linear");
    word(ctx, "RISE", GOLD, tRise, [0, 6.2, 0], 1.3, { billboard: true, drift: 1.5, t1: tFall });
    word(ctx, "FALL", ICE, tFall, [0, 6.0, 0], 1.3, { billboard: true, drift: -2.5 });
    flashAt(ctx, B(168.6), "#fff6dc", 0.8, 0.35);
  });

  shot(176.8, 184.8, "29 house of cards — runnin' from my flaws / ten feet tall", (ctx) => {
    const tTall = fw("tall", 72);
    stageLights(ctx, 1);
    eyeBlink(ctx);
    // pyramid of A-frames: level L has (5-L) frames
    let n = 0;
    const levels = 5, fwid = 1.25;
    const topY = levels * 1.32;
    for (let L = 0; L < levels; L++) {
      for (let f = 0; f < levels - L; f++) {
        for (const side of [-1, 1]) {
          const c = W.house[n];
          if (!c) continue;
          const order = n;
          n++;
          const arrive = B(176.8) + order * 0.05;
          const k = E.outCubic(U.clamp((ctx.t - arrive) / 0.35));
          if (k <= 0) continue;
          c.visible = true;
          const x = (f - (levels - L - 1) / 2) * fwid * 1.05 + side * 0.3;
          const y = L * 1.32 + 0.66;
          c.position.set(U.lerp(x + side * 6, x, k), U.lerp(y + 6, y, k), -1.5);
          c.rotation.set(0, 0, side * 0.42);
        }
      }
    }
    const climb = E.inOutCubic(U.clamp((ctx.t - B(178)) / (tTall - 0.3 - B(178))));
    const s = heroGrow(ctx, tTall - 0.3, tTall + 0.3, 1, 1.25);
    W.hero(0, -1.5, s, { y: climb * topY });
    ctx.choreo = [{ b: 0, move: "run" }, { b: U.beatAt(tTall) - 0.4, pose: "tall" }];
    cam(ctx, [[0, [0, 1.2, 15.5], [0, 3.5, -1.5], 44], [0.7, [0, 3.0, 12.5], [0, 5.6, -1.5], 44, "inOutCubic"], [1, [0, 6.4, 7.2], [0, 7.6, -1.5], 46, "outCubic"]], { punch: 1.4 });
    flashAt(ctx, tTall, "#fff3cf", 0.5, 0.3);
  });

  shot(184.8, 193.6, "30 quick cuts — Mirror, mirror, don't you lie / I can see it in my eyes", (ctx) => {
    const sub = Math.floor(ctx.lb / 2);
    stageLights(ctx, 1);
    eyeBlink(ctx);
    W.hero(0, 0.6, 1);
    ctx.choreo = [{ b: 0, move: "kicks" }];
    const angle = sub % 4;
    if (angle === 0) {
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.4;
        mirrorAt(i, Math.sin(a) * 6, -2.5 - Math.cos(a) * 6 + 6 - 2, -a, 1);
        W.hero(Math.sin(a) * 6, -2.5 - Math.cos(a) * 6 + 6 - 2 + 0.06, 0.86, { shadow: true, flip: i % 2 === 0, billboard: false }).rotation.y = -a;
      }
      W.camLook([0, 2.6, 12], [0, 2.4, -2], 40);
    } else if (angle === 1) {
      W.camLook([0.4, 2.9, 3.2], [0, 2.75, 0], 30);
    } else if (angle === 2) {
      drawGiantEye(ctx, 1, Math.sin(ctx.t * 3) * 0.7, 0);
      eyePlane([0, 5.0, -11], 26, 13);
      W.sun.visible = false;
      W.camLook([-3, 1.3, 9], [0, 3.6, -5], 42);
    } else {
      W.hero(0, -2.5, 1, { shadow: true, flip: true });
      W.camLook([5.5, 1.6, 6.5], [0, 2.0, -1], 40);
    }
    ctx.post.bloom = 0.6;
    flashAt(ctx, B(184.8 + sub * 2), "#fff6dc", 0.4, 0.18);
    const tEyes = fw("eyes", 76);
    word(ctx, "EYES", ICE, tEyes, [0, 5.4, -1], 1.2, { billboard: true });
  });

  shot(193.6, "end", "31 the touch + title — Truth gon' surface every time", (ctx) => {
    const tTruth = fw("truth", 77), tSurf = fw("surface", 77), tEvery = fw("every", 78);
    stageLights(ctx, 0.8);
    eyeBlink(ctx);
    W.floor.material.uniforms.strength.value = 1.1;
    // he faces his blue self; their hands meet on the invisible mirror line at x = 0
    const meet = E.outCubic(U.clamp((ctx.t - tTruth) / 0.35));
    W.hero(U.lerp(-1.6, -1.04, meet), 0, 1);
    W.hero(U.lerp(1.6, 1.04, meet), 0, 1, { shadow: true, flip: true });
    ctx.choreo = [{ b: 0, pose: "crossArms" }, { b: U.beatAt(tTruth) - 0.15, pose: "touch" }];
    const touch = E.outCubic(U.clamp((ctx.t - tSurf + 0.05) / 0.45));
    const line = W.glow([0, 2.0, 0.02], 0.1, 0.8 * meet);
    line.userData.billboard = false;
    line.scale.set(0.22, 4.4 * meet, 1);
    W.glow([0, 2.12, 0.08], 0.4 + touch * 5.5, 0.95 * touch);
    W.glow([0, 2.12, 0.1], 0.3 + touch * 2.6, 0.9 * touch, true);
    sparksBurst(ctx, tSurf, [0, 2.12, 0.2], 70, 3.2, 0.09);
    cam(ctx, [[0, [0, 2.2, 6.4], [0, 2.0, 0], 40], [1, [0, 2.15, 5.0], [0, 2.05, 0], 40, "linear"]]);
    const dtE = ctx.t - tEvery;
    if (dtE > -0.12) {
      // white-out peaks exactly on "every", then reveals the title card
      ctx.post.flash = ["#fff6e0", dtE < 0 ? (dtE + 0.12) / 0.12 : Math.max(0, 1 - dtE / 0.18)];
    }
    if (dtE > 0) {
      ctx.post.bloom = 0.18;
      W.floorLines.visible = false;
      W.heroes.forEach((h) => (h.visible = false));
      W.glows.forEach((g) => (g.visible = false));
      W.sparks.forEach((g) => (g.visible = false));
      bigCardAt([0, 2.45, 4.2], 0, Math.sin(ctx.t * 1.2) * 0.12, 0, 0.6);
      W.camLook([0, 2.45, 9.8], [0, 2.45, 4.2], 38);
      ctx.overlay.push((O) => {
        O.text("MIRROR MIRROR", 1920 / 2, 150, { font: "400 120px Limelight", color: "#f8de94", glow: "rgba(255,190,80,0.9)", blur: 30 });
        O.text("ANNO DOMINI BEATS", 1920 / 2, 960, { font: "700 40px 'Josefin Sans'", color: "#f4ecd8", tracking: "14px" });
      });
    }
  });

  MV.SHOTS = S;
})();
