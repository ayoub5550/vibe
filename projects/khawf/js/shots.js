// shots.js — THE EDIT. One shot per hemistich (56) + the title card. Shot i starts 0.12 s before the
// first word of hemistich i (AGENTS.md section 8). Each shot is a function (ctx) => configure the world.
// Documented row by row in storyboard.md. All motion comes from ctx.t / ctx.b (frame = f(t)).
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, P = MV.P;
  const L = MV.SONG.lines;
  const SH = (MV.SHOTS = []);
  const LEAD = 0.12;
  const FINALE_END = 161.6;
  const T0 = (i) => (i === 0 ? 0 : L[i].s - LEAD);
  function shot(i, name, fn) {
    SH.push({ i, name, t0: T0(i), t1: i + 1 < L.length ? T0(i + 1) : FINALE_END, apply: fn });
  }
  MV.shotsCheck = () => SH.map((s) => [s.i, s.name, +(s.t1 - s.t0).toFixed(2)]);

  // ---------------------------------------------------------------- helpers
  const w_ = (li, j) => { // onset of word j of line li (throws on a bad index instead of failing silently)
    const w = L[li].words[j];
    if (!w) throw new Error(`no word ${j} in line ${li}`);
    return w[1];
  };
  // onset of the word `str` inside line li (diacritics/tanween ignored)
  const wf = (li, str) => {
    const q = U.norm(str);
    for (const w of L[li].words) if (U.norm(w[0]) === q) return w[1];
    for (const w of L[li].words) if (U.norm(w[0]).includes(q) || q.includes(U.norm(w[0]))) return w[1];
    throw new Error(`word ${str} not in line ${li}`);
  };
  const bt = (t) => U.beatAt(t); // beat at a time (for choreo)
  const ASPECT = MV.PUPPET_CANVAS.w / MV.PUPPET_CANVAS.h;
  const GYN = MV.PUPPET_CANVAS.groundY;
  const hb = (x) => x - Math.floor(x);

  // pose spec -> pose (+ rod-sway groove) -> slot canvas. slot 0 is the hero (motion_check reads it)
  function pup(ctx, slot, kind, spec, o = {}, gv = 0.6) {
    let pose;
    if (typeof spec === "string") pose = MV.pose(spec);
    else if (Array.isArray(spec)) pose = MV.choreoPose(spec, ctx.b);
    else pose = Object.assign(MV.pose("neutral"), spec);
    pose = Object.assign({}, pose);
    if (gv > 0) {
      const b = ctx.b;
      const bob = Math.pow(0.5 + 0.5 * Math.cos(U.TAU * hb(b)), 2) * gv;
      pose.squash += 0.022 * bob;
      pose.head += 2.5 * bob;
      const sway = Math.sin(Math.PI * b) * gv;
      pose.shift += 9 * sway;
      pose.torso += 2 * sway;
      pose.lSh -= 4 * sway; pose.rSh -= 4 * sway;
    }
    if (o.shiver) { pose.torso += Math.sin(ctx.t * 23) * 1.6 * o.shiver; pose.head += Math.sin(ctx.t * 17 + 1) * 2.4 * o.shiver; pose.lEl += Math.sin(ctx.t * 29) * 4 * o.shiver; }
    pose.eyes = hb((ctx.t + slot * 0.7 + 1.1) / 3.3) < 0.04 ? 0.1 : 1;
    if (slot === 0 && !o.notHero) ctx.heroPose = pose;
    if (!ctx.poseOnly) W.drawSlot(slot, kind, pose, Object.assign({}, o), ctx.t, o.blur === undefined ? 4 : o.blur);
    return pose;
  }
  // canvas px of a joint in slot -> world point for a puppet placed at (x, y) with height h
  function jw(slot, joint, x, y, h, flip = false) {
    const J = W.slots[slot].joints;
    if (!J) return [x, y + h * 0.6];
    const p = J[joint];
    return [x + (p[0] / MV.PUPPET_CANVAS.w - 0.5) * h * ASPECT * (flip ? -1 : 1), y + ((GYN - p[1]) / MV.PUPPET_CANVAS.h) * h];
  }
  function cam(ctx, keys, ease = "inOutSine") {
    // keys: [[k, [px,py,pz], [lx,ly,lz], fov]] over shot progress k
    const k = ctx.k;
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (k >= keys[i][0] && k <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
    const u = b[0] > a[0] ? U.ease[ease](U.clamp((k - a[0]) / (b[0] - a[0]))) : 0;
    const pos = U.mix(a[1], b[1], u), look = U.mix(a[2], b[2], u);
    const fov = U.lerp(a[3] || 38, b[3] || 38, u);
    if (ctx.punch) pos[2] -= ctx.punch;
    if (ctx.shake) { pos[0] += ctx.shake * U.noise1(ctx.t * 13, 1) * 0.25; pos[1] += ctx.shake * U.noise1(ctx.t * 13, 2) * 0.25; }
    W.cam(pos, look, fov, ctx.roll || 0);
  }
  function word(ctx, str, t0, x, y, o = {}) {
    ctx.overlay.push((O, t) => O.word(str, x, y, Object.assign({ t, t0 }, o)));
  }
  function flash(ctx, color, times, len = 0.22, amt = 0.6) {
    for (const tt of times) {
      const dt = ctx.t - tt;
      if (dt >= 0 && dt < len) {
        const a = amt * Math.pow(1 - dt / len, 2);
        if (!ctx.post.flash || ctx.post.flash[1] < a) ctx.post.flash = [color, a];
      }
    }
  }
  function fadeIn(ctx, len = 0.5) {
    const a = 1 - U.clamp(ctx.lt / len);
    if (a > 0) ctx.post.flash = ["#000", a];
  }
  function theatre(ctx, o = {}) {
    W.setTheatre(o);
    if (o.prosc !== false && o.lanterns !== false) lanterns(ctx);
  }
  function lanterns(ctx, a = 1) {
    for (const s of [-1, 1]) {
      const x = s * 9.5, y = 9.0;
      W.atlas("lantern", W.loopFrame("lantern", ctx.t, 0.5, s > 0 ? 17 : 0), x, y, 1.3, 3.3, { slot: s > 0 ? 1 : 0, opacity: a, order: 8 });
      W.glow(x, y - 0.25, 1.35, 3.4 + 0.25 * Math.sin(ctx.t * 7 + s), 0xffb060, 0.55 * a, 9);
    }
  }
  function desert(ctx, o = {}) { W.setDesert(o); }
  // a row of clones of one slot; flips/scales vary deterministically
  function crowd(slot, xs, y, z, h, o = {}) {
    xs.forEach((x, i) => {
      const s = 1 + (U.hash(i, 3) - 0.5) * (o.vary === undefined ? 0.16 : o.vary);
      if (o.shadow !== false) W.shadow(slot, x + 0.25, y, z - 0.03, h * s, { opacity: 0.35 });
      W.puppet(slot, x, y + (o.yv || 0) * U.hash(i, 5), z, h * s, { flip: o.flip ? o.flip(i) : false, opacity: o.opacity, rot: o.rot ? o.rot(i) : 0 });
    });
  }
  // closed-form particles: n dots in a box, rising (or falling) and looping
  function motes(ctx, n, seed, box, col, speed = 0.4, fall = false) {
    const [x0, x1, y0, y1, z0, z1] = box;
    for (let i = 0; i < n; i++) {
      const ph = hb(U.hash(i, seed) + ctx.t * speed * (0.5 + U.hash(i, seed + 1)) / (y1 - y0 + 0.001));
      const y = fall ? y1 - ph * (y1 - y0) : y0 + ph * (y1 - y0);
      const x = U.lerp(x0, x1, U.hash(i, seed + 2)) + 0.3 * Math.sin(ctx.t * 1.3 + i);
      const z = U.lerp(z0, z1, U.hash(i, seed + 3));
      const a = Math.sin(Math.PI * ph);
      W.dot(x, y, z, col[0] * a, col[1] * a, col[2] * a);
    }
  }
  // mirror content: the slot canvas drawn mirrored (a reflection). Canvas point (360, focusY) lands
  // at (w/2 + dx*w, top*h); s = scale (1180 canvas px -> s*1180 mirror px)
  const reflect = (slot, o = {}) => (g, w, h) => {
    const c = W.slots[slot].c;
    const s = o.s || 0.5, fy = o.focusY === undefined ? 200 : o.focusY;
    g.save();
    g.translate(w / 2 + (o.dx || 0) * w, (o.top === undefined ? 0.3 : o.top) * h);
    g.scale(-s, s);
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    g.drawImage(c, -(o.focusX === undefined ? 360 : o.focusX), -fy);
    g.restore();
  };
  MV.shotHelpers = { pup, jw, cam, word, flash, fadeIn, theatre, lanterns, desert, crowd, motes, reflect, w_, wf, bt, shot, L, FINALE_END };

  // ================================================================ STANZA 1: the mirror
  // 01 يا خوف حدق في هذه المرآة — lantern flares, the giant shadow, the mirror turns on «المرآة»
  shot(0, "lantern-mirror", (ctx) => {
    theatre(ctx, { tint: 0xffe2b0, hot: [0, 5, 15, 0.6] });
    const t = ctx.t;
    cam(ctx, [[0, [-6.4, 8.6, 6.2], [-9.3, 8.9, 1.2], 40], [0.35, [-5.0, 7.8, 9.0], [-7.5, 7.6, 1], 40], [1, [0.4, 4.4, 19.5], [0.2, 3.9, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, pose: "majesty" }, { b: bt(w_(0, 2)), pose: "bothUp" }, { b: bt(w_(0, 5)), pose: "majesty" }], { whips: true }, 0.5);
    W.shadow(0, -0.6, -3.2, 0.02, 15, { opacity: 0.78 * U.inv(0.5, 1.6, t), order: 1 });
    W.puppet(0, 3.6, 0.4, 0.05, 6.4);
    const ang = U.lerp(-80, -4, U.ease.outCubic(U.inv(2.25, 3.1, t)));
    W.mirror("m0", ang, -4.6, -0.3, 3.2, 5.4, reflect(0, { s: 0.36, top: 0.26, focusY: 150, alpha: 0.9 }), { bottom: true, order: 6 });
    W.glow(-4.6, 2.2, 3.25, 7, 0xffe0b0, 0.25 * U.inv(2.6, 3.2, t), 7);
    motes(ctx, 40, 11, [-10, 10, 0, 9, 0.5, 4], [1, 0.75, 0.4], 0.35);
    fadeIn(ctx, 0.9);
    ctx.post.lift = 0.3;
    word(ctx, "المرآة", w_(0, 5), 760, 170, { size: 170, style: "gold" });
  });

  // 02 قد شبت يا شيخ مثلنا والله — the reflection is an old man
  shot(1, "old-reflection", (ctx) => {
    theatre(ctx, { tint: 0xffe2b0, hot: [3, 5, 12, 0.55] });
    cam(ctx, [[0, [-0.2, 3.6, 16.5], [-0.2, 3.4, 3], 38], [1, [-0.9, 3.5, 14.6], [-0.9, 3.3, 3], 37]]);
    pup(ctx, 0, "fear", [{ b: 0, pose: "majesty" }, { b: bt(w_(1, 1)), pose: "lookClose" }], { whips: true }, 0.4);
    W.shadow(0, 4.6, 0.2, 0.02, 7.2, { opacity: 0.4 });
    W.puppet(0, 4.0, 0.4, 0.05, 7.2);
    pup(ctx, 1, "fear", "tired", { age: 1, crownTilt: -12 }, 0.3);
    W.mirror("m1", 6, -1.4, -0.72, 5.0, 6.2, reflect(1, { s: 0.42, top: 0.27, focusY: 190 }), { bottom: true, order: 6 });
    motes(ctx, 45, 21, [-3.4, 0.6, 0, 6.0, 5.2, 5.6], [1, 1, 0.95], 0.5, true);
    word(ctx, "شبت", w_(1, 1), 420, 230, { size: 180, style: "bone" });
  });

  // 03 شماتة فيك غير خافية — the crowd points and laughs
  shot(2, "gloat", (ctx) => {
    theatre(ctx, { tint: 0xffe6bc, hot: [-2, 5, 15, 0.6] });
    cam(ctx, [[0, [-2.6, 4.3, 14.5], [-2.6, 4.1, 0], 38], [1, [0.6, 4.3, 14.5], [0.6, 4.1, 0], 38]]);
    pup(ctx, 1, "youth", [{ b: bt(L[2].s) - 0.5, move: "laugh" }], {}, 0.8);
    crowd(1, [-7.2, -5.6, -4.1, -2.6, -1.1, 0.4, -6.4], 0.4, 0.05, 4.6, { yv: 0 });
    pup(ctx, 0, "fear", "cower", { whips: true, age: 0.05 }, 0.3);
    W.shadow(0, 5.6, 0.2, 0.02, 6.6, { opacity: 0.4, flip: true });
    W.puppet(0, 5.4, 0.4, 0.06, 6.6, { flip: true });
    word(ctx, "شماتة", w_(2, 0), 620, 170, { size: 180, style: "gold" });
  });

  // 04 يا عامر الملك يا عظيم الجاه — mock majesty, the Blender crown in a sunburst
  shot(3, "majesty", (ctx) => {
    theatre(ctx, { tint: 0xffd890, hot: [0, 7, 16, 0.85], hotColor: 0xffc060 });
    cam(ctx, [[0, [0, 3.0, 15.0], [0, 4.2, 0], 38], [1, [0, 4.8, 14.6], [0, 5.0, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: bt(L[3].s) - 0.6, move: "majesty" }], { whips: true, age: 0.1 }, 0.6);
    W.shadow(0, 0.5, -0.6, 0.02, 8.6, { opacity: 0.45 });
    W.puppet(0, 0, 0.4, 0.05, 7.4);
    const k = U.ease.outBack(U.inv(w_(3, 2) - 0.2, w_(3, 2) + 0.4, ctx.t));
    W.glow(0, 7.7, 0.1, 9 * k, 0xffd070, 0.7, 2);
    W.dyn("sunburst", 1024, 1024, (g, w, h) => {
      g.translate(w / 2, h / 2);
      g.rotate(ctx.t * 0.25);
      for (let i = 0; i < 24; i++) {
        g.rotate(U.TAU / 24);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(-34, -500); g.lineTo(34, -500); g.closePath();
        g.fillStyle = i % 2 ? "rgba(122,60,16,0.55)" : "rgba(224,170,74,0.6)";
        g.fill();
      }
    }, 0, 7.4, 0.025, 11 * k + 0.01, { order: 1 });
    W.atlas("crown", W.loopFrame("crown", ctx.t, 0.7), 0, U.lerp(10.5, 8.0, k), 0.3, 2.9 * k + 0.01, { order: 6 });
    motes(ctx, 60, 31, [-7, 7, 0, 10, 0.2, 1.5], [1, 0.8, 0.35], 0.6);
    word(ctx, "الملك", w_(3, 2), 470, 330, { size: 170, style: "gold" });
    word(ctx, "الجاه", w_(3, 5), 1450, 330, { size: 170, style: "gold" });
  });

  // 05 أصبحت منا وكنت سيدنا — he shrinks to the size of the crowd and stands in the row
  shot(4, "one-of-us", (ctx) => {
    theatre(ctx, { tint: 0xffe6bc });
    cam(ctx, [[0, [0, 5.0, 14.0], [0, 4.8, 0], 38], [1, [0, 5.2, 18.5], [0, 4.7, 0], 38]]);
    pup(ctx, 1, "youth", [{ b: 0, move: "sway" }], {}, 0.5);
    crowd(1, [-6.6, -4.8, -3.0, 3.0, 4.8, 6.6], 0.4, 0.05, 4.6, { flip: (i) => i >= 3 });
    pup(ctx, 0, "fear", [{ b: 0, pose: "majesty" }, { b: bt(w_(4, 1)), pose: "neutral" }], { whips: false, age: 0.15 }, 0.4);
    const k = U.ease.outBack(U.inv(w_(4, 0), w_(4, 1) + 0.3, ctx.t));
    const h = U.lerp(9.5, 4.7, k);
    W.shadow(0, 0.3, 0.2, 0.02, h * 1.05, { opacity: 0.4 });
    W.puppet(0, 0, 0.4, 0.06, h);
    word(ctx, "منا", w_(4, 1), 960, 330, { size: 180, style: "bone" });
  });

  // 06 والملك لله لا إله سواه — the crown falls; a cartouche draws «الملك لله» (SVG + anime.js)
  shot(5, "crown-falls", (ctx) => {
    theatre(ctx, { tint: 0xffe2b0, hot: [-3, 6, 14, 0.5] });
    cam(ctx, [[0, [1.5, 4.6, 15.5], [1.5, 4.6, 0], 38], [1, [2.0, 5.2, 15], [1.8, 5.3, 0], 38]]);
    const tc = w_(5, 0);
    const fallen = ctx.t > tc;
    pup(ctx, 0, "fear", [{ b: 0, pose: "neutral" }, { b: bt(tc + 0.3), pose: "bow" }], { crown: fallen ? "none" : "taj", age: 0.2 }, 0.3);
    const x = 5.2, h = 6.6;
    W.shadow(0, x + 0.4, 0.2, 0.02, h, { opacity: 0.4 });
    W.puppet(0, x, 0.4, 0.06, h);
    if (fallen) {
      const k = U.clamp((ctx.t - tc) / 0.9);
      const y0 = 0.4 + h * 0.84, y1 = 0.55;
      const bounce = Math.abs(Math.sin(k * Math.PI * 2.5)) * (1 - k) * 0.8;
      const y = k < 0.45 ? U.lerp(y0, y1, U.ease.inQuad(k / 0.45)) : y1 + bounce;
      W.atlas("crown", W.loopFrame("crown", ctx.t, 1.6), x + 0.4 + k * 1.6, y + 0.6, 0.3, 1.3, { order: 6, rot: -k * 1.2 });
    }
    ctx.post.vignette = 1;
  });

  // 07 مولاي أمسى حسابكم عسراً — a shadow-puppet balance: his pan sinks
  shot(6, "reckoning", (ctx) => {
    theatre(ctx, { tint: 0xffdfb0, hot: [0, 5, 13, 0.6] });
    cam(ctx, [[0, [0, 4.6, 15.8], [0, 4.6, 0], 38], [1, [0.3, 4.7, 14.0], [0.3, 4.7, 0], 38]]);
    const k = U.ease.outBack(U.inv(w_(6, 2), w_(6, 2) + 0.7, ctx.t));
    const ang = 0.3 * k + 0.03 * Math.sin(ctx.t * 2); // + = counter-clockwise: the left pan (his crimes) sinks
    const cx = 1.2, cy = 6.2;
    W.sprite(MV.postTex(), cx, 3.2, 0.03, 1.4, 5.6, { order: 2 });
    W.sprite(MV.beamTex(), cx, cy, 0.04, 7.2, 0.9, { rot: ang, order: 3 });
    for (const s of [-1, 1]) {
      const px = cx + s * 3.3 * Math.cos(ang), py = cy + s * 3.3 * Math.sin(ang);
      W.sprite(MV.panTex(), px, py - 1.55, 0.035, 2.5, 3.1, { order: 2 });
      if (s < 0) W.sprite(MV.weightTex(), px, py - 2.35, 0.045, 1.4, 1.4, { order: 4 });
      else W.atlas("crown", W.loopFrame("crown", ctx.t, 0.4), px, py - 2.45, 0.045, 1.1, { order: 4 });
    }
    pup(ctx, 0, "fear", [{ b: 0, pose: "neutral" }, { b: bt(w_(6, 2)), pose: "cower" }], { age: 0.25, crown: "none" }, 0.4);
    W.shadow(0, -5.6, 0.2, 0.02, 6.2, { opacity: 0.4 });
    W.puppet(0, -6.0, 0.4, 0.06, 6.2);
    word(ctx, "حسابكم", w_(6, 2), 1460, 170, { size: 170, style: "red" });
  });

  // 08 ليلة تحكيم العبد في مولاه — night: the slave on the dais, the master kneeling
  shot(7, "judgement", (ctx) => {
    theatre(ctx, { tint: 0x5a62a8, hot: [2, 5, 14, 0.2], hotColor: 0xc8d4ff, bg: 0x05060f });
    cam(ctx, [[0, [0, 1.6, 14.5], [0, 4.3, 0], 38], [1, [0.4, 2.0, 13.6], [0.4, 4.4, 0], 38]]);
    const mk = U.inv(L[7].s - 0.1, L[7].e, ctx.t);
    W.sprite(MV.moonTex(), -4.2, U.lerp(5.6, 6.8, mk), 0.008, 6.5, 6.5, { order: 1 });
    W.sprite(MV.daisTex(), 3.0, 2.15, 0.03, 6.4, 4.0, { order: 2 });
    pup(ctx, 1, "youth", "sit", {}, 0.2);
    W.puppet(1, 3.2, 2.7, 0.05, 5.6);
    pup(ctx, 0, "fear", "kneel", { age: 0.35, crown: "none", whips: false }, 0.2);
    W.shadow(0, -2.6, 0.2, 0.02, 6.4, { opacity: 0.4 });
    W.puppet(0, -2.9, 0.4, 0.06, 6.4);
    ctx.post.lift = 0.3;
    word(ctx, "العبد", w_(7, 2), 1460, 150, { size: 170, style: "gold" });
    word(ctx, "مولاه", w_(7, 4), 300, 720, { size: 150, style: "red" });
  });

  // 09 قتلتنا فانظر كيف تقتلنا — the crowd falls; on «تقتلنا» they rise again as ghosts
  shot(8, "killed", (ctx) => {
    theatre(ctx, { tint: 0xffe0b0, hot: [0, 5, 15, 0.5] });
    cam(ctx, [[0, [0, 4.6, 16], [0, 4.5, 0], 38], [1, [0, 4.6, 15], [0, 4.6, 0], 38]]);
    const tf = w_(8, 0), tr = w_(8, 3);
    pup(ctx, 1, "youth", "face", {}, 0);
    const xs = [-5.0, -3.0, -1.0, 1.0, 3.0, 5.0];
    xs.forEach((x, i) => {
      const k = U.ease.inQuad(U.clamp((ctx.t - tf - i * 0.12) / 0.35));
      W.puppet(1, x, 0.4, 0.05, 4.4, { rot: -k * Math.PI * 0.5 * (i % 2 ? 1 : 1), opacity: 1 - 0.4 * U.inv(tr - 0.2, tr + 0.4, ctx.t) });
    });
    pup(ctx, 2, "youth", "face", { ghost: true }, 0.5);
    xs.forEach((x, i) => {
      const k = U.ease.outCubic(U.clamp((ctx.t - tr - i * 0.08) / 0.7));
      if (k > 0) {
        W.puppet(2, x, 0.4 + k * 1.2 + 0.15 * Math.sin(ctx.t * 2 + i), 0.08, 4.6, { opacity: 0.9 * k });
      }
    });
    pup(ctx, 0, "fear", [{ b: 0, pose: "whipUpR" }, { b: bt(tf), pose: "lashR", x: 0.25 }], { whips: true, age: 0.38 }, 0.3);
    W.shadow(0, -6.6, 0.2, 0.02, 6.4, { opacity: 0.4 });
    W.puppet(0, -6.9, 0.4, 0.06, 6.4);
    flash(ctx, "#ff5a3a", [tf], 0.2, 0.35);
    word(ctx, "قتلتنا", w_(8, 0), 960, 160, { size: 180, style: "red" });
  });

  // 10 من بعدها يا فطين يا تياه — he struts, nose high: one high step + chin-up per metre foot
  shot(9, "strut", (ctx) => {
    theatre(ctx, { tint: 0xffe2b0, hot: [0, 5, 15, 0.55] });
    const b0 = bt(L[9].s) - 0.5;
    const ph = Math.max(0, ctx.b - b0);
    const step = Math.floor(ph) + U.ease.inOutCubic(U.clamp((ph - Math.floor(ph)) / 0.45));
    const x = -4.8 + 2.2 * step;
    cam(ctx, [[0, [-2.8, 4.6, 13.6], [-2.8, 4.6, 0], 38], [1, [2.4, 4.8, 13.6], [2.4, 4.7, 0], 38]], "linear");
    pup(ctx, 0, "fear", [{ b: b0, move: "strut" }], { whips: true, age: 0.42 }, 0.5);
    W.shadow(0, x + 0.5, 0.2, 0.02, 7.8, { opacity: 0.4 });
    W.puppet(0, x, 0.4, 0.06, 7.8);
    word(ctx, "فطين", w_(9, 3), 1460, 240, { size: 170, style: "bone" });
    word(ctx, "تياه", w_(9, 5), 520, 200, { size: 190, style: "gold" });
  });

  // 11 بل كيف تنجو يا شيخ من يدنا — he runs; our giant hands close in
  shot(10, "hands", (ctx) => {
    theatre(ctx, { tint: 0xffdcb0, hot: [0, 5, 14, 0.5] });
    cam(ctx, [[0, [3.4, 4.5, 15], [3.4, 4.5, 0], 38], [0.18, [0, 4.5, 15], [0, 4.5, 0], 38], [1, [0, 4.6, 14.2], [0, 4.6, 0], 38]], "outCubic");
    const ty = w_(10, 6);
    pup(ctx, 0, "fear", [{ b: 0, move: "run" }, { b: bt(ty), pose: "cower" }], { age: 0.46 }, 0.2);
    W.shadow(0, 0.4, 0.2, 0.02, 6.4, { opacity: 0.4 });
    W.puppet(0, 0, 0.4, 0.06, 6.4);
    const k = U.ease.outCubic(U.inv(L[10].s, ty + 0.2, ctx.t));
    for (const s of [-1, 1]) W.sprite(MV.handTex(), s * U.lerp(13, 4.6, k), 3.6, 0.015, 6.4 * (s < 0 ? -1 : 1), 9.6, { rot: -s * 0.35, opacity: 0.82, color: 0x1a0d06, order: 1 });
    ctx.shake = 0.5 * U.eventPulse(ctx.t, [ty], 0.4);
    word(ctx, "يدنا", ty, 960, 140, { size: 190, style: "red" });
  });

  // 12 وهل نجا المرء قط من قتلاه — a ring of ghosts circles him
  shot(11, "ghost-ring", (ctx) => {
    theatre(ctx, { tint: 0xd8c8b0, hot: [0, 5, 12, 0.4] });
    cam(ctx, [[0, [-1.2, 4.4, 15.2], [0, 4.3, 0], 38], [1, [1.2, 4.6, 14.0], [0, 4.4, 0], 38]]);
    pup(ctx, 0, "fear", "cower", { age: 0.5, crown: "none" }, 0.2);
    W.shadow(0, 0.4, 0.2, 0.02, 6.4, { opacity: 0.4 });
    W.puppet(0, 0, 0.4, 0.06, 6.4, { order: 4 });
    // ghosts circle him in the plane of the screen (draft 1 orbited them in 3D and their legs fell
    // out below the screen onto the proscenium); near = bigger, in front of him
    pup(ctx, 2, "youth", [{ b: 0, move: "sway" }], { ghost: true }, 0.4);
    for (let i = 0; i < 7; i++) {
      const th = (i / 7) * U.TAU + ctx.t * 0.9;
      const near = Math.sin(th);
      const x = Math.cos(th) * 5.8, sc = 4.6 * (1 + 0.16 * near);
      const ap = U.inv(L[11].s + i * 0.08, L[11].s + 0.6 + i * 0.08, ctx.t);
      W.puppet(2, x, 0.4 + 0.25 * Math.sin(ctx.t * 2 + i), 0.08 + 0.02 * (near + 1), sc, { opacity: 0.85 * ap * (0.7 + 0.3 * near), flip: near > 0, order: near > 0 ? 5 : 3 });
    }
    motes(ctx, 50, 41, [-7, 7, 0.5, 8, 0.2, 0.6], [0.5, 0.55, 0.8], 0.4);
    word(ctx, "قتلاه", wf(11, "قتلاه"), 960, 150, { size: 180, style: "silver" });
    // short dip at the end of the stanza (< 0.5 s, not a black run)
    const dip = U.inv(ctx.shot.t1 - 0.3, ctx.shot.t1, ctx.t);
    if (dip > 0) ctx.post.flash = ["#000", dip * 0.7];
  });

  // ================================================================ STANZA 2: the portrait of fear
  // 13 هل أنت يا هذا الرث صاحبنا — close-up of the shabby Sultan
  shot(12, "shabby", (ctx) => {
    theatre(ctx, { tint: 0xf0d8b0, hot: [1, 6, 12, 0.5] });
    cam(ctx, [[0, [1.0, 5.6, 9.5], [1.0, 5.6, 0], 38], [1, [1.2, 6.0, 7.6], [1.2, 6.0, 0], 36]]);
    pup(ctx, 0, "fear", "tired", { age: 0.6, tatter: true, crownTilt: -14 }, 0.35);
    W.shadow(0, 0.7, 0.2, 0.02, 8.6, { opacity: 0.35 });
    W.puppet(0, 0.3, 0.4, 0.06, 8.6);
    word(ctx, "الرث", wf(12, "الرث"), 430, 820, { size: 190, style: "bone" });
  });

  // 14 ذاك المهيب الذي تعودناه — red sepia flashback: the giant majestic shadow, the tiny crowd bowing
  shot(13, "awe", (ctx) => {
    theatre(ctx, { tint: 0xe08a6a, hot: [0, 6, 16, 0.7], hotColor: 0xffa070 });
    cam(ctx, [[0, [0, 7.4, 15.5], [0, 6.2, 0], 38], [1, [0, 4.6, 15.8], [0, 4.6, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, move: "majesty" }], { whips: true, blur: 2 }, 0.5);
    W.shadow(0, 0, -5.2, 0.02, 17, { opacity: 0.92 });
    pup(ctx, 1, "youth", "bowDeep", {}, 0.2);
    crowd(1, [-6.8, -5.2, -3.6, -2.0, 2.0, 3.6, 5.2, 6.8], 0.4, 0.05, 2.6, { flip: (i) => i >= 4, shadow: false });
    ctx.post.lift = 0.3;
    word(ctx, "المهيب", wf(13, "المهيب"), 1430, 340, { size: 170, style: "gold" });
  });

  // 15 يحمل سوطين في يديه فذا — two whips crack on the words
  shot(14, "two-whips", (ctx) => {
    theatre(ctx, { tint: 0xe8a888, hot: [0, 5, 14, 0.55], hotColor: 0xffa070 });
    const c1 = wf(14, "يحمل"), c2 = wf(14, "سوطين"), c3 = wf(14, "يديه"), c4 = wf(14, "فذا");
    ctx.punch = 1.2 * U.eventPulse(ctx.t, [c2 + 0.08, c3 + 0.08], 0.35);
    cam(ctx, [[0, [0, 4.8, 15], [0, 4.8, 0], 38], [1, [0, 4.8, 14], [0, 4.8, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, pose: "bothUp" }, { b: bt(c1), pose: "whipUpL", x: 0.3 }, { b: bt(c2), pose: "lashL", x: 0.22 },
      { b: bt(c3 - 0.2), pose: "whipUpR", x: 0.3 }, { b: bt(c3 + 0.05), pose: "lashR", x: 0.22 }, { b: bt(c4 + 0.1), pose: "bothUp", x: 0.4 }], { whips: true }, 0.3);
    W.shadow(0, 0.5, 0.2, 0.02, 8.0, { opacity: 0.45 });
    W.puppet(0, 0, 0.4, 0.06, 8.0);
    flash(ctx, "#ff7050", [c2 + 0.08, c3 + 0.12], 0.2, 0.4);
    word(ctx, "سوطين", c2, 480, 190, { size: 180, style: "red" });
  });

  // 16 لمن عصاه وذا لمن أرضاه — one whip for the rebel, one for the obedient
  shot(15, "rebel-obedient", (ctx) => {
    theatre(ctx, { tint: 0xe8a888, hot: [0, 5, 14, 0.55], hotColor: 0xffa070 });
    cam(ctx, [[0, [0, 4.5, 16.5], [0, 4.4, 0], 38], [1, [0, 4.5, 15.8], [0, 4.4, 0], 38]]);
    const tA = wf(15, "عصاه"), tB = wf(15, "أرضاه");
    pup(ctx, 0, "fear", [{ b: 0, pose: "bothUp" }, { b: bt(tA), pose: "lashL", x: 0.25 }, { b: bt(tA + 0.6), pose: "bothUp" }, { b: bt(tB), pose: "lashR", x: 0.25 }], { whips: true }, 0.3);
    W.shadow(0, 0.4, 0.2, 0.02, 7.2, { opacity: 0.4 });
    W.puppet(0, 0, 0.4, 0.06, 7.2);
    pup(ctx, 1, "youth", "fist", {}, 0.4);
    const fa = U.ease.inQuad(U.clamp((ctx.t - tA - 0.1) / 0.3));
    W.puppet(1, -5.6, 0.4, 0.05, 5.0, { rot: fa * Math.PI * 0.5 });
    pup(ctx, 2, "youth", "bowDeep", {}, 0.2);
    const fb = U.ease.inQuad(U.clamp((ctx.t - tB - 0.1) / 0.3));
    W.puppet(2, 5.6, 0.4, 0.05, 5.0, { flip: true, rot: -fb * Math.PI * 0.5 });
    flash(ctx, "#ff6040", [tA + 0.08, tB + 0.08], 0.2, 0.4);
    word(ctx, "عصاه", tA, 420, 190, { size: 160, style: "red" });
    word(ctx, "أرضاه", tB, 1500, 190, { size: 160, style: "red" });
  });

  // 17 إن لم تطعه تمت مفاجأة — sudden death: a hard snap
  shot(16, "sudden", (ctx) => {
    theatre(ctx, { tint: 0xe0a890, hot: [0, 5, 13, 0.45], hotColor: 0xffa070 });
    const ts = wf(16, "تمت");
    ctx.punch = 2.2 * U.ease.outExpo(U.inv(ts, ts + 0.15, ctx.t));
    cam(ctx, [[0, [0, 4.4, 15.5], [0, 4.2, 0], 38], [1, [0, 4.4, 15.0], [0, 4.2, 0], 38]]);
    pup(ctx, 1, "youth", "face", { rods: ctx.t < ts }, 0.4);
    const k = U.ease.inQuad(U.clamp((ctx.t - ts) / 0.14));
    W.puppet(1, -0.5, 0.4 + k * 0.7, 0.05, 6.4, { rot: k * Math.PI * 0.5 });
    pup(ctx, 0, "fear", [{ b: 0, pose: "whipUpR" }, { b: bt(ts - 0.05), pose: "lashR", x: 0.15 }], { whips: true, notHero: false }, 0.2);
    W.shadow(0, 5.2, -1.4, 0.02, 11, { opacity: 0.55 });
    flash(ctx, "#ff2a1a", [ts], 0.24, 0.85);
    ctx.shake = 1.2 * U.eventPulse(ctx.t, [ts], 0.5);
    word(ctx, "مفاجأة", wf(16, "مفاجأة"), 960, 170, { size: 190, style: "red" });
  });

  // 18 وإن تطعه يوماً تمت بأناة — the Blender hourglass drains; the obedient one sinks slowly
  shot(17, "slowly", (ctx) => {
    theatre(ctx, { tint: 0xe8a888, hot: [-2, 5, 13, 0.45], hotColor: 0xffa070 });
    cam(ctx, [[0, [0.2, 4.0, 14.2], [0.2, 3.9, 2], 38], [1, [0.4, 3.8, 12.6], [0.4, 3.7, 2], 37]]);
    const p = U.inv(L[17].s, L[17].e + 0.2, ctx.t);
    W.atlas("hourglass", p * 47.99, 3.4, 3.0, 3.0, 6.2, { order: 6 });
    W.glow(3.4, 3.2, 2.95, 7, 0xffc070, 0.25, 5);
    pup(ctx, 1, "youth", [{ b: 0, pose: "face" }, { b: bt(wf(17, "تمت")), pose: "bowDeep", x: 1.4 }], {}, 0.15);
    const sink = U.ease.inOutSine(p);
    W.puppet(1, -2.6, 0.4 - sink * 0.6, 0.05, 6.8);
    // the mound: sand (leather cut-out) rising in step with the draining glass, to his chest
    const mh = 0.3 + 2.5 * sink;
    W.dyn("mound", 1024, 512, (g, w, h) => {
      g.beginPath();
      g.moveTo(0, h);
      g.bezierCurveTo(w * 0.18, h * 0.55, w * 0.32, h * 0.04, w * 0.5, h * 0.02);
      g.bezierCurveTo(w * 0.68, h * 0.04, w * 0.82, h * 0.55, w, h);
      g.closePath();
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "#d9a45a"); gr.addColorStop(1, "#8a5a28");
      g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      g.fillStyle = "rgba(255,240,200,0.55)";
      for (let i = 0; i < 90; i++) { MV.star8(g, U.hash(i, 171) * w, U.hash(i, 172) * h, 3 + 4 * U.hash(i, 173)); g.fill(); }
      g.restore();
      g.lineWidth = 10; g.strokeStyle = "#24120a"; g.stroke();
    }, -2.6, 0.05 + mh / 2, 0.07, mh, { order: 4 });
    // the sand stream from the glass to the mound
    for (let i = 0; i < 70; i++) {
      const ph = hb(U.hash(i, 61) + ctx.t * 0.9);
      const x = U.lerp(2.6, -2.2, ph) + (U.hash(i, 62) - 0.5) * 0.25, y = U.lerp(1.0, mh * 0.92, ph) + 1.3 * Math.sin(Math.PI * ph) + (U.hash(i, 63) - 0.5) * 0.15;
      W.dot(x, y, 0.3, 1, 0.78, 0.42);
    }
    word(ctx, "بأناة", wf(17, "بأناة"), 1380, 200, { size: 180, style: "bone" });
  });

  // 19 يعدمنا رغم أنه عدم — he turns hollow: only his outline and holes remain
  shot(18, "nothingness", (ctx) => {
    theatre(ctx, { tint: 0xe8a888, hot: [0, 5, 14, 0.55], hotColor: 0xffa070 });
    const a = (ctx.k - 0.5) * 0.4;
    cam(ctx, [[0, [Math.sin(a) * 15, 4.8, Math.cos(a) * 15], [0, 4.8, 0], 38], [1, [Math.sin(a) * 15, 4.8, Math.cos(a) * 15], [0, 4.8, 0], 38]]);
    const th = wf(18, "عدم");
    const k = U.inv(th - 0.6, th + 0.1, ctx.t);
    const sp = [{ b: 0, move: "majesty" }];
    pup(ctx, 0, "fear", sp, { whips: true }, 0.4);
    pup(ctx, 3, "fear", sp, { whips: true, hollow: true }, 0.4);
    W.shadow(0, 0.5, 0.2, 0.02, 8, { opacity: 0.4 * (1 - k) });
    W.puppet(0, 0, 0.4, 0.06, 8, { opacity: 1 - k });
    W.puppet(3, 0, 0.4, 0.065, 8, { opacity: k });
    word(ctx, "عدم", th, 1450, 330, { size: 200, style: "bone", outline: true });
  });

  // 20 بعض الجنايات ما لهن جناة — a chalk outline, red drops, an empty spotlight
  shot(19, "no-culprit", (ctx) => {
    theatre(ctx, { tint: 0x8c8a9c, hot: [3.6, 3.2, 6, 0.55], hotColor: 0xfff4e0 });
    cam(ctx, [[0, [0, 4.0, 15.5], [0, 3.8, 0], 38], [1, [0.6, 4.0, 14.0], [0.6, 3.8, 0], 38]]);
    W.sprite(MV.chalkTex(), -2.4, 1.6, 0.03, 9, 4.5, { order: 2, color: 0xfff6ea });
    for (let i = 0; i < 9; i++) W.sprite(MV.glowTex(), -4 + U.hash(i, 2) * 5, 0.8 + U.hash(i, 3) * 2.2, 0.04, 0.35, 0.35, { color: 0x9c0f0b, order: 3 });
    W.glow(3.6, 0.6, 0.05, 3.2, 0xfff0d8, 0.5, 3);
    word(ctx, "جناة", wf(19, "جناة"), 1390, 190, { size: 190, style: "red", strike: U.inv(wf(19, "جناة") + 0.3, wf(19, "جناة") + 0.7, ctx.t) });
  });

  // 21 كالوحش في الحلم إذ يطاردني — blue dream: the youth runs, a horned shadow beast chases him
  shot(20, "dream-chase", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8c86c0, duneX: ctx.lt * 2.4, moon: [30, 30, 24] });
    // a fast lateral track; the beast lunges on every metre foot (54.02, 54.76, 55.50)
    const feet = MV.SONG.beats.filter((x) => x > ctx.shot.t0 - 0.05 && x < ctx.shot.t1);
    const lunge = U.eventPulse(ctx.t, feet, 0.32);
    const cx = U.lerp(6, -6, ctx.k);
    ctx.shake = 0.35 * lunge;
    cam(ctx, [[0, [cx, 2.7, 12.4], [cx - 1, 2.7, 0], 40], [1, [cx, 2.7, 12.4], [cx - 1, 2.7, 0], 40]], "linear");
    const x = cx - 3.0;
    pup(ctx, 0, "youth", [{ b: 0, move: "run" }], {}, 0);
    W.groundShadow(0, x, 2.2, 6.0, 1.2, { flip: true });
    W.puppet(0, x, 0, 2.2, 6.0, { flip: true });
    const bx = x + 6.0 - 1.6 * lunge;
    const bs = 12 * (1 + 0.12 * lunge);
    W.sprite(MV.beastTex(), bx, 5.6 + 0.4 * lunge, -4, bs, bs, { color: 0x05040c, opacity: 0.9, order: 1, rot: 0.1 * lunge });
    // kicked-up dust behind his feet
    for (let i = 0; i < 50; i++) {
      const ph = hb(U.hash(i, 71) + ctx.t * 1.6);
      W.dot(x + 0.4 + ph * 2.4 + (U.hash(i, 72) - 0.5) * 0.4, 0.1 + ph * 0.9 * U.hash(i, 73), 2.2, 0.9 * (1 - ph), 0.82 * (1 - ph), 1 * (1 - ph));
    }
    word(ctx, "يطاردني", wf(20, "يطاردني"), 960, 150, { size: 170, style: "silver" });
  });

  // 22 ويختفي لو وقفت كي ألقاه — he stops and turns; the beast shrinks into a toy and puffs into sand
  shot(21, "face-it", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8c86c0, moon: [30, 30, 24] });
    const tStop = wf(21, "وقفت"), tGone = wf(21, "ألقاه");
    const run = U.clamp((tStop - ctx.t) / 1.4);
    const x = -2.5 + 2.4 * (1 - U.ease.outCubic(1 - run));
    cam(ctx, [[0, [0, 2.6, 13], [-1, 2.6, 0], 40], [1, [-1.0, 2.5, 10.5], [-1, 2.6, 0], 38]]);
    const turned = ctx.t > tStop + 0.1;
    pup(ctx, 0, "youth", [{ b: 0, move: "run" }, { b: bt(tStop), pose: "stopPalm", x: 0.5 }], {}, 0.2);
    W.groundShadow(0, x, 2.2, 5.8, 1.2, { flip: !turned });
    W.puppet(0, x, 0, 2.2, 5.8, { flip: !turned });
    const shrink = U.ease.inCubic(U.inv(tStop, tGone, ctx.t));
    const bs = 13 * (1 - shrink);
    if (bs > 0.2) W.sprite(MV.beastTex(), U.lerp(5, 2.6, shrink), U.lerp(7.2, 0.8, shrink), U.lerp(-6, 1.8, shrink), bs, bs, { color: 0x05040c, opacity: 0.85, order: 1 });
    const toy = U.inv(tGone - 0.3, tGone, ctx.t) * (1 - U.inv(tGone + 0.15, tGone + 0.45, ctx.t));
    pup(ctx, 1, "fear", "majesty", { whips: true }, 0.4);
    if (toy > 0) W.puppet(1, 2.6, 0, 1.9, 1.3, { opacity: toy, flip: true });
    const burst = U.clamp((ctx.t - tGone - 0.15) / 1.0);
    if (burst > 0 && burst < 1) for (let i = 0; i < 60; i++) {
      const a = U.hash(i, 81) * U.TAU, r = burst * (0.4 + U.hash(i, 82) * 1.6);
      W.dot(2.6 + Math.cos(a) * r, 0.5 + Math.abs(Math.sin(a)) * r, 1.9, 1 * (1 - burst), 0.85 * (1 - burst), 0.6 * (1 - burst));
    }
    ctx.post.lift = 0.45;
    word(ctx, "ألقاه", tGone, 600, 190, { size: 180, style: "gold" });
  });

  // 23 فلا يراه الذي يواجهه — he faces where it should be: nothing; the beast is behind him, unseen
  shot(22, "unseen-front", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8c86c0, moon: [36, 28, 16] });
    cam(ctx, [[0, [0, 3.2, 11.8], [0, 3.3, 0], 40], [1, [0.3, 3.2, 11.0], [0.3, 3.3, 0], 39]]);
    pup(ctx, 0, "youth", [{ b: 0, pose: "face" }, { b: bt(wf(22, "يواجهه")), pose: "stopPalm", x: 0.8 }], {}, 0.3);
    W.groundShadow(0, 0.6, 1.5, 6.0, 1.1);
    W.puppet(0, 0.6, 0, 1.5, 6.0);
    // the beast looms right behind him, filling the upper frame: he faces the empty dunes (+x)
    const br = 0.5 + 0.5 * Math.sin(ctx.t * 2.2);
    W.sprite(MV.beastTex(), -2.6, 5.0, 0.55, -11.4, 11.4, { color: 0x05040c, opacity: 0.25, order: 0 });
    W.sprite(MV.beastTex(), -2.6, 5.0, 0.6, -11, 11, { color: 0x9fb4dc, opacity: 0.3 + 0.06 * br, order: 1 });
    word(ctx, "يواجهه", wf(22, "يواجهه"), 1420, 220, { size: 170, style: "silver" });
  });

  // 24 ولا الذي فر من أذاه يراه — he flees; the shadow stalks right behind him
  shot(23, "unseen-back", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8c86c0, duneX: -ctx.lt * 1.2, moon: [30, 30, 24] });
    const cx = U.lerp(-3, 3, ctx.k);
    cam(ctx, [[0, [cx, 2.8, 12.5], [cx + 0.6, 2.6, 0], 40], [1, [cx, 2.8, 12.5], [cx + 0.6, 2.6, 0], 40]], "linear");
    const x = cx + 1.6;
    pup(ctx, 0, "youth", [{ b: 0, move: "run" }], {}, 0);
    W.groundShadow(0, x, 2.0, 5.8, 1.2);
    W.puppet(0, x, 0, 2.0, 5.8);
    W.sprite(MV.beastTex(), x - 2.9, 2.6, 1.0, 5.6, 5.6, { color: 0x05040c, opacity: 0.6, order: 1 });
    ctx.post.lift = 0.45;
    word(ctx, "فر", wf(23, "فر"), 560, 200, { size: 200, style: "silver" });
  });

  // 25 تظهر آثاره مؤجلة — footprints appear late, with no walker
  shot(24, "late-traces", (ctx) => {
    desert(ctx, { sky: "night", sand: 0xa49ccc, moon: [-20, 26, 18] });
    cam(ctx, [[0, [0.6, 3.8, 7.0], [0, 0, -3], 44], [1, [0.8, 3.4, 4.6], [0.2, 0, -6.5], 44]]);
    const feet = MV.SONG.beats.filter((x) => x > L[24].s - 0.05 && x < ctx.shot.t1 + 0.8);
    const times = [];
    feet.forEach((b, i) => { times.push(b); if (feet[i + 1]) times.push((b + feet[i + 1]) / 2); });
    for (let i = 0; i < 12; i++) {
      const ti = (times[i] === undefined ? 1e9 : times[i]) + 0.05;
      const a = U.inv(ti, ti + 0.12, ctx.t);
      if (a <= 0) continue;
      const z = 3.4 - i * 1.25, x = (i % 2 ? 0.45 : -0.45) + Math.sin(i * 0.5) * 0.5;
      W.sprite(MV.footprintTex(), x, 0.03, z, 0.9, 1.8, { rx: -Math.PI / 2, rot: -0.1, opacity: a, order: -10 });
      const pf = U.clamp((ctx.t - ti) / 0.6);
      if (pf < 1) for (let j = 0; j < 8; j++) W.dot(x + (U.hash(i, j) - 0.5) * pf * 1.4, 0.1 + pf * 0.7 * U.hash(j, i), z, 0.8 * (1 - pf), 0.7 * (1 - pf), 0.9 * (1 - pf));
    }
    ctx.post.lift = 0.5;
    word(ctx, "آثاره", wf(24, "آثاره"), 960, 160, { size: 190, style: "bone" });
  });

  // 26 كصحة الصوت واعتلال صداه — the voice goes out clean, the echo returns late and sick (SVG)
  shot(25, "echo", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8c86c0, moon: [10, 30, 16] });
    cam(ctx, [[0, [0, 3.0, 12], [0, 3.0, 0], 38], [1, [0, 3.0, 11.6], [0, 3.0, 0], 38]]);
    pup(ctx, 0, "youth", "call", {}, 0.2);
    W.groundShadow(0, -5.2, 1.0, 5.4, 1.1);
    W.puppet(0, -5.2, 0, 1.0, 5.4);
    ctx.echo = true;
    ctx.post.lift = 0.45;
    word(ctx, "صداه", wf(25, "صداه"), 1420, 880, { size: 180, style: "red" });
  });

  // 27 حق ولكن كأنه كذب — the cut-out «حق»; the lamp swings and its shadow reads «كذب»
  const cutWord = (str, fill, holes) => (g, w, h) => {
    g.font = "700 300px Amiri";
    str = MV.Overlay.shape(str);
    g.direction = "rtl";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = 16;
    g.strokeStyle = "#24120a";
    g.strokeText(str, w / 2, h / 2);
    g.fillStyle = fill;
    g.fillText(str, w / 2, h / 2);
    if (holes) {
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "#fff6dc";
      for (let y = 20; y < h; y += 46) for (let x = 20; x < w; x += 46) { MV.star8(g, x + (y % 92 ? 23 : 0), y, 5); g.fill(); }
      g.globalCompositeOperation = "source-over";
    }
  };
  shot(26, "truth-lie", (ctx) => {
    const tK = wf(26, "كذب");
    const sw = U.ease.inOutSine(U.inv(wf(26, "كأنه") - 0.5, tK + 0.2, ctx.t));
    theatre(ctx, { tint: 0xffe2b8, hot: [U.lerp(4, -4, sw), 5.6, 12, 0.6] });
    cam(ctx, [[0, [0, 4.8, 15], [0, 4.8, 0], 38], [1, [0, 4.8, 13.2], [0, 4.8, 0], 38]]);
    const a = U.inv(wf(26, "حق") - 0.1, wf(26, "حق") + 0.2, ctx.t);
    // the shadows: «حق» fades out while «كذب» grows in as the hotspot swings
    W.dyn("sh-haq", 768, 384, (g, w, h) => { g.filter = "blur(6px)"; cutWord("حق", "#000", false)(g, w, h); }, U.lerp(-1.6, 2.4, sw), 3.6, 0.02, 3.8, { color: 0x1a0d06, opacity: 0.8 * a * (1 - sw) });
    W.dyn("sh-kadhib", 768, 384, (g, w, h) => { g.filter = "blur(6px)"; cutWord("كذب", "#000", false)(g, w, h); }, U.lerp(-1.6, 2.6, sw), 3.6, 0.025, U.lerp(3.8, 5.0, sw), { color: 0x2a0806, opacity: 0.85 * sw });
    W.dyn("cut-haq", 768, 384, cutWord("حق", "#e0aa4a", true), -2.4, 5.6, 0.6, 3.6, { opacity: a, order: 6 });
  });

  // 28 كما تكون النقائض الأشباه — white and black Sultans dance the same move, mirrored
  shot(27, "opposites", (ctx) => {
    theatre(ctx, { tint: 0xa8a49c, hot: [0, 5, 15, 0.35], hotColor: 0xd8d0c0 });
    const a = (ctx.k - 0.5) * 0.35;
    cam(ctx, [[0, [Math.sin(a) * 15.5, 4.6, Math.cos(a) * 15.5], [0, 4.6, 0], 38], [1, [Math.sin(a) * 15.5, 4.6, Math.cos(a) * 15.5], [0, 4.6, 0], 38]]);
    const ch = [{ b: bt(L[27].s) - 0.5, move: "strut" }];
    pup(ctx, 0, "fear", ch, { pal: "white", whips: true }, 0.6);
    pup(ctx, 3, "fear", ch, { pal: "black", whips: true }, 0.6);
    W.shadow(0, -3.0, 0.2, 0.02, 7, { opacity: 0.35 });
    W.puppet(0, -3.4, 0.4, 0.06, 7);
    W.shadow(3, 3.0, 0.2, 0.02, 7, { opacity: 0.35, flip: true });
    W.puppet(3, 3.4, 0.4, 0.06, 7, { flip: true });
    word(ctx, "النقائض", wf(27, "النقائض"), 960, 140, { size: 160, style: "gold" });
  });

  // 29 ضيف على كمه اليسار دم — the guest enters through an arch, blood on his left sleeve
  shot(28, "guest", (ctx) => {
    theatre(ctx, { tint: 0xe8c8a0, hot: [0, 4.5, 11, 0.5] });
    cam(ctx, [[0, [0, 4.4, 15.8], [0, 4.2, 0], 38], [1, [0.4, 4.2, 12.6], [0.4, 4.0, 0], 37]]);
    W.sprite(MV.doorTex(), 0, 4.6, 0.04, 9.2, 9.2 * 1.333, { order: 4 });
    const x = U.lerp(2.6, 0.2, U.ease.outCubic(U.inv(L[28].s - 0.1, L[28].s + 2.2, ctx.t)));
    pup(ctx, 0, "guest", [{ b: 0, move: "hideWalk" }, { b: bt(L[28].s + 2.2), pose: "neutral", x: 1 }], { blood: true, hideR: true }, 0.4);
    W.shadow(0, x + 0.4, 0.2, 0.02, 8.2, { opacity: 0.4, flip: true });
    W.puppet(0, x, 0.4, 0.03, 8.2, { flip: true, order: 3 });
    word(ctx, "دم", wf(28, "دم"), 1730, 520, { size: 230, style: "red" });
  });

  // 30 يخطو إلينا ولا نرى يمناه — he walks toward us, right hand hidden
  shot(29, "toward-us", (ctx) => {
    desert(ctx, { sky: "night", sand: 0x8078b0, moon: [0, 34, 22] });
    cam(ctx, [[0, [0, 1.3, 12.5], [0, 3.2, 0], 40], [1, [0, 1.2, 12.5], [0, 3.6, 0], 40]]);
    const z = U.lerp(-7, 5.2, U.ease.inOutSine(U.inv(L[29].s - 0.1, L[29].e + 0.6, ctx.t)));
    pup(ctx, 0, "guest", [{ b: 0, move: "hideWalk" }], { blood: true, hideR: true }, 0.4);
    W.groundShadow(0, 0, z, 6, 1.1);
    W.puppet(0, 0, 0, z, 6, { ry: 0.0 });
    ctx.post.lift = 0.45;
    ctx.post.vignette = 1.1;
    word(ctx, "يمناه", wf(29, "يمناه"), 1450, 200, { size: 180, style: "red" });
  });


  // ================================================================ STANZA 3: mercy
  const DAWN = (ctx, k) => desert(ctx, { sky: ["night", "dawn", k], sand: k > 0.5 ? 0xc8a890 : 0xa898b8, moon: [-34, 30, 22, 1 - 0.5 * k], duneTint: k > 0.5 ? 0xffe6d0 : 0xffffff });

  // 31 ما باله متعباً ومرتبكاً — pre-dawn: the old Sultan trembles, confused
  shot(30, "tired", (ctx) => {
    DAWN(ctx, 0.25);
    cam(ctx, [[0, [0.3 + 0.3 * U.noise1(ctx.t * 0.7, 3), 3.4, 11.5], [0, 3.3, 0], 38], [1, [0.6 + 0.3 * U.noise1(ctx.t * 0.7, 3), 3.3, 10.5], [0.2, 3.3, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, move: "sway" }], { age: 0.9, tatter: true, crownTilt: -16, shiver: 1 }, 0.5);
    W.groundShadow(0, 0, 1.5, 6.6, 1.3);
    W.puppet(0, 0, 0, 1.5, 6.6);
    ctx.post.lift = 0.45;
    word(ctx, "متعباً", wf(30, "متعبا"), 1450, 200, { size: 170, style: "bone" });
  });

  // 32 تكاد أن لا تقله قدماه — his legs buckle; he sinks to his knees
  shot(31, "buckle", (ctx) => {
    DAWN(ctx, 0.3);
    cam(ctx, [[0, [0, 4.6, 10.5], [0, 4.4, 0], 38], [1, [0, 2.4, 10], [0, 2.0, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, pose: "tired" }, { b: bt(wf(31, "تقله")) - 0.2, pose: "buckle", x: 0.5 }, { b: bt(wf(31, "قدماه")) - 0.25, pose: "kneel", x: 0.5 }], { age: 0.9, tatter: true, crownTilt: -16, shiver: 0.6 }, 0.15);
    W.groundShadow(0, 0, 1.5, 6.6, 1.3);
    W.puppet(0, 0, 0, 1.5, 6.6);
    ctx.post.lift = 0.45;
    word(ctx, "قدماه", wf(31, "قدماه"), 1480, 260, { size: 170, style: "bone" });
  });

  // 33 يا شيخ لا بأس هاك خذ كتفي — a youth comes and offers his shoulder
  shot(32, "shoulder", (ctx) => {
    DAWN(ctx, 0.4);
    cam(ctx, [[0, [0, 3.0, 12.5], [0, 2.8, 0], 38], [1, [0.2, 3.0, 11.2], [0.2, 2.8, 0], 38]]);
    const tH = wf(32, "هاك"), tK = wf(32, "كتفي");
    pup(ctx, 0, "fear", [{ b: 0, pose: "kneel" }, { b: bt(tK), pose: Object.assign({}, MV.POSES.kneel, { rSh: 104, rEl: -8, head: 10 }), x: 1 }], { age: 0.9, tatter: true, crownTilt: -16 }, 0.15);
    W.groundShadow(0, 1.4, 1.4, 6.4, 1.3);
    W.puppet(0, 1.4, 0, 1.4, 6.4, { flip: true });
    const xy = U.lerp(-4.5, -0.4, U.ease.outCubic(U.inv(L[32].s - 0.1, tH, ctx.t)));
    pup(ctx, 1, "youth", [{ b: 0, move: "walk" }, { b: bt(tH), pose: "offer", x: 0.8 }], {}, 0.3);
    W.groundShadow(1, xy, 1.6, 5.4, 1.3);
    W.puppet(1, xy, 0, 1.6, 5.4);
    ctx.post.lift = 0.45;
    word(ctx, "كتفي", tK, 1460, 200, { size: 180, style: "gold" });
  });

  // 34 وقم فمن ذا السعيد في دنياه — he lifts him; Blender lanterns rise into the sky
  shot(33, "rise", (ctx) => {
    DAWN(ctx, 0.5);
    cam(ctx, [[0, [0, 2.6, 13], [0, 3.0, 0], 38], [1, [0, 4.2, 13.5], [0, 6.0, -4], 40]]);
    const tQ = wf(33, "وقم");
    pup(ctx, 0, "fear", [{ b: 0, pose: Object.assign({}, MV.POSES.kneel, { rSh: 104, rEl: -8, head: 10 }) }, { b: bt(tQ), pose: "standUp", x: 1.2 }], { age: 0.85, tatter: true, crownTilt: -10 }, 0.15);
    W.groundShadow(0, 1.2, 1.4, 6.4, 1.3);
    W.puppet(0, 1.2, 0, 1.4, 6.4, { flip: true });
    pup(ctx, 1, "youth", [{ b: 0, pose: "offer" }, { b: bt(tQ + 0.2), pose: "standUp", x: 1.2 }], {}, 0.3);
    W.puppet(1, -0.6, 0, 1.6, 5.4);
    for (let i = 0; i < 7; i++) {
      const rise = (ctx.t - L[33].s + 0.3 + U.hash(i, 9) * 0.8) * (0.9 + U.hash(i, 8) * 0.5);
      if (rise <= 0) continue;
      const x = -9 + i * 3 + U.hash(i, 7) * 1.5, z = -6 - U.hash(i, 6) * 10, y = 1.5 + rise * 1.6;
      W.atlas("lantern", W.loopFrame("lantern", ctx.t, 0.4, i * 7), x, y, z, 1.6, { slot: 10 + i, order: -5 });
      W.glow(x, y - 0.1, z + 0.1, 2.6, 0xffa850, 0.6, -4);
    }
    ctx.post.lift = 0.45;
    word(ctx, "السعيد", wf(33, "السعيد"), 960, 140, { size: 170, style: "gold" });
  });

  const cx0 = (ctx) => U.lerp(-1.0, 1.0, ctx.k);
  // 35 مهما اختصمنا فأنت صاحبنا — side by side on the dune, against a huge moon
  shot(34, "companions", (ctx) => {
    desert(ctx, { sky: ["night", "dawn", 0.55], sand: 0xc0a090, moon: [6, 16, 40], duneTint: 0xffe6d8 });
    cam(ctx, [[0, [-1.0, 2.4, 13], [-1.0, 3.4, 0], 38], [1, [1.0, 2.4, 13], [1.0, 3.4, 0], 38]], "linear");
    const x = U.lerp(-4.4, 2.6, ctx.k);
    pup(ctx, 0, "fear", [{ b: 0, move: "walk" }], { age: 0.85, tatter: true, crownTilt: -10 }, 0.2);
    pup(ctx, 1, "youth", [{ b: 1, move: "walk" }], {}, 0.2);
    for (let i = 0; i < 9; i++) { // foreground grass tufts sliding past faster (parallax)
      const gx = ((i * 3.1 - ctx.t * 2.2) % 27 + 27) % 27 - 13.5 + cx0(ctx);
      W.sprite(MV.glowTex(), gx, 0.15, 4.5, 0.9, 0.5, { color: 0x3a2a40, opacity: 0.6, order: 6 });
    }
    W.groundShadow(0, x + 1.4, -1, 7.2, 1.4);
    W.puppet(0, x + 1.4, 0, -1, 7.2);
    W.groundShadow(1, x - 0.8, -0.8, 6.2, 1.4);
    W.puppet(1, x - 0.8, 0, -0.8, 6.2);
    ctx.post.lift = 0.4;
    word(ctx, "صاحبنا", wf(34, "صاحبنا"), 960, 150, { size: 170, style: "gold" });
  });

  // 36 ونحن لا ننسى المرء صاحبناه — two lines of footprints side by side
  shot(35, "two-tracks", (ctx) => {
    desert(ctx, { sky: ["night", "dawn", 0.6], sand: 0xd0b098, moon: [-26, 22, 18, 0.6], duneTint: 0xffe6d8 });
    cam(ctx, [[0, [0, 4.6, 8], [0, 0, -4], 44], [1, [0, 4.0, 3], [0, 0, -10], 44]]);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) {
      const z = 4 - i * 1.0, x = (r ? 0.9 : -0.9) + (i % 2 ? 0.2 : -0.2);
      W.sprite(MV.footprintTex(), x, 0.03, z, r ? 0.4 : 0.5, r ? 0.8 : 1.0, { rx: -Math.PI / 2, opacity: 0.9, order: -10 });
    }
    pup(ctx, 0, "fear", [{ b: 0, move: "walk" }], { age: 0.85, crownTilt: -10 }, 0.3);
    pup(ctx, 1, "youth", [{ b: 0.5, move: "walk" }], {}, 0.3);
    W.puppet(0, 0.9, 0, -14, 2.6, { ry: Math.PI / 2 * 0 });
    W.puppet(1, -0.9, 0, -14, 2.3);
    ctx.post.lift = 0.4;
    word(ctx, "صاحبناه", wf(35, "صاحبناه"), 960, 150, { size: 160, style: "gold" });
  });

  // 37 نحنّ حتى للخوف من كرم — the crowd wraps him in a cloak; a soft girih rosette
  const cloak = (g, w, h) => {
    g.beginPath();
    g.moveTo(w * 0.5, 20);
    g.bezierCurveTo(w * 0.95, 40, w * 0.98, h * 0.7, w * 0.9, h - 20);
    g.lineTo(w * 0.1, h - 20);
    g.bezierCurveTo(w * 0.02, h * 0.7, w * 0.05, 40, w * 0.5, 20);
    g.closePath();
    g.fillStyle = "#1f8a8a";
    g.fill();
    g.save(); g.clip();
    MV.lattice(g, 0, 0, w, h, 64, "#ffd98a", 4);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = "#24120a"; g.stroke();
  };
  shot(36, "generosity", (ctx) => {
    theatre(ctx, { tint: 0xffd8a0, hot: [0, 5, 16, 0.75], hotColor: 0xffc070 });
    cam(ctx, [[0, [0, 4.0, 15], [0, 3.8, 0], 38], [1, [0, 3.9, 13.2], [0, 3.7, 0], 38]]);
    pup(ctx, 0, "fear", "kneel", { age: 0.95, tatter: true, crown: "none" }, 0.25);
    W.puppet(0, 0, 0.4, 0.06, 6.6);
    const ck = U.ease.outCubic(U.inv(wf(36, "حتى"), wf(36, "كرم"), ctx.t));
    W.dyn("cloak", 512, 640, cloak, -0.1, U.lerp(6.5, 1.9, ck), 0.07, 3.0, { opacity: ck, order: 4 });
    pup(ctx, 1, "youth", "offer", {}, 0.4);
    crowd(1, [-5.4, -3.4], 0.4, 0.05, 4.8, { shadow: false });
    crowd(1, [3.4, 5.4], 0.4, 0.05, 4.8, { shadow: false, flip: () => true });
    motes(ctx, 50, 91, [-6, 6, 0, 8, 0.3, 1.2], [1, 0.8, 0.4], 0.3);
    word(ctx, "كرم", wf(36, "كرم"), 1460, 170, { size: 200, style: "gold" });
  });

  // 38 من بعد ما عشنا كل ما خفناه — the old fears appear as shadows and burn into embers
  shot(37, "embers", (ctx) => {
    theatre(ctx, { tint: 0xe8a888, hot: [0, 5, 15, 0.55], hotColor: 0xff9a60 });
    cam(ctx, [[0, [0, 4.6, 14], [0, 4.6, 0], 38], [1, [0, 4.8, 16], [0, 4.7, 0], 38]]);
    const tb = wf(37, "عشنا"), te = wf(37, "خفناه");
    const ap = U.inv(L[37].s, L[37].s + 0.7, ctx.t), burn = U.inv(tb + 0.4, te + 0.6, ctx.t);
    const al = ap * (1 - burn);
    pup(ctx, 0, "fear", "lashL", { whips: true }, 0);
    W.shadow(0, -4.6, 0.6, 0.02, 7.2, { opacity: 0.85 * al });
    W.sprite(MV.beastTex(), 4.4, 4.8, 0.02, 6.4, 6.4, { color: 0x1a0d06, opacity: 0.85 * al, order: 1 });
    W.sprite(MV.chalkTex(), 0.4, 1.4, 0.02, 6, 3, { color: 0x1a0d06, opacity: 0.85 * al, order: 1 });
    W.atlas("hourglass", 20, 0.2, 6.2, 0.03, 3.2, { color: 0x3a1a0a, opacity: 0.9 * al });
    for (let i = 0; i < 160; i++) {
      const ph = U.hash(i, 101);
      const st = burn * 1.2 - ph * 0.3;
      if (st <= 0 || st > 1) continue;
      const x = -7 + U.hash(i, 102) * 14, y = 0.5 + U.hash(i, 103) * 7 + st * 3;
      W.dot(x, y, 0.2, 1 * (1 - st), 0.6 * (1 - st), 0.2 * (1 - st));
    }
    word(ctx, "خفناه", te, 960, 150, { size: 180, style: "bone" });
  });

  // 39 ورب خوف في القلب أجمل من — a small flame of fear in a youth's heart
  shot(38, "heart-flame", (ctx) => {
    theatre(ctx, { tint: 0xf0d0a0, hot: [1, 6, 12, 0.5] });
    cam(ctx, [[0, [0.8, 5.0, 10], [0.8, 5.0, 0], 38], [1, [0.9, 5.2, 7.8], [0.9, 5.2, 0], 36]]);
    const fl = 0.45 + 0.25 * U.inv(wf(38, "القلب"), wf(38, "القلب") + 0.5, ctx.t);
    pup(ctx, 0, "youth", "heart", { heart: fl }, 0.3);
    W.shadow(0, 0.6, 0.2, 0.02, 9.6, { opacity: 0.35 });
    W.puppet(0, 0.2, 0.4, 0.06, 9.6);
    word(ctx, "القلب", wf(38, "القلب"), 470, 250, { size: 180, style: "gold" });
  });

  // 40 شجاعة لو أمعنت في معناه — the flame grows into the Blender lantern, lifted high
  shot(39, "courage", (ctx) => {
    theatre(ctx, { tint: 0xffdca8, hot: [0, 7, 16, 0.7], hotColor: 0xffc070 });
    cam(ctx, [[0, [0, 4.0, 14], [0, 4.2, 0], 38], [1, [0, 5.6, 14.5], [0, 5.8, 0], 38]]);
    const tS = wf(39, "شجاعة");
    const lift = U.inv(tS, tS + 0.9, ctx.t);
    pup(ctx, 0, "youth", [{ b: 0, pose: "heart" }, { b: bt(tS), pose: "liftLantern", x: 1 }], { heart: 0.7 * (1 - lift) + 0.01 }, 0.3);
    const x = -0.4, h = 8.6;
    W.shadow(0, x + 0.4, 0.2, 0.02, h, { opacity: 0.35 });
    W.puppet(0, x, 0.4, 0.06, h);
    if (lift > 0) {
      const p = jw(0, "wrR", x, 0.4, h);
      W.atlas("lantern", W.loopFrame("lantern", ctx.t, 0.5), p[0], p[1] + 0.75, 0.1, 2.2 * U.ease.outBack(lift), { order: 6 });
      W.glow(p[0], p[1] + 0.6, 0.12, 6 * lift, 0xffb050, 0.7, 7);
    }
    word(ctx, "شجاعة", tS, 1450, 230, { size: 180, style: "gold" });
  });

  // 41 كخوف أم على ابنها فإذا — a mother shields her child
  shot(40, "mother", (ctx) => {
    theatre(ctx, { tint: 0xf4d6a8, hot: [-1, 5, 13, 0.6] });
    cam(ctx, [[0, [0, 4.0, 14.5], [0, 3.9, 0], 38], [1, [0, 4.0, 12.6], [0, 3.9, 0], 37]]);
    pup(ctx, 3, "mother", "hold", {}, 0.3);
    pup(ctx, 4, "child", "face", {}, 0.2);
    pup(ctx, 0, "fear", "majesty", { whips: true }, 0.3);
    W.shadow(0, 5.2, -0.5, 0.02, 10.5, { opacity: 0.5 * U.inv(L[40].s, L[40].s + 1.5, ctx.t) });
    W.shadow(3, -0.6, 0.2, 0.02, 7.4, { opacity: 0.35 });
    W.puppet(3, -1.0, 0.4, 0.06, 7.4);
    W.puppet(4, -0.2, 0.4, 0.07, 6.4);
    word(ctx, "أم", wf(40, "أم"), 1450, 210, { size: 220, style: "gold" });
  });

  // 42 ما مات عنها ما عاد ما تخشاه — the child rises as light; her arms are empty (deliberately dim)
  shot(41, "loss", (ctx) => {
    theatre(ctx, { tint: 0x9a8c88, hot: [-0.4, 5, 9, 0.18], hotColor: 0xd8e0ff });
    cam(ctx, [[0, [0, 4.4, 13.5], [0, 4.4, 0], 38], [1, [0, 4.6, 13.0], [0, 4.6, 0], 38]]);
    const tM = wf(41, "مات");
    pup(ctx, 3, "mother", [{ b: 0, pose: "hold" }, { b: bt(tM + 0.4), pose: "empty", x: 1.6 }], {}, 0.2);
    W.puppet(3, -1.0, 0.4, 0.06, 7.4);
    const up = U.ease.inOutSine(U.inv(tM, tM + 2.0, ctx.t));
    pup(ctx, 4, "child", "face", { ghost: up > 0.05 }, 0.2);
    W.puppet(4, -0.2, 0.4 + up * 4, 0.07, 6.4, { opacity: 1 - up * 0.9 });
    W.glow(-0.2, 3 + up * 4.5, 0.08, 3 + up * 3, 0xe8f0ff, 0.6 * up, 5);
    motes(ctx, 30, 111, [-1.2, 0.8, 1, 8, 0.1, 0.3], [0.8, 0.85, 1], 0.6);
    ctx.post.lift = 0.5;
    word(ctx, "تخشاه", wf(41, "تخشاه"), 960, 150, { size: 170, style: "silver" });
  });

  // 43 شجاعة إجبارية جعلت — she stands tall; her shadow outgrows his
  shot(42, "forced-courage", (ctx) => {
    theatre(ctx, { tint: 0xf0d4a8, hot: [-3, 4, 12, 0.6] });
    cam(ctx, [[0, [0, 1.8, 14.5], [0, 4.2, 0], 38], [1, [0, 1.6, 14.0], [0, 4.4, 0], 38]]);
    const g = U.ease.inOutSine(U.inv(L[42].s, L[42].e, ctx.t));
    pup(ctx, 3, "mother", [{ b: 0, pose: "empty" }, { b: bt(wf(42, "إجبارية")), pose: "tall", x: 1.2 }], {}, 0.2);
    pup(ctx, 0, "fear", "majesty", { whips: true }, 0.3);
    W.shadow(0, 4.4, -0.4, 0.02, U.lerp(11, 4.6, g), { opacity: 0.6, flip: true });
    W.shadow(3, -1.6, 0.2, 0.02, U.lerp(7.4, 12.5, g), { opacity: 0.55 });
    W.puppet(3, -2.6, 0.4, 0.06, 7.6);
    word(ctx, "إجبارية", wf(42, "إجبارية"), 1300, 160, { size: 160, style: "gold" });
  });

  // 44 من نقمة الخوف نعمة مهداة — one letter changes: نقمة becomes نعمة; the shadow blooms
  shot(43, "curse-gift", (ctx) => {
    const tN = wf(43, "نعمة");
    const sw = U.inv(tN - 0.05, tN + 0.25, ctx.t);
    theatre(ctx, { tint: sw > 0 ? 0xffe8b8 : 0xe8c8a8, hot: [0, 5, 16, 0.5 + 0.35 * sw], hotColor: 0xffd080 });
    cam(ctx, [[0, [0, 4.6, 15.5], [0, 4.6, 0], 38], [1, [0, 4.6, 14.8], [0, 4.6, 0], 38]]);
    pup(ctx, 0, "fear", "majesty", { whips: true }, 0.3);
    W.shadow(0, 0, -2.8, 0.02, 14, { opacity: 0.75 * (1 - sw) });
    motes(ctx, 70, 121, [-7, 7, 0, 9, 0.2, 1], [1, 0.85, 0.4], 0.5 * sw + 0.01);
    flash(ctx, "#ffd080", [tN], 0.22, 0.4);
    word(ctx, "نقمة", wf(43, "نقمة"), 960, 520, { size: 280, style: "red", t1: tN - 0.05 });
    word(ctx, "نعمة", tN, 960, 520, { size: 280, style: "gold" });
  });

  // ================================================================ STANZA 4: we are your mirrors
  const roadTex = () => MV.shapeTex("road", 256, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, "rgba(255,236,200,0)"); grd.addColorStop(0.2, "rgba(255,236,200,0.5)"); grd.addColorStop(0.8, "rgba(255,236,200,0.5)"); grd.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  const DAY = (ctx, o = {}) => desert(ctx, Object.assign({ sky: ["night", "dawn", 0.8], sand: 0xd8b498, moon: false, duneTint: 0xfff0e0 }, o));

  // 45 قف هاهنا في طريق صبيتنا — boys walk the road; the Sultan steps into their path
  shot(44, "roadblock", (ctx) => {
    DAY(ctx);
    cam(ctx, [[0, [0, 2.8, 15], [0, 2.6, 0], 38], [1, [0.6, 2.7, 13.8], [0.6, 2.6, 0], 38]]);
    W.sprite(roadTex(), 0, 0.02, -2, 60, 3.2, { rx: -Math.PI / 2, rot: Math.PI / 2, opacity: 0.35, order: -10 });
    const tQ = wf(44, "قف");
    pup(ctx, 1, "child", [{ b: 0, move: "walk" }, { b: bt(tQ + 0.3), pose: "face", x: 1 }], {}, 0.3);
    const adv = U.lerp(-1.5, 0, U.ease.outCubic(U.inv(L[44].s - 0.1, tQ + 0.6, ctx.t)));
    for (let i = 0; i < 5; i++) W.puppet(1, -6.6 + i * 1.9 + adv, 0, 1.2, 6.0 * (1 - i * 0.03));
    const x = U.lerp(9, 4.4, U.ease.outBack(U.inv(tQ - 0.3, tQ + 0.4, ctx.t)));
    pup(ctx, 0, "fear", "stopPalm", { age: 0.8, crownTilt: -8 }, 0.3);
    W.groundShadow(0, x, 0.8, 7, 1.2, { flip: true });
    W.puppet(0, x, 0, 0.8, 7, { flip: true });
    word(ctx, "صبيتنا", wf(44, "صبيتنا"), 700, 170, { size: 170, style: "gold" });
  });

  // 46 والبس لهم زي قيصر أو شاه — Caesar's laurel and cape, then the Blender Shah crown
  shot(45, "costumes", (ctx) => {
    DAY(ctx);
    const tC = wf(45, "قيصر"), tS = wf(45, "شاه");
    ctx.punch = 1.0 * U.eventPulse(ctx.t, [tC + 0.05, tS + 0.05], 0.4);
    cam(ctx, [[0, [0.3, 4.2, 11], [0.3, 4.2, 0], 38], [1, [0.3, 4.4, 10.2], [0.3, 4.4, 0], 38]]);
    const st = ctx.t < tC ? 0 : ctx.t < tS ? 1 : 2;
    const ag = U.lerp(0.8, 0.5, U.ease.inOutSine(U.inv(tC - 0.1, tC + 0.5, ctx.t)));
    pup(ctx, 0, "fear", [{ b: 0, pose: "neutral" }, { b: bt(tC - 0.1), pose: "majesty", x: 0.6 }], st === 0 ? { age: ag, tatter: true, crownTilt: -8 } : st === 1 ? { age: ag, crown: "laurel", cape: true } : { age: ag, crown: "none", cape: true }, 0.4);
    const x = 0, h = 8;
    W.groundShadow(0, x, 1, h, 1.1);
    W.puppet(0, x, 0, 1, h);
    if (st === 2) {
      const p = jw(0, "neckTop", x, 0, h);
      W.atlas("crown", W.loopFrame("crown", ctx.t, 0.6), p[0] + 0.15, p[1] + 1.55, 1.05, 1.6, { order: 6 });
    }
    flash(ctx, "#ffd080", [tC, tS], 0.2, 0.35);
    if (st) for (let i = 0; i < 40; i++) {
      const tt = st === 1 ? tC : tS, k = U.clamp((ctx.t - tt) / 0.8);
      if (k >= 1) continue;
      const a = U.hash(i, 131) * U.TAU, r = k * 3;
      W.dot(x + Math.cos(a) * r, 5 + Math.sin(a) * r, 1.2, 1 - k, 0.85 * (1 - k), 0.5 * (1 - k));
    }
    word(ctx, "قيصر", tC, 470, 240, { size: 170, style: "gold" });
    word(ctx, "شاه", tS, 1450, 240, { size: 190, style: "gold" });
  });

  // 47 كي يعرفوا الخوف ما حقيقته — the boys look up at him (low angle)
  shot(46, "look-up", (ctx) => {
    DAY(ctx);
    cam(ctx, [[0, [-1.2, 0.8, 12.5], [0, 4.4, 0], 42], [1, [-1.0, 0.9, 12.0], [0, 4.8, 0], 42]]);
    pup(ctx, 0, "fear", [{ b: 0, move: "majesty" }], { age: 0.5, crown: "none", cape: true, whips: true }, 0.4);
    const x = 1.6, h = 8.5;
    W.groundShadow(0, x, -1.5, h, 1.1, { flip: true });
    W.puppet(0, x, 0, -1.5, h, { flip: true });
    const p = jw(0, "neckTop", x, 0, h, true);
    W.atlas("crown", W.loopFrame("crown", ctx.t, 0.6), p[0] - 0.15, p[1] + 1.5, -1.45, 1.7, { order: 6 });
    pup(ctx, 1, "child", { head: -24, lSh: -14, lEl: -10, rSh: 14, rEl: 10 }, {}, 0.2);
    for (let i = 0; i < 3; i++) W.puppet(1, -4.8 + i * 1.5, 0, 5.5 + i * 0.3, 4.2);
    word(ctx, "حقيقته", wf(46, "حقيقته"), 1460, 160, { size: 170, style: "gold" });
  });

  // 48 الأولى وما شره وما جدواه — split: his evil (red) | his use (gold: the mother's protective fear)
  shot(47, "evil-use", (ctx) => {
    theatre(ctx, { tint: 0xf0dcc0, hot: [0, 5, 15, 0.45] });
    cam(ctx, [[0, [0, 4.6, 15.8], [0, 4.6, 0], 38], [1, [0, 4.6, 15.2], [0, 4.6, 0], 38]]);
    pup(ctx, 0, "fear", [{ b: 0, move: "whip" }], { whips: true, age: 0.9, tatter: true }, 0.3);
    W.shadow(0, -3.8, 0.2, 0.02, 7, { opacity: 0.45 });
    W.puppet(0, -4.2, 0.4, 0.06, 7);
    pup(ctx, 3, "mother", "hold", {}, 0.3);
    pup(ctx, 4, "child", "face", {}, 0.2);
    W.puppet(3, 3.6, 0.4, 0.06, 7);
    W.puppet(4, 4.4, 0.4, 0.07, 6.0);
    ctx.overlay.unshift((O) => {
      const g = O.g;
      g.save();
      g.globalCompositeOperation = "multiply";
      g.fillStyle = "rgba(220,90,70,0.55)"; g.fillRect(0, 0, 960, 1080);
      g.globalCompositeOperation = "soft-light";
      g.fillStyle = "rgba(255,200,90,0.6)"; g.fillRect(960, 0, 960, 1080);
      g.restore();
    });
    word(ctx, "شره", wf(47, "شره"), 480, 170, { size: 190, style: "red" });
    word(ctx, "جدواه", wf(47, "جدواه"), 1440, 170, { size: 180, style: "gold" });
  });

  // 49 وانظر ملياً تدرك تغيرنا — he peers; the youth grows under his gaze
  shot(48, "we-changed", (ctx) => {
    DAY(ctx);
    cam(ctx, [[0, [0.4, 3.4, 13], [0.4, 3.2, 0], 38], [1, [0.4, 3.4, 11.4], [0.4, 3.2, 0], 38]]);
    pup(ctx, 0, "fear", "lookClose", { age: 0.85, crown: "none", tatter: true }, 0.3);
    W.groundShadow(0, 3.2, 1, 6.8, 1.2, { flip: true });
    W.puppet(0, 3.2, 0, 1, 6.8, { flip: true });
    const gk = U.ease.inOutSine(U.inv(wf(48, "تدرك") - 0.3, L[48].e + 0.2, ctx.t));
    pup(ctx, 1, "youth", "standUp", {}, 0.3);
    W.groundShadow(1, -1.4, 1.2, U.lerp(4.0, 7.0, gk), 1.2);
    W.puppet(1, -1.4, 0, 1.2, U.lerp(4.0, 7.0, gk));
    word(ctx, "تغيرنا", wf(48, "تغيرنا"), 960, 150, { size: 170, style: "gold" });
  });

  // 50 فربما تخدع الفتى عيناه — the image doubles and swims
  shot(49, "deceived", (ctx) => {
    DAY(ctx);
    cam(ctx, [[0, [0, 4.6, 8.0], [0, 4.4, 0], 38], [1, [0.3, 4.6, 7.4], [0.3, 4.4, 0], 38]]);
    pup(ctx, 0, "youth", "face", {}, 0.3);
    W.puppet(0, -0.6, 0, 0, 7.6);
    const amt = U.inv(L[49].s, wf(49, "تخدع") + 0.3, ctx.t);
    ctx.overlay.unshift((O, t) => {
      const g = O.g, dx = 40 * amt * Math.sin(t * 3.1), dy = 14 * amt * Math.sin(t * 2.3);
      g.save();
      g.globalAlpha = 0.38 * amt;
      g.filter = "blur(1.5px) hue-rotate(-18deg)";
      g.drawImage(O.gl, dx, dy);
      g.filter = "blur(1.5px) hue-rotate(18deg)";
      g.drawImage(O.gl, -dx * 0.7, -dy);
      g.filter = "none";
      g.restore();
    });
    word(ctx, "عيناه", wf(49, "عيناه"), 1450, 200, { size: 180, style: "silver" });
  });

  // 51 نحن مراياك إذ نشيب معاً — the biggest set: an arc of 11 tall mirrors held by the people, the
  // camera orbits; every mirror shows the old Sultan, each greyer than the last, and the people grey together
  shot(50, "mirror-arc", (ctx) => {
    DAY(ctx, { sky: ["night", "dawn", 0.6], sand: 0xb8a8c0 });
    const a = U.lerp(-0.42, 0.42, U.ease.inOutSine(ctx.k));
    const R = 14.5;
    W.cam([Math.sin(a) * R, 3.4, 1.5 + Math.cos(a) * R], [0, 3.1, -0.5], 40);
    pup(ctx, 0, "fear", "tired", { age: 1, crown: "none", tatter: true }, 0.3);
    W.groundShadow(0, 0, 3.2, 5.8, 1.2);
    W.puppet(0, 0, 0, 3.2, 5.8, { order: 9 });
    const grey = U.inv(L[50].s, L[50].e + 0.3, ctx.t);
    pup(ctx, 1, "youth", "offer", { grey }, 0.3);
    const N = 11;
    for (let i = 0; i < N; i++) {
      const th = U.lerp(-1.3, 1.3, i / (N - 1));
      const x = Math.sin(th) * 7.6, z = 3.2 - Math.cos(th) * 7.6;
      const gk = i / (N - 1);
      const yaw = U.clamp(-(th - a) * 50, -70, 70);
      W.mirror("arc" + i, yaw, x, 0, z, 6.2, (g, w, h) => {
        g.filter = `grayscale(${gk.toFixed(2)}) brightness(${(1 - 0.3 * gk).toFixed(2)})`;
        reflect(0, { s: 0.4, top: 0.24, focusY: 230 })(g, w, h);
        g.filter = "none";
      }, { bottom: true, order: 4 });
      W.puppet(1, x + 1.9 * Math.cos(th), 0, z - 0.2, 4.4, { order: 3, flip: th > 0 });
    }
    word(ctx, "مراياك", wf(50, "مراياك"), 960, 130, { size: 170, style: "silver" });
  });

  // 52 وقد يشيب الإنسان رغم صباه — a boy whose hair turns white
  shot(51, "grey-youth", (ctx) => {
    DAY(ctx, { sky: ["night", "dawn", 0.6], sand: 0xb8a8c0 });
    cam(ctx, [[0, [0, 3.7, 8.0], [0, 3.6, 0], 38], [1, [0, 3.8, 7.4], [0, 3.7, 0], 38]]);
    const grey = U.ease.inOutSine(U.inv(L[51].s, wf(51, "صباه") + 0.3, ctx.t));
    pup(ctx, 0, "child", "face", { grey }, 0.25);
    W.puppet(0, 0.2, 0, 0, 11);
    motes(ctx, 40, 141, [-1.5, 1.5, 3, 8.5, 0.3, 0.6], [1, 1, 1], 0.4, true);
    word(ctx, "صباه", wf(51, "صباه"), 1450, 200, { size: 180, style: "bone" });
  });

  // 53 نحن مراياك هل ترى أحداً — the mirrors turn one after another to face him: nobody in them
  shot(52, "mirrors-turn", (ctx) => {
    DAY(ctx, { sky: ["night", "abyss", 0.3], sand: 0x9a90b8 });
    const a = (ctx.k - 0.5) * 0.5;
    cam(ctx, [[0, [Math.sin(a) * 15, 3.6, 3 + Math.cos(a) * 12], [0, 2.8, 0], 40], [1, [Math.sin(a) * 15, 3.6, 3 + Math.cos(a) * 12], [0, 2.8, 0], 40]]);
    pup(ctx, 0, "fear", "lookClose", { age: 1, crown: "none", tatter: true }, 0.2);
    W.groundShadow(0, 0, 3, 5.6, 1.1);
    W.puppet(0, 0, 0, 3, 5.6, { order: 7 });
    for (let i = 0; i < 5; i++) {
      const th = Math.PI * (0.15 + 0.175 * i);
      const x = -Math.cos(th) * 7, z = -Math.sin(th) * 4.5;
      const k = U.ease.outBack(U.inv(L[52].s + i * 0.3, L[52].s + i * 0.3 + 0.6, ctx.t));
      W.mirror("turn" + i, U.lerp(80, -Math.cos(th) * 25, k), x, 0, z, 4.8, (g, w, h) => {
        const grd = g.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, "#0b1030"); grd.addColorStop(1, "#3a4070");
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
      }, { bottom: true, order: 3 });
    }
    word(ctx, "أحداً", wf(52, "أحدا"), 960, 130, { size: 170, style: "silver" });
  });

  // 54 فيها سوى هوة بحجم فلاة — dive into a mirror: an endless desert abyss
  const abyss = (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#020309"); grd.addColorStop(0.62, "#1a2050"); grd.addColorStop(0.64, "#2a2440"); grd.addColorStop(1, "#05040c");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 80; i++) { g.globalAlpha = 0.3 + U.hash(i, 1) * 0.7; g.fillRect(U.hash(i, 2) * w, U.hash(i, 3) * h * 0.6, 1.6, 1.6); }
    g.globalAlpha = 1;
  };
  shot(53, "abyss", (ctx) => {
    const dive = U.ease.inCubic(U.inv(L[53].s - 0.1, L[53].s + 1.2, ctx.t));
    if (dive < 1) {
      DAY(ctx, { sky: ["night", "abyss", 0.5], sand: 0x9a90b8 });
      W.mirror("dive", 0, 0, 0, 5, 7.2, abyss, { bottom: true, order: 3 });
      cam(ctx, [[0, [0, 3.4, 14], [0, 3.4, 5], 38], [1, [0, 3.4, 14], [0, 3.4, 5], 38]]);
      W.cam([0, 3.4, U.lerp(14, 5.6, dive)], [0, 3.4, 0], U.lerp(38, 60, dive * dive));
    } else {
      desert(ctx, { sky: "abyss", sand: 0x524c78, moon: false, duneTint: 0x8a8ab0 });
      const f = ctx.t - (L[53].s + 1.2);
      W.cam([0, 2.6, 10 - f * 2.2], [0, 2.2, -20 - f * 2.2], 44);
      pup(ctx, 0, "fear", "tired", { age: 1, crown: "none", tatter: true }, 0.3);
      W.puppet(0, 0.6, 0, -24, 2.4, { opacity: 0.9 });
      motes(ctx, 120, 151, [-20, 20, 2, 16, -40, -10], [0.8, 0.85, 1], 0.05);
    }
    ctx.post.lift = 0.5;
    word(ctx, "فلاة", wf(53, "فلاة"), 960, 160, { size: 200, style: "silver" });
  });

  // 55 إنا وإياك هالكون معاً — he and the people walk into the desert together and dissolve
  shot(54, "perish", (ctx) => {
    desert(ctx, { sky: ["abyss", "dawn", U.inv(L[54].s, L[54].e + 1, ctx.t) * 0.6], sand: 0x8a7a90, moon: false, duneTint: 0xc8c0e0 });
    cam(ctx, [[0, [0, 2.8, 9], [0, 2.4, -6], 40], [1, [0, 3.4, 13], [0, 2.4, -6], 40]]);
    const go = U.inv(L[54].s, L[54].e + 0.4, ctx.t);
    pup(ctx, 0, "fear", [{ b: 0, move: "walk" }], { age: 1, crown: "none", tatter: true }, 0.3);
    pup(ctx, 1, "youth", [{ b: 0.5, move: "walk" }], {}, 0.3);
    const z0 = -2 - go * 6, fade = U.inv(wf(54, "هالكون"), L[54].e + 0.4, ctx.t);
    W.puppet(0, 0.4, 0, z0, 5, { flip: false, opacity: 1 - fade * 0.9 });
    [-3.6, -2.0, 2.2, 3.8].forEach((x, i) => W.puppet(1, x, 0, z0 + 0.3 * i, 4.3, { opacity: 1 - fade * 0.9 }));
    for (let i = 0; i < 140; i++) {
      const st = fade * 1.3 - U.hash(i, 161) * 0.3;
      if (st <= 0 || st > 1) continue;
      W.dot(-4 + U.hash(i, 162) * 8.4 + st * 2, 0.5 + U.hash(i, 163) * 4.5 + st, z0, 1 * (1 - st), 0.85 * (1 - st), 0.65 * (1 - st));
    }
    ctx.post.lift = 0.45;
    word(ctx, "معاً", wf(54, "معا"), 960, 150, { size: 200, style: "gold" });
  });

  // 56 يا خوف حدق في هذه المرآة — finale: on «حدق» we push in over his shoulder until the glass holds
  // his own old face, eye to eye; on «المرآة» the glass fills with lantern light and his shadow peels
  // off the sand, stands up and walks into the light without him. Held to the end of the music.
  shot(55, "finale", (ctx) => {
    const tH = wf(55, "حدق"), tM = wf(55, "المرآة");
    const push = U.ease.inOutCubic(U.inv(tH - 0.1, tH + 1.1, ctx.t));
    const light = U.ease.inOutSine(U.inv(tM + 0.05, tM + 1.3, ctx.t));
    const peel = U.ease.inOutSine(U.inv(tM - 0.05, tM + 0.6, ctx.t));
    const walk = U.ease.inOutSine(U.inv(tM + 0.45, FINALE_END - 0.15, ctx.t));
    desert(ctx, { sky: ["night", "dawn", 0.3 + 0.4 * light], sand: 0xa898b0, moon: false, duneTint: 0xffeedd });
    const mx = 1.3, mz = 2.2, mh = 6.4, hx = -2.2, hz = 3.0;
    const pull = U.ease.inOutSine(U.inv(tM - 0.1, tM + 0.9, ctx.t));
    const camP = U.mix(U.mix([0.0, 3.4, 13.2], [-0.3, 4.5, 8.6], push), [-0.2, 3.7, 11.6], pull);
    const camL = U.mix(U.mix([0.0, 3.3, 2.2], [-0.3, 4.5, 2.2], push), [-0.2, 3.4, 2.2], pull);
    W.cam(camP, camL, U.lerp(38, 34, push * (1 - pull)) + 0 * pull);
    pup(ctx, 0, "fear", [{ b: 0, pose: "tired" }, { b: bt(tH), pose: "lookClose", x: 1 }], { age: 1, crown: "none", tatter: true }, 0.2);
    // the face in the puppet canvas (from the solved joints), so the mirror can frame it exactly
    const J = W.slots[0].joints, hp = ctx.heroPose;
    let fx = 420, fy = 420;
    if (J && hp) {
      const an = ((J.torsoA + hp.head + 12) * Math.PI) / 180, lx = 26, ly = -125;
      fx = J.neckTop[0] + lx * Math.cos(an) - ly * Math.sin(an);
      fy = J.neckTop[1] + lx * Math.sin(an) + ly * Math.cos(an);
    }
    W.puppet(0, hx, 0, hz, 6.2, { order: 7 });
    W.mirror("final", -8, mx, 0, mz, mh, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#1a2050"); grd.addColorStop(1, "#4a5288");
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      // his reflection, scaled up to the face as we push in
      reflect(0, { s: U.lerp(0.42, 1.0, push), top: U.lerp(0.26, 0.32, push), focusY: U.lerp(200, fy, push), focusX: U.lerp(360, fx, push), alpha: 1 - 0.85 * light })(g, w, h);
      if (light > 0) {
        g.globalAlpha = light;
        const lg = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, h * 0.65);
        lg.addColorStop(0, "#fff0cc"); lg.addColorStop(0.45, "#ffc870"); lg.addColorStop(1, "#b8702e");
        g.fillStyle = lg; g.fillRect(0, 0, w, h);
        W.drawAtlas(g, "lantern", W.loopFrame("lantern", ctx.t, 0.5), w * 0.36, h * 0.2, w * 0.28, h * 0.36);
        g.globalAlpha = 1;
      }
    }, { bottom: true, order: 5 });
    // his shadow: first lying on the sand, then it peels up and walks into the light (slot 2 walks)
    pup(ctx, 2, "fear", walk > 0 ? [{ b: 0, move: "walk" }] : "lookClose", { age: 1, crown: "none", tatter: true }, 0.2);
    if (peel <= 0) W.groundShadow(0, hx, hz - 0.05, 6.2, 1.3, { opacity: 0.6 });
    else {
      const sx = U.lerp(hx + 0.9, mx, walk), sz = U.lerp(hz - 0.15, mz + 0.06, walk);
      W.shadow(2, sx, 0.02, sz, 6.2 * (1 - 0.3 * walk), { rx: (-Math.PI / 2) * (1 - peel), opacity: 0.9 * (1 - 0.9 * U.inv(0.75, 1, walk)), color: 0x0b0a20, order: 6 });
    }
    W.glow(mx, 3.2, mz + 0.1, 10 * light + 0.01, 0xffc070, 0.5 * light, 8);
    motes(ctx, 40, 171, [mx - 2.5, mx + 2.5, 0.5, 6, mz + 0.2, mz + 0.6], [1, 0.8, 0.45], 0.4 * light + 0.01);
    word(ctx, "المرآة", tM, 560, 170, { size: 190, style: "gold" });
  });

  // 57 title card (music outro + 1.0 s tail): SVG arch + rosette (anime.js), «الخوف», the poet
  SH.push({ i: 56, name: "title", t0: FINALE_END, t1: U.TOTAL, apply: (ctx) => {
    desert(ctx, { sky: "dawn", sand: 0xd8b498, moon: false, duneTint: 0xfff0e0 });
    const k = U.clamp((ctx.t - FINALE_END) / (U.TOTAL - FINALE_END));
    W.cam([0, 3.0, 16 - k * 1.5], [0, 3.6, 0], 38);
    W.atlas("lantern", W.loopFrame("lantern", ctx.t, 0.5), 0, 8.2, 0, 1.8, { order: 6 });
    W.glow(0, 8.0, 0.05, 4, 0xffb050, 0.6, 7);
    ctx.post.lift = 0.3;
    const a = U.inv(FINALE_END + 0.8, FINALE_END + 1.6, ctx.t);
    ctx.overlay.push((O, t) => {
      const g = O.g;
      g.save();
      g.globalAlpha = 0.45 * a;
      g.fillStyle = "#0b0703";
      g.beginPath(); // (draft 1 had no beginPath here: the previous frame's plate ellipse got filled too)
      MV.archPath(g, 960, 1010, 375, 360, 0.34);
      g.fill();
      g.restore();
      O.word("الخوف", 960, 520, { t, t0: FINALE_END + 1.0, size: 230, style: "gold", plate: false });
      O.text("تميم البرغوثي", 960, 760, { font: "700 70px Amiri", rtl: true, color: "#f3ead8", alpha: U.inv(FINALE_END + 1.8, FINALE_END + 2.4, t), glow: "rgba(0,0,0,0.6)" });
      O.text("AL-KHAWF (FEAR)  ·  TAMIM AL-BARGHOUTI", 960, 850, { font: "400 28px Amiri", color: "#e0aa4a", tracking: "3px", alpha: U.inv(FINALE_END + 2.4, FINALE_END + 3.0, t) });
      O.text("a shadow-play motion graphics video, made entirely with code", 960, 895, { font: "400 26px Amiri", color: "#f3ead8", alpha: 0.8 * U.inv(FINALE_END + 2.8, FINALE_END + 3.4, t) });
    });
  } });

})();
