// svg.js — the vector layer (inline <svg id="svg"> above the canvases):
//   * manga panel borders: one path per declared panel, drawn in by an anime.js stroke animation
//     when the panel appears (shots declare panels statically: MV.PANEL_DECL)
//   * the sniper's scope reticle (circle, crosshair, ticks), drawn by anime.js, trembling from t
//   * «ゴゴゴ»-style menace marks (katakana-like brush strokes, decoration only), stroke-drawn
//   * the shards of the shattering page at the colour burst (positions from t by our own code)
//   * the HP bar frame («والعمر... نقص») and the title-card ink frame
// One paused anime.js timeline, primed (seek END then 0), seeked to t*1000 from MV.renderAt.
window.MV = window.MV || {};
(function () {
  const U = MV.U;
  const S = (MV.Svg = {});
  const NS = "http://www.w3.org/2000/svg";
  let tl = null;
  const el = {};
  function node(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const rectD = (r) => `M${r[0]} ${r[1]} L${r[0] + r[2]} ${r[1]} L${r[0] + r[2]} ${r[1] + r[3]} L${r[0]} ${r[1] + r[3]} Z`;
  // katakana-like "go" (コ + dakuten) as brush strokes in a 100x100 box
  const GO = ["M10 22 L78 22 L74 86", "M14 86 L76 86", "M84 4 L92 18", "M96 0 L104 14"];
  const DON = ["M30 0 L30 100", "M30 40 L70 58", "M78 4 L86 18", "M90 0 L98 14", "M120 30 L132 44", "M118 96 Q160 80 176 30"];

  S.build = function () {
    const svg = document.getElementById("svg");
    if (!svg) return false;
    tl = anime.timeline({ autoplay: false, easing: "easeOutQuad" });
    const draw = (paths, t0, dur, stagger = 0) => tl.add({ targets: paths, strokeDashoffset: [anime.setDashoffset, 0], duration: dur * 1000, delay: anime.stagger(stagger) }, Math.max(0, t0) * 1000);
    // panel borders
    el.panels = [];
    const pg = node("g", { id: "panels" }, svg);
    for (const d of MV.PANEL_DECL) {
      const p = node("path", { d: rectD(d.r), fill: "none", stroke: "#0a0710", "stroke-width": 8, "stroke-linejoin": "miter", opacity: 0 }, pg);
      el.panels.push({ p, d });
      draw([p], d.t - 0.06, 0.3);
    }
    // reticle
    const rg = (el.ret = node("g", { id: "ret", opacity: 0 }, svg));
    const rp = [node("circle", { cx: 0, cy: 0, r: 150, fill: "none", stroke: "#e8283c", "stroke-width": 6 }, rg),
      node("circle", { cx: 0, cy: 0, r: 60, fill: "none", stroke: "#e8283c", "stroke-width": 3 }, rg),
      node("path", { d: "M-230 0 L-70 0 M70 0 L230 0 M0 -230 L0 -70 M0 70 L0 230", fill: "none", stroke: "#e8283c", "stroke-width": 5 }, rg),
      node("path", { d: "M-150 -10 L-150 10 M150 -10 L150 10 M-10 150 L10 150 M-10 -150 L10 -150 M-110 -6 L-110 6 M110 -6 L110 6", fill: "none", stroke: "#e8283c", "stroke-width": 4 }, rg)];
    el.retP = rp;
    draw(rp, 3.0, 0.45, 90);
    // menace marks (two sets: Death at 3.3 s, the hero at 28.3 s and 40.6 s)
    el.go = [];
    for (const [t0, x, y, s, col] of [[3.25, 120, 140, 1.15, "#0a0710"], [28.2, 1460, 160, 1.3, "#ffd36b"], [41.7, 140, 120, 1.4, "#ffffff"]]) {
      const g = node("g", { opacity: 0 }, svg);
      const paths = [];
      for (let k = 0; k < 3; k++) {
        const gg = node("g", { transform: `translate(${k * 80} ${k * 150}) rotate(${-8 + k * 4})` }, g);
        for (const d of GO) paths.push(node("path", { d, fill: "none", stroke: col, "stroke-width": 15, "stroke-linecap": "round", "stroke-linejoin": "round" }, gg));
        for (const d of GO) { const o = node("path", { d, fill: "none", stroke: col === "#0a0710" ? "#ffffff" : "#120d1c", "stroke-width": 5, "stroke-linecap": "round" }, gg); o.setAttribute("transform", "translate(5 5)"); paths.push(o); }
      }
      el.go.push({ g, t0, x, y, s });
      draw(paths, t0, 0.5, 18);
    }
    // impact "DON"-like decoration at the colour burst
    const dg = (el.don = node("g", { opacity: 0 }, svg));
    const dp = DON.map((d) => node("path", { d, fill: "none", stroke: "#ffffff", "stroke-width": 18, "stroke-linecap": "round" }, dg));
    draw(dp, 23.2, 0.3, 30);
    // shards of the page (colour burst)
    const sg = (el.shards = node("g", { opacity: 0 }, svg));
    el.sh = [];
    for (let i = 0; i < 18; i++) {
      const cx = 100 + U.hash(i, 1) * 1720, cy = 80 + U.hash(i, 2) * 920, r = 70 + U.hash(i, 3) * 130;
      const pts = [0, 1, 2].map((j) => { const a = (j / 3) * U.TAU + U.hash(i, 4 + j) * 1.4; return [Math.cos(a) * r, Math.sin(a) * r]; });
      const p = node("path", { d: "M" + pts.map((q) => q[0].toFixed(0) + " " + q[1].toFixed(0)).join(" L") + " Z", fill: "#f4efe4", stroke: "#0a0710", "stroke-width": 6 }, sg);
      el.sh.push({ p, cx, cy, i });
    }
    // HP bar (L7)
    const hg = (el.hp = node("g", { opacity: 0 }, svg));
    el.hpFrame = node("path", { d: "M1040 150 L1840 150 L1840 214 L1040 214 Z", fill: "none", stroke: "#0a0710", "stroke-width": 8 }, hg);
    el.hpFill = node("rect", { x: 1052, y: 162, width: 776, height: 40, fill: "#0a0710" }, hg);
    el.hpTicks = node("path", { d: "", stroke: "#f4efe4", "stroke-width": 6 }, hg);
    draw([el.hpFrame], 17.7, 0.4);
    // title frame
    const tg = (el.title = node("g", { opacity: 0 }, svg));
    const tp = [node("path", { d: "M360 300 L1560 300", fill: "none", stroke: "#ffd36b", "stroke-width": 6 }, tg),
      node("path", { d: "M360 790 L1560 790", fill: "none", stroke: "#ffd36b", "stroke-width": 6 }, tg),
      node("path", { d: "M300 545 A 50 50 0 1 1 300 546 M1620 545 A 50 50 0 1 1 1620 546", fill: "none", stroke: "#e8283c", "stroke-width": 8 }, tg)];
    draw(tp, 57.2, 0.9, 150);
    tl.seek(U.TOTAL * 1000);
    tl.seek(0);
    return true;
  };

  const show = (n, a) => { n.setAttribute("opacity", a.toFixed(3)); n.style.display = a > 0.001 ? "inline" : "none"; };

  S.render = function (t, ctx) {
    if (!tl) return;
    tl.seek(t * 1000);
    // panel borders: visible inside their shot window
    for (const { p, d } of el.panels) {
      const on = t >= d.t - 0.06 && t < d.t1 && (!ctx.burst || t < 23.16);
      show(p, on ? 1 : 0);
      if (on && ctx.page) p.setAttribute("transform", ctx.page); else p.removeAttribute("transform");
    }
    // reticle
    const R = ctx.reticle;
    show(el.ret, R ? R.a : 0);
    if (R) el.ret.setAttribute("transform", `translate(${R.x.toFixed(1)} ${R.y.toFixed(1)}) scale(${R.s.toFixed(3)})`);
    // menace marks
    for (const m of el.go) {
      const a = t >= m.t0 && t < m.t0 + 2.2 && ctx.go ? 1 : 0;
      show(m.g, a);
      if (a) { const j = Math.floor(t * 30); m.g.setAttribute("transform", `translate(${m.x + (U.hash(j, 1) - 0.5) * 10} ${m.y + (U.hash(j, 2) - 0.5) * 10}) scale(${m.s})`); }
    }
    const da = t >= 23.18 && t < 24.2 ? 1 - U.inv(23.9, 24.2, t) : 0;
    show(el.don, da);
    if (da) el.don.setAttribute("transform", `translate(1460 120) scale(${(1.6 + U.inv(23.18, 24.2, t) * 0.3).toFixed(3)}) rotate(-10)`);
    // shards: fly out from the burst
    const sk = U.inv(23.16, 24.0, t);
    show(el.shards, t >= 23.16 && t < 24.0 ? 1 : 0);
    if (sk > 0 && sk < 1) for (const s of el.sh) {
      const dx = s.cx - 900, dy = s.cy - 560, d = Math.hypot(dx, dy) || 1;
      const e = U.ease.outCubic(sk) * (600 + 500 * U.hash(s.i, 9));
      s.p.setAttribute("transform", `translate(${(s.cx + (dx / d) * e).toFixed(1)} ${(s.cy + (dy / d) * e + 600 * sk * sk).toFixed(1)}) rotate(${(sk * 400 * (U.hash(s.i, 8) - 0.5)).toFixed(1)}) scale(${(1 - 0.5 * sk).toFixed(3)})`);
    }
    // HP bar
    const H = ctx.hp;
    show(el.hp, H ? 1 : 0);
    if (H) {
      el.hpFill.setAttribute("width", (776 * U.clamp(H.v)).toFixed(1));
      el.hpFill.setAttribute("fill", H.v < 0.25 ? "#e8283c" : "#0a0710");
      let d = "";
      for (let i = 1; i < 8; i++) d += `M${1052 + i * 97} 162 L${1052 + i * 97} 202 `;
      el.hpTicks.setAttribute("d", d);
    }
    show(el.title, t >= 57.15 ? 1 : 0);
  };
})();
