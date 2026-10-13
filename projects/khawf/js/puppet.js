// puppet.js — the shadow-play puppets (khayal al-zill): jointed figures of translucent coloured
// leather with punched star holes, rivets at the joints and control rods, drawn on Canvas 2D.
// Heads are in PROFILE (facing +x), as in the shadow theatre, so the shadows read as faces.
// The pose is plain data (angles in degrees, same convention as mirror-mirror's jester):
//   torso, head, lSh, lEl, rSh, rEl, lHip, lKnee, rHip, rKnee, shift, air, squash, spin,
//   lHand/rHand ("open" | "fist" | "point"), crackL/crackR (whip extension 0..1)
// Characters: fear (the Sultan), guest (Fear in a travel cloak), youth, child, mother.
window.MV = window.MV || {};
(function () {
  const U = MV.U, P = MV.P;
  const D = Math.PI / 180;
  const CW = 720, CH = 1180, GY = 1150, CX = CW / 2;
  MV.PUPPET_CANVAS = { w: CW, h: CH, groundY: GY };
  MV.JESTER_CANVAS = MV.PUPPET_CANVAS; // tools/motion_check.cjs reads this name

  const BASE = { thigh: 178, shin: 170, upper: 126, fore: 116, spine: 246, shoulder: 66, hip: 36, neck: 16 };
  const KIND = {
    fear: { k: 1.0, head: 1.3, robe: true },
    guest: { k: 1.0, head: 1.3, robe: true },
    mother: { k: 0.9, head: 1.15, robe: true },
    youth: { k: 0.84, head: 1.12, robe: false },
    child: { k: 0.6, head: 0.95, robe: false },
  };
  const PAL = {
    fear: { body: "#b8322a", body2: "#7a1712", trim: "#e8a33a", sash: "#2e3a7c", skin: "#e2a872", leg: "#7a1712", shoe: "#e8a33a", hair: "#24120a" },
    guest: { body: "#46557a", body2: "#262f4a", trim: "#9fb4dc", sash: "#5c3418", skin: "#d9a070", leg: "#262f4a", shoe: "#5c3418", hair: "#24120a" },
    youth: { body: "#1f8a8a", body2: "#11605e", trim: "#f3ead8", sash: "#e8a33a", skin: "#e2a872", leg: "#efe2c4", shoe: "#b8742a", hair: "#24120a", cap: "#e8a33a" },
    child: { body: "#e8a33a", body2: "#a86c22", trim: "#f3ead8", sash: "#1f8a8a", skin: "#e8b07a", leg: "#efe2c4", shoe: "#1f8a8a", hair: "#24120a", cap: "#1f8a8a" },
    mother: { body: "#2e3a7c", body2: "#1d2357", trim: "#e0aa4a", sash: "#e0aa4a", skin: "#e2a872", leg: "#1d2357", shoe: "#e0aa4a", hair: "#24120a", scarf: "#f3ead8" },
    // ghosts are cool blue-grey translucent shadows with an ink edge (draft 1's white ghosts vanished on the screen)
    ghost: { body: "rgba(62,82,138,0.66)", body2: "rgba(40,54,100,0.62)", trim: "rgba(176,196,240,0.85)", sash: "rgba(120,140,200,0.7)", skin: "rgba(96,116,170,0.66)", leg: "rgba(62,82,138,0.6)", shoe: "rgba(120,140,200,0.7)", hair: "rgba(200,214,245,0.8)", cap: "rgba(120,140,200,0.7)", scarf: "rgba(200,214,245,0.7)" },
    white: { body: "#f3ead8", body2: "#cfc3a6", trim: "#e0aa4a", sash: "#e0aa4a", skin: "#f8eedd", leg: "#cfc3a6", shoe: "#e0aa4a", hair: "#ffffff" },
    black: { body: "#1a1310", body2: "#000000", trim: "#7a1712", sash: "#7a1712", skin: "#2a1d16", leg: "#000000", shoe: "#7a1712", hair: "#000000" },
  };
  const INK = "#24120a";

  const dir = (a) => [Math.sin(a * D), Math.cos(a * D)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];

  // ------------------------------------------------------------------ poses
  const NEUTRAL = {
    torso: 0, shift: 0, head: 0, air: 0, squash: 0, spin: 1,
    lSh: -12, lEl: -8, rSh: 12, rEl: 8, lHip: -5, lKnee: 3, rHip: 5, rKnee: -3,
    lHand: "open", rHand: "open", crackL: 0, crackR: 0, mouth: 0, eyes: 1,
  };
  const POSES = {
    neutral: {},
    majesty: { lSh: -118, lEl: -28, rSh: 118, rEl: 28, head: -8, lHip: -9, rHip: 9, lHand: "fist", rHand: "fist" },
    throne: { lSh: -48, lEl: 104, rSh: 48, rEl: -104, head: -10, lHip: -12, rHip: 12, lHand: "fist", rHand: "fist" },
    whipUpL: { lSh: -165, lEl: -12, rSh: 40, rEl: 70, torso: 4, head: -6, lHip: -12, rHip: 6, lHand: "fist", rHand: "fist", crackL: 0.15 },
    whipUpR: { rSh: 165, rEl: 12, lSh: -40, lEl: -70, torso: -4, head: -6, lHip: -6, rHip: 12, lHand: "fist", rHand: "fist", crackR: 0.15 },
    lashL: { lSh: -72, lEl: -6, rSh: 30, rEl: 60, torso: 9, head: 4, lHip: -18, lKnee: 14, rHip: 4, lHand: "fist", rHand: "fist", crackL: 1 },
    lashR: { rSh: 72, rEl: 6, lSh: -30, lEl: -60, torso: -9, head: 4, rHip: 18, rKnee: -14, lHip: -4, lHand: "fist", rHand: "fist", crackR: 1 },
    bothUp: { lSh: -160, lEl: -20, rSh: 160, rEl: 20, head: -10, lHip: -12, rHip: 12, lHand: "fist", rHand: "fist", crackL: 0.2, crackR: 0.2 },
    // strut: a proud high step per metre foot, chin up, whip arms swung wide
    strutA: { torso: 6, head: -26, lSh: -150, lEl: -30, rSh: 70, rEl: 40, lHip: -14, lKnee: -10, rHip: 62, rKnee: -70, shift: -10, lHand: "fist", rHand: "fist", crackL: 0.5, air: 10 },
    strutB: { torso: 2, head: -22, lSh: -70, lEl: -40, rSh: 150, rEl: 30, lHip: -6, lKnee: -4, rHip: 10, rKnee: -6, shift: 12, lHand: "fist", rHand: "fist", crackR: 0.5 },
    bow: { torso: -12, head: 30, lSh: -30, lEl: 40, rSh: 30, rEl: -40, squash: 0.06, lHip: -8, rHip: 8 },
    cower: { lSh: -10, lEl: 165, rSh: 30, rEl: 120, head: 24, torso: 6, squash: 0.08, lHip: -16, lKnee: 26, rHip: 16, rKnee: -26 },
    // kneel on the back (left) knee: front thigh level, front shin vertical, back shin flat on the floor
    kneel: { torso: -14, head: 24, lSh: -20, lEl: -30, rSh: 30, rEl: 50, lHip: 4, lKnee: -94, rHip: 86, rKnee: -86, squash: 0.02 },
    buckle: { torso: -18, head: 26, lSh: -14, lEl: -20, rSh: 40, rEl: 60, lHip: -10, lKnee: -60, rHip: 40, rKnee: -70, squash: 0.03 },
    tired: { torso: -12, head: 20, lSh: -6, lEl: -4, rSh: 8, rEl: 6, lHip: -10, lKnee: 14, rHip: 9, rKnee: -12 },
    lookClose: { torso: -14, head: 8, lSh: -18, lEl: -24, rSh: 62, rEl: 74, rHand: "open", lHip: -8, rHip: 12, rKnee: -8 },
    pointDown: { rSh: 44, rEl: -4, rHand: "point", lSh: -30, lEl: -90, head: 10, torso: -4 },
    stopPalm: { rSh: 92, rEl: -78, lSh: -22, lEl: -30, head: -4, rHand: "open", lHip: -10, rHip: 10 },
    point: { rSh: 98, rEl: 0, rHand: "point", lSh: -26, lEl: -100, lHand: "fist", torso: -4, head: -4, rHip: 14, lHip: -6 },
    laugh: { head: -22, torso: 6, lSh: -24, lEl: 100, rSh: 24, rEl: -100, lHand: "fist", rHand: "fist", squash: 0.03, lHip: -10, rHip: 10 },
    fist: { rSh: 168, rEl: 0, rHand: "fist", lSh: -24, lEl: -60, lHand: "fist", head: -10, lHip: -12, rHip: 10 },
    bowDeep: { torso: -26, head: 30, lSh: -10, lEl: 70, rSh: 10, rEl: -70, squash: 0.1, lHip: -6, lKnee: 18, rHip: 6, rKnee: -18 },
    call: { lSh: -10, lEl: 150, rSh: 60, rEl: 100, head: -12, lHip: -10, rHip: 10 },
    offer: { rSh: 70, rEl: 26, lSh: -18, lEl: -20, torso: -6, head: 6, rHip: 12, rKnee: -8, lHip: -6 },
    lean: { lSh: -92, lEl: -14, rSh: 16, rEl: 20, torso: 8, head: 14, lHip: -10, lKnee: 18, rHip: 8, rKnee: -16 },
    standUp: { lSh: -60, lEl: -20, rSh: 30, rEl: 30, torso: -2, head: -12, lHip: -8, rHip: 8 },
    liftLantern: { rSh: 172, rEl: 0, rHand: "fist", lSh: -30, lEl: -30, head: -18, lHip: -10, rHip: 10 },
    heart: { rSh: 20, rEl: -160, rHand: "open", lSh: -18, lEl: -20, head: 10, lHip: -6, rHip: 6 },
    hold: { lSh: -25, lEl: 105, rSh: 25, rEl: -105, head: 22, torso: -6, lHip: -6, rHip: 6 },
    empty: { lSh: -46, lEl: -66, rSh: 46, rEl: 66, head: -16, torso: 2, lHip: -6, rHip: 6 },
    tall: { rSh: 96, rEl: -10, rHand: "open", lSh: -26, lEl: -20, head: -10, torso: 2, lHip: -14, rHip: 14 },
    face: { lSh: -16, lEl: -14, rSh: 16, rEl: 14, head: -2 },
    sit: { lHip: 78, lKnee: -78, rHip: 72, rKnee: -72, lSh: -40, lEl: -90, rSh: 40, rEl: 90, head: -10, lHand: "fist", rHand: "fist" },
    // gallop run (profile, facing +x): the front (right) leg always leads, so the shins never cross
    runA: { rHip: 46, rKnee: -34, lHip: -40, lKnee: -56, lSh: 50, lEl: 80, rSh: -60, rEl: -90, torso: -12, head: -4, air: 26 },
    runB: { rHip: 6, rKnee: -78, lHip: -6, lKnee: -22, lSh: -50, lEl: -90, rSh: 50, rEl: 80, torso: -12, head: -4, air: 4 },
    walkA: { rHip: 22, rKnee: -6, lHip: -20, lKnee: -26, lSh: 18, lEl: 20, rSh: -18, rEl: -20, torso: -3 },
    walkB: { rHip: 4, rKnee: -26, lHip: -4, lKnee: -6, lSh: -16, lEl: -20, rSh: 16, rEl: 20, torso: -3 },
    hideWalkA: { rHip: 22, rKnee: -6, lHip: -20, lKnee: -26, lSh: 18, lEl: 22, rSh: -20, rEl: -60, torso: -3 },
    hideWalkB: { rHip: 4, rKnee: -26, lHip: -4, lKnee: -6, lSh: -18, lEl: -22, rSh: -20, rEl: -60, torso: -3 },
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

  // moves: [beatOffset, poseName, ease], looping every `len` beats (beats = feet of the metre)
  const MOVES = {
    sway: { len: 2, smooth: true, keys: [[0, "neutral"], [1, "face"]] },
    whip: { len: 2, keys: [[0, "whipUpL", "outCubic"], [1, "lashL", "outExpo"]] },
    whips: { len: 4, keys: [[0, "whipUpL"], [1, "lashL"], [2, "whipUpR"], [3, "lashR"]] },
    strut: { len: 2, keys: [[0, "strutA", "outBack"], [1, "strutB", "outBack"]] },
    run: { len: 1, smooth: true, keys: [[0, "runA"], [0.5, "runB"]] },
    walk: { len: 2, smooth: true, keys: [[0, "walkA"], [1, "walkB"]] },
    hideWalk: { len: 2, smooth: true, keys: [[0, "hideWalkA"], [1, "hideWalkB"]] },
    laugh: { len: 2, keys: [[0, "laugh"], [1, "point"]] },
    majesty: { len: 4, keys: [[0, "majesty"], [2, "throne"]] },
    tremble: { len: 1, smooth: true, keys: [[0, "tired"], [0.5, "cower"]] },
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
      if (d >= -pre && d <= post) {
        const k = (d + pre) / (pre + post);
        return lerpPose(full(prev[1]), full(keys[j][1]), U.ease.inOutBack(k));
      }
    }
    let best = n - 1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = ((ph - keys[j][0]) % len + len) % len;
      if (d < bestD) { bestD = d; best = j; }
    }
    return full(keys[best][1]);
  }
  // choreo = [{b, move|pose}] on absolute beats; 0.6-beat S-curve crossfade between entries
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

  // ------------------------------------------------------------------ skeleton
  function solve(p, kind = "fear") {
    const kd = KIND[kind] || KIND.fear;
    const L = {};
    for (const k in BASE) L[k] = BASE[k] * kd.k;
    // knees bend FORWARD only (the figures face +x in profile): a knee value of either sign bends
    // the shin backwards. Draft 1 clamped like a frontal dancer and got backward knees and X-legs.
    p = Object.assign({}, p, { lKnee: -Math.abs(p.lKnee), rKnee: -Math.abs(p.rKnee) });
    const torsoA = p.torso;
    const pelvis = [CX + p.shift, 0];
    const hipL = [pelvis[0] - L.hip, 0], hipR = [pelvis[0] + L.hip, 0];
    const kneeL = add(hipL, mul(dir(p.lHip), L.thigh)), kneeR = add(hipR, mul(dir(p.rHip), L.thigh));
    const ankL = add(kneeL, mul(dir(p.lHip + p.lKnee), L.shin)), ankR = add(kneeR, mul(dir(p.rHip + p.rKnee), L.shin));
    const low = Math.max(ankL[1], ankR[1]);
    const dy = GY - 20 - low - p.air;
    for (const v of [pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR]) v[1] += dy;
    const sq = 1 - p.squash;
    const up = dir(180 + torsoA);
    const chest = add(pelvis, mul(up, L.spine * sq));
    const side = [Math.cos(torsoA * D), Math.sin(torsoA * D)];
    const shL = add(chest, mul([-side[0], -side[1]], L.shoulder));
    const shR = add(chest, mul(side, L.shoulder));
    const elL = add(shL, mul(dir(p.lSh + torsoA), L.upper)), elR = add(shR, mul(dir(p.rSh + torsoA), L.upper));
    const wrL = add(elL, mul(dir(p.lSh + p.lEl + torsoA), L.fore)), wrR = add(elR, mul(dir(p.rSh + p.rEl + torsoA), L.fore));
    const neckTop = add(chest, mul(up, L.neck));
    return { pelvis, hipL, hipR, kneeL, kneeR, ankL, ankR, chest, shL, shR, elL, elR, wrL, wrR, neckTop, torsoA, L };
  }
  MV.puppetJoints = solve;
  MV.jesterJoints = (p) => solve(p, "fear"); // tools/motion_check.cjs

  // age bends the Sultan: hunch, head down, knees soft
  MV.agePose = function (p, age) {
    if (!age) return p;
    const o = Object.assign({}, p);
    o.torso -= 12 * age;
    o.head += 12 * age;
    o.lKnee += 10 * age; o.rKnee -= 10 * age;
    o.squash += 0.03 * age;
    return o;
  };

  // ------------------------------------------------------------------ drawing helpers
  let punch = null;
  function punchPattern(g) {
    if (!punch) {
      // sparse punched holes: a small star and one dot on a staggered 72 px grid (NOT a diamond
      // checker: that read as mirror-mirror's harlequin on the first test)
      const s = 72, c = MV.canvas(s, s), x = c.getContext("2d");
      x.fillStyle = "#fff6dc";
      MV.star8(x, s * 0.25, s * 0.25, 5);
      x.fill();
      x.beginPath(); x.arc(s * 0.75, s * 0.75, 2.4, 0, U.TAU); x.fill();
      punch = c;
    }
    return g.createPattern(punch, "repeat");
  }
  function mixHex(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round((((pa >> s) & 255) * (1 - k)) + (((pb >> s) & 255) * k));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  function seg(g, a, b, wa, wb) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    g.beginPath();
    g.moveTo(a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2);
    g.lineTo(b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2);
    g.arc(b[0], b[1], wb / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, false);
    g.lineTo(a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2);
    g.arc(a[0], a[1], wa / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, false);
    g.closePath();
  }
  // fill the current path as backlit leather: colour, punched holes, outline
  function leather(g, col, st, holes = true) {
    if (!st.hollow) {
      g.fillStyle = col;
      g.fill();
      if (holes) {
        g.save();
        g.globalAlpha *= 0.55;
        g.fillStyle = punchPattern(g);
        g.fill();
        g.restore();
      }
    } else if (holes) {
      g.save();
      g.globalAlpha *= 0.9;
      g.fillStyle = punchPattern(g);
      g.fill();
      g.restore();
    }
    g.lineWidth = st.hollow ? 7 : 5.5;
    g.strokeStyle = st.ink;
    g.stroke();
  }
  function rivet(g, p, st) {
    g.beginPath();
    g.arc(p[0], p[1], 7, 0, U.TAU);
    g.fillStyle = st.hollow ? "rgba(0,0,0,0)" : "#e0aa4a";
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = st.ink;
    g.stroke();
  }
  function hand(g, st, wrist, ang, type, sc) {
    g.save();
    g.translate(wrist[0], wrist[1]);
    g.rotate(ang);
    g.scale(sc, sc);
    g.beginPath();
    if (type === "fist") g.ellipse(0, 14, 17, 17, 0, 0, U.TAU);
    else if (type === "point") { g.ellipse(0, 12, 16, 16, 0, 0, U.TAU); g.moveTo(6, 20); MV.roundRect(g, -5, 18, 10, 36, 5); }
    else {
      g.ellipse(0, 16, 16, 19, 0, 0, U.TAU);
      g.moveTo(10, 26);
      MV.roundRect(g, -12, 22, 24, 30, 9);
    }
    leather(g, st.pal.skin, st, false);
    g.restore();
  }
  // whip: wooden handle + tapering lash. crack 0 = hangs and sways, 1 = cracked straight out
  function whip(g, st, wrist, ang, crack, t, side) {
    const ux = Math.sin(-ang), uy = Math.cos(ang); // arm direction (down the forearm)
    const tip = [wrist[0] + ux * 58, wrist[1] + uy * 58];
    g.save();
    g.lineCap = "round";
    g.strokeStyle = st.ink;
    g.lineWidth = 16;
    g.beginPath(); g.moveTo(wrist[0], wrist[1]); g.lineTo(tip[0], tip[1]); g.stroke();
    g.strokeStyle = "#7a4e1c";
    g.lineWidth = 9;
    g.stroke();
    const sway = Math.sin(t * 3.1 + side) * 30;
    const lash = (c) => {
      const hang = [side * 60 + sway, 250];
      const ext = [ux * 360, uy * 360];
      const end = [tip[0] + U.lerp(hang[0], ext[0], c), tip[1] + U.lerp(hang[1], ext[1], c)];
      const mid1 = [tip[0] + U.lerp(side * 90, ext[0] * 0.35 - uy * 40 * side, c), tip[1] + U.lerp(60, ext[1] * 0.35 + ux * 40 * side, c)];
      const mid2 = [tip[0] + U.lerp(side * 40 + sway * 0.6, ext[0] * 0.7 + uy * 30 * side, c), tip[1] + U.lerp(170, ext[1] * 0.7 - ux * 30 * side, c)];
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const k = i / 24, a = 1 - k;
        pts.push([a * a * a * tip[0] + 3 * a * a * k * mid1[0] + 3 * a * k * k * mid2[0] + k * k * k * end[0],
                  a * a * a * tip[1] + 3 * a * a * k * mid1[1] + 3 * a * k * k * mid2[1] + k * k * k * end[1]]);
      }
      return pts;
    };
    const stroke = (pts, wmul, col) => {
      for (let i = 0; i < 24; i++) {
        g.beginPath();
        g.moveTo(pts[i][0], pts[i][1]);
        g.lineTo(pts[i + 1][0], pts[i + 1][1]);
        g.lineWidth = (22 * (1 - i / 26) + 5) * wmul;
        g.strokeStyle = col;
        g.stroke();
      }
    };
    // motion smear while the lash is cracking out (thick, readable at 1/4 size - critic P1)
    if (crack > 0.35 && !st.hollow) {
      g.globalAlpha *= 0.28;
      for (const d of [0.32, 0.2, 0.1]) stroke(lash(Math.max(0, crack - d)), 1.25, st.ink);
      g.globalAlpha /= 0.28;
    }
    const pts = lash(crack);
    stroke(pts, 1, st.ink);
    const end = pts[24];
    // the crack: a white spark at the tip when fully out
    const sp = U.clamp((crack - 0.8) / 0.2);
    if (sp > 0 && !st.hollow) {
      g.fillStyle = "#fff6dc";
      g.strokeStyle = st.ink;
      g.lineWidth = 4;
      MV.star8(g, end[0], end[1], 14 + 22 * sp);
      g.fill();
      g.stroke();
    }
    g.restore();
    return end;
  }

  // ------------------------------------------------------------------ heads (profile, facing +x)
  function head(g, st, J, pose, kind, o) {
    const kd = KIND[kind] || KIND.fear;
    const s = kd.head;
    g.save();
    g.translate(J.neckTop[0], J.neckTop[1]);
    g.rotate((J.torsoA + pose.head) * D);
    g.scale(s, s);
    const age = o.age || 0;
    const hairCol = kind === "fear" || kind === "guest" ? mixHex("#24120a", "#f3ead8", age) : mixHex("#24120a", "#f3ead8", o.grey || 0);
    // scarf drape behind (mother)
    if (o.crown === "scarf" || kind === "mother") {
      g.beginPath();
      g.moveTo(28, -112);
      g.bezierCurveTo(-30, -150, -80, -90, -66, -10);
      g.lineTo(-60, 70); g.lineTo(20, 40); g.lineTo(30, -6);
      g.closePath();
      leather(g, st.pal.scarf || P.bone, st);
    }
    // face profile
    const big = kind === "fear" || kind === "guest";
    g.beginPath();
    g.moveTo(-24, 6);
    g.bezierCurveTo(-48, -20, -50, -92, -12, -116);
    g.bezierCurveTo(10, -126, 34, -114, 40, -88);
    g.lineTo(44, -78);
    if (big) { g.lineTo(70, -56); g.lineTo(50, -48); } else { g.lineTo(58, -58); g.lineTo(45, -52); }
    g.lineTo(50, -40); g.lineTo(44, -34); g.lineTo(46, -20);
    g.quadraticCurveTo(34, -4, 16, 6);
    g.closePath();
    leather(g, st.pal.skin, st, false);
    // hair at the back (youth / old Sultan without crown)
    if (!big || o.crown === "none") {
      g.beginPath();
      g.moveTo(-14, -118); g.bezierCurveTo(-56, -100, -54, -40, -30, -20); g.lineTo(-18, -60); g.bezierCurveTo(-10, -90, 0, -104, 20, -112);
      g.closePath();
      leather(g, hairCol, st, false);
    }
    // eye (a punched hole) + brow
    g.beginPath();
    g.ellipse(26, -76, 11, 6, 0.1, 0, U.TAU);
    g.fillStyle = st.hollow ? "rgba(0,0,0,0)" : "#fff6dc";
    g.fill();
    g.lineWidth = 3; g.strokeStyle = st.ink; g.stroke();
    const blink = pose.eyes < 0.5;
    if (!blink) { g.beginPath(); g.arc(30, -76, 4, 0, U.TAU); g.fillStyle = st.ink; g.fill(); }
    g.lineWidth = big ? 8 : 5;
    g.lineCap = "round";
    g.beginPath();
    if (big) { const a0 = U.lerp(-92, -84, age), a1 = U.lerp(-80, -90, age); g.moveTo(12, a0); g.lineTo(44, a1); }
    else { g.moveTo(14, -88); g.lineTo(40, -88); }
    g.strokeStyle = big ? hairCol : st.ink;
    g.stroke();
    // beard + moustache (Sultan, guest)
    if (big) {
      const tipY = 80 + 50 * age;
      g.beginPath();
      g.moveTo(-8, -46); g.lineTo(48, -36); g.lineTo(58, 10);
      g.quadraticCurveTo(52, tipY - 30, 30, tipY); g.quadraticCurveTo(0, 40, -14, 12);
      g.closePath();
      leather(g, hairCol, st, false);
      g.beginPath();
      g.moveTo(48, -48); g.bezierCurveTo(78, -44, 94, -58, 84, -74);
      g.lineWidth = 10; g.strokeStyle = hairCol; g.stroke();
      g.lineWidth = 3; g.strokeStyle = st.ink; g.stroke();
    } else {
      g.beginPath(); g.moveTo(40, -36); g.lineTo(48, -37); g.lineWidth = 3; g.strokeStyle = st.ink; g.stroke();
    }
    // headgear
    const crown = o.crown || (kind === "fear" ? "taj" : kind === "guest" ? "turban" : kind === "mother" ? "scarf" : "cap");
    g.save();
    g.translate(0, -112);
    g.rotate((o.crownTilt || 0) * D);
    if (crown === "taj") {
      g.beginPath();
      g.moveTo(-44, 6); g.lineTo(46, -2); g.lineTo(46, -26); g.lineTo(-44, -18); g.closePath();
      leather(g, P.gold, st, false);
      g.beginPath();
      g.moveTo(-40, -18);
      g.bezierCurveTo(-70, -80, -20, -120, 4, -168);
      g.bezierCurveTo(30, -120, 80, -84, 42, -26);
      g.closePath();
      leather(g, "#c22d24", st);
      g.beginPath(); g.moveTo(4, -168); g.lineTo(-6, -24); g.moveTo(4, -168); g.lineTo(24, -24);
      g.lineWidth = 5; g.strokeStyle = P.gold; g.stroke();
      g.beginPath(); g.arc(30, -46, 11, 0, U.TAU); g.fillStyle = st.hollow ? "rgba(0,0,0,0)" : P.teal; g.fill(); g.lineWidth = 3; g.strokeStyle = st.ink; g.stroke();
      g.beginPath(); g.moveTo(4, -168); g.bezierCurveTo(-30, -210, -80, -200, -96, -160); g.bezierCurveTo(-70, -180, -30, -184, 4, -160);
      leather(g, P.gold, st, false);
    } else if (crown === "laurel") {
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * (1.05 - i * 0.11);
        const x = Math.cos(a) * 50, y = Math.sin(a) * -22 - 4;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 + 0.5);
        g.beginPath(); g.ellipse(0, 0, 20, 8, 0, 0, U.TAU);
        leather(g, i % 2 ? "#6f8f30" : "#9cbc4c", st, false);
        g.restore();
      }
    } else if (crown === "turban") {
      for (let i = 0; i < 3; i++) {
        g.beginPath(); g.ellipse(2, -10 - i * 22, 54 - i * 8, 20, -0.08, 0, U.TAU);
        leather(g, i % 2 ? "#e2d6bb" : P.bone, st, false);
      }
    } else if (crown === "cap") {
      g.beginPath(); g.moveTo(-40, 6); g.bezierCurveTo(-40, -40, 40, -44, 42, 0); g.closePath();
      leather(g, st.pal.cap || P.saffron, st);
    } else if (crown === "scarf") {
      g.beginPath(); g.moveTo(-50, 30); g.bezierCurveTo(-50, -40, 30, -46, 40, 8); g.lineTo(30, 12); g.bezierCurveTo(20, -20, -20, -20, -36, 40); g.closePath();
      leather(g, st.pal.scarf || P.bone, st, false);
    }
    g.restore();
    g.restore();
  }

  // ------------------------------------------------------------------ the figure
  // o: {age, whips, crown, crownTilt, tatter, hollow, blood, hideR, ghost, pal, grey, cape, heart, rods, t}
  MV.drawPuppet = function (g, kind, pose, o = {}, t = 0) {
    if (!o.keep) g.clearRect(0, 0, CW, CH);
    const kd = KIND[kind] || KIND.fear;
    const p = MV.agePose(pose, (kind === "fear" || kind === "guest") ? o.age || 0 : 0);
    const J = solve(p, kind);
    const st = { pal: o.pal ? PAL[o.pal] : o.ghost ? PAL.ghost : PAL[kind], ink: o.ghost ? "#141a36" : INK, hollow: !!o.hollow };
    if ((o.age || 0) > 0 && (kind === "fear")) {
      st.pal = Object.assign({}, st.pal, { body: mixHex(st.pal.body, "#7a5a48", o.age * 0.45), body2: mixHex(st.pal.body2, "#4a3a30", o.age * 0.4) });
    }
    g.save();
    g.globalAlpha = o.alpha !== undefined ? o.alpha : 1;
    g.translate(CX, GY);
    g.scale(p.spin, 1);
    g.translate(-CX, -GY);
    g.lineJoin = "round";
    g.lineCap = "round";
    const A = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
    const ks = kd.k;

    // control rods (behind): chest and both wrists down to below the canvas
    if (o.rods !== false && !o.ghost) {
      g.save();
      g.strokeStyle = "rgba(40,22,10,0.85)";
      g.lineWidth = 5;
      for (const [a, dx] of [[J.chest, 0], [J.wrL, -60], [J.wrR, 60]]) {
        if (a === J.wrR && o.hideR) continue;
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0] + dx, CH + 40); g.stroke();
      }
      g.restore();
    }
    // cape (Caesar) behind the body
    if (o.cape) {
      g.beginPath();
      g.moveTo(J.shL[0] - 10, J.shL[1]);
      g.quadraticCurveTo(J.pelvis[0] - 150 - 30 * Math.sin(t * 2), J.pelvis[1] + 60, J.pelvis[0] - 120, GY - 30);
      g.lineTo(J.pelvis[0] + 60, GY - 40);
      g.lineTo(J.shR[0] + 10, J.shR[1]);
      g.closePath();
      leather(g, "#a3201a", st);
    }
    // hidden right arm (behind the body)
    const drawArm = (side) => {
      const sh = side < 0 ? J.shL : J.shR, el = side < 0 ? J.elL : J.elR, wr = side < 0 ? J.wrL : J.wrR;
      const wide = kind === "fear" || kind === "guest" || kind === "mother";
      seg(g, sh, el, (wide ? 58 : 40) * ks, (wide ? 50 : 32) * ks);
      leather(g, st.pal.body, st);
      seg(g, el, wr, (wide ? 50 : 32) * ks, (wide ? 64 : 26) * ks);
      const bloody = o.blood && side < 0;
      leather(g, bloody ? "#d81a10" : st.pal.body2, st);
      if (bloody) {
        // drips under the left cuff (closed form in t)
        g.save();
        g.fillStyle = "#c8140f";
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.7 + i / 3) % 1;
          const x = wr[0] - 16 + i * 16, y = wr[1] + 14 + ph * 200;
          g.globalAlpha = (1 - ph) * (o.alpha !== undefined ? o.alpha : 1);
          g.beginPath(); g.ellipse(x, y, 8, 14, 0, 0, U.TAU); g.fill();
        }
        g.restore();
      }
      hand(g, st, wr, A(el, wr), side < 0 ? p.lHand : p.rHand, ks);
      rivet(g, sh, st); rivet(g, el, st);
      if (o.whips && !(side > 0 && o.hideR)) whip(g, st, wr, A(el, wr), side < 0 ? p.crackL : p.crackR, t, side);
    };
    if (o.hideR) drawArm(1);

    // legs
    const robed = kd.robe;
    const legW = robed ? 34 : 40;
    for (const [hp, kn, an, sd] of [[J.hipL, J.kneeL, J.ankL, -1], [J.hipR, J.kneeR, J.ankR, 1]]) {
      seg(g, hp, kn, legW * ks + 8, legW * ks);
      leather(g, st.pal.leg, st, false);
      seg(g, kn, an, legW * ks, (legW - 10) * ks);
      leather(g, st.pal.leg, st, false);
      // pointed slipper
      g.beginPath();
      g.moveTo(an[0] - 14, an[1] - 6);
      g.quadraticCurveTo(an[0] - 16, an[1] + 22, an[0] + 10, an[1] + 22);
      g.quadraticCurveTo(an[0] + 60 * ks, an[1] + 22, an[0] + 70 * ks, an[1] - 8);
      g.quadraticCurveTo(an[0] + 40, an[1] - 2, an[0] - 14, an[1] - 6);
      g.closePath();
      leather(g, st.pal.shoe, st, false);
      if (!robed) rivet(g, kn, st);
      void sd;
    }

    // robe / tunic
    const pe = J.pelvis, sh = J.shL, sR = J.shR;
    const hemY = robed ? U.lerp(Math.max(J.kneeL[1], J.kneeR[1]), Math.max(J.ankL[1], J.ankR[1]), kind === "mother" ? 0.85 : 0.55) : pe[1] + 70 * ks;
    const spread = Math.abs(J.kneeR[0] - J.kneeL[0]);
    const hemL = Math.min(J.kneeL[0], J.ankL[0]) - (robed ? 40 : 26) * ks - spread * 0.1;
    const hemR = Math.max(J.kneeR[0], J.ankR[0]) + (robed ? 40 : 26) * ks + spread * 0.1;
    g.beginPath();
    g.moveTo(J.neckTop[0], J.neckTop[1] + 6);
    g.lineTo(sh[0], sh[1]);
    g.quadraticCurveTo(sh[0] + 6, (sh[1] + pe[1]) / 2, pe[0] - 58 * ks, pe[1]);
    g.lineTo(hemL, hemY);
    if (o.tatter) {
      const n = 9;
      for (let i = 1; i <= n; i++) {
        const x = U.lerp(hemL, hemR, i / n), y = hemY + (i % 2 ? 26 : -4) + U.hash(i, 9) * 18;
        g.lineTo(x, y);
      }
    } else {
      g.quadraticCurveTo((hemL + hemR) / 2, hemY + 18, hemR, hemY);
    }
    g.lineTo(pe[0] + 58 * ks, pe[1]);
    g.quadraticCurveTo(sR[0] - 6, (sR[1] + pe[1]) / 2, sR[0], sR[1]);
    g.closePath();
    leather(g, st.pal.body, st);
    // trim: centre band + hem band of punched dots
    if (!st.hollow) {
      g.save();
      g.lineCap = "butt";
      g.strokeStyle = st.pal.trim;
      g.lineWidth = 16 * ks;
      g.beginPath(); g.moveTo(J.neckTop[0], J.neckTop[1] + 14); g.lineTo(pe[0], pe[1]); g.lineTo((hemL + hemR) / 2, hemY + 10); g.stroke();
      g.fillStyle = "#fff6dc";
      for (let i = 0; i < 6; i++) {
        const k = i / 6;
        g.beginPath(); g.arc(U.lerp(J.neckTop[0], pe[0], k), U.lerp(J.neckTop[1] + 20, pe[1], k), 3.5, 0, U.TAU); g.fill();
      }
      g.restore();
    }
    // embroidered yoke: a band of gold stars across the chest
    if (!st.hollow && robed) {
      g.save();
      g.fillStyle = st.pal.trim;
      const y0 = J.chest[1] + 40 * ks;
      for (let i = -2; i <= 2; i++) { MV.star8(g, J.chest[0] + i * 26 * ks, y0 + Math.abs(i) * 4, 9 * ks); g.fill(); }
      g.restore();
    }
    // tatters: patches + torn holes
    if (o.tatter) {
      const patches = [[-50, 60, "#5c3418"], [40, 150, "#2e3a7c"], [-20, 240, "#7a5a48"]];
      for (const [dx, dy, c] of patches) {
        g.save();
        g.translate(pe[0] + dx * ks, J.chest[1] + dy * ks);
        g.rotate(U.hash(dx, dy) - 0.5);
        g.beginPath(); g.rect(-24, -20, 48, 40);
        g.fillStyle = c; g.fill();
        g.setLineDash([6, 5]); g.lineWidth = 3; g.strokeStyle = "#f3ead8"; g.stroke();
        g.restore();
      }
      g.save();
      g.globalCompositeOperation = "destination-out";
      for (const [dx, dy, r] of [[30, 90, 16], [-40, 190, 12], [10, 300, 20]]) {
        g.beginPath(); g.ellipse(pe[0] + dx * ks, J.chest[1] + dy * ks, r, r * 0.7, 0.4, 0, U.TAU); g.fill();
      }
      g.restore();
    }
    // sash
    g.save();
    g.translate(pe[0], pe[1] - 6);
    g.rotate(J.torsoA * D);
    MV.roundRect(g, -62 * ks, -14, 124 * ks, 28, 8);
    leather(g, st.pal.sash, st, false);
    g.restore();

    // arms (left always in front; right in front unless hidden)
    drawArm(-1);
    if (!o.hideR) drawArm(1);

    // heart flame (courage / fear in the heart), drawn over the arms: it glows through
    if (o.heart) {
      const hx = J.chest[0] + 18, hy = J.chest[1] + 70 * ks, hs = o.heart;
      g.save();
      g.globalCompositeOperation = "lighter";
      const grd = g.createRadialGradient(hx, hy, 0, hx, hy, 120 * hs);
      grd.addColorStop(0, "rgba(255,230,160,0.95)");
      grd.addColorStop(0.4, "rgba(255,160,60,0.5)");
      grd.addColorStop(1, "rgba(255,120,30,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(hx, hy, 120 * hs, 0, U.TAU); g.fill();
      const fl = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29);
      g.fillStyle = "rgba(255,248,220,1)";
      g.beginPath();
      g.moveTo(hx, hy - 46 * hs * fl);
      g.quadraticCurveTo(hx + 22 * hs, hy - 6 * hs, hx, hy + 18 * hs);
      g.quadraticCurveTo(hx - 22 * hs, hy - 6 * hs, hx, hy - 46 * hs * fl);
      g.fill();
      g.restore();
    }

    // head
    head(g, st, J, p, kind, o);
    g.restore();
    return J;
  };
})();
