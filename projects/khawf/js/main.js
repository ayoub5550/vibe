// main.js — frame = f(time). Lazy world build on the first seek (fonts are ready by then), then
// every seek: reset world -> the active shot configures it (and draws its puppets into slots) ->
// render three.js -> overlay post pass + kinetic type -> SVG layer.
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, O = MV.Overlay;
  let built = false;
  let lastT = -1;

  function build() {
    // look the canvases up lazily: the HyperFrames compiler may hoist scripts above <body> (N2)
    const glCanvas = document.getElementById("gl");
    const ovCanvas = document.getElementById("ov");
    if (!glCanvas || !ovCanvas) return false;
    W.init(glCanvas);
    O.init(ovCanvas, glCanvas);
    MV.Svg.build();
    built = true;
    return true;
  }

  function shotAt(t) {
    const S = MV.SHOTS;
    for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return S[i];
    return S[0];
  }

  // opt.poseOnly: run the shot logic and stop before drawing (tools/motion_check.cjs)
  MV.renderAt = function (t, opt) {
    t = U.clamp(t, 0, U.TOTAL - 1e-4);
    if (!built && !build()) return;
    const poseOnly = !!(opt && opt.poseOnly);
    if (!poseOnly && Math.abs(t - lastT) < 1e-6) return;
    lastT = poseOnly ? -1 : t;
    W.reset();
    const shot = shotAt(t);
    const b = U.beatAt(t);
    const ctx = {
      t, b, poseOnly,
      lt: t - shot.t0,
      lb: b - U.beatAt(shot.t0),
      dur: shot.t1 - shot.t0,
      k: U.clamp((t - shot.t0) / (shot.t1 - shot.t0)),
      shot,
      heroPose: null,
      post: { bloom: 0.35, vignette: 0.9, grain: 0.05, flash: null, letterbox: 0, exposure: 1, lift: 0.35 },
      overlay: [],
    };
    shot.apply(ctx);
    // the backlit parchment is the brightest thing in the film: cap the midtone lift and bloom on
    // it (draft 1 screened it into flat white). Type on it switches to dark ink (overlay.js).
    O.bright = W.theatre.visible && !ctx.night;
    if (W.theatre.visible) {
      ctx.post.lift = Math.min(ctx.post.lift, ctx.liftCap === undefined ? 0.1 : ctx.liftCap);
      ctx.post.bloom = Math.min(ctx.post.bloom, 0.18);
    }
    MV.lastPose = ctx.heroPose || MV.pose("neutral");
    MV.lastShot = shot.name;
    if (poseOnly) return;
    W.renderer.toneMappingExposure = ctx.post.exposure;
    W.render();
    O.begin(ctx.post.lift);
    O.bloom(ctx.post.bloom);
    for (const fn of ctx.overlay) fn(O, t);
    O.letterbox(ctx.post.letterbox);
    O.vignette(ctx.post.vignette);
    O.grainPass(t, ctx.post.grain);
    if (ctx.post.flash) O.flash(ctx.post.flash[0], ctx.post.flash[1]);
    MV.Svg.render(t, ctx);
  };

  window.addEventListener("hf-seek", (e) => {
    const tt = e && e.detail ? Number(e.detail.time) : NaN;
    if (isFinite(tt)) MV.renderAt(tt);
  });
  MV.attachTimeline = function (tl) {
    const proxy = { t: 0 };
    tl.to(proxy, { t: U.TOTAL, duration: U.TOTAL, ease: "none", onUpdate: () => MV.renderAt(proxy.t) }, 0);
    return tl;
  };
})();
