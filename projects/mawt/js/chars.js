// chars.js — the anime cast, drawn on Canvas 2D with bold ink outlines and one flat cel-shadow tone.
//   hero  : the young survivor (spiky black hair, navy jacket, the long RED SCARF), frontal skeleton
//   boy   : the crying child (same skeleton, child proportions)
//   death : the hooded reaper-sniper (cloak with a tattered hem, skull face, red eye; holds the Blender rifle)
//   monkey: the free monkey (same skeleton, long arms, tail)
//   beasts: gazelle and wolf in side view (gait from a phase), for the inverted-world panels
//   eye   : the extreme anime eye close-up with a reflection inside the iris
// The pose is plain data (angles in degrees, mirror-mirror convention: 0 = straight down, + = screen
// right). Moves and choreography: MV.MOVES / MV.choreoPose (key pose reached ON its beat).
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const D = Math.PI / 180;
  const CW = 720, CH = 1180, GY = 1150, CX = CW / 2;
  MV.CHAR_CANVAS = { w: CW, h: CH, groundY: GY };
  MV.JESTER_CANVAS = MV.CHAR_CANVAS; // tools/motion_check.cjs reads this name
  const BASE = { thigh: 230, shin: 222, upper: 142, fore: 132, spine: 262, shoulder: 74, hip: 42, neck: 26, head: 1 };
  const KIND = {
    hero: { k: 1.0, head: 1.0, armK: 1 },
    boy: { k: 0.6, head: 1.3, armK: 1 },
    death: { k: 1.08, head: 1.0, armK: 1.1 },
    monkey: { k: 0.55, head: 1.25, armK: 1.45, legK: 0.75 },
  };
  const dir = (a) => [Math.sin(a * D), Math.cos(a * D)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];

  // ------------------------------------------------------------------ poses
  const NEUTRAL = {
    torso: 0, shift: 0, head: 0, air: 0, squash: 0, spin: 1,
    lSh: -14, lEl: -10, rSh: 14, rEl: 10, lHip: -5, lKnee: 3, rHip: 5, rKnee: -3,
    lHand: "open", rHand: "open", mouth: 0, eyes: 1,
  };
  const POSES = {
    neutral: {},
    breathe: { lSh: -10, lEl: -6, rSh: 10, rEl: 6, head: 3 },
    bounceDown: { lHip: -18, lKnee: 26, rHip: 18, rKnee: -26, lSh: -22, lEl: -40, rSh: 22, rEl: 40, head: 5, squash: 0.03 },
    bounceUp: { lHip: -6, lKnee: 4, rHip: 6, rKnee: -4, lSh: -18, lEl: -60, rSh: 18, rEl: 60, head: -3 },
    runA: { lHip: 30, lKnee: -62, rHip: -12, rKnee: 30, lSh: 42, lEl: 84, rSh: -52, rEl: -92, torso: 5, air: 22 },
    runB: { lHip: -12, lKnee: 30, rHip: -30, rKnee: 62, lSh: -52, lEl: -92, rSh: 42, rEl: 84, torso: -5, air: 22 },
    pointAt: { rSh: 92, rEl: 0, rHand: "point", lSh: -30, lEl: -100, lHand: "fist", torso: 6, head: -4, rHip: 18, lHip: -8, lKnee: 12, shift: 16 },
    shout: { lSh: -60, lEl: -40, rSh: 60, rEl: 40, head: -14, torso: 0, lHip: -16, rHip: 16, lHand: "fist", rHand: "fist", squash: -0.02 },
    fight: { lSh: -40, lEl: -120, rSh: 50, rEl: 110, lHand: "fist", rHand: "fist", lHip: -24, lKnee: 30, rHip: 22, rKnee: -30, torso: -4, head: 4, shift: -8 },
    beckon: { rSh: 70, rEl: -110, rHand: "open", lSh: -36, lEl: -20, head: -6, torso: 3, lHip: -10, rHip: 12 },
    openArms: { lSh: -100, lEl: -10, rSh: 100, rEl: 10, head: -10, lHip: -10, rHip: 10 },
    reach: { rSh: 110, rEl: -8, rHand: "open", lSh: -24, lEl: -30, torso: 10, head: -2, shift: 30, rHip: 24, lHip: -6, lKnee: 14 },
    cry: { lSh: -20, lEl: 150, rSh: 20, rEl: -150, head: 18, lHip: -6, rHip: 6, squash: 0.03 },
    sad: { lSh: -8, lEl: -4, rSh: 8, rEl: 4, head: 20, torso: 0, lHip: -4, rHip: 4 },
    lookUp: { head: -22, lSh: -20, lEl: -20, rSh: 20, rEl: 20 },
    vUp: { lSh: -150, lEl: -10, rSh: 150, rEl: 10, lHip: -12, rHip: 12, head: -8 },
    power: { lSh: -70, lEl: -60, rSh: 70, rEl: 60, lHand: "fist", rHand: "fist", lHip: -26, lKnee: 34, rHip: 26, rKnee: -34, head: -6, squash: 0.04 },
    punch: { rSh: 95, rEl: 0, rHand: "fist", lSh: -40, lEl: -110, lHand: "fist", torso: 12, shift: 40, rHip: 30, lHip: -14, lKnee: 24, head: 4 },
    dashA: { lHip: 40, lKnee: -70, rHip: -30, rKnee: 40, lSh: 70, lEl: 40, rSh: -70, rEl: -40, torso: 16, air: 40 },
    dashB: { lHip: -30, lKnee: 40, rHip: -40, rKnee: 70, lSh: -70, lEl: -40, rSh: 70, rEl: 40, torso: 16, air: 40 },
    jump: { lHip: -30, lKnee: 60, rHip: 30, rKnee: -60, lSh: -150, lEl: -20, rSh: 150, rEl: 20, air: 120, head: -10 },
    // death
    aim: { lSh: 70, lEl: 40, rSh: 80, rEl: -30, head: 6, torso: 4, lHand: "fist", rHand: "fist" },
    recoil: { lSh: -40, lEl: 120, rSh: 30, rEl: -130, head: -18, torso: -10, shift: -30, squash: 0.02 },
    cower: { lSh: -10, lEl: 160, rSh: 10, rEl: -160, head: 22, squash: 0.08, lHip: -16, lKnee: 26, rHip: 16, rKnee: -26 },
    tiptoe: { lSh: -40, lEl: 110, rSh: 40, rEl: -110, head: 10, torso: -6, air: 10 },
    // monkey
    danceA: { lSh: -150, lEl: -40, rSh: 60, rEl: 90, lHip: -30, lKnee: 40, rHip: 10, rKnee: -10, torso: -8, head: -8, air: 20 },
    danceB: { lSh: -60, lEl: -90, rSh: 150, rEl: 40, lHip: -10, lKnee: 10, rHip: 30, rKnee: -40, torso: 8, head: 8, air: 4 },
    sitTop: { lHip: -70, lKnee: 90, rHip: 70, rKnee: -90, lSh: -30, lEl: -60, rSh: 80, rEl: -60, head: -6 },
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

  const MOVES = {
    groove: { len: 2, keys: [[0, "bounceDown"], [1, "bounceUp"]] },
    run: { len: 1, smooth: true, keys: [[0, "runA"], [0.5, "runB"]] },
    dash: { len: 0.6, smooth: true, keys: [[0, "dashA"], [0.3, "dashB"]] },
    dance: { len: 2, keys: [[0, "danceA"], [1, "danceB"]] },
    tremble: { len: 0.25, smooth: true, keys: [[0, "cower"], [0.125, "recoil"]] },
    breathe: { len: 2, smooth: true, keys: [[0, "neutral"], [1, "breathe"]] },
  };
  MV.MOVES = MOVES;
  const PRE = 0.3, POST = 0.22;
  function moveAt(name, beatInMove) {
    const m = MOVES[name];
    const len = m.len, keys = m.keys, n = keys.length;
    const ph = ((beatInMove % len) + len) % len;
    if (m.smooth) {
      let i = n - 1;
      for (let j = 0; j < n; j++) if (keys[j][0] <= ph) i = j;
      const a = keys[i], b = keys[(i + 1) % n];
      const tB = i + 1 < n ? b[0] : len + keys[0][0];
      const k = U.clamp((ph - a[0]) / Math.max(1e-6, tB - a[0]));
      return lerpPose(full(a[1]), full(b[1]), U.ease.inOutSine(k));
    }
    const wrap = (d) => ((((d + len / 2) % len) + len) % len) - len / 2;
    for (let j = 0; j < n; j++) {
      const kt = keys[j][0];
      const prev = keys[(j - 1 + n) % n];
      const seg = ((kt - prev[0]) % len + len) % len || len;
      const pre = Math.min(PRE, seg * 0.45), post = Math.min(POST, seg * 0.3);
      const d = wrap(ph - kt);
      if (d >= -pre && d <= post) return lerpPose(full(prev[1]), full(keys[j][1]), U.ease.inOutBack((d + pre) / (pre + post)));
    }
    let best = n - 1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = ((ph - keys[j][0]) % len + len) % len;
      if (d < bestD) { bestD = d; best = j; }
    }
    return full(keys[best][1]);
  }
  // choreo = [{b, move|pose, x}] on absolute beats; x-beat S-curve crossfade (default 0.6)
  MV.choreoPose = function (choreo, beat) {
    let idx = 0;
    for (let i = 0; i < choreo.length; i++) if (choreo[i].b <= beat) idx = i;
    const c = choreo[idx];
    const poseOf = (cc, bb) => (cc.move ? moveAt(cc.move, bb - cc.b) : full(cc.pose));
    let p = poseOf(c, beat);
    if (idx > 0) {
      const k = U.clamp((beat - c.b) / (c.x || 0.6));
      if (k < 1) p = lerpPose(poseOf(choreo[idx - 1], beat), p, U.ease.inOutCubic(k));
    }
    return p;
  };

  // ------------------------------------------------------------------ skeleton (frontal)
  function solve(p, kind = "hero") {
    const kd = KIND[kind] || KIND.hero;
    const L = {};
    for (const k in BASE) L[k] = BASE[k] * kd.k;
    L.upper *= kd.armK; L.fore *= kd.armK;
    if (kd.legK) { L.thigh *= kd.legK; L.shin *= kd.legK; }
    // shins never cross into an X (frontal clamp, mirror-mirror)
    let lSh = p.lHip + p.lKnee, rSh = p.rHip + p.rKnee;
    lSh = Math.min(lSh, 14); rSh = Math.max(rSh, -14);
    const pelvis = [CX + p.shift, 0];
    const hipL = [pelvis[0] - L.hip, 0], hipR = [pelvis[0] + L.hip, 0];
    const kneeL = add(hipL, mul(dir(p.lHip), L.thigh)), kneeR = add(hipR, mul(dir(p.rHip), L.thigh));
    const ankL = add(kneeL, mul(dir(lSh), L.shin)), ankR = add(kneeR, mul(dir(rSh), L.shin));
    const low = Math.max(ankL[1], ankR[1]);
    const dy = GY - 24 - low - p.air;
    for (const v of [pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR]) v[1] += dy;
    const sq = 1 - p.squash;
    const up = dir(180 + p.torso);
    const chest = add(pelvis, mul(up, L.spine * sq));
    const side = [Math.cos(p.torso * D), Math.sin(p.torso * D)];
    const shL = add(chest, mul([-side[0], -side[1]], L.shoulder)), shR = add(chest, mul(side, L.shoulder));
    const elL = add(shL, mul(dir(p.lSh + p.torso), L.upper)), elR = add(shR, mul(dir(p.rSh + p.torso), L.upper));
    const wrL = add(elL, mul(dir(p.lSh + p.lEl + p.torso), L.fore)), wrR = add(elR, mul(dir(p.rSh + p.rEl + p.torso), L.fore));
    const neckTop = add(chest, mul(up, L.neck));
    return { pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR, chest, shL, shR, elL, elR, wrL, wrR, neckTop, L, kd, up };
  }
  MV.charJoints = solve;
  MV.jesterJoints = (p) => solve(p, "hero"); // tools/motion_check.cjs

  // ------------------------------------------------------------------ drawing helpers
  function segPath(g, a, b, wa, wb) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    g.beginPath();
    g.moveTo(a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2);
    g.lineTo(b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2);
    // caps sweep OUTWARD (anticlockwise on screen); the khawf/jester sweep cut half-disc holes at every joint
    g.arc(b[0], b[1], wb / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
    g.lineTo(a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2);
    g.arc(a[0], a[1], wa / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
    g.closePath();
  }
  // cel-shaded limb: base fill, a flat shadow on the side away from the light (upper left), ink
  function limb(g, a, b, wa, wb, col, shade, lw = 6) {
    segPath(g, a, b, wa, wb);
    g.fillStyle = col;
    g.fill();
    g.save();
    g.clip();
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (nx < 0) { nx = -nx; ny = -ny; }
    const o = Math.max(wa, wb) * 0.12;
    g.beginPath();
    g.moveTo(a[0] + nx * o - dx, a[1] + ny * o - dy);
    g.lineTo(b[0] + nx * o + dx, b[1] + ny * o + dy);
    g.lineTo(b[0] + nx * 300 + dx, b[1] + ny * 300 + dy);
    g.lineTo(a[0] + nx * 300 - dx, a[1] + ny * 300 - dy);
    g.closePath();
    g.fillStyle = shade;
    g.fill();
    g.restore();
    segPath(g, a, b, wa, wb);
    g.lineWidth = lw;
    g.strokeStyle = P.ink;
    g.stroke();
  }
  function poly(g, pts, col, shade, lw = 6, close = true) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (close) g.closePath();
    if (col) { g.fillStyle = col; g.fill(); }
    if (shade) {
      g.save(); g.clip();
      let cx = 0; for (const p of pts) cx += p[0]; cx /= pts.length;
      g.fillStyle = shade; g.fillRect(cx + 12, -2000, 4000, 6000);
      g.restore();
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath();
    }
    g.lineWidth = lw;
    g.strokeStyle = P.ink;
    g.stroke();
  }
  function handShape(g, wrist, ang, type, s, col, shade) {
    g.save();
    g.translate(wrist[0], wrist[1]);
    g.rotate(ang);
    g.scale(s, s);
    g.beginPath();
    if (type === "fist") g.ellipse(0, 16, 21, 20, 0, 0, U.TAU);
    else if (type === "point") { g.ellipse(0, 14, 19, 18, 0, 0, U.TAU); MV.roundRect(g, -6, 20, 12, 44, 6); }
    else if (type === "bone") { // skeletal fingers
      g.ellipse(0, 12, 15, 14, 0, 0, U.TAU);
      for (let i = -2; i <= 2; i++) MV.roundRect(g, i * 7 - 3, 18, 6, 40 - Math.abs(i) * 6, 3);
    } else { g.ellipse(0, 18, 19, 22, 0, 0, U.TAU); MV.roundRect(g, -16, 24, 32, 36, 12); MV.roundRect(g, 14, 6, 12, 30, 6); }
    g.fillStyle = col;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = P.ink;
    g.stroke();
    g.restore();
  }
  const limbAng = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;

  // the scarf: a knot at the neck and two long tails streaming with the wind (closed form in t)
  function scarf(g, J, o, front) {
    const t = o.t || 0, wind = o.wind === undefined ? 1 : o.wind, k = J.L.spine / 262;
    const n0 = add(J.neckTop, [0, 6 * k]);
    if (!front) {
      for (const [len, ph, w0] of [[1, 0, 44], [0.78, 1.7, 36]]) {
        const pts = [];
        const L = 430 * len * k * (o.scarfLen || 1);
        for (let i = 0; i <= 16; i++) {
          const s = i / 16;
          const wave = Math.sin(s * 5 - t * 9 + ph) * 34 * s * k;
          pts.push([n0[0] + wind * s * L + (1 - Math.abs(wind)) * wave * 0.6, n0[1] + 30 * k + s * L * (0.25 + (1 - Math.abs(wind)) * 0.75) * 0.6 + wave]);
        }
        const L2 = [], R2 = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1;
          const w = w0 * k * (1 - (i / 16) * 0.35) / 2;
          L2.push([pts[i][0] - (dy / ln) * w, pts[i][1] + (dx / ln) * w]);
          R2.push([pts[i][0] + (dy / ln) * w, pts[i][1] - (dx / ln) * w]);
        }
        const tail = L2.concat(R2.reverse());
        poly(g, tail, o.scarfCol || P.red, P.red2, 5);
        // fringe
        const e = pts[pts.length - 1];
        g.strokeStyle = P.ink; g.lineWidth = 4;
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(e[0] + i * 7 * k, e[1]); g.lineTo(e[0] + i * 7 * k + wind * 18 * k, e[1] + 16 * k); g.stroke(); }
      }
    } else {
      // wrap around the neck
      g.save();
      g.beginPath();
      g.ellipse(n0[0], n0[1] + 8 * k, 70 * k, 30 * k, 0, 0, U.TAU);
      g.fillStyle = o.scarfCol || P.red; g.fill();
      g.save(); g.clip(); g.fillStyle = P.red2; g.fillRect(n0[0] + 10 * k, n0[1] - 60, 200, 200); g.restore();
      g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
      g.restore();
    }
  }

  // anime head: face, hair, big eyes. hs = head scale, expr = calm|shock|angry|sad|shout|smile|cry
  function head(g, J, kind, o, hs) {
    const k = J.L.spine / 262 * hs;
    const ang = ((o.pose && o.pose.head) || 0) * D + (J.up ? Math.atan2(J.up[0], -J.up[1]) : 0);
    const c = add(J.neckTop, [0, -84 * k]);
    const pal = kind === "boy" ? { hair: "#5a3420", hair2: "#8a5a34", skin: P.skin, skin2: P.skin2 } : { hair: P.hair, hair2: P.hair2, skin: P.skin, skin2: P.skin2 };
    g.save();
    g.translate(c[0], c[1]);
    g.rotate(ang * 0.5);
    // neck
    limb(g, [0, 50 * k], [0, 100 * k], 40 * k, 40 * k, pal.skin, pal.skin2, 5);
    // back hair mass
    g.beginPath();
    g.ellipse(0, -10 * k, 92 * k, 98 * k, 0, 0, U.TAU);
    g.fillStyle = pal.hair; g.fill(); g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
    // face: rounded top, pointed chin
    g.beginPath();
    g.moveTo(-70 * k, -20 * k);
    g.bezierCurveTo(-72 * k, 40 * k, -40 * k, 76 * k, 0, 92 * k);
    g.bezierCurveTo(40 * k, 76 * k, 72 * k, 40 * k, 70 * k, -20 * k);
    g.bezierCurveTo(68 * k, -90 * k, -68 * k, -90 * k, -70 * k, -20 * k);
    g.closePath();
    g.fillStyle = pal.skin; g.fill();
    g.save(); g.clip();
    g.fillStyle = pal.skin2;
    g.beginPath(); g.ellipse(70 * k, 20 * k, 40 * k, 120 * k, 0.2, 0, U.TAU); g.fill(); // side shadow
    if (o.blush) { g.fillStyle = "rgba(255,90,110,0.45)"; g.beginPath(); g.ellipse(-40 * k, 38 * k, 16 * k, 8 * k, 0, 0, U.TAU); g.ellipse(40 * k, 38 * k, 16 * k, 8 * k, 0, 0, U.TAU); g.fill(); }
    g.restore();
    g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
    // eyes
    const ex = o.expr || "calm";
    const blink = o.blink || 0;
    for (const s of [-1, 1]) {
      const x = s * 32 * k, y = 10 * k;
      g.save();
      g.translate(x, y);
      if (ex === "smile" || ex === "happy") {
        g.beginPath(); g.arc(0, 8 * k, 18 * k, Math.PI * 1.15, Math.PI * 1.85); g.lineWidth = 7 * k; g.strokeStyle = P.ink; g.stroke();
      } else if (blink > 0.5 || ex === "closed") {
        g.beginPath(); g.moveTo(-20 * k, 0); g.quadraticCurveTo(0, 10 * k, 20 * k, 0); g.lineWidth = 6 * k; g.strokeStyle = P.ink; g.stroke();
      } else {
        const eh = ex === "shock" ? 30 : 34, ew = 22;
        g.beginPath(); g.ellipse(0, 0, ew * k, eh * k, 0, 0, U.TAU); g.fillStyle = "#fff"; g.fill();
        if (ex !== "shock") {
          g.save(); g.clip();
          const lx = (o.look || 0) * 6 * k;
          g.beginPath(); g.ellipse(lx, 4 * k, 17 * k, 26 * k, 0, 0, U.TAU);
          const ig = g.createLinearGradient(0, -22 * k, 0, 30 * k);
          ig.addColorStop(0, o.irisA || "#3a1408"); ig.addColorStop(1, o.irisB || "#d0662c");
          g.fillStyle = ig; g.fill();
          g.beginPath(); g.ellipse(lx, 6 * k, 8 * k, 12 * k, 0, 0, U.TAU); g.fillStyle = "#120808"; g.fill();
          g.fillStyle = "#fff";
          g.beginPath(); g.ellipse(lx - 7 * k, -8 * k, 6 * k, 8 * k, 0, 0, U.TAU); g.fill();
          g.beginPath(); g.arc(lx + 7 * k, 14 * k, 3 * k, 0, U.TAU); g.fill();
          g.restore();
        } else {
          g.beginPath(); g.arc(0, 2 * k, 4 * k, 0, U.TAU); g.fillStyle = P.ink; g.fill(); // tiny shocked pupil
        }
        // thick upper lash line
        g.beginPath();
        g.moveTo(-ew * 1.15 * k, -eh * 0.35 * k);
        g.quadraticCurveTo(0, -eh * 1.35 * k, ew * 1.2 * k, -eh * 0.5 * k);
        g.lineWidth = 9 * k; g.strokeStyle = P.ink; g.lineCap = "round"; g.stroke();
        g.beginPath(); g.ellipse(0, 0, ew * k, eh * k, 0, 0, U.TAU); g.lineWidth = 3 * k; g.stroke();
      }
      // brows
      const bt = ex === "angry" || ex === "shout" ? 0.45 * -s : ex === "sad" || ex === "cry" ? -0.4 * -s : 0.05 * s;
      g.save(); g.translate(0, -48 * k); g.rotate(bt);
      g.beginPath(); g.moveTo(-20 * k, 0); g.lineTo(20 * k, -3 * k); g.lineWidth = 8 * k; g.strokeStyle = pal.hair; g.lineCap = "round"; g.stroke();
      g.restore();
      // tears
      if (o.tears) {
        const tl = (o.t * 1.6 + (s > 0 ? 0.5 : 0)) % 1;
        g.fillStyle = "#bfe8ff"; g.strokeStyle = P.ink; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-6 * k, 30 * k); g.quadraticCurveTo(-14 * k, (40 + tl * 60) * k, 0, (44 + tl * 70) * k); g.quadraticCurveTo(10 * k, (40 + tl * 60) * k, 4 * k, 30 * k); g.closePath(); g.fill(); g.stroke();
      }
      g.restore();
    }
    // mouth
    g.lineCap = "round";
    g.strokeStyle = P.ink;
    g.lineWidth = 5 * k;
    const m = o.mouth || 0;
    if (ex === "shout" || ex === "shock" || m > 0.2) {
      const mh = ex === "shout" ? 26 : ex === "shock" ? 18 : 8 + 18 * m;
      g.beginPath(); g.ellipse(0, 58 * k, 14 * k, mh * k * 0.6, 0, 0, U.TAU); g.fillStyle = "#5a1020"; g.fill(); g.stroke();
    } else if (ex === "smile" || ex === "happy") {
      g.beginPath(); g.arc(0, 50 * k, 14 * k, 0.2, Math.PI - 0.2); g.stroke();
    } else if (ex === "sad" || ex === "cry") {
      g.beginPath(); g.arc(0, 66 * k, 10 * k, Math.PI + 0.3, -0.3); g.stroke();
    } else { g.beginPath(); g.moveTo(-8 * k, 56 * k); g.lineTo(8 * k, 56 * k); g.stroke(); }
    // hair: spiky bangs (hero) or messy curls (boy)
    g.beginPath();
    if (kind === "boy") {
      g.moveTo(-84 * k, -10 * k);
      for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; g.quadraticCurveTo(Math.cos(a - 0.2) * 100 * k, -20 * k + Math.sin(a - 0.2) * 100 * k, Math.cos(a) * 86 * k, -26 * k + Math.sin(a) * 82 * k); }
      g.lineTo(70 * k, -20 * k); g.lineTo(40 * k, -44 * k); g.lineTo(10 * k, -24 * k); g.lineTo(-20 * k, -46 * k); g.lineTo(-50 * k, -22 * k); g.closePath();
    } else {
      const sp = o.hairFlare || 0;
      g.moveTo(-86 * k, 20 * k);
      g.lineTo(-104 * k - sp * 20, -40 * k);
      g.lineTo(-120 * k - sp * 40, -70 * k - sp * 30);
      g.lineTo(-80 * k, -96 * k);
      g.lineTo(-96 * k - sp * 20, -150 * k - sp * 40);
      g.lineTo(-30 * k, -118 * k);
      g.lineTo(-10 * k, -176 * k - sp * 50);
      g.lineTo(26 * k, -120 * k);
      g.lineTo(84 * k + sp * 20, -160 * k - sp * 40);
      g.lineTo(80 * k, -98 * k);
      g.lineTo(126 * k + sp * 40, -76 * k - sp * 30);
      g.lineTo(96 * k, -36 * k);
      g.lineTo(88 * k, 16 * k);
      // bangs
      g.lineTo(66 * k, -30 * k);
      g.lineTo(52 * k, 6 * k);
      g.lineTo(30 * k, -40 * k);
      g.lineTo(8 * k, -2 * k);
      g.lineTo(-12 * k, -44 * k);
      g.lineTo(-34 * k, -6 * k);
      g.lineTo(-50 * k, -40 * k);
      g.lineTo(-66 * k, 8 * k);
      g.closePath();
    }
    g.fillStyle = pal.hair; g.fill();
    g.save(); g.clip();
    g.fillStyle = pal.hair2;
    g.beginPath(); g.ellipse(-36 * k, -96 * k, 50 * k, 14 * k, -0.3, 0, U.TAU); g.fill(); // shine band
    g.restore();
    g.lineWidth = 6; g.strokeStyle = P.ink; g.lineJoin = "round"; g.stroke();
    // sweat drop (anime)
    if (o.sweat) {
      g.save(); g.translate(78 * k, -40 * k + (o.t * 40 % 30) * k);
      g.beginPath(); g.moveTo(0, -22 * k); g.quadraticCurveTo(14 * k, 6 * k, 0, 12 * k); g.quadraticCurveTo(-14 * k, 6 * k, 0, -22 * k);
      g.fillStyle = "#cdefff"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();
      g.restore();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ hero / boy
  MV.drawHero = function (g, pose, o = {}) {
    const kind = o.kind || "hero";
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    g.lineJoin = "round";
    g.lineCap = "round";
    const J = solve(pose, kind);
    const k = J.L.spine / 262;
    o.pose = pose;
    const jacket = kind === "boy" ? "#ffc23d" : o.jacket || "#2b3a6e", jacket2 = kind === "boy" ? "#d08a1c" : o.jacket2 || "#18214a";
    const pants = kind === "boy" ? "#3a6fb0" : "#23233a", pants2 = kind === "boy" ? "#244a80" : "#121222";
    if (kind === "hero" && o.scarf !== false) scarf(g, J, o, false);
    // legs
    for (const [h, kn, an] of [[J.hipL, J.kneeL, J.ankL], [J.hipR, J.kneeR, J.ankR]]) {
      limb(g, h, kn, 62 * k, 52 * k, pants, pants2);
      limb(g, kn, an, 52 * k, 42 * k, kind === "boy" ? P.skin : pants, kind === "boy" ? P.skin2 : pants2);
      // sneaker
      g.save(); g.translate(an[0], an[1] + 8 * k);
      g.beginPath(); g.ellipse(an[0] < J.pelvis[0] ? -10 * k : 10 * k, 6 * k, 38 * k, 20 * k, 0, 0, U.TAU);
      g.fillStyle = "#f4f2f8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
      g.fillStyle = P.red; g.fillRect(-30 * k, 10 * k, 60 * k, 6 * k);
      g.restore();
    }
    // torso: jacket trapezoid + open front showing the white shirt
    const hw = 70 * k, sw = J.L.shoulder + 14 * k;
    const side = [J.shR[0] - J.chest[0], J.shR[1] - J.chest[1]], sl = Math.hypot(...side) || 1;
    const sx = side[0] / sl, sy = side[1] / sl;
    const top = [J.chest[0], J.chest[1]], bot = [J.pelvis[0], J.pelvis[1] + 20 * k];
    const body = [[top[0] - sx * sw, top[1] - sy * sw], [top[0] + sx * sw, top[1] + sy * sw], [bot[0] + sx * hw, bot[1] + sy * hw], [bot[0] - sx * hw, bot[1] - sy * hw]];
    poly(g, body, jacket, jacket2, 6);
    if (kind === "hero") {
      poly(g, [[top[0] - sx * 26 * k, top[1]], [top[0] + sx * 26 * k, top[1]], [bot[0] + sx * 18 * k, bot[1] - 6], [bot[0] - sx * 18 * k, bot[1] - 6]], P.white, P.white2, 4);
    }
    // arms
    for (const [s, e, w, hand] of [[J.shL, J.elL, J.wrL, pose.lHand], [J.shR, J.elR, J.wrR, pose.rHand]]) {
      limb(g, s, e, 46 * k, 40 * k, jacket, jacket2);
      limb(g, e, w, 40 * k, 34 * k, jacket, jacket2);
      handShape(g, w, limbAng(e, w), hand, k * 1.05, P.skin, P.skin2);
    }
    if (kind === "hero" && o.scarf !== false) scarf(g, J, o, true);
    head(g, J, kind, o, J.kd.head);
    if (o.aura) aura(g, J, o.aura, o.t || 0);
    return J;
  };

  // anime battle aura: flickering flame tongues around the silhouette (drawn behind via destination-over)
  function aura(g, J, a, t) {
    g.save();
    g.globalCompositeOperation = "destination-over";
    const f = Math.floor(t * 20);
    for (let layer = 0; layer < 2; layer++) {
      g.beginPath();
      const cx = J.pelvis[0], cy = (J.neckTop[1] + J.ankL[1]) / 2, R = 360;
      for (let i = 0; i <= 40; i++) {
        const ang = (i / 40) * U.TAU;
        const r = R * (0.75 + 0.25 * U.hash(i, f + layer * 50)) * (layer ? 0.8 : 1) * (1 + 0.6 * Math.max(0, -Math.sin(ang)));
        const x = cx + Math.cos(ang) * r * 0.55, y = cy + Math.sin(ang) * r;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.closePath();
      g.fillStyle = layer ? `rgba(255,236,170,${0.8 * a})` : `rgba(255,70,60,${0.7 * a})`;
      g.fill();
    }
    g.restore();
  }

  // ------------------------------------------------------------------ death
  MV.drawDeath = function (g, pose, o = {}) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    g.lineJoin = "round";
    g.lineCap = "round";
    const J = solve(pose, "death");
    const k = J.L.spine / 262;
    const t = o.t || 0, wind = o.wind || 0;
    const cloak = o.cloak || P.violet, cloak2 = o.cloak2 || "#211640";
    const shake = o.fear ? Math.sin(t * 90) * 5 * o.fear : 0;
    g.translate(shake, 0);
    // cloak body: shoulders -> flared tattered hem near the ground, streaming with `wind`
    const hemY = Math.max(J.ankL[1], J.ankR[1]) + 10, top = J.neckTop;
    const pts = [[J.shL[0] - 40 * k, J.shL[1] - 10 * k]];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const x = U.lerp(J.pelvis[0] - 250 * k, J.pelvis[0] + 250 * k, s) - wind * 220 * k * (0.4 + 0.6 * Math.abs(s - 0.5) * 2);
      const tat = (i % 2 ? -1 : 1) * (40 + 30 * U.hash(i, 9)) * k + Math.sin(t * 7 + i * 1.3) * 18 * k;
      pts.push([x, hemY - (i % 2 ? 60 * k : 0) + tat * 0.5 - Math.abs(wind) * 90 * k * Math.sin(s * Math.PI)]);
    }
    pts.push([J.shR[0] + 40 * k, J.shR[1] - 10 * k]);
    pts.push([top[0], top[1] - 30 * k]);
    poly(g, pts, cloak, cloak2, 7);
    // sleeves + bony hands
    for (const [s, e, w] of [[J.shL, J.elL, J.wrL], [J.shR, J.elR, J.wrR]]) {
      limb(g, s, e, 64 * k, 70 * k, cloak, cloak2, 6);
      limb(g, e, w, 70 * k, 84 * k, cloak, cloak2, 6);
      handShape(g, w, limbAng(e, w), "bone", k * 1.1, P.bone, P.bone2);
    }
    // weapon (the Blender rifle-scythe atlas, frame 0 = side view) between the hands
    if (o.rifle && o.rifle.draw) {
      const a = J.wrL, b = J.wrR, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (o.rifle.ang || 0);
      g.save();
      g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      g.rotate(ang);
      o.rifle.draw(g, -330 * k, -165 * k, 660 * k, 330 * k);
      g.restore();
    }
    // hood + skull
    const hc = add(top, [0, -70 * k]);
    g.save();
    g.translate(hc[0], hc[1]);
    g.rotate((pose.head || 0) * D * 0.6);
    g.beginPath();
    g.moveTo(-110 * k, 90 * k);
    g.bezierCurveTo(-120 * k, -60 * k, -60 * k, -150 * k, 20 * k + wind * -60 * k, -170 * k);
    g.bezierCurveTo(90 * k, -120 * k, 120 * k, -40 * k, 110 * k, 90 * k);
    g.closePath();
    g.fillStyle = cloak; g.fill();
    g.save(); g.clip(); g.fillStyle = cloak2; g.fillRect(20 * k, -300, 400, 600); g.restore();
    g.lineWidth = 7; g.strokeStyle = P.ink; g.stroke();
    g.beginPath(); g.ellipse(0, 6 * k, 72 * k, 84 * k, 0, 0, U.TAU); g.fillStyle = "#07040e"; g.fill();
    // skull
    g.beginPath();
    g.moveTo(-50 * k, 0); g.bezierCurveTo(-50 * k, -70 * k, 50 * k, -70 * k, 50 * k, 0);
    g.bezierCurveTo(50 * k, 30 * k, 30 * k, 40 * k, 26 * k, 66 * k); g.lineTo(-26 * k, 66 * k);
    g.bezierCurveTo(-30 * k, 40 * k, -50 * k, 30 * k, -50 * k, 0); g.closePath();
    g.fillStyle = P.bone; g.fill();
    g.save(); g.clip(); g.fillStyle = P.bone2; g.fillRect(14 * k, -100, 100, 300); g.restore();
    g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
    const fear = o.fear || 0;
    for (const s of [-1, 1]) {
      g.beginPath(); g.ellipse(s * 22 * k, 4 * k, 16 * k, (fear > 0.5 ? 20 : 15) * k, s * 0.2, 0, U.TAU); g.fillStyle = "#07040e"; g.fill();
      g.beginPath(); g.arc(s * 22 * k, 6 * k, (fear > 0.5 ? 3 : 6) * k, 0, U.TAU); g.fillStyle = fear > 0.5 ? "#fff" : o.eyeCol || "#ff2a4a"; g.fill();
      if (fear <= 0.5) { g.globalCompositeOperation = "lighter"; g.beginPath(); g.arc(s * 22 * k, 6 * k, 14 * k, 0, U.TAU); g.fillStyle = "rgba(255,40,70,0.35)"; g.fill(); g.globalCompositeOperation = "source-over"; }
    }
    g.beginPath(); g.moveTo(0, 22 * k); g.lineTo(-7 * k, 36 * k); g.lineTo(7 * k, 36 * k); g.closePath(); g.fillStyle = "#07040e"; g.fill();
    g.strokeStyle = P.ink; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 9 * k, 48 * k); g.lineTo(i * 9 * k, 64 * k); g.stroke(); }
    if (o.sweat || fear > 0.3) {
      for (const [dx, ph] of [[66, 0], [-70, 0.4], [80, 0.7]]) {
        const yy = -30 + ((t * 50 + ph * 30) % 30);
        g.save(); g.translate(dx * k, yy * k);
        g.beginPath(); g.moveTo(0, -20 * k); g.quadraticCurveTo(13 * k, 6 * k, 0, 12 * k); g.quadraticCurveTo(-13 * k, 6 * k, 0, -20 * k);
        g.fillStyle = "#cdefff"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke(); g.restore();
      }
    }
    g.restore();
    return J;
  };

  // ------------------------------------------------------------------ monkey
  MV.drawMonkey = function (g, pose, o = {}) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    g.lineJoin = "round"; g.lineCap = "round";
    const J = solve(pose, "monkey");
    const k = 0.55, fur = "#8a5a3c", fur2 = "#5c3a24", tan = "#f0cf9e", tan2 = "#c99a66", t = o.t || 0;
    // tail spiral
    g.beginPath();
    let px = J.pelvis[0], py = J.pelvis[1];
    g.moveTo(px, py);
    for (let i = 1; i <= 20; i++) { const a = i * 0.32 + Math.sin(t * 4) * 0.2; px += Math.cos(a) * 18; py -= Math.sin(a) * 18 - 4; g.lineTo(px, py); }
    g.lineWidth = 26; g.strokeStyle = P.ink; g.stroke(); g.lineWidth = 16; g.strokeStyle = fur; g.stroke();
    for (const [h, kn, an] of [[J.hipL, J.kneeL, J.ankL], [J.hipR, J.kneeR, J.ankR]]) { limb(g, h, kn, 44, 38, fur, fur2); limb(g, kn, an, 38, 34, fur, fur2); }
    const body = [[J.chest[0] - 70, J.chest[1] - 10], [J.chest[0] + 70, J.chest[1] - 10], [J.pelvis[0] + 66, J.pelvis[1] + 20], [J.pelvis[0] - 66, J.pelvis[1] + 20]];
    poly(g, body, fur, fur2, 6);
    g.beginPath(); g.ellipse((J.chest[0] + J.pelvis[0]) / 2, (J.chest[1] + J.pelvis[1]) / 2 + 10, 42, 60, 0, 0, U.TAU); g.fillStyle = tan; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();
    for (const [s, e, w] of [[J.shL, J.elL, J.wrL], [J.shR, J.elR, J.wrR]]) { limb(g, s, e, 34, 30, fur, fur2); limb(g, e, w, 30, 26, fur, fur2); handShape(g, w, limbAng(e, w), "fist", 0.85, tan, tan2); }
    if (o.bread) MV.drawBread(g, J.wrR[0] + 10, J.wrR[1] + 20, 56, t * 3);
    const hc = add(J.neckTop, [0, -60]);
    g.save(); g.translate(hc[0], hc[1]); g.rotate((pose.head || 0) * D * 0.6);
    for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 70, -6, 30, 0, U.TAU); g.fillStyle = fur; g.fill(); g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke(); g.beginPath(); g.arc(s * 70, -6, 16, 0, U.TAU); g.fillStyle = tan; g.fill(); }
    g.beginPath(); g.arc(0, 0, 68, 0, U.TAU); g.fillStyle = fur; g.fill(); g.lineWidth = 6; g.stroke();
    g.beginPath(); g.ellipse(-22, -4, 28, 32, 0, 0, U.TAU); g.ellipse(22, -4, 28, 32, 0, 0, U.TAU); g.ellipse(0, 30, 44, 30, 0, 0, U.TAU); g.fillStyle = tan; g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 20, -6, 9, 13, 0, 0, U.TAU); g.fillStyle = P.ink; g.fill(); g.beginPath(); g.arc(s * 20 - 3, -11, 3.5, 0, U.TAU); g.fillStyle = "#fff"; g.fill(); }
    g.beginPath(); g.arc(0, 32, 22, 0.15, Math.PI - 0.15); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke(); // grin
    g.beginPath(); g.arc(0, 36, 14, 0.2, Math.PI - 0.2); g.fillStyle = "#fff"; g.fill();
    g.restore();
    return J;
  };

  // ------------------------------------------------------------------ gazelle / wolf (side view, facing +x)
  MV.drawBeast = function (g, kind, ph, o = {}) {
    g.save();
    g.lineJoin = "round"; g.lineCap = "round";
    const gz = kind === "gazelle";
    const col = gz ? "#d9a35c" : "#7c8296", col2 = gz ? "#9a6a2c" : "#4a4f62", belly = gz ? "#fbf3e2" : "#c9ccd6";
    const bx = 0, by = 0, rx = gz ? 135 : 170, ry = gz ? 62 : 74;
    const legL = gz ? [140, 135] : [118, 108], lw = gz ? 20 : 28;
    const crouch = o.crouch || 0, sniff = o.sniff || 0;
    const legs = [[rx * 0.62, 0], [rx * 0.5, 0.5], [-rx * 0.6, 0.25], [-rx * 0.72, 0.75]];
    const drawLeg = (x0, off, back) => {
      const a = Math.sin((ph + off) * U.TAU) * (o.amp === undefined ? 32 : o.amp);
      const kn = [x0 + Math.sin(a * D) * legL[0] * (1 - crouch * 0.3), by + ry * 0.5 + Math.cos(a * D) * legL[0] * (1 - crouch * 0.4)];
      const b2 = a + (back ? -30 : 26) * (0.4 + 0.6 * Math.abs(Math.sin((ph + off) * U.TAU))) * (back ? 1 : -1) * -1;
      const ft = [kn[0] + Math.sin(b2 * D) * legL[1], kn[1] + Math.cos(b2 * D) * legL[1] * (1 - crouch * 0.3)];
      limb(g, [x0, by + ry * 0.3], kn, lw * 1.5, lw, col, col2, 5);
      limb(g, kn, ft, lw, lw * 0.8, col, col2, 5);
      g.beginPath(); g.ellipse(ft[0] + 4, ft[1] + 4, lw * 0.7, lw * 0.45, 0, 0, U.TAU); g.fillStyle = P.ink; g.fill();
    };
    drawLeg(legs[1][0], legs[1][1], false); drawLeg(legs[3][0], legs[3][1], true);
    // tail
    g.beginPath();
    if (gz) { g.ellipse(-rx - 8, -10, 14, 26, -0.6, 0, U.TAU); }
    else { g.moveTo(-rx + 10, -20); g.quadraticCurveTo(-rx - 120, -40 + Math.sin(ph * U.TAU) * 20, -rx - 150, 30 - (o.tailUp || 0) * 90); g.quadraticCurveTo(-rx - 60, 20, -rx + 10, 20); }
    g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
    // body: deep chest at the front, tucked waist, round haunch at the back (not a plain ellipse)
    const bodyPath = () => {
      g.beginPath();
      g.moveTo(-rx * 0.95, -ry * 0.55);
      g.bezierCurveTo(-rx * 0.5, -ry * 1.05, rx * 0.4, -ry * 0.95, rx * 0.8, -ry * 0.85);
      g.bezierCurveTo(rx * 1.15, -ry * 0.7, rx * 1.12, ry * 0.7, rx * 0.7, ry * 0.95);
      g.bezierCurveTo(rx * 0.3, ry * 1.1, -rx * 0.1, ry * 0.55, -rx * 0.45, ry * 0.75);
      g.bezierCurveTo(-rx * 1.1, ry * 1.05, -rx * 1.2, -ry * 0.1, -rx * 0.95, -ry * 0.55);
      g.closePath();
    };
    bodyPath(); g.fillStyle = col; g.fill();
    g.save(); g.clip(); g.fillStyle = belly; g.beginPath(); g.ellipse(bx + rx * 0.1, by + ry * 0.95, rx * 0.8, ry * 0.5, 0, 0, U.TAU); g.fill();
    if (gz) { g.fillStyle = "#6a3a14"; g.fillRect(-rx, by + ry * 0.2, rx * 2, 9); }
    g.fillStyle = col2; g.globalAlpha = 0.45; g.fillRect(-rx * 1.2, by - ry * 1.2, rx * 2.4, ry * 0.45); g.globalAlpha = 1;
    g.restore();
    bodyPath(); g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
    drawLeg(legs[0][0], legs[0][1], false); drawLeg(legs[2][0], legs[2][1], true);
    // neck + head
    const neckA = (gz ? -0.95 : -0.35) + sniff * 1.5;
    const nb = [rx * 0.72, -ry * 0.3], nl = gz ? 150 : 90;
    const hp = [nb[0] + Math.cos(neckA) * nl, nb[1] + Math.sin(neckA) * nl];
    limb(g, nb, hp, gz ? 62 : 90, gz ? 40 : 62, col, col2, 6);
    g.save(); g.translate(hp[0], hp[1]); g.rotate(sniff * 0.9);
    if (gz) {
      for (const s of [0, 1]) { // ringed lyre horns
        g.beginPath(); g.moveTo(-6 + s * 10, -20); g.bezierCurveTo(-30 + s * 10, -110, 10 + s * 10, -150, -40 + s * 14, -190);
        g.lineWidth = 14; g.strokeStyle = P.ink; g.stroke(); g.lineWidth = 7; g.strokeStyle = "#3a2410"; g.stroke();
      }
      g.beginPath(); g.ellipse(-14, -24, 12, 30, -0.7, 0, U.TAU); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke();
      g.beginPath(); g.moveTo(-30, -20); g.quadraticCurveTo(0, -46, 30, -16); g.quadraticCurveTo(80, 0, 84, 20); g.quadraticCurveTo(60, 36, 20, 26); g.quadraticCurveTo(-26, 30, -30, -20); g.closePath();
    } else {
      for (const s of [0, 1]) { g.beginPath(); g.moveTo(-34 + s * 26, -26); g.lineTo(-24 + s * 26, -90); g.lineTo(-2 + s * 26, -30); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke(); }
      g.beginPath(); g.moveTo(-50, -30); g.quadraticCurveTo(0, -60, 40, -24); g.lineTo(120, -6); g.quadraticCurveTo(130, 14, 112, 24); g.lineTo(30, 40); g.quadraticCurveTo(-40, 50, -50, -30); g.closePath();
    }
    g.fillStyle = col; g.fill();
    g.save(); g.clip(); g.fillStyle = belly; g.fillRect(-60, 14, 220, 60); g.restore();
    g.lineWidth = 6; g.strokeStyle = P.ink; g.stroke();
    // nose
    g.beginPath(); g.arc(gz ? 80 : 120, gz ? 18 : 6, gz ? 6 : 10, 0, U.TAU); g.fillStyle = P.ink; g.fill();
    // eye expressions: normal | shock | hungry | sleep
    const ex = o.eye || "normal", ex0 = gz ? 14 : 22, ey0 = gz ? -10 : -16;
    if (ex === "sleep") { g.beginPath(); g.arc(ex0, ey0, 10, 0.2, Math.PI - 0.2); g.lineWidth = 5; g.strokeStyle = P.ink; g.stroke(); }
    else {
      const r = ex === "shock" ? 15 : ex === "hungry" ? 16 : 11;
      g.beginPath(); g.ellipse(ex0, ey0, r, r * 1.15, 0, 0, U.TAU); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();
      if (ex === "shock") { g.beginPath(); g.arc(ex0 + 3, ey0, 3, 0, U.TAU); g.fillStyle = P.ink; g.fill(); }
      else {
        g.beginPath(); g.ellipse(ex0 + 3, ey0 + 1, r * 0.62, r * 0.8, 0, 0, U.TAU); g.fillStyle = ex === "hungry" ? "#c01030" : "#2a1408"; g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(ex0, ey0 - 4, r * 0.28, 0, U.TAU); g.fill();
        if (ex === "hungry") { g.beginPath(); g.arc(ex0 + 6, ey0 + 5, r * 0.16, 0, U.TAU); g.fill(); }
      }
    }
    if (o.drool) {
      g.beginPath(); g.moveTo(gz ? 60 : 90, 28); g.quadraticCurveTo(gz ? 66 : 96, 28 + 40 * o.drool, gz ? 58 : 88, 30 + 60 * o.drool);
      g.lineWidth = 8; g.strokeStyle = P.ink; g.stroke(); g.lineWidth = 4; g.strokeStyle = "#dff4ff"; g.stroke();
    }
    if (o.teeth) { g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(50 + i * 16, 24); g.lineTo(58 + i * 16, 40); g.lineTo(66 + i * 16, 24); g.closePath(); g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke(); } }
    if (o.sweat) {
      g.save(); g.translate(-40, -70 + (o.t * 40 % 20));
      g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(13, 6, 0, 12); g.quadraticCurveTo(-13, 6, 0, -20); g.fillStyle = "#cdefff"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.stroke();
      g.restore();
    }
    g.restore();
    g.restore();
  };

  // ------------------------------------------------------------------ the extreme eye close-up
  // (cx, cy) centre, w = eye width in px. o.reflect(g, R) draws inside the iris (mirrored world),
  // o.lid 0 open .. 1 shut, o.look [-1..1], o.irisA/irisB colours, o.glow (colour section power-up)
  MV.drawEyeCU = function (g, cx, cy, w, o = {}) {
    const h = w * 0.46;
    g.save();
    g.translate(cx, cy);
    g.lineJoin = "round"; g.lineCap = "round";
    // skin around
    g.fillStyle = o.skin || P.skin;
    g.fillRect(-w * 1.2, -h * 2.4, w * 2.4, h * 4.8);
    g.fillStyle = o.skin2 || P.skin2;
    g.beginPath(); g.ellipse(w * 0.2, h * 1.3, w * 1.1, h * 0.6, 0, 0, U.TAU); g.fill();
    // brow
    g.save(); g.translate(0, -h * 1.45); g.rotate(o.brow || 0);
    g.beginPath(); g.moveTo(-w * 0.62, h * 0.15); g.quadraticCurveTo(0, -h * 0.35, w * 0.62, -h * 0.05); g.lineWidth = h * 0.22; g.strokeStyle = P.hair; g.stroke();
    g.restore();
    // eye shape
    const shape = () => {
      g.beginPath();
      g.moveTo(-w * 0.5, h * 0.05);
      g.bezierCurveTo(-w * 0.32, -h * 0.95, w * 0.36, -h * 1.0, w * 0.52, -h * 0.12);
      g.bezierCurveTo(w * 0.36, h * 0.72, -w * 0.3, h * 0.78, -w * 0.5, h * 0.05);
      g.closePath();
    };
    shape();
    g.fillStyle = "#fdfcff"; g.fill();
    g.save(); shape(); g.clip();
    const lx = (o.look || 0) * w * 0.12;
    const R = h * 0.78 * (o.irisK || 1);
    g.beginPath(); g.arc(lx, h * 0.02, R, 0, U.TAU);
    const ig = g.createLinearGradient(0, -R, 0, R);
    ig.addColorStop(0, o.irisA || "#2a0c06"); ig.addColorStop(0.6, o.irisB || "#c4581e"); ig.addColorStop(1, o.irisC || "#ffb35a");
    g.fillStyle = ig; g.fill();
    // reflection inside the iris (what the eye sees)
    if (o.reflect) { g.save(); g.beginPath(); g.arc(lx, h * 0.02, R * 0.94, 0, U.TAU); g.clip(); g.translate(lx, h * 0.02); o.reflect(g, R); g.restore(); }
    g.beginPath(); g.arc(lx, h * 0.04, R * (o.pupil || 0.36), 0, U.TAU); g.fillStyle = "rgba(10,4,4,0.85)"; g.fill();
    // iris ring lines
    g.strokeStyle = "rgba(20,8,4,0.6)"; g.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * U.TAU; g.beginPath(); g.moveTo(lx + Math.cos(a) * R * 0.42, h * 0.02 + Math.sin(a) * R * 0.42); g.lineTo(lx + Math.cos(a) * R * 0.9, h * 0.02 + Math.sin(a) * R * 0.9); g.stroke(); }
    g.beginPath(); g.arc(lx, h * 0.02, R, 0, U.TAU); g.lineWidth = h * 0.05; g.strokeStyle = P.ink; g.stroke();
    // highlights
    g.fillStyle = "#fff";
    g.beginPath(); g.ellipse(lx - R * 0.4, -R * 0.38, R * 0.22, R * 0.3, -0.4, 0, U.TAU); g.fill();
    g.beginPath(); g.arc(lx + R * 0.42, R * 0.4, R * 0.09, 0, U.TAU); g.fill();
    if (o.glow) { g.globalCompositeOperation = "lighter"; g.globalAlpha = o.glow; g.fillStyle = "#ff5030"; g.beginPath(); g.arc(lx, 0, R * 1.1, 0, U.TAU); g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
    // upper lid shadow
    g.fillStyle = "rgba(60,40,80,0.35)"; g.fillRect(-w, -h * 1.2, w * 2, h * 0.45);
    // eyelid closing
    if (o.lid) { g.fillStyle = o.skin || P.skin; g.fillRect(-w, -h * 1.2, w * 2, h * 2.4 * o.lid); }
    g.restore();
    // lash line + lower line
    g.beginPath();
    g.moveTo(-w * 0.56, h * 0.12);
    g.bezierCurveTo(-w * 0.34, -h * 1.02 + (o.lid || 0) * h * 1.6, w * 0.38, -h * 1.08 + (o.lid || 0) * h * 1.6, w * 0.6, -h * 0.2);
    g.lineWidth = h * 0.16; g.strokeStyle = P.ink; g.stroke();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * (0.44 + i * 0.05), -h * (0.4 + i * 0.12)); g.lineTo(w * (0.62 + i * 0.07), -h * (0.62 + i * 0.16)); g.lineWidth = h * 0.07; g.stroke(); }
    g.beginPath(); g.moveTo(-w * 0.3, h * 0.6); g.quadraticCurveTo(0, h * 0.8, w * 0.36, h * 0.5); g.lineWidth = h * 0.04; g.stroke();
    if (o.tear) {
      const k = o.tear;
      g.beginPath(); g.moveTo(-w * 0.3, h * 0.66); g.quadraticCurveTo(-w * 0.36, h * (0.9 + k * 1.4), -w * 0.28, h * (1.0 + k * 1.6)); g.quadraticCurveTo(-w * 0.2, h * (0.9 + k * 1.4), -w * 0.26, h * 0.66);
      g.fillStyle = "#cfefff"; g.fill(); g.lineWidth = h * 0.03; g.strokeStyle = P.ink; g.stroke();
    }
    g.restore();
  };
})();
