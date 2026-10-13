// shots.js — THE EDIT. One entry per shot: shot(t0, t1, name, fn). A shot configures the world (or
// declares manga panels) from ctx.t only. Times come from the proof-read word onsets (wf), never typed
// by hand (M5); every line's shot starts 0.12 s before its first spoken word (T0). Beats = the 3 feet
// (mustaf'ilun) of each rajaz line (tools/voice_pulse.py); characters are posed on those feet.
// Act 1 (0 - 23.16 s): black-and-white MANGA pages. «يا موت» (23.16 s): the page shatters and the film
// BURSTS INTO COLOUR ANIME. 40.12 - 57.15 s: the instrumental finale. 57.15 - 58.95 s: title card.
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, O = MV.Overlay, P = MV.P;
  const SH = (MV.SHOTS = []);
  const DECL = (MV.PANEL_DECL = []);
  const LN = U.LINES;
  const T0 = (i) => (i === 0 ? 0 : LN[i].s - 0.12);
  const wf = (i, w) => { const q = U.norm(w); for (const x of LN[i].words) if (U.norm(x[0]) === q) return x[1]; throw new Error("word " + w + " not in line " + i); };
  const wfe = (i, w) => { const q = U.norm(w); for (const x of LN[i].words) if (U.norm(x[0]) === q) return x[2]; throw new Error("word " + w); };
  const bt = (t) => U.beatAt(t);
  const END_POEM = 40.12, OUTRO = [40.12, 41.64, 43.16, 46.2, 50.0, 53.8], TITLE = 57.15;
  function shot(t0, t1, name, fn, panels) {
    SH.push({ t0, t1, name, apply: fn });
    if (panels) for (const p of panels) DECL.push({ r: p.r, t: t0 + (p.at || 0), t1 });
  }
  // panel layout helper: declared once, used by the shot and by svg.js (borders)
  const R = (x, y, w, h, at = 0) => ({ r: [x, y, w, h], at });

  // ---------------------------------------------------------------- helpers
  const DRAW = { hero: MV.drawHero, boy: MV.drawHero, death: MV.drawDeath, monkey: MV.drawMonkey };
  // pose a character on the feet (choreo in absolute beats), drawn on twos (anime limited animation)
  function pose(ctx, slot, choreo, o = {}) {
    const tq = U.onTwos(ctx.t, o.ones ? 1 : 2);
    let p = typeof choreo === "string" ? MV.pose(choreo) : MV.choreoPose(choreo, bt(tq));
    const gv = o.gv === undefined ? 0.5 : o.gv;
    const bp = U.beatPulse(tq, 0.35);
    p = Object.assign({}, p, { squash: p.squash + 0.035 * bp * gv, head: p.head + 4 * bp * gv, lSh: p.lSh - 3 * bp * gv, rSh: p.rSh + 3 * bp * gv });
    const kind = o.kind || "hero";
    if (slot === 0 && kind === "hero") ctx.heroPose = p;
    if (!ctx.poseOnly) {
      const blink = ((tq + slot * 1.37) % 3.3) < 0.12 ? 1 : 0;
      W.drawSlot(slot, (g) => DRAW[kind](g, p, Object.assign({ t: tq, blink, kind }, o)));
    }
    return p;
  }
  // camera keys over shot progress k: [[k, pos, look, fov, roll]]
  function cam(ctx, keys, aspect, e = "inOutSine", k = ctx.k) {
    let i = 0;
    while (i < keys.length - 2 && k > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const kk = b === a ? 0 : U.ease[e](U.clamp((k - a[0]) / (b[0] - a[0] || 1)));
    const pos = U.mix(a[1], b[1], kk), look = U.mix(a[2], b[2], kk);
    const punch = ctx.punch || 0;
    const d = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]];
    const sh = ctx.shake || 0;
    W.cam([pos[0] + d[0] * 0.12 * punch + Math.sin(ctx.t * 71) * sh, pos[1] + d[1] * 0.12 * punch + Math.cos(ctx.t * 63) * sh, pos[2] + d[2] * 0.12 * punch],
      look, U.lerp(a[3] || 40, b[3] || 40, kk), U.lerp(a[4] || 0, b[4] || 0, kk), aspect || ctx.aspect);
  }
  const word = (ctx, str, t0, x, y, o = {}) => ctx.overlay.push((O_, t) => O.word(str, x, y, Object.assign({ t, t0 }, o)));
  const sfx = (ctx, str, t0, x, y, o = {}) => ctx.overlay.push((O_, t) => O.sfx(str, x, y, Object.assign({ t, t0 }, o)));
  function flash(ctx, color, times, len = 0.2, amp = 0.6) {
    for (const tt of times) {
      const d = ctx.t - tt;
      if (d >= 0 && d < len) { const a = amp * (1 - d / len) * (1 - d / len); if (!ctx.post.flash || ctx.post.flash[1] < a) ctx.post.flash = [color, a]; }
    }
  }
  // impact frame: n frames (at 60 fps) of black/white negative from each time
  function impact(ctx, times, n = 4, invert = true) {
    for (const tt of times) if (ctx.t >= tt && ctx.t < tt + n / 60) { ctx.post.impact = 1; ctx.post.impactInvert = invert; }
  }
  const rifleDraw = (frame) => (g, x, y, w, h) => W.drawAtlas(g, "rifle", frame, x, y, w, h);
  // the drawn slot image straight onto a 2D panel (for 2D panels that show a character)
  function blitSlot(g, slot, cx, groundY, h, o = {}) {
    const c = W.slots[slot].c, w = (h * c.width) / c.height;
    g.save();
    g.translate(cx, groundY);
    if (o.flip) g.scale(-1, 1);
    if (o.rot) g.rotate(o.rot);
    g.drawImage(c, -w / 2, -h * (MV.CHAR_CANVAS.groundY / c.height), w, h);
    g.restore();
  }
  // 2D manga background inside a panel: paper, horizon, hatched ground, optional focus lines
  function bg2d(g, r, o = {}) {
    const [x, y, w, h] = r;
    g.fillStyle = o.sky || "#f4efe4";
    g.fillRect(x, y, w, h);
    const hy = y + h * (o.horizon || 0.7);
    if (o.skyline) { // distant city silhouette (mid grey -> tone)
      g.fillStyle = "#8c8796";
      g.beginPath(); g.moveTo(x, hy);
      for (let i = 0; i <= 40; i++) { const xx = x + (i / 40) * w; const hh = 30 + U.hash(i, 77) * 110; g.lineTo(xx, hy - hh); g.lineTo(xx + w / 40, hy - hh); }
      g.lineTo(x + w, hy); g.closePath(); g.fill();
      g.fillStyle = "#6c6676";
      for (let i = 0; i < 6; i++) { const xx = x + U.hash(i, 5) * w; g.beginPath(); g.arc(xx, hy - 120, 26, Math.PI, 0); g.fill(); g.fillRect(xx - 26, hy - 120, 52, 120); }
    }
    g.fillStyle = o.ground || "#b9b3c0";
    g.fillRect(x, hy, w, y + h - hy);
    g.strokeStyle = "#0a0710";
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(x, hy); g.lineTo(x + w, hy); g.stroke();
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const yy = hy + 10 + (i * 37) % (y + h - hy); const xx = x + U.hash(i, 9) * w; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 60 + U.hash(i, 2) * 80, yy); g.stroke(); }
    if (o.focus) MV.speedLines(g, x + w * o.focus[0], y + h * o.focus[1], Math.min(w, h) * (o.focus[2] || 0.3), { t: o.t, n: 70, color: "#0a0710", alpha: 0.9 });
  }
  // zZz / sparkle / sweat marks
  function glint(g, x, y, s) {
    g.save(); g.translate(x, y); g.fillStyle = "#fff"; g.strokeStyle = "#0a0710"; g.lineWidth = 4;
    g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * U.TAU, rr = i % 2 ? s * 0.25 : s; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  function heroCloseup(g, cx, cy, s, o) { // a big head-and-shoulders crop of slot 0
    blitSlot(g, o.slot || 0, cx, cy + s * 1.15, s * 2.6, o);
  }

  // ===================================================================== ACT 1: MANGA (black & white)
  // ---- S0 «رأيت موتي مقبلا ثم نكص»: the eye sees Death coming in its iris, then Death recoils
  {
    const pA = R(50, 40, 1820, 380, 0.02), pB = R(50, 450, 1110, 590, 0.35), pC = R(1190, 450, 680, 590, 1.0);
    const tSee = wf(0, "رأيت"), tDeath = wf(0, "موتي"), tCome = wf(0, "مقبلا"), tBack = wf(0, "نكص");
    shot(0, T0(1), "page1-eye", (ctx) => {
      ctx.manga = true;
      const t = ctx.t;
      const dp = pose(ctx, 1, [{ b: 0, move: "breathe" }, { b: bt(tBack - 0.05), pose: "recoil", x: 0.25 }], { kind: "death", fear: t > tBack ? 1 : 0, gv: 0.3 });
      const hp = pose(ctx, 0, "lookUp", { expr: t > tBack ? "shock" : "calm", scarf: true, wind: 0.6 });
      ctx.panels = [
        Object.assign({}, pA, { gl: (pc) => { // the city at night, slow pan
          W.setCity({ sky: "mnight" });
          cam(pc, [[0, [-30, 9, 16], [0, 6, -30], 38], [1, [-22, 9, 16], [8, 6, -30], 38]]);
        } }),
        Object.assign({}, pB, { d2: (g, r) => { // extreme eye close-up; Death grows in the iris, then recoils
          const grow = U.ease.inOutCubic(U.inv(tSee, tCome + 0.4, t)), back = U.ease.outExpo(U.inv(tBack, tBack + 0.3, t));
          const s = (0.15 + 0.85 * grow) * (1 - 0.85 * back);
          MV.drawEyeCU(g, r[0] + r[2] / 2, r[1] + r[3] * 0.56, 1000, { look: -0.2, irisA: "#6a6070", irisB: "#c9bec4", irisC: "#f2ece8", pupil: 0.3 + 0.25 * back, reflect: (gg, Rr) => {
            gg.fillStyle = "rgba(240,236,250,0.35)"; gg.fillRect(-Rr, Rr * 0.25, Rr * 2, Rr); // horizon in the iris
            gg.save(); gg.scale(s, s);
            gg.fillStyle = "#08050e";
            gg.beginPath(); gg.moveTo(0, -Rr * 0.9); gg.bezierCurveTo(Rr * 0.5, -Rr * 0.8, Rr * 0.55, -Rr * 0.2, Rr * 0.7, Rr * 0.9); gg.lineTo(-Rr * 0.7, Rr * 0.9); gg.bezierCurveTo(-Rr * 0.55, -Rr * 0.2, -Rr * 0.5, -Rr * 0.8, 0, -Rr * 0.9); gg.fill();
            gg.fillStyle = "#fff"; gg.beginPath(); gg.arc(-Rr * 0.12, -Rr * 0.42, Rr * 0.06, 0, U.TAU); gg.arc(Rr * 0.12, -Rr * 0.42, Rr * 0.06, 0, U.TAU); gg.fill();
            gg.restore();
          } });
          if (back > 0 && back < 1) MV.speedLines(g, r[0] + r[2] / 2, r[1] + r[3] * 0.56, 200, { t, n: 60, color: "#0a0710", alpha: 0.8 * (1 - back) });
        } }),
        Object.assign({}, pC, { gl: (pc) => { // Death walking up the street, then jerking back
          W.setCity({ sky: "paper" });
          const back = U.ease.outExpo(U.inv(tBack, tBack + 0.35, t));
          const x = U.lerp(-16, -3, U.ease.inOutSine(U.inv(1.0, tBack, t))) - back * 7;
          cam(pc, [[0, [7, 1.5, 0.6], [-6, 2.3, 0], 46]]);
          W.char(1, x, 0, 0, 3.6);
        } }),
      ];
      word(ctx, "موتي", tDeath, 600, 250, { size: 170, style: "manga", t1: tBack - 0.1 });
      sfx(ctx, "نكص!", tBack, 1530, 560, { size: 170, rot: -0.12, color: "#0a0710" });
      void dp; void hp;
    }, [pA, pB, pC]);
  }

  // ---- S1 «مالك يا قناص قد خفت القنص»: the sniper aims, then shakes with fear
  {
    const pA = R(50, 40, 760, 1000, 0.0), pB = R(840, 40, 1030, 500, 0.12), pC = R(840, 570, 1030, 470, 0.9);
    const tQ = wf(1, "قناص"), tFear = wf(1, "خفت"), tHunt = wf(1, "القنص");
    shot(T0(1), T0(2), "page2-sniper", (ctx) => {
      ctx.manga = true;
      ctx.go = true;
      const t = ctx.t, fear = U.inv(tFear - 0.1, tFear + 0.2, t);
      pose(ctx, 1, [{ b: 0, pose: "aim" }, { b: bt(tFear), pose: "recoil", x: 0.4 }], { kind: "death", fear, rifle: { draw: rifleDraw(0), ang: 0 }, gv: 0.2 });
      pose(ctx, 0, [{ b: 0, move: "breathe" }], { expr: "calm", wind: 0.8 });
      ctx.panels = [
        Object.assign({}, pA, { gl: (pc) => {
          W.setCity({ sky: "mnight", mode: "roof" });
          cam(pc, [[0, [2.4, 2.4, 4.4], [-0.5, 2.1, -2], 44], [1, [2.0, 2.2, 3.6], [-0.5, 2.1, -2], 44]]);
          W.char(1, -0.6, 0, -2.2, 3.9);
        } }),
        Object.assign({}, pB, { d2: (g, r) => { // scope view: the hero in the crosshair
          g.fillStyle = "#5c5868"; g.fillRect(r[0], r[1], r[2], r[3]);
          bg2d(g, [r[0], r[1], r[2], r[3]], { horizon: 0.78, skyline: true, sky: "#d8d4de" });
          blitSlot(g, 0, r[0] + r[2] * 0.5, r[1] + r[3] * 1.25, 900);
          const cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
          g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.arc(cx, cy, 235, 0, U.TAU, true); g.fillStyle = "#07050c"; g.fill(); g.restore();
        } }),
        Object.assign({}, pC, { d2: (g, r) => { // weapon reveal: the Blender rifle-scythe spinning on focus lines
          g.fillStyle = "#f4efe4"; g.fillRect(r[0], r[1], r[2], r[3]);
          MV.speedLines(g, r[0] + r[2] / 2, r[1] + r[3] / 2, 120, { t, n: 80, color: "#0a0710" });
          const f = W.loopFrame("rifle", t, 0.55);
          W.drawAtlas(g, "rifle", f, r[0] + 60, r[1] + 40, r[2] - 120, (r[2] - 120) / 2);
        } }),
      ];
      const sh = 6 + 40 * fear;
      ctx.reticle = { x: 840 + 515 + Math.sin(t * 37) * sh, y: 40 + 250 + Math.cos(t * 29) * sh, s: 0.95, a: U.inv(T0(1), T0(1) + 0.1, t) };
      word(ctx, "قناص", tQ, 1355, 980, { size: 150, style: "manga" });
      if (fear > 0) sfx(ctx, "!؟", tFear, 600, 200, { size: 200, rot: 0.1 });
    }, [pA, pB, pC]);
  }

  // ---- S2 «تبعته بين القصور والخصص»: the hero follows Death between palaces and huts
  {
    const pA = R(40, 40, 1840, 1000, 0.0);
    const tF = wf(2, "تبعته"), tPal = wf(2, "القصور"), tHut = wf(2, "والخصص");
    shot(T0(2), T0(3), "chase-street", (ctx) => {
      ctx.manga = true;
      const t = ctx.t;
      pose(ctx, 0, [{ b: 0, move: "run" }], { expr: "angry", wind: -1, gv: 0 });
      pose(ctx, 1, [{ b: 0, move: "run" }], { kind: "death", wind: 0.9, fear: 0.6, gv: 0 });
      const x0 = U.lerp(-34, -12, ctx.k);
      ctx.panels = [Object.assign({}, pA, { gl: (pc) => {
        W.setCity({ sky: "paper" });
        cam(pc, [[0, [x0 - 3.2, 1.3, 4.6], [x0 + 3, 1.9, -1], 46], [1, [x0 - 2.8, 1.2, 4.2], [x0 + 3.5, 1.9, -1], 46]], undefined, "linear");
        W.char(0, x0, 0, 1.2, 2.7, { flip: false });
        W.char(1, x0 + 6.5 + Math.sin(t * 3) * 0.3, 0, -1.2, 3.0);
      } })];
      ctx.under.push(() => MV.streaks(O.g, 0, { t, n: 36, color: "#0a0710", alpha: 0.45 }));
      word(ctx, "تبعته", tF, 1500, 210, { size: 170, style: "manga" });
      sfx(ctx, "القصور", tPal, 420, 180, { size: 90, rot: -0.05, t1: tHut - 0.1 });
      sfx(ctx, "والخصص", tHut, 470, 300, { size: 90, rot: 0.06 });
    }, [pA]);
  }

  // ---- S3 «ظبي تحرى أثر الذئب وقص»: the gazelle tracks the wolf's pawprints
  {
    const pA = R(50, 40, 1820, 560, 0.0), pB = R(50, 630, 890, 410, 0.7), pC = R(970, 630, 900, 410, 1.5);
    const tG = wf(3, "ظبي"), tTr = wf(3, "أثر"), tW = wf(3, "الذئب"), tQ = wf(3, "وقص");
    shot(T0(3), T0(4), "gazelle-tracks", (ctx) => {
      ctx.manga = true;
      const t = ctx.t, tq = U.onTwos(t, 2);
      ctx.panels = [
        Object.assign({}, pA, { d2: (g, r) => {
          bg2d(g, r, { horizon: 0.78, skyline: true });
          const gy = r[1] + r[3] * 0.78;
          for (let i = 0; i < 9; i++) { // wolf pawprints across the panel
            const px = r[0] + 300 + i * 190, py = gy + 40 + (i % 2) * 30;
            if (px > r[0] + 300 + ctx.k * 1500 + 200) continue;
            g.fillStyle = "#0a0710";
            g.beginPath(); g.ellipse(px, py, 16, 11, 0, 0, U.TAU); g.fill();
            for (let j = -1; j <= 1; j++) { g.beginPath(); g.arc(px + 18, py + j * 11, 5, 0, U.TAU); g.fill(); }
          }
          const gx = r[0] + 200 + ctx.k * 900;
          g.save(); g.translate(gx, gy - 220); g.scale(0.95, 0.95);
          MV.drawBeast(g, "gazelle", tq * 1.2, { sniff: 0.5 + 0.3 * Math.sin(tq * 5), amp: 20, t: tq });
          g.restore();
          // the wolf's tail leaving at the right edge
          g.save(); g.translate(r[0] + r[2] + 120 - ctx.k * 80, gy - 240); MV.drawBeast(g, "wolf", tq * 1.5, { amp: 30, t: tq }); g.restore();
        } }),
        Object.assign({}, pB, { d2: (g, r) => { // nose to the pawprint
          bg2d(g, r, { horizon: 0.25, focus: [0.6, 0.7, 0.25], t });
          g.fillStyle = "#0a0710";
          const px = r[0] + r[2] * 0.62, py = r[1] + r[3] * 0.72;
          g.beginPath(); g.ellipse(px, py, 70, 50, 0, 0, U.TAU); g.fill();
          for (let j = -1; j <= 1; j++) { g.beginPath(); g.arc(px + 80, py + j * 46, 22, 0, U.TAU); g.fill(); }
          g.save(); g.translate(r[0] + 160, r[1] + 120); g.rotate(0.5); g.scale(1.5, 1.5); MV.drawBeast(g, "gazelle", 0, { sniff: 1, amp: 0, t: tq }); g.restore();
        } }),
        Object.assign({}, pC, { d2: (g, r) => { // the wolf looks back, nervous
          bg2d(g, r, { horizon: 0.85, focus: [0.4, 0.45, 0.3], t });
          g.save(); g.translate(r[0] + r[2] * 0.42, r[1] + r[3] * 0.5); g.scale(-1.4, 1.4); MV.drawBeast(g, "wolf", 0, { amp: 0, eye: t > tQ ? "shock" : "normal", sweat: t > tQ, t: tq }); g.restore();
        } }),
      ];
      word(ctx, "ظبي", tG, 1640, 150, { size: 170, style: "manga" });
      word(ctx, "الذئب", tW, 1640, 720, { size: 130, style: "manga" });
      void tTr;
    }, [pA, pB, pC]);
  }

  // ---- S4 «منتهزا من غفلاته الفرص»: the wolf dozes; the gazelle seizes the chance
  {
    const pA = R(50, 40, 1120, 1000, 0.0), pB = R(1200, 40, 670, 480, 0.5), pC = R(1200, 550, 670, 490, 1.2);
    const tSl = wf(4, "غفلاته"), tCh = wf(4, "الفرص");
    shot(T0(4), T0(5), "wolf-dozes", (ctx) => {
      ctx.manga = true;
      const t = ctx.t, tq = U.onTwos(t, 2);
      ctx.panels = [
        Object.assign({}, pA, { d2: (g, r) => {
          bg2d(g, r, { horizon: 0.74, skyline: true });
          const gy = r[1] + r[3] * 0.74;
          g.save(); g.translate(r[0] + 720, gy - 150); g.scale(-1.15, 1.15); MV.drawBeast(g, "wolf", 0.25, { amp: 2, eye: "sleep", crouch: 0.6, t: tq }); g.restore();
          const creep = U.ease.inOutSine(U.inv(T0(4), tCh, t));
          g.save(); g.translate(r[0] + 100 + creep * 250, gy - 210 + 40); g.scale(1.05, 1.05); MV.drawBeast(g, "gazelle", tq * 0.6, { crouch: 0.7, amp: 14, eye: "hungry", t: tq }); g.restore();
          const zz = (tq * 0.8) % 1;
          ctx.zz = [r[0] + 820 + zz * 60, gy - 330 - zz * 120, 1 - zz];
        } }),
        Object.assign({}, pB, { d2: (g, r) => { // the wolf's shut eye, close
          g.save(); g.translate(r[0] + r[2] * 0.4, r[1] + r[3] * 0.62); g.scale(-3.4, 3.4); g.translate(-210, 70); MV.drawBeast(g, "wolf", 0, { amp: 0, eye: "sleep", t: tq }); g.restore();
        } }),
        Object.assign({}, pC, { d2: (g, r) => { // the gazelle's eye glints on «الفرص»
          bg2d(g, r, { horizon: 1, focus: [0.5, 0.5, 0.2], t });
          g.save(); g.translate(r[0] + r[2] * 0.55, r[1] + r[3] * 0.7); g.scale(3.6, 3.6); g.translate(-175, 80); MV.drawBeast(g, "gazelle", 0, { amp: 0, eye: "hungry", t: tq }); g.restore();
          if (t > tCh) glint(g, r[0] + r[2] * 0.45, r[1] + r[3] * 0.32, 70 * U.ease.outBack(U.inv(tCh, tCh + 0.2, t)));
        } }),
      ];
      sfx(ctx, "خرررر", tSl, 860, 300, { size: 110, rot: -0.2, color: "#0a0710" });
      word(ctx, "الفرص", tCh, 1535, 960, { size: 140, style: "manga" });
    }, [pA, pB, pC]);
  }

  // ---- S5 «بالظبي للذئب التشهي والخمص»: the gazelle hungers for the wolf (the world upside down)
  {
    const pA = R(50, 40, 1820, 640, 0.0), pB = R(50, 710, 900, 330, 0.8), pC = R(980, 710, 890, 330, 1.4);
    const tH = wf(5, "التشهي"), tK = wf(5, "والخمص");
    shot(T0(5), T0(6), "gazelle-hungry", (ctx) => {
      ctx.manga = true;
      const t = ctx.t, tq = U.onTwos(t, 2);
      ctx.panels = [
        Object.assign({}, pA, { d2: (g, r) => {
          bg2d(g, r, { horizon: 0.86, focus: [0.36, 0.42, 0.26], t });
          const gy = r[1] + r[3] * 0.86;
          const loom = U.ease.outBack(U.inv(T0(5), T0(5) + 0.5, t));
          g.save(); g.translate(r[0] + 640, gy - 330 * loom); g.scale(1.9 * loom, 1.9 * loom); MV.drawBeast(g, "gazelle", 0.1, { amp: 4, eye: "hungry", drool: U.inv(tH, tH + 0.6, t), teeth: true, t: tq }); g.restore();
          g.save(); g.translate(r[0] + 1450 + Math.sin(t * 60) * 4, gy - 110); g.scale(-0.8, 0.8); MV.drawBeast(g, "wolf", 0, { amp: 0, eye: "shock", crouch: 0.8, sweat: true, tailUp: -0.5, t: tq }); g.restore();
        } }),
        Object.assign({}, pB, { d2: (g, r) => {
          bg2d(g, r, { horizon: 1, focus: [0.5, 0.45, 0.2], t });
          g.save(); g.translate(r[0] + r[2] * 0.35 + Math.sin(t * 70) * 5, r[1] + r[3] * 0.72); g.scale(-2.6, 2.6); g.translate(-200, 60); MV.drawBeast(g, "wolf", 0, { amp: 0, eye: "shock", sweat: true, t: tq }); g.restore();
        } }),
        Object.assign({}, pC, { d2: (g, r) => {
          bg2d(g, r, { horizon: 1 });
          g.save(); g.translate(r[0] + r[2] * 0.5, r[1] + r[3] * 0.78); g.scale(2.6, 2.6); g.translate(-160, 70); MV.drawBeast(g, "gazelle", 0, { amp: 0, eye: "hungry", drool: 1, teeth: true, t: tq }); g.restore();
        } }),
      ];
      word(ctx, "التشهي", tH, 1500, 170, { size: 160, style: "mangaRed" });
      sfx(ctx, "جوع!", tK, 1630, 940, { size: 120, rot: -0.1 });
    }, [pA, pB, pC]);
  }

  // ---- S6 «تلك لعمري من أعاجيب القصص»: pull back: it is a book of wonders, pages flipping on the feet
  {
    const pA = R(40, 40, 1840, 1000, 0.0);
    const tW = wf(6, "أعاجيب"), tS = wf(6, "القصص");
    function miniPage(g, x, y, w, h, seed) {
      g.fillStyle = "#f4efe4"; g.fillRect(x, y, w, h);
      g.strokeStyle = "#0a0710"; g.lineWidth = 3;
      const rr = U.rng(seed);
      const rows = 2 + Math.floor(rr() * 2);
      for (let i = 0; i < rows; i++) {
        const yy = y + 14 + i * (h - 14) / rows, hh = (h - 14) / rows - 12;
        const split = 0.3 + rr() * 0.4;
        g.strokeRect(x + 12, yy, (w - 36) * split, hh); g.strokeRect(x + 24 + (w - 36) * split, yy, (w - 36) * (1 - split), hh);
        g.fillStyle = rr() < 0.5 ? "#8c8796" : "#c9c3d0"; g.fillRect(x + 16, yy + hh * 0.55, (w - 44) * split, hh * 0.4);
      }
    }
    shot(T0(6), T0(7), "book-of-wonders", (ctx) => {
      ctx.manga = true;
      const t = ctx.t, k = U.ease.outCubic(U.inv(T0(6), T0(6) + 1.0, t));
      ctx.panels = [Object.assign({}, pA, { d2: (g, r) => {
        g.fillStyle = "#3c3846"; g.fillRect(r[0], r[1], r[2], r[3]);
        MV.speedLines(g, 960, 560, 300, { t, n: 50, color: "#0a0710", alpha: 0.5 });
        const s = U.lerp(2.6, 1, k);
        g.save(); g.translate(960, 600); g.scale(s, s);
        // open book: two pages + a flipping page per foot
        g.fillStyle = "#0a0710"; g.fillRect(-640, -330, 1280, 640);
        miniPage(g, -620, -310, 600, 600, 3); miniPage(g, 20, -310, 600, 600, 4);
        const fb = bt(t), ph = fb - Math.floor(fb);
        const ang = U.ease.inOutCubic(U.clamp(ph / 0.6));
        const w = 600 * Math.cos(ang * Math.PI);
        g.save(); g.transform(1, 0, -0.12 * Math.sin(ang * Math.PI), 1, 0, 0);
        miniPage(g, w >= 0 ? 20 : 20 + w, -310 - 30 * Math.sin(ang * Math.PI), Math.abs(w), 600, 10 + Math.floor(fb));
        g.restore();
        g.strokeStyle = "#0a0710"; g.lineWidth = 8; g.strokeRect(-620, -310, 1240, 600);
        g.beginPath(); g.moveTo(0, -320); g.lineTo(0, 300); g.stroke();
        // gazelle and wolf as tiny drawings on the left page
        g.save(); g.translate(-330, -40); g.scale(0.55, 0.55); MV.drawBeast(g, "gazelle", 0.2, { eye: "hungry", t }); g.restore();
        g.save(); g.translate(-160, 140); g.scale(-0.4, 0.4); MV.drawBeast(g, "wolf", 0.4, { eye: "shock", t }); g.restore();
        g.restore();
        for (let i = 0; i < 5; i++) glint(g, 300 + U.hash(i, 3) * 1300, 160 + U.hash(i, 4) * 700, 30 + 30 * Math.abs(Math.sin(t * 4 + i)));
      } })];
      word(ctx, "أعاجيب", tW, 960, 150, { size: 190, style: "manga" });
      word(ctx, "القصص", tS, 960, 960, { size: 120, style: "manga" });
    }, [pA]);
  }

  // ---- S7 «والعمر فاعلم كلما زاد نقص»: age counter goes up, the life bar goes down (on the feet)
  {
    const pA = R(40, 40, 1840, 1000, 0.0);
    const tA = wf(7, "والعمر"), tZ = wf(7, "زاد"), tN = wf(7, "نقص");
    shot(T0(7), T0(8), "life-bar", (ctx) => {
      ctx.manga = true;
      const t = ctx.t;
      pose(ctx, 0, [{ b: 0, pose: "sad" }, { b: bt(tN), pose: "cry", x: 0.4 }], { expr: t > tN ? "sad" : "calm", wind: 0.5 });
      const steps = U.clamp(Math.floor(bt(t) - bt(tA)) + 1, 0, 4);
      const age = 17 + steps, drop = U.ease.outExpo(U.inv(tN, tN + 0.25, t));
      ctx.hp = { v: U.lerp(1 - steps * 0.18, 0.06, drop) };
      ctx.panels = [Object.assign({}, pA, { gl: (pc) => {
        W.setCity({ sky: "mnight", mode: "roof" });
        cam(pc, [[0, [-3.5, 2.4, 7.5], [-1.2, 2.1, 0], 34], [1, [-3.2, 2.2, 6.6], [-1.2, 2.1, 0], 34]]);
        W.char(0, -1.6, 0, 0.5, 3.1);
      } })];
      ctx.overlay.push(() => {
        O.text("العمر", 1720, 110, { font: "700 64px Amiri", color: "#0a0710", rtl: true, stroke: "#f4efe4", strokeW: 10 });
        const ds = String(age).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
        const pop = U.beatPulse(t, 0.25);
        O.text(ds, 1180, 330, { font: `700 ${Math.round(180 * (1 + 0.15 * pop))}px Amiri`, color: "#0a0710", stroke: "#f4efe4", strokeW: 14 });
        O.text("+١", 1380, 300 - 60 * ((bt(t) % 1)), { font: "700 70px Amiri", color: "#0a0710", alpha: 1 - (bt(t) % 1), stroke: "#f4efe4", strokeW: 8 });
      });
      word(ctx, "زاد", tZ, 1180, 470, { size: 120, style: "manga", t1: tN - 0.05 });
      word(ctx, "نقص", tN, 1450, 560, { size: 230, style: "mangaRed" });
      flash(ctx, "#ffffff", [tN], 0.22, 0.7);
    }, [pA]);
  }

  // ---- S8 «وانقلبت أفراحه إلى غصص»: the joy panels flip upside down and crack; the eye cries
  {
    const p1 = R(50, 40, 580, 470, 0.0), p2 = R(670, 40, 580, 470, 0.12), p3 = R(1290, 40, 580, 470, 0.24), p4 = R(50, 540, 1820, 500, 0.4);
    const tFlip = wf(8, "وانقلبت"), tJoy = wf(8, "أفراحه"), tG = wf(8, "غصص");
    shot(T0(8), T0(9), "joys-flip", (ctx) => {
      ctx.manga = true;
      const t = ctx.t, tq = U.onTwos(t, 2);
      pose(ctx, 0, "vUp", { expr: "happy", wind: 0.8 });
      pose(ctx, 2, [{ b: 0, move: "groove" }], { kind: "boy", expr: "happy" });
      const flipK = (i) => U.ease.inOutBack(U.inv(tFlip + i * 0.22, tFlip + i * 0.22 + 0.45, t));
      const crack = U.inv(tG, tG + 0.2, t);
      const memory = (i, draw) => (g, r) => {
        const cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
        g.translate(cx, cy); g.rotate(Math.PI * flipK(i)); g.translate(-cx, -cy);
        draw(g, r);
        if (crack > 0) { g.strokeStyle = "#0a0710"; g.lineWidth = 6; g.beginPath(); let x = cx - 20, y = r[1]; g.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (U.hash(j, i) - 0.5) * 120; y += r[3] / 8 * crack; g.lineTo(x, y); } g.stroke(); }
      };
      ctx.panels = [
        Object.assign({}, p1, { d2: memory(0, (g, r) => { bg2d(g, r, { horizon: 0.85, skyline: true }); MV.drawKite(g, r[0] + 330, r[1] + 170, 90, Math.sin(tq * 2) * 0.2, tq, "#2a2630", "#9a94a4"); g.strokeStyle = "#0a0710"; g.lineWidth = 2; g.beginPath(); g.moveTo(r[0] + 330, r[1] + 250); g.quadraticCurveTo(r[0] + 260, r[1] + 380, r[0] + 120, r[1] + 470); g.stroke(); }) }),
        Object.assign({}, p2, { d2: memory(1, (g, r) => { bg2d(g, r, { horizon: 0.92, focus: [0.5, 0.4, 0.3], t }); blitSlot(g, 0, r[0] + 200, r[1] + 1280, 1260); blitSlot(g, 2, r[0] + 430, r[1] + 980, 760); }) }),
        Object.assign({}, p3, { d2: memory(2, (g, r) => { bg2d(g, r, { horizon: 0.8 }); MV.drawBread(g, r[0] + 290, r[1] + 250, 120, 0.2); for (let i = 0; i < 6; i++) glint(g, r[0] + 80 + i * 90, r[1] + 80 + (i % 2) * 300, 26); }) }),
        Object.assign({}, p4, { d2: (g, r) => {
          const cry = U.inv(tJoy, tG, t);
          MV.drawEyeCU(g, r[0] + r[2] * 0.5, r[1] + r[3] * 0.55, 860, { look: 0.1, irisA: "#4a4050", irisB: "#a89ca4", irisC: "#e8e0e0", brow: -0.15 * cry, tear: U.clamp(cry * 1.2), lid: 0.25 * cry });
        } }),
      ];
      word(ctx, "انقلبت", tFlip, 960, 470, { size: 110, style: "manga", t1: tG - 0.2 });
      word(ctx, "غصص", tG, 1500, 800, { size: 200, style: "manga" });
    }, [p1, p2, p3, p4]);
  }

  MV.__shotHelpers = { pose, cam, word, sfx, flash, impact, rifleDraw, blitSlot, bg2d, glint, wf, wfe, T0, R, shot, heroCloseup, END_POEM, OUTRO, TITLE };
})();
