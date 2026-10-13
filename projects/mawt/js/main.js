// main.js — frame = f(time). Lazy world build on the first seek (fonts are ready by then), then
// every seek: reset world -> the active shot configures it. A manga shot declares panels: each 3D
// panel resets and configures the world itself and is rendered into its rect (scissor); each 2D
// panel draws into its rect on the overlay. Then: screentone pass (manga) or bloom (anime colour),
// gutters, kinetic type, letterbox, vignette, grain, impact frame, flash, SVG layer.
window.MV = window.MV || {};
(function () {
  const U = MV.U, W = MV.World, O = MV.Overlay;
  let built = false;
  let lastT = -1;

  function build() {
    const glCanvas = document.getElementById("gl");
    const ovCanvas = document.getElementById("ov");
    if (!glCanvas || !ovCanvas) return false; // N2: look up lazily
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
      manga: false,
      panels: null,
      post: { bloom: 0.3, vignette: 0.7, grain: 0.04, flash: null, letterbox: 0, lift: 0.1, impact: 0 },
      under: [],   // 2D drawn before the manga pass (part of the artwork)
      overlay: [], // 2D drawn after it (type, SFX, HUD)
    };
    shot.apply(ctx);
    // manga panels appear one by one (their borders are drawn in by anime.js at the same moment)
    if (ctx.panels) ctx.panels = ctx.panels.filter((p) => t >= shot.t0 + (p.at || 0) - 0.06);
    MV.lastPose = ctx.heroPose || MV.pose("neutral");
    MV.lastShot = shot.name;
    if (poseOnly) return;
    // ---- 3D: full frame or panels
    if (ctx.panels) {
      W.clearAll(0xf4efe4);
      for (const p of ctx.panels) {
        if (!p.gl) continue;
        W.reset();
        const pc = Object.assign({}, ctx, { aspect: p.r[2] / p.r[3], rect: p.r });
        p.gl(pc);
        W.renderView(p.r);
      }
    } else {
      W.renderView(null);
    }
    O.begin(ctx.post.lift);
    if (ctx.panels) {
      for (const p of ctx.panels) {
        if (!p.d2) continue;
        const g = O.g;
        g.save();
        g.beginPath();
        g.rect(p.r[0], p.r[1], p.r[2], p.r[3]);
        g.clip();
        if (!p.gl) { g.fillStyle = p.bg || "#f4efe4"; g.fillRect(p.r[0], p.r[1], p.r[2], p.r[3]); }
        p.d2(g, p.r, ctx);
        g.restore();
      }
    }
    for (const fn of ctx.under) fn(O, t);
    if (ctx.manga && !ctx.burst) ctx.post.vignette = Math.min(ctx.post.vignette, 0.25);
    if (ctx.manga) O.manga({ mask: ctx.mangaMask, tLight: ctx.tLight, tMid: ctx.tMid, tDark: ctx.tDark });
    else O.bloom(ctx.post.bloom);
    if (ctx.panels && !ctx.noGutter) O.panelFrame(ctx.panels.map((p) => p.r), { border: false });
    for (const fn of ctx.overlay) fn(O, t);
    O.letterbox(ctx.post.letterbox);
    O.vignette(ctx.post.vignette);
    O.grainPass(t, ctx.post.grain);
    O.impact(ctx.post.impact, ctx.post.impactInvert !== false);
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
