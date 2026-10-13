// shots2.js — THE EDIT, part 2: the COLOUR ANIME act («يا موت» -> the end), the instrumental finale
// (40.12 - 57.15 s) and the title card. Same helpers as shots.js (MV.__shotHelpers).
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, O = MV.Overlay, P = MV.P;
  const { pose, cam, word, sfx, flash, impact, rifleDraw, glint, wf, T0, shot, TITLE } = MV.__shotHelpers;
  const bt = (t) => U.beatAt(t);
  const BURST = wf(9, "يا");

  // ---- S9 «يا موت لا أجبن منك أو ألص»: impact frame, the page shatters, colour floods out of the hero
  {
    const tM = wf(9, "موت"), tC = wf(9, "أجبن"), tT = wf(9, "ألص");
    shot(T0(9), T0(10), "ya-mawt-burst", (ctx) => {
      const t = ctx.t;
      ctx.burst = true;
      pose(ctx, 0, [{ b: 0, pose: "shout" }, { b: bt(tM), pose: "pointAt", x: 0.3 }], { expr: "shout", wind: -1, hairFlare: U.inv(BURST, BURST + 0.3, t), gv: 0.4 });
      pose(ctx, 1, [{ b: 0, move: "tremble" }], { kind: "death", fear: 1, gv: 0, wind: 0.3 });
      W.setCity({ sky: "dusk", mode: "roof", sun: [-60, 12, -200, 70] });
      ctx.punch = 1.4 * U.eventPulse(t, [BURST, tM, tC], 0.3);
      cam(ctx, [[0, [1.2, 1.1, 6.6], [0.2, 2.6, -2], 46, -0.06], [1, [0.8, 1.2, 5.8], [0.4, 2.6, -2], 46, -0.03]]);
      W.char(1, 3.6, 0, -6.5, 3.0);
      W.char(0, -0.9, 0, 0.8, 4.3);
      // before the burst: still the manga print; then a radial colour wipe from the hero's chest
      const rad = U.ease.outCubic(U.inv(BURST + 0.02, BURST + 0.5, t)) * 2300;
      if (t < BURST + 0.5) {
        ctx.manga = true;
        const c = W.project(-0.9, 2.6, 0.8);
        ctx.mangaMask = (g) => { if (rad <= 0) return; const gr = g.createRadialGradient(c[0], c[1], rad * 0.75, c[0], c[1], rad); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], rad, 0, U.TAU); g.fill(); };
      }
      impact(ctx, [BURST], 5);
      impact(ctx, [tM + 0.02], 3, false);
      ctx.under.push(() => { const a = 1 - U.inv(BURST + 0.2, BURST + 1.3, t); if (t > BURST && a > 0) { const c = W.project(-0.9, 2.6, 0.8); MV.speedLines(O.g, c[0], c[1], 260, { t, n: 110, color: "#ffffff", alpha: 0.85 * a }); } });
      ctx.post.bloom = 0.35;
      word(ctx, "يا موت", BURST, 1320, 230, { size: 210, style: "white" });
      word(ctx, "أجبن", tC, 1500, 520, { size: 170, style: "red", t1: tT + 0.1 });
      sfx(ctx, "بوم!", BURST + 0.05, 330, 220, { size: 170, rot: -0.15, color: "#e8283c", t1: BURST + 1.0 });
      word(ctx, "ألص", tT, 1560, 760, { size: 120, style: "gold" });
      flash(ctx, "#ffd36b", [tM], 0.2, 0.5);
    });
  }

  // ---- S10 «لم فتني في الصف والقتلى ترص»: the row of shrouded dead; Death walks the row and skips him
  {
    const tW = wf(10, "فتني"), tR = wf(10, "والقتلى");
    shot(T0(10), T0(11), "the-row", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "storm", row: true, fogNear: 30, fogFar: 120 });
      const dx = U.lerp(-16, 22, U.ease.inOutSine(ctx.k));
      pose(ctx, 1, [{ b: 0, move: "breathe" }], { kind: "death", gv: 0, wind: 0.2 });
      const passed = dx > 14.6;
      pose(ctx, 0, [{ b: 0, pose: "sad" }, { b: bt(T0(10) + 1.6), pose: "reach", x: 0.5 }], { expr: passed ? "shock" : "sad", wind: 0.3, look: passed ? 1 : 0 });
      cam(ctx, [[0, [-9, 2.4, 8.5], [-4, 1.0, 0], 40], [1, [10.5, 2.0, 6.4], [14, 1.6, 0], 40]]);
      W.char(1, dx, 0, -1.8, 3.4);
      W.char(0, 14.6, 0, 0.6, 2.9);
      ctx.post.lift = 0.15;
      word(ctx, "فتني", tW, 1500, 200, { size: 170, style: "white" });
      word(ctx, "الصف", tR - 0.3, 420, 220, { size: 110, style: "gold" });
    });
  }

  // ---- S11 «تعال أرج حصتي بين الحصص»: come and give me my share: the hero beckons, aura rising
  {
    const tC = wf(11, "تعال"), tS = wf(11, "حصتي");
    shot(T0(11), T0(12), "beckon", (ctx) => {
      const t = ctx.t;
      ctx.go = true;
      W.setCity({ sky: "dusk", mode: "roof", sun: [-60, 12, -200, 70] });
      pose(ctx, 0, [{ b: 0, pose: "fight" }, { b: bt(tC), pose: "beckon", x: 0.3 }, { b: bt(tS + 0.4), pose: "openArms", x: 0.5 }], { expr: "angry", wind: -0.8, aura: U.inv(tC, tC + 0.6, t) * 0.8 });
      pose(ctx, 1, [{ b: 0, move: "tremble" }], { kind: "death", fear: 1, gv: 0, wind: 0.5 });
      cam(ctx, [[0, [0.5, 2.3, 8.6], [0, 2.4, 0], 40], [1, [0.3, 2.2, 6.9], [0, 2.5, 0], 40]]);
      W.char(1, 4.4, 0, -6 - ctx.k * 2, 2.6);
      W.char(0, -0.6, 0, 0.6, 4.1);
      flash(ctx, "#ff8a3d", [tC], 0.22, 0.5);
      word(ctx, "تعال", tC, 1380, 260, { size: 220, style: "red" });
      word(ctx, "حصتي", tS, 1420, 520, { size: 130, style: "gold" });
    });
  }

  // ---- S12 «قرد بخبز الولد الباكي رقص»: the monkey dances with the crying boy's bread
  {
    const tM = wf(12, "قرد"), tB = wf(12, "الباكي"), tD = wf(12, "رقص");
    shot(T0(12), T0(13), "monkey-dance", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "dusk" });
      pose(ctx, 3, [{ b: 0, move: "dance" }], { kind: "monkey", bread: true, gv: 1 });
      pose(ctx, 2, [{ b: 0, pose: "cry" }], { kind: "boy", expr: "cry", tears: true, gv: 0.3 });
      cam(ctx, [[0, [0, 1.3, 5.0], [0, 1.3, 0], 40], [1, [0.4, 1.2, 4.4], [0.2, 1.3, 0], 40]]);
      W.char(2, -1.4, 0, 0.3, 3.1);
      W.char(3, 1.3, 0, 0.6, 3.6 + 0.08 * U.beatPulse(t, 0.3));
      word(ctx, "قرد", tM, 1500, 200, { size: 140, style: "gold" });
      word(ctx, "رقص", tD, 1480, 780, { size: 200, style: "red" });
      ctx.overlay.push(() => { // music notes for the dance (drawn, closed form)
        for (let i = 0; i < 5; i++) {
          const ph = (t * 0.7 + i * 0.2) % 1, x = 1100 + i * 90 + Math.sin(ph * 6 + i) * 30, y = 700 - ph * 500;
          const g = O.g; g.save(); g.globalAlpha = 1 - ph; g.fillStyle = "#120d1c"; g.strokeStyle = "#fff2c4"; g.lineWidth = 6;
          g.beginPath(); g.ellipse(x, y, 20, 15, -0.4, 0, U.TAU); g.stroke(); g.fill(); g.fillRect(x + 14, y - 70, 7, 70); g.restore();
        }
      });
      void tB;
    });
  }

  // ---- S13 «والقرد حر والصبي في القفص»: the monkey sits free on top; the boy is in the Blender cage
  {
    const tF = wf(13, "حر"), tC = wf(13, "القفص");
    shot(T0(13), T0(14), "boy-in-cage", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "dusk" });
      pose(ctx, 2, [{ b: 0, pose: "cry" }], { kind: "boy", expr: "cry", tears: true, gv: 0.2 });
      pose(ctx, 3, [{ b: 0, pose: "sitTop" }], { kind: "monkey", bread: true, gv: 0.6 });
      cam(ctx, [[0, [0, 2.6, 9.4], [0, 2.6, 0], 40], [1, [0, 2.4, 7.8], [0, 2.6, 0], 40]]);
      W.char(2, 0, 1.05, -0.1, 3.5);
      W.atlas("cage", W.loopFrame("cage", t, 0.6), 0, -0.25, 0.3, 5.6, { bottom: true, order: 5 });
      W.char(3, 0.2, 4.2, 0.5, 2.6, { order: 6 });
      word(ctx, "حر", tF, 1440, 260, { size: 200, style: "gold" });
      word(ctx, "القفص", tC, 500, 820, { size: 190, style: "red" });
    });
  }

  // ---- S14 «يهرب مني وهو قد عم وخص»: Death flees over the roofs; its shadow covers all, then one window
  {
    const tR = wf(14, "يهرب"), tA = wf(14, "عم"), tK = wf(14, "وخص");
    shot(T0(14), T0(15), "death-flees", (ctx) => {
      const t = ctx.t, k = ctx.k;
      W.setCity({ sky: "dusk", mode: "roof", sun: [-60, 12, -200, 70] });
      pose(ctx, 1, [{ b: 0, move: "run" }], { kind: "death", fear: 0.8, wind: 1, gv: 0 });
      pose(ctx, 0, [{ b: 0, move: "run" }], { expr: "angry", wind: -1, gv: 0 });
      const dz = U.lerp(-3, -30, k), dy = Math.abs(Math.sin(k * Math.PI * 3)) * 3;
      cam(ctx, [[0, [0.5, 1.7, 9], [0, 2.4, -10], 44], [1, [0.3, 2.0, 6.5], [0, 2.6, -20], 44]], undefined, "linear");
      W.char(1, 1.4, dy, dz, 3.6);
      W.char(0, -1.3, 0, U.lerp(3.2, 1.2, k), 3.2);
      ctx.under.push(() => MV.streaks(O.g, 0.02, { t, n: 30, color: "#fff2c4", alpha: 0.35 }));
      // «عم»: a violet shadow sweeps over the whole city
      const sw = U.ease.inOutCubic(U.inv(tA, tA + 0.5, t));
      if (sw > 0) ctx.overlay.push(() => { const g = O.g; g.save(); g.globalCompositeOperation = "multiply"; const x = -400 + sw * 2700; const gr = g.createLinearGradient(x - 900, 0, x, 0); gr.addColorStop(0, "rgba(70,40,120,1)"); gr.addColorStop(1, "rgba(255,255,255,1)"); g.fillStyle = gr; g.fillRect(0, 0, Math.min(1920, x), 1080); g.restore(); });
      word(ctx, "يهرب", tR, 1460, 230, { size: 200, style: "white" });
      word(ctx, "عم", tA, 420, 260, { size: 150, style: "gold", t1: tK + 0.4 });
      word(ctx, "وخص", tK, 520, 470, { size: 120, style: "red" });
    });
  }

  // ---- S15 «يغلو علي في مواسم الرخص»: death is cheap for everyone, priceless for him
  {
    const tG = wf(15, "يغلو"), tS = wf(15, "الرخص");
    shot(T0(15), 40.12, "priceless", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "dusk", mode: "roof", sun: [-60, 12, -200, 70] });
      pose(ctx, 0, [{ b: 0, pose: "reach" }], { expr: "sad", wind: -0.6 });
      pose(ctx, 1, [{ b: 0, pose: "tiptoe" }], { kind: "death", fear: 0.5, wind: 0.6, gv: 0 });
      cam(ctx, [[0, [-2.4, 2.1, 7.8], [1, 2.3, -4], 42], [1, [-2.2, 2.0, 6.6], [1.2, 2.3, -4], 42]]);
      W.char(1, 3.5, 0, -7 - ctx.k * 2, 2.8);
      W.char(0, -1.4, 0, 0.8, 3.8);
      ctx.overlay.push(() => {
        const g = O.g;
        // falling sale tags (cheap) everywhere
        for (let i = 0; i < 14; i++) {
          const ph = (t * 0.35 + U.hash(i, 1)) % 1, x = 80 + U.hash(i, 2) * 1760, y = -80 + ph * 1240, rot = Math.sin(t * 2 + i) * 0.4;
          g.save(); g.translate(x, y); g.rotate(rot);
          g.fillStyle = "#fff2c4"; g.strokeStyle = "#120d1c"; g.lineWidth = 5;
          g.beginPath(); g.moveTo(-60, -34); g.lineTo(44, -34); g.lineTo(70, 0); g.lineTo(44, 34); g.lineTo(-60, 34); g.closePath(); g.fill(); g.stroke();
          g.font = "400 46px Lalezar"; g.direction = "rtl"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#e8283c";
          g.fillText(i % 3 ? "٠" : "رخيص", -6, 4);
          g.restore();
        }
        // Death's own tag: the number runs away (priceless)
        const c = W.project(3.5, 3.1, -7 - ctx.k * 2);
        const n = Math.floor(Math.pow(10, 1 + 7 * U.inv(tG, tG + 1.2, t)));
        g.save(); g.translate(c[0] + 120, c[1] - 120); g.rotate(-0.12);
        g.fillStyle = "#ffd36b"; g.strokeStyle = "#120d1c"; g.lineWidth = 7;
        g.beginPath(); g.moveTo(-170, -60); g.lineTo(130, -60); g.lineTo(180, 0); g.lineTo(130, 60); g.lineTo(-170, 60); g.closePath(); g.fill(); g.stroke();
        g.font = "400 70px Lalezar"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#120d1c";
        g.fillText(t > tS ? "∞" : String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]), -10, 6);
        g.restore();
      });
      word(ctx, "يغلو", tG, 1380, 820, { size: 190, style: "gold" });
      word(ctx, "الرخص", tS, 520, 860, { size: 130, style: "red" });
    });
  }

  // ===================================================================== FINALE (instrumental)
  // ---- F1 40.12: the eye ignites (colour extreme close-up)
  shot(40.12, 41.64, "eye-ignites", (ctx) => {
    const t = ctx.t;
    W.setCity({ sky: "dusk", mode: "roof" });
    cam(ctx, [[0, [0, 3, 8], [0, 3, 0], 40]]);
    const k = U.inv(40.12, 41.5, t);
    ctx.overlay.push(() => {
      const g = O.g;
      g.fillStyle = "#2b1a5e"; g.fillRect(0, 0, 1920, 1080);
      MV.speedLines(g, 960, 560, 420, { t, n: 90, color: "#ff8a3d", alpha: 0.6 + 0.4 * k });
      MV.drawEyeCU(g, 960, 560 + Math.sin(t * 40) * 3 * k, 1200 * (1 + 0.15 * U.ease.inOutSine(k)), { look: 0, irisA: "#3a0606", irisB: "#e8283c", irisC: "#ffd36b", glow: 0.15 + 0.45 * k, pupil: U.lerp(0.36, 0.18, k), brow: -0.12 });
    });
    sfx(ctx, "ووووش", 40.6, 1520, 900, { size: 150, rot: -0.1, color: "#ffd36b", inner: "#120d1c" });
    flash(ctx, "#ff8a3d", [40.12, 41.2], 0.2, 0.4);
  });
  // ---- F2 41.64: power-up (aura, hair flare, the scarf blazes)
  shot(41.64, 43.16, "power-up", (ctx) => {
    const t = ctx.t;
    ctx.go = true;
    W.setCity({ sky: "dusk", mode: "roof", sun: [-60, 12, -200, 70] });
    pose(ctx, 0, [{ b: 0, pose: "power" }, { b: bt(42.4), pose: "vUp", x: 0.4 }], { expr: "shout", wind: -1, aura: 1, hairFlare: 1, gv: 0.6 });
    const a = U.lerp(-0.5, 0.5, ctx.k);
    ctx.shake = 0.04;
    cam(ctx, [[0, [Math.sin(a) * 7.5, 0.9, Math.cos(a) * 7.5], [0, 2.7, 0], 44]], undefined, "linear", 0);
    W.char(0, 0, 0, 0, 4.4);
    ctx.under.push(() => MV.speedLines(O.g, 960, 480, 380, { t, n: 120, color: "#fff2c4", alpha: 0.7 }));
    flash(ctx, "#ffd36b", [41.64], 0.22, 0.7);
    ctx.post.bloom = 0.5;
  });
  // ---- F3 43.16: the dash, the impact frame, the cage breaks, the boy is free
  {
    const HIT = 44.68;
    shot(43.16, 46.2, "break-the-cage", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "dusk" });
      const hx = U.lerp(-7, 3.6, U.ease.inQuad(U.inv(43.2, HIT, t)));
      pose(ctx, 0, t < HIT ? [{ b: 0, move: "dash" }] : [{ b: 0, pose: "punch" }], { expr: "shout", wind: -1, aura: 0.6, gv: 0 });
      pose(ctx, 2, t < HIT + 0.4 ? [{ b: 0, pose: "cry" }] : [{ b: 0, pose: "jump" }, { b: bt(HIT + 1.0), move: "groove" }], { kind: "boy", expr: t < HIT ? "cry" : "happy", tears: t < HIT });
      pose(ctx, 3, [{ b: 0, move: "run" }], { kind: "monkey", gv: 0 });
      ctx.punch = 2 * U.eventPulse(t, [HIT], 0.3);
      ctx.shake = 0.12 * U.eventPulse(t, [HIT], 0.4);
      if (t < HIT) W.cam([hx - 3.2, 1.5, 7.6], [hx + 2.6, 2.0, 0], 42);
      else cam(ctx, [[0, [2.2, 1.8, 8.6], [5, 2.2, 0], 42], [1, [3, 2.2, 9.0], [5.5, 2.4, 0], 42]]);
      const jumpY = t > HIT + 0.4 ? Math.max(0, Math.sin(U.inv(HIT + 0.4, HIT + 1.2, t) * Math.PI)) * 1.6 : 0.5;
      W.char(2, 6, jumpY + 0.25, -0.1, 3.0);
      if (t < HIT) W.atlas("cage", W.loopFrame("cage", t, 0.6), 6, -0.25, 0.3, 5.6, { bottom: true, order: 5 });
      else W.atlas("cageburst", U.ease.outCubic(U.inv(HIT, HIT + 0.8, t)) * 31.99, 6, -1.6, 0.3, 8.4, { bottom: true, order: 5 });
      if (t > HIT) W.char(3, U.lerp(7, 16, U.inv(HIT, 46.2, t)), 0, 1, 2.4);
      W.char(0, hx, 0, 1.0, 3.4);
      if (t < HIT) ctx.under.push(() => MV.streaks(O.g, 0, { t, n: 50, color: "#ffffff", alpha: 0.6 }));
      impact(ctx, [HIT], 5);
      impact(ctx, [HIT + 5 / 60], 3, false);
      sfx(ctx, "كرررك!", HIT, 1300, 260, { size: 200, rot: -0.12, color: "#ffd36b", inner: "#120d1c", t1: 45.9 });
      flash(ctx, "#ffffff", [HIT + 8 / 60], 0.22, 0.6);
    });
  }
  // ---- F4 46.2: Death flees into the sunrise, drops the rifle, bursts into crows
  {
    const DROP = 47.72, CROWS = 48.48;
    shot(46.2, 50.0, "flees-into-sunrise", (ctx) => {
      const t = ctx.t;
      W.setCity({ sky: "dawn", mode: "roof", sun: [0, 16, -220, 90] });
      pose(ctx, 0, [{ b: 0, pose: "lookUp" }, { b: bt(47.2), pose: "pointAt", x: 0.6 }], { expr: "angry", wind: 0.6 });
      pose(ctx, 1, [{ b: 0, move: "run" }], { kind: "death", fear: 1, wind: 1, gv: 0 });
      cam(ctx, [[0, [-1.5, 1.6, 9], [0.5, 3.0, -10], 42], [1, [-1.2, 1.4, 8], [0.5, 3.6, -12], 42]]);
      const fk = U.inv(46.2, CROWS, t), dz = U.lerp(-6, -40, fk), dy = U.lerp(0, 8, fk * fk);
      if (t < CROWS) W.char(1, 1.5, dy, dz, 3.2);
      W.char(0, -2.4, 0, 1.8, 3.9);
      // the rifle falls and sticks in the roof
      if (t > DROP) {
        const fall = U.clamp((t - DROP) / 0.55);
        const y = U.lerp(4.5, 0.75, fall * fall), fr = fall < 1 ? W.loopFrame("rifle", t, 2.2) : 0;
        const m = W.atlas("rifle", fr, 2.4, y, -3.0, 1.5, { order: 4 });
        if (m && fall >= 1) m.rotateZ(-1.1);
      }
      if (t > CROWS) ctx.overlay.push(() => {
        const c = W.project(1.5, dy + 1.5, dz), g = O.g, k = t - CROWS;
        g.fillStyle = "#120d1c";
        for (let i = 0; i < 34; i++) {
          const a = -Math.PI / 2 + (U.hash(i, 1) - 0.5) * 2.4, sp = 140 + U.hash(i, 2) * 260;
          const x = c[0] + Math.cos(a) * sp * k + Math.sin(k * 3 + i) * 20, y = c[1] + Math.sin(a) * sp * k;
          const flap = Math.sin(t * 22 + i) * 0.6, s = 14 + U.hash(i, 3) * 16;
          g.beginPath(); g.moveTo(x - s, y - s * flap); g.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y + s * 0.2); g.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - s * flap); g.quadraticCurveTo(x, y, x - s, y - s * flap); g.fill();
        }
      });
      sfx(ctx, "ووش", CROWS, 1300, 240, { size: 140, rot: -0.08, color: "#120d1c", t1: 49.6 });
      flash(ctx, "#ffffff", [CROWS], 0.2, 0.45);
      ctx.post.bloom = 0.45;
    });
  }
  // ---- F5 50.0: the kite flies again (the joy that had been flipped comes back)
  shot(50.0, 53.8, "kite-again", (ctx) => {
    const t = ctx.t;
    W.setCity({ sky: "dawn", mode: "roof", sun: [0, 16, -220, 90] });
    pose(ctx, 0, [{ b: 0, pose: "lookUp" }, { b: bt(51.5), move: "groove" }], { expr: "happy", wind: 0.5, gv: 0.6 });
    pose(ctx, 2, [{ b: 0, pose: "vUp" }], { kind: "boy", expr: "happy", gv: 0.8 });
    cam(ctx, [[0, [0, 1.5, 7.0], [0, 2.2, 0], 42], [1, [0.3, 1.4, 6.8], [0.3, 3.3, -2], 42]]);
    W.char(0, -1.6, 0, 0.4, 3.6);
    W.char(2, 1.3, 0, 0.9, 3.0);
    const m = W.atlas("rifle", 0, 4.5, 0.75, -3.0, 1.5, { order: 4 });
    if (m) m.rotateZ(-1.1);
    ctx.overlay.push(() => {
      const g = O.g, hand = W.project(1.3, 2.6, 0.9);
      const kx = 1220 + Math.sin(t * 0.9) * 120, ky = 230 + Math.cos(t * 1.3) * 40 - (t - 50) * 10;
      g.strokeStyle = "#120d1c"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(hand[0], hand[1]); g.quadraticCurveTo((hand[0] + kx) / 2 + 80, (hand[1] + ky) / 2 + 120, kx, ky + 60); g.stroke();
      MV.drawKite(g, kx, ky, 80, Math.sin(t * 2) * 0.25, t);
    });
    ctx.post.bloom = 0.45;
  });
  // ---- F6 53.8: close-up: he smiles; the reaper's rifle stands abandoned behind him
  shot(53.8, TITLE, "survivor", (ctx) => {
    const t = ctx.t;
    W.setCity({ sky: "dawn", mode: "roof", sun: [-8, 14, -220, 120] });
    pose(ctx, 0, [{ b: 0, move: "breathe" }], { expr: "smile", wind: 0.9, gv: 0.3, scarfLen: 1.2 });
    cam(ctx, [[0, [0.3, 2.85, 4.9], [-0.2, 2.75, 0], 34], [1, [0.1, 2.9, 4.3], [-0.3, 2.78, 0], 34]]);
    W.char(0, -0.5, 0, 0.6, 3.8);
    const m = W.atlas("rifle", 0, 3.2, 0.75, -3.0, 1.5, { order: 1 });
    if (m) m.rotateZ(-1.1);
    ctx.overlay.push(() => MV.drawKite(O.g, 1560 + Math.sin(t) * 40, 190 + Math.cos(t * 1.4) * 20, 40, Math.sin(t * 2) * 0.2, t));
    ctx.post.bloom = 0.5;
    ctx.post.lift = 0.12;
  });
  // ---- TITLE 57.15 - 58.95
  shot(TITLE, U.TOTAL, "title", (ctx) => {
    const t = ctx.t;
    W.setCity({ sky: "dawn", mode: "roof", sun: [-8, 14, -220, 120] });
    cam(ctx, [[0, [0, 6, 9], [0, 9, -30], 40]]);
    ctx.overlay.push(() => {
      const g = O.g, a = U.inv(TITLE, TITLE + 0.35, t);
      g.fillStyle = `rgba(18,13,28,${0.82 * a})`; g.fillRect(0, 0, 1920, 1080);
      O.word("الموت الهارب", 960, 520, { t, t0: TITLE + 0.25, size: 220, style: "gold", plate: false });
      O.text("تميم البرغوثي", 960, 700, { font: "700 72px Amiri", color: "#fbf8f2", rtl: true, alpha: U.inv(TITLE + 0.6, TITLE + 1.0, t) });
      O.text("قصيدة وإلقاء: تميم البرغوثي · «مع تميم» AJ+ ساحة", 960, 860, { font: "400 34px Amiri", color: "#c9c3d9", rtl: true, alpha: U.inv(TITLE + 0.9, TITLE + 1.3, t) });
      MV.drawKite(g, 1640, 230 - (t - TITLE) * 30, 46, Math.sin(t * 2) * 0.2, t);
    });
  });

  // sanity: shots must be contiguous and sorted
  MV.SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i + 1 < MV.SHOTS.length; i++) if (Math.abs(MV.SHOTS[i].t1 - MV.SHOTS[i + 1].t0) > 1e-6) console.warn("shot gap", MV.SHOTS[i].name, MV.SHOTS[i].t1, MV.SHOTS[i + 1].t0);
  void glint; void rifleDraw;
})();
