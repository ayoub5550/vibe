// main.js — frame = f(time). Lazy world build on the first seek (fonts are ready by then),
// then every seek: reset world -> active shot configures it -> draw hero canvases -> render -> overlay.
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, O = MV.Overlay;
  let built = false;
  let lastT = -1;

  // ---- lip sync: mouth openness from word timestamps (vowel groups ~ syllables)
  const WORDS = [];
  for (const l of MV.SONG.lines) for (const w of l.words) WORDS.push(w);
  const syl = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length);
  function mouthAt(t) {
    for (const w of WORDS) {
      if (t >= w[1] - 0.02 && t <= w[2] + 0.04) {
        const k = U.clamp((t - w[1]) / Math.max(0.08, w[2] - w[1]));
        return 0.25 + 0.75 * Math.abs(Math.sin(Math.PI * k * syl(w[0])));
      }
    }
    return 0;
  }
  function eyesAt(t) {
    // blink ~every 3.3 s, 0.12 s long, deterministic
    const period = 3.3, ph = (t + 1.1) % period;
    return ph < 0.12 ? 0.1 : 1;
  }
  MV.mouthAt = mouthAt;

  function build() {
    // look the canvases up lazily: the HyperFrames compiler may hoist scripts above <body>
    const glCanvas = document.getElementById("gl");
    const ovCanvas = document.getElementById("ov");
    if (!glCanvas || !ovCanvas) return false;
    W.init(glCanvas);
    O.init(ovCanvas, glCanvas);
    built = true;
    return true;
  }

  function shotAt(t) {
    const S = MV.SHOTS;
    for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return S[i];
    return S[0];
  }

  // opt.poseOnly: run the shot + choreography and stop before drawing (tools/motion_check.cjs)
  MV.renderAt = function (t, opt) {
    t = U.clamp(t, 0, U.TOTAL - 1e-4);
    if (!built && !build()) return;
    const poseOnly = !!(opt && opt.poseOnly);
    if (!poseOnly && Math.abs(t - lastT) < 1e-6) return;
    lastT = poseOnly ? -1 : t;
    W.reset(t >= 25.66); // white face walls from the kick drop on (shots can flip back to eyes)
    const shot = shotAt(t);
    const b = U.beatAt(t);
    const ctx = {
      t, b,
      lt: t - shot.t0,
      lb: b - U.beatAt(shot.t0),
      dur: shot.t1 - shot.t0,
      k: U.clamp((t - shot.t0) / (shot.t1 - shot.t0)),
      choreo: null, pose: null, shadowPose: null,
      post: { bloom: 0.42, vignette: 1, grain: 0.05, flash: null, letterbox: 0, glitch: 0, exposure: 1, lift: 0.6 },
      overlay: [],
    };
    shot.apply(ctx);

    // hero pose -> canvases
    let pose = ctx.pose || (ctx.choreo ? MV.choreoPose(ctx.choreo, b) : MV.pose("neutral"));
    pose = Object.assign({}, pose);
    // groove (critic fix): knee-bend bounce down on every beat + hip sway + weight shift, so the body
    // never stands frozen between hits. Stronger after the drop. ctx.groove = 0 disables it.
    let gv = ctx.groove !== undefined ? ctx.groove : ctx.choreo ? (t >= 25.66 ? 1 : 0.6) : 0;
    if (ctx.groove === undefined && ctx.choreo) {
      // static story poses (pray, bow, stand still) only breathe; moves get the full groove
      let cur = ctx.choreo[0];
      for (const c of ctx.choreo) if (c.b <= b) cur = c;
      if (!cur.move) gv *= 0.2;
    }
    if (gv > 0) {
      const fb = b - Math.floor(b);
      const bob = Math.pow(0.5 + 0.5 * Math.cos(U.TAU * fb), 2) * gv;
      pose.lHip -= 7 * bob; pose.lKnee += 14 * bob; pose.rHip += 7 * bob; pose.rKnee -= 14 * bob;
      pose.squash += 0.035 * bob;
      pose.head += 3 * bob;
      const sway = Math.sin(Math.PI * b) * gv;
      pose.shift += 12 * sway;
      pose.torso += 2.5 * sway;
    }
    if (ctx.mouth !== false) pose.mouth = mouthAt(t) * (ctx.mouthScale || 1);
    pose.eyes = eyesAt(t);
    if (ctx.poseMod) ctx.poseMod(pose);
    ctx.finalPose = pose;
    MV.lastPose = pose; // read by tools/motion_check.cjs (snap detector)
    MV.lastShot = shot.name;
    if (poseOnly) return;
    MV.drawJester(W.heroCtx, pose, MV.P, t);
    W.heroTex.needsUpdate = true;
    let sp = ctx.shadowPose ? Object.assign({}, ctx.shadowPose) : pose;
    if (ctx.shadowPose) { sp.mouth = pose.mouth; sp.eyes = pose.eyes; }
    MV.drawJester(W.shadowCtx, sp, MV.SHADOW, t);
    W.shadowTex.needsUpdate = true;
    if (ctx.afterPose) ctx.afterPose(pose);

    W.renderer.toneMappingExposure = ctx.post.exposure;
    W.render();

    // overlay
    O.begin(ctx.post.lift);
    O.bloom(ctx.post.bloom);
    if (ctx.post.glitch) O.glitch(t, ctx.post.glitch);
    for (const fn of ctx.overlay) fn(O, t);
    O.letterbox(ctx.post.letterbox);
    O.vignette(ctx.post.vignette);
    O.grainPass(t, ctx.post.grain);
    if (ctx.post.flash) O.flash(ctx.post.flash[0], ctx.post.flash[1]);
  };

  // ---- HyperFrames wiring: seek events + a registered paused GSAP timeline
  window.addEventListener("hf-seek", (e) => {
    const tt = e && e.detail ? Number(e.detail.time) : NaN;
    if (isFinite(tt)) MV.renderAt(tt);
  });
  // index.html creates + registers the paused timeline; we add one proxy tween spanning the song
  MV.attachTimeline = function (tl) {
    const proxy = { t: 0 };
    tl.to(proxy, { t: U.TOTAL, duration: U.TOTAL, ease: "none", onUpdate: () => MV.renderAt(proxy.t) }, 0);
    return tl;
  };
  // debug hook: MV.renderAt(seconds) can be called from a console / Playwright
})();
