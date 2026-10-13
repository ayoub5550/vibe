// jester.js — the 2D hero: a harlequin Jack drawn as a jointed paper puppet on Canvas 2D.
// The pose is pure data (angles in degrees). Every frame: pose = f(time) -> drawJester(canvas, pose).
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const D = Math.PI / 180;

  // canvas + skeleton dimensions (px). Ground line is GY.
  const CW = 720, CH = 1180, GY = 1150, CX = CW / 2;
  const L = {
    thigh: 205, shin: 196, upper: 138, fore: 128,
    spine: 236, shoulder: 72, hip: 38, neck: 20, headW: 54, headH: 64,
  };
  MV.JESTER_CANVAS = { w: CW, h: CH, groundY: GY };

  // limb direction: angle 0 = straight down, +90 = screen right
  const dir = (a) => [Math.sin(a * D), Math.cos(a * D)];

  // ------------------------------------------------------------------ poses
  const NEUTRAL = {
    torso: 0, shift: 0, head: 0, air: 0, squash: 0, spin: 1,
    lSh: -14, lEl: -10, rSh: 14, rEl: 10,
    lHip: -5, lKnee: 3, rHip: 5, rKnee: -3,
    lHand: "open", rHand: "open", mouth: 0, eyes: 1,
  };
  // l* = character's screen-left limbs. Arms: negative = out to the left. Legs: same convention.
  const POSES = {
    neutral: {},
    bounceDown: { lHip: -22, lKnee: 34, rHip: 22, rKnee: -34, lSh: -26, lEl: -46, rSh: 26, rEl: 46, head: 5, squash: 0.03 },
    bounceUp: { lHip: -6, lKnee: 4, rHip: 6, rKnee: -4, lSh: -18, lEl: -60, rSh: 18, rEl: 60, head: -3 },
    stepL: { shift: -46, lHip: -28, lKnee: 6, rHip: 2, rKnee: -14, torso: -5, lSh: -70, lEl: -30, rSh: 30, rEl: 80 },
    stepR: { shift: 46, lHip: -2, lKnee: 14, rHip: 28, rKnee: -6, torso: 5, lSh: -30, lEl: -80, rSh: 70, rEl: 30 },
    vUp: { lSh: -150, lEl: -10, rSh: 150, rEl: 10, lHip: -12, lKnee: 0, rHip: 12, rKnee: 0, head: -8, lHand: "open", rHand: "open" },
    pointUpR: { rSh: 172, rEl: 0, lSh: -35, lEl: -115, torso: 6, rHand: "point", head: -10, lHip: -10, rHip: 8, rKnee: -10 },
    pointUpL: { lSh: -172, lEl: 0, rSh: 35, rEl: 115, torso: -6, lHand: "point", head: 10, lHip: -8, lKnee: 10, rHip: 10 },
    pointOutR: { rSh: 95, rEl: 0, lSh: -30, lEl: -110, torso: 8, rHand: "point", shift: 20, rHip: 22, lHip: -6, lKnee: 18 },
    pointOutL: { lSh: -95, lEl: 0, rSh: 30, rEl: 110, torso: -8, lHand: "point", shift: -20, lHip: -22, rHip: 6, rKnee: -18 },
    frame: { lSh: -120, lEl: -120, rSh: 120, rEl: 120, head: 0, lHip: -14, lKnee: 18, rHip: 14, rKnee: -18 },
    mirrorTouchR: { rSh: 75, rEl: 75, lSh: -20, lEl: -30, head: 12, torso: 4, rHand: "open", lHip: -6, rHip: 6 },
    hips: { lSh: -40, lEl: -105, rSh: 40, rEl: 105, lHand: "fist", rHand: "fist", lHip: -12, rHip: 12, head: -4 },
    crossArms: { lSh: -20, lEl: -125, rSh: 20, rEl: 125, lHand: "fist", rHand: "fist", lHip: -9, rHip: 9, head: 6 },
    shrug: { lSh: -55, lEl: 70, rSh: 55, rEl: -70, head: 14, torso: 0, lHip: -6, rHip: 6 },
    pray: { lSh: -14, lEl: 146, rSh: 14, rEl: -146, head: 18, lHip: -10, lKnee: 12, rHip: 10, rKnee: -12, squash: 0.03, lHand: "open", rHand: "open" },
    kneelTouch: { rSh: 24, rEl: 4, lSh: -48, lEl: -36, head: 24, torso: 16, lHip: -34, lKnee: 78, rHip: 30, rKnee: -82, rHand: "open" },
    bow: { lSh: -60, lEl: 20, rSh: 60, rEl: -20, head: 26, squash: 0.12, lHip: -8, rHip: 8 },
    runA: { lHip: 28, lKnee: -60, rHip: -10, rKnee: 30, lSh: 40, lEl: 80, rSh: -50, rEl: -90, torso: 4, air: 18 },
    runB: { lHip: -10, lKnee: 30, rHip: -28, rKnee: 60, lSh: -50, lEl: -90, rSh: 40, rEl: 80, torso: -4, air: 18 },
    star: { lSh: -125, lEl: 0, rSh: 125, rEl: 0, lHip: -38, lKnee: 0, rHip: 38, rKnee: 0, air: 90, head: -6 },
    kickR: { rHip: 100, rKnee: -10, lHip: -4, lKnee: 6, lSh: -120, lEl: -20, rSh: 60, rEl: 30, torso: -10, shift: -10 },
    kickL: { lHip: -100, lKnee: 10, rHip: 4, rKnee: -6, rSh: 120, rEl: 20, lSh: -60, lEl: -30, torso: 10, shift: 10 },
    strikeR: { rSh: 135, rEl: 0, lSh: -45, lEl: 0, torso: 10, head: -12, rHip: 30, rKnee: 0, lHip: -10, lKnee: 20, shift: 30 },
    strikeL: { lSh: -135, lEl: 0, rSh: 45, rEl: 0, torso: -10, head: 12, lHip: -30, lKnee: 0, rHip: 10, rKnee: -20, shift: -30 },
    puppet: { lSh: -100, lEl: 80, rSh: 100, rEl: -80, head: 20, lHip: -10, lKnee: 30, rHip: 10, rKnee: -30, lHand: "limp", rHand: "limp", air: 30 },
    puppetB: { lSh: -130, lEl: 60, rSh: 70, rEl: -100, head: -16, lHip: -24, lKnee: 10, rHip: 2, rKnee: -40, lHand: "limp", rHand: "limp", air: 46 },
    grip: { lSh: -150, lEl: 30, rSh: 150, rEl: -30, head: 4, lHand: "fist", rHand: "fist", lHip: -8, rHip: 8 },
    fall: { lSh: -100, lEl: -20, rSh: 120, rEl: 40, torso: -18, head: 30, lHip: -40, lKnee: 70, rHip: 30, rKnee: -80 },
    count1: { rSh: 150, rEl: 10, rHand: "point", lSh: -30, lEl: -100, lHand: "fist", lHip: -10, lKnee: 14, rHip: 10, rKnee: -14 },
    count2: { rSh: 120, rEl: 40, rHand: "point", lSh: -30, lEl: -100, lHand: "fist", lHip: -14, lKnee: 24, rHip: 14, rKnee: -24, head: 6 },
    tall: { lSh: -165, lEl: -5, rSh: 165, rEl: 5, lHip: -3, rHip: 3, head: -14, lHand: "fist", rHand: "fist" },
    lookUp: { head: -24, lSh: -20, lEl: -20, rSh: 20, rEl: 20 },
    touch: { rSh: 90, rEl: 6, rHand: "open", lSh: -22, lEl: -34, head: 9, torso: 4, shift: 10, lHip: -8, rHip: 10, rKnee: -6 },
    wipe: { rSh: 100, rEl: 110, lSh: -100, lEl: -110, head: 0, lHip: -16, lKnee: 18, rHip: 16, rKnee: -18 },
  };
  MV.POSES = POSES;
  const full = (name) => Object.assign({}, NEUTRAL, POSES[name] || {});
  MV.pose = full;

  function lerpPose(a, b, k) {
    const o = {};
    for (const key in NEUTRAL) {
      const va = a[key], vb = b[key];
      o[key] = typeof va === "number" ? va + (vb - va) * k : k < 0.5 ? va : vb;
    }
    return o;
  }
  MV.lerpPose = lerpPose;

  // A move = list of [beatOffset, poseName, ease]; the move loops every `len` beats.
  const MOVES = {
    groove: { len: 2, keys: [[0, "bounceDown", "outCubic"], [1, "bounceUp", "inOutQuad"]] },
    step: { len: 4, keys: [[0, "stepL", "outCubic"], [1, "bounceDown", "inOutQuad"], [2, "stepR", "outCubic"], [3, "bounceDown", "inOutQuad"]] },
    wave: { len: 4, keys: [[0, "pointOutL", "outBack"], [1, "frame", "outCubic"], [2, "pointOutR", "outBack"], [3, "vUp", "outCubic"]] },
    hype: { len: 4, keys: [[0, "pointUpR", "outBack"], [1, "bounceDown", "outCubic"], [2, "pointUpL", "outBack"], [3, "bounceDown", "outCubic"]] },
    strike: { len: 4, keys: [[0, "strikeR", "outExpo"], [1, "hips", "outCubic"], [2, "strikeL", "outExpo"], [3, "crossArms", "outCubic"]] },
    run: { len: 2, smooth: true, keys: [[0, "runA", "inOutSine"], [1, "runB", "inOutSine"]] }, // one stride per beat, continuous
    count: { len: 1, keys: [[0, "count1", "outBack"], [0.5, "count2", "inOutQuad"]] },
    kicks: { len: 4, keys: [[0, "kickR", "outExpo"], [1, "bounceDown", "outCubic"], [2, "kickL", "outExpo"], [3, "bounceDown", "outCubic"]] },
    puppet: { len: 2, keys: [[0, "puppet", "outElastic"], [1, "puppetB", "outElastic"]] },
    frameMirror: { len: 4, keys: [[0, "frame", "outBack"], [1, "mirrorTouchR", "outCubic"], [2, "frame", "outBack"], [3, "wipe", "outCubic"]] },
    cool: { len: 4, keys: [[0, "crossArms", "outCubic"], [2, "hips", "outCubic"]] },
  };
  MV.MOVES = MOVES;

  // Dance timing (critic fix): a move hits its key pose ON the key beat. The transition starts
  // PRE beats early and settles POST beats after, with anticipation + overshoot (inOutBack), i.e.
  // about 3-5 frames of in-betweens at 150 BPM. Draft 1 started at the beat with outExpo and
  // jumped in 1-2 frames, which read as robotic semaphore.
  const PRE = 0.3, POST = 0.22;
  function moveAt(name, beatInMove) {
    const m = MOVES[name];
    const len = m.len, keys = m.keys, n = keys.length;
    const ph = ((beatInMove % len) + len) % len;
    if (m.smooth) {
      // cyclic motion (run): continuous sine interpolation between keys, no holds
      let i = n - 1;
      for (let j = 0; j < n; j++) if (keys[j][0] <= ph) i = j;
      const a = keys[i], b = keys[(i + 1) % n];
      const tB = i + 1 < n ? b[0] : len + keys[0][0];
      const k = U.clamp((ph - a[0]) / Math.max(1e-6, tB - a[0]));
      return lerpPose(full(a[1]), full(b[1]), U.ease.inOutSine(k));
    }
    const wrap = (d) => ((((d + len / 2) % len) + len) % len) - len / 2; // signed distance in (-len/2, len/2]
    for (let j = 0; j < n; j++) {
      const kt = keys[j][0];
      const prev = keys[(j - 1 + n) % n];
      const seg = ((kt - prev[0]) % len + len) % len || len;
      const pre = Math.min(PRE, seg * 0.45), post = Math.min(POST, seg * 0.3);
      const d = wrap(ph - kt);
      if (d >= -pre && d <= post) {
        const k = (d + pre) / (pre + post);
        const ease = keys[j][2] === "outElastic" ? U.ease.outElastic : U.ease.inOutBack;
        return lerpPose(full(prev[1]), full(keys[j][1]), ease(k));
      }
    }
    // hold the latest key at or before ph
    let best = n - 1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = ((ph - keys[j][0]) % len + len) % len;
      if (d < bestD) { bestD = d; best = j; }
    }
    return full(keys[best][1]);
  }

  // choreo = [{b: startBeat, move|pose, len?}] (sorted). Returns pose at absolute beat `beat`.
  MV.choreoPose = function (choreo, beat) {
    let idx = 0;
    for (let i = 0; i < choreo.length; i++) if (choreo[i].b <= beat) idx = i;
    const c = choreo[idx];
    const poseOf = (cc, bb) => (cc.move ? moveAt(cc.move, bb - cc.b) : full(cc.pose));
    let p = poseOf(c, beat);
    // crossfade from the previous entry over 0.6 beat (S-curve: no 2-frame body snaps)
    if (idx > 0) {
      const k = U.clamp((beat - c.b) / 0.6);
      if (k < 1) p = lerpPose(poseOf(choreo[idx - 1], beat), p, U.ease.inOutCubic(k));
    }
    return p;
  };

  // ------------------------------------------------------------------ drawing
  const pats = {};
  function diamondPattern(g, c1, c2, line) {
    const key = c1 + c2 + line;
    if (pats[key]) return pats[key];
    const s = 44;
    const c = MV.canvas(s, s), x = c.getContext("2d");
    x.fillStyle = c2;
    x.fillRect(0, 0, s, s);
    x.fillStyle = c1;
    x.beginPath();
    x.moveTo(s / 2, 0); x.lineTo(s, s / 2); x.lineTo(s / 2, s); x.lineTo(0, s / 2);
    x.closePath();
    x.fill();
    x.strokeStyle = line;
    x.lineWidth = 2;
    x.stroke();
    pats[key] = c;
    return c;
  }
  function setPattern(g, pal, which, ang, ox, oy) {
    const c = which === "red" ? diamondPattern(g, pal.red, pal.redDeep, pal.gold) : diamondPattern(g, pal.blue, pal.blueDeep, pal.gold);
    const p = g.createPattern(c, "repeat");
    const m = new DOMMatrix();
    m.translateSelf(ox, oy);
    m.rotateSelf(ang);
    p.setTransform(m);
    g.fillStyle = p;
  }

  // tapered limb segment from A to B with widths wa, wb
  function segPath(g, a, b, wa, wb) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    g.beginPath();
    g.moveTo(a[0] + nx * wa / 2, a[1] + ny * wa / 2);
    g.lineTo(b[0] + nx * wb / 2, b[1] + ny * wb / 2);
    g.arc(b[0], b[1], wb / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, false);
    g.lineTo(a[0] - nx * wa / 2, a[1] - ny * wa / 2);
    g.arc(a[0], a[1], wa / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, false);
    g.closePath();
  }
  function limb(g, pal, a, b, wa, wb, which) {
    segPath(g, a, b, wa, wb);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) / D;
    setPattern(g, pal, which, ang + 45, a[0], a[1]);
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = pal.ink;
    g.stroke();
  }
  function cuff(g, pal, a, b, w) {
    // gold band at point b, perpendicular to a->b
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const c0 = [b[0] - ux * 10, b[1] - uy * 10];
    g.beginPath();
    g.moveTo(c0[0] + nx * w / 2, c0[1] + ny * w / 2);
    g.lineTo(b[0] + nx * w / 2 + ux * 4, b[1] + ny * w / 2 + uy * 4);
    g.lineTo(b[0] - nx * w / 2 + ux * 4, b[1] - ny * w / 2 + uy * 4);
    g.lineTo(c0[0] - nx * w / 2, c0[1] - ny * w / 2);
    g.closePath();
    g.fillStyle = pal.gold;
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = pal.ink;
    g.stroke();
  }
  function hand(g, pal, wrist, ang, type, side) {
    g.save();
    g.translate(wrist[0], wrist[1]);
    g.rotate(ang);
    g.fillStyle = pal.skin;
    g.strokeStyle = pal.ink;
    g.lineWidth = 4.5;
    if (type === "point") {
      // fist + long index finger along the limb direction (+y in local space)
      g.beginPath();
      g.ellipse(0, 18, 19, 21, 0, 0, U.TAU);
      g.fill(); g.stroke();
      MV.roundRect(g, -6, 26, 12, 40, 6);
      g.fill(); g.stroke();
    } else if (type === "fist") {
      g.beginPath();
      g.ellipse(0, 18, 20, 20, 0, 0, U.TAU);
      g.fill(); g.stroke();
    } else {
      // open glove: palm + 4 fingers + thumb
      g.beginPath();
      g.ellipse(0, 20, 20, 22, 0, 0, U.TAU);
      g.fill(); g.stroke();
      const spread = type === "limp" ? 0.12 : 0.28;
      for (let i = -1.5; i <= 1.5; i += 1) {
        g.save();
        g.translate(i * 8, 34);
        g.rotate(i * spread);
        MV.roundRect(g, -5, 0, 10, 26, 5);
        g.fill(); g.stroke();
        g.restore();
      }
      g.save();
      g.translate(side * 16, 18);
      g.rotate(side * -0.9);
      MV.roundRect(g, -5, 0, 10, 20, 5);
      g.fill(); g.stroke();
      g.restore();
    }
    g.restore();
  }
  function shoe(g, pal, ankle, side, which) {
    g.save();
    g.translate(ankle[0], ankle[1]);
    g.beginPath();
    g.moveTo(-16 * side, -8);
    g.quadraticCurveTo(-18 * side, 24, 10 * side, 24);
    g.quadraticCurveTo(52 * side, 24, 74 * side, -8);
    g.quadraticCurveTo(54 * side, 2, 30 * side, -6);
    g.quadraticCurveTo(10 * side, -14, -16 * side, -8);
    g.closePath();
    g.fillStyle = which === "red" ? pal.red : pal.blue;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = pal.ink;
    g.stroke();
    g.beginPath();
    g.arc(76 * side, -10, 8, 0, U.TAU);
    g.fillStyle = pal.gold;
    g.fill();
    g.lineWidth = 3.5;
    g.stroke();
    g.restore();
  }

  function headDraw(g, pal, neckTop, ang, pose, t) {
    g.save();
    g.translate(neckTop[0], neckTop[1]);
    g.rotate(ang);
    const hy = -L.headH + 4;
    // hat horns behind head
    for (const sd of [-1, 1]) {
      g.beginPath();
      g.moveTo(-34 * sd, hy - 26);
      g.bezierCurveTo(-60 * sd, hy - 118, -150 * sd, hy - 120, -170 * sd, hy - 58);
      g.quadraticCurveTo(-108 * sd, hy - 74, -70 * sd, hy - 30);
      g.quadraticCurveTo(-50 * sd, hy - 14, -34 * sd, hy - 26);
      g.closePath();
      g.fillStyle = sd < 0 ? pal.blue : pal.red;
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = pal.ink;
      g.stroke();
      // bell
      const swing = Math.sin(t * 9 + sd) * 4;
      g.beginPath();
      g.arc(-174 * sd + swing, hy - 50, 15, 0, U.TAU);
      g.fillStyle = pal.gold;
      g.fill();
      g.lineWidth = 4;
      g.stroke();
      g.beginPath();
      g.arc(-174 * sd + swing, hy - 46, 4, 0, U.TAU);
      g.fillStyle = pal.ink;
      g.fill();
    }
    // centre point of the hat
    g.beginPath();
    g.moveTo(-30, hy - 30);
    g.quadraticCurveTo(0, hy - 140, 26, hy - 128);
    g.quadraticCurveTo(14, hy - 70, 30, hy - 30);
    g.closePath();
    g.fillStyle = pal.red;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = pal.ink;
    g.stroke();
    g.beginPath();
    g.arc(28, hy - 128, 13, 0, U.TAU);
    g.fillStyle = pal.gold;
    g.fill();
    g.lineWidth = 4;
    g.stroke();
    // face
    g.beginPath();
    g.ellipse(0, hy + 10, L.headW, L.headH, 0, 0, U.TAU);
    g.fillStyle = pal.skin;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = pal.ink;
    g.stroke();
    // hat band
    g.beginPath();
    g.moveTo(-52, hy - 18);
    g.quadraticCurveTo(0, hy - 46, 52, hy - 18);
    g.lineTo(50, hy - 2);
    g.quadraticCurveTo(0, hy - 28, -50, hy - 2);
    g.closePath();
    g.fillStyle = pal.gold;
    g.fill();
    g.lineWidth = 4;
    g.stroke();
    // eyes (blink on pose.eyes)
    const ey = hy + 6, eo = Math.max(0.08, pose.eyes);
    g.fillStyle = pal.ink;
    for (const sx of [-18, 18]) {
      g.beginPath();
      g.ellipse(sx, ey, 6.5, 9 * eo, 0, 0, U.TAU);
      g.fill();
    }
    // brows
    g.lineWidth = 4;
    g.strokeStyle = pal.ink;
    g.beginPath(); g.moveTo(-28, ey - 18); g.lineTo(-10, ey - 21); g.stroke();
    g.beginPath(); g.moveTo(10, ey - 21); g.lineTo(28, ey - 18); g.stroke();
    // diamond tear mark
    g.beginPath();
    g.moveTo(22, ey + 14); g.lineTo(28, ey + 24); g.lineTo(22, ey + 34); g.lineTo(16, ey + 24);
    g.closePath();
    g.fillStyle = pal.blue;
    g.fill();
    // cheeks
    g.fillStyle = "rgba(201,48,44,0.32)";
    g.beginPath(); g.arc(-30, ey + 26, 9, 0, U.TAU); g.fill();
    g.beginPath(); g.arc(30, ey + 26, 9, 0, U.TAU); g.fill();
    // mouth: lip-sync driven
    const mo = U.clamp(pose.mouth);
    g.fillStyle = pal.ink;
    g.beginPath();
    g.ellipse(0, ey + 36, 11 + mo * 3, 2.5 + mo * 11, 0, 0, U.TAU);
    g.fill();
    if (mo > 0.3) {
      g.fillStyle = "#b8322e";
      g.beginPath();
      g.ellipse(0, ey + 40 + mo * 3, 6, 2 + mo * 4, 0, 0, U.TAU);
      g.fill();
    }
    g.restore();
  }

  // compute joints in canvas px for a pose (feet planted on GY unless airborne)
  function solve(p) {
    // clamp: the left shin may point right by at most 12 deg (and mirrored), so legs never X-cross
    const lShin = Math.min(p.lHip + p.lKnee, 12), rShin = Math.max(p.rHip + p.rKnee, -12);
    p = Object.assign({}, p, { lKnee: lShin - p.lHip, rKnee: rShin - p.rHip });
    const torsoA = p.torso;
    const pelvis = [CX + p.shift, 0];
    const hipL = [pelvis[0] - L.hip, 0], hipR = [pelvis[0] + L.hip, 0];
    const kneeL = add(hipL, mul(dir(p.lHip), L.thigh)), kneeR = add(hipR, mul(dir(p.rHip), L.thigh));
    const ankL = add(kneeL, mul(dir(p.lHip + p.lKnee), L.shin)), ankR = add(kneeR, mul(dir(p.rHip + p.rKnee), L.shin));
    const low = Math.max(ankL[1], ankR[1]);
    const dy = GY - 22 - low - p.air;
    for (const v of [pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR]) v[1] += dy;
    const sq = 1 - p.squash;
    const up = dir(180 + torsoA);
    const chest = add(pelvis, mul(up, L.spine * sq));
    const side = [Math.cos(torsoA * D), -Math.sin(torsoA * D) * 0 + Math.sin(torsoA * D)];
    const shL = add(chest, mul([-side[0], -side[1]], L.shoulder));
    const shR = add(chest, mul(side, L.shoulder));
    const elL = add(shL, mul(dir(p.lSh + torsoA), L.upper)), elR = add(shR, mul(dir(p.rSh + torsoA), L.upper));
    const wrL = add(elL, mul(dir(p.lSh + p.lEl + torsoA), L.fore)), wrR = add(elR, mul(dir(p.rSh + p.rEl + torsoA), L.fore));
    const neckTop = add(chest, mul(up, L.neck));
    return { pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR, chest, shL, shR, elL, elR, wrL, wrR, neckTop, torsoA };
  }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s]; }

  MV.jesterJoints = solve;

  // Close-up insert for the finale (drawn big on the overlay): forearm from above, gold cuff and a
  // white cartoon glove pointing down. Local units at s = 1: wrist at (0, 0), fingertip at (0, 262).
  function glove(g, pal) {
    g.save();
    g.lineJoin = "round";
    g.lineCap = "round";
    g.strokeStyle = pal.ink;
    g.lineWidth = 6;
    g.fillStyle = pal.skin;
    // curled fingers (knuckle bumps), drawn first so the back of the hand overlaps them
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(14 + i * 22, 112 - i * 6, 21, 25, -0.15, 0, U.TAU);
      g.fill(); g.stroke();
    }
    // extended index finger
    MV.roundRect(g, -44, 70, 44, 192, 22);
    g.fill(); g.stroke();
    // back of the hand
    g.beginPath();
    g.moveTo(-52, 0);
    g.bezierCurveTo(-70, 40, -66, 92, -40, 118);
    g.lineTo(46, 112);
    g.bezierCurveTo(70, 80, 66, 30, 50, 0);
    g.closePath();
    g.fill(); g.stroke();
    // thumb folded across
    g.beginPath();
    g.ellipse(-46, 64, 18, 36, 0.5, 0, U.TAU);
    g.fill(); g.stroke();
    // stitching lines on the back of the glove
    g.lineWidth = 5;
    for (const x of [-18, 2, 22]) { g.beginPath(); g.moveTo(x, 22); g.lineTo(x * 1.05, 62); g.stroke(); }
    // soft shading on the far side
    g.globalAlpha = 0.12;
    g.fillStyle = pal.ink;
    g.beginPath();
    g.moveTo(50, 4); g.bezierCurveTo(66, 30, 70, 80, 46, 112); g.lineTo(34, 108); g.bezierCurveTo(52, 76, 50, 34, 38, 4);
    g.closePath(); g.fill();
    // fingernail-like highlight on the finger tip
    g.globalAlpha = 0.5;
    g.fillStyle = "#ffffff";
    MV.roundRect(g, -34, 214, 12, 34, 6); g.fill();
    g.restore();
  }
  MV.drawPointingArm = function (g, pal, x, yWrist, s) {
    g.save();
    g.translate(x, yWrist);
    g.scale(s, s);
    g.lineJoin = "round";
    g.lineCap = "round";
    const a = [-6, -900 / s], b = [0, -6];
    limb(g, pal, a, b, 150, 118, "red");
    cuff(g, pal, a, b, 136);
    glove(g, pal);
    g.restore();
  };

  // draw the full figure. pal = MV.P (red/blue hero) or MV.SHADOW (blue self)
  MV.drawJester = function (g, pose, pal, t = 0, opt = {}) {
    if (!opt.keep) g.clearRect(0, 0, CW, CH);
    const p = pose;
    const J = solve(p);
    g.save();
    // spin = horizontal scale (1 front, -1 mirrored); squash anchored to the ground
    g.translate(CX, GY);
    g.scale(p.spin, 1);
    g.translate(-CX, -GY);
    g.lineJoin = "round";
    g.lineCap = "round";
    const A = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;

    // legs (behind torso)
    limb(g, pal, J.hipL, J.kneeL, 62, 48, "red");
    limb(g, pal, J.kneeL, J.ankL, 48, 32, "red");
    limb(g, pal, J.hipR, J.kneeR, 62, 48, "blue");
    limb(g, pal, J.kneeR, J.ankR, 48, 32, "blue");
    cuff(g, pal, J.kneeL, J.ankL, 38);
    cuff(g, pal, J.kneeR, J.ankR, 38);
    shoe(g, pal, J.ankL, -1, "blue");
    shoe(g, pal, J.ankR, 1, "red");

    // torso: two halves with diamond pattern
    const sh = J.shL, sR = J.shR, c = J.chest, pe = J.pelvis;
    const waistL = [pe[0] - 52, pe[1] + 12], waistR = [pe[0] + 52, pe[1] + 12];
    const midTop = [c[0], c[1] - 6], midBot = [pe[0], pe[1] + 14];
    for (const half of ["L", "R"]) {
      g.beginPath();
      if (half === "L") { g.moveTo(midTop[0], midTop[1]); g.lineTo(sh[0], sh[1]); g.quadraticCurveTo(sh[0] + 12, (sh[1] + waistL[1]) / 2, waistL[0], waistL[1]); g.lineTo(midBot[0], midBot[1]); }
      else { g.moveTo(midTop[0], midTop[1]); g.lineTo(sR[0], sR[1]); g.quadraticCurveTo(sR[0] - 12, (sR[1] + waistR[1]) / 2, waistR[0], waistR[1]); g.lineTo(midBot[0], midBot[1]); }
      g.closePath();
      setPattern(g, pal, half === "L" ? "red" : "blue", 45 + J.torsoA, c[0], c[1]);
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = pal.ink;
      g.stroke();
    }
    // belt + buttons
    g.save();
    g.translate(pe[0], pe[1] - 6);
    g.rotate(J.torsoA * D);
    MV.roundRect(g, -58, -13, 116, 26, 6);
    g.fillStyle = pal.gold;
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = pal.ink;
    g.stroke();
    g.fillStyle = pal.ink;
    MV.roundRect(g, -12, -9, 24, 18, 4);
    g.fill();
    g.restore();
    for (let i = 1; i <= 3; i++) {
      const k = i / 4.2;
      const bx = U.lerp(midTop[0], pe[0], k), by = U.lerp(midTop[1], pe[1], k);
      g.beginPath();
      g.arc(bx, by, 7, 0, U.TAU);
      g.fillStyle = pal.gold;
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = pal.ink;
      g.stroke();
    }

    // arms
    limb(g, pal, J.shL, J.elL, 44, 36, "blue");
    limb(g, pal, J.elL, J.wrL, 36, 26, "blue");
    limb(g, pal, J.shR, J.elR, 44, 36, "red");
    limb(g, pal, J.elR, J.wrR, 36, 26, "red");
    cuff(g, pal, J.elL, J.wrL, 34);
    cuff(g, pal, J.elR, J.wrR, 34);
    hand(g, pal, J.wrL, A(J.elL, J.wrL), p.lHand, -1);
    hand(g, pal, J.wrR, A(J.elR, J.wrR), p.rHand, 1);
    // shoulder pads (gold diamonds)
    for (const s of [J.shL, J.shR]) {
      g.beginPath();
      g.moveTo(s[0], s[1] - 18); g.lineTo(s[0] + 16, s[1]); g.lineTo(s[0], s[1] + 18); g.lineTo(s[0] - 16, s[1]);
      g.closePath();
      g.fillStyle = pal.gold;
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = pal.ink;
      g.stroke();
    }

    // ruff collar
    g.save();
    g.translate(J.neckTop[0], J.neckTop[1] + 6);
    g.rotate(J.torsoA * D);
    g.beginPath();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * U.TAU;
      const r = i % 2 ? 46 : 62;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.36);
    }
    g.closePath();
    g.fillStyle = pal.cream;
    g.fill();
    g.lineWidth = 4.5;
    g.strokeStyle = pal.ink;
    g.stroke();
    g.restore();

    headDraw(g, pal, J.neckTop, (J.torsoA + p.head) * D, p, t);
    g.restore();
    return J;
  };
})();
