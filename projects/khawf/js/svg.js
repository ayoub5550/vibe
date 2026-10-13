// svg.js — the vector layer (inline <svg id="svg"> above the canvases): girih rosettes, the
// cartouche around «الملك لله», the voice/echo rings, split lines and the title arch.
// anime.js draws the strokes (one paused timeline, primed, seeked to t*1000 from MV.renderAt);
// visibility windows and per-frame transforms are set by our own code from t. Frame = f(t).
window.MV = window.MV || {};
(function () {
  const U = MV.U;
  const S = (MV.Svg = {});
  const NS = "http://www.w3.org/2000/svg";
  let tl = null, el = {};

  function node(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const pt = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const poly = (pts, close = true) => "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + (close ? " Z" : "");

  // girih rosette around (0,0): 16-point star polygon {16/5}, an 8-point star {8/3}, rings, petals
  function rosette(g, R, color, outerOnly = false) {
    const paths = [];
    const star = (n, step, r, rot) => {
      const pts = [];
      let i = 0;
      for (let k = 0; k <= n; k++) { pts.push(pt(r, rot + (i * U.TAU) / n)); i = (i + step) % n; }
      return poly(pts, false);
    };
    paths.push(node("path", { d: star(16, 5, R, 0), class: "rs" }, g));
    paths.push(node("circle", { r: R * 1.06, class: "rs" }, g));
    if (!outerOnly) paths.push(node("path", { d: star(8, 3, R * 0.62, Math.PI / 8), class: "rs" }, g));
    if (!outerOnly) paths.push(node("circle", { r: R * 0.24, class: "rs" }, g));
    for (let i = 0; i < (outerOnly ? 0 : 8); i++) {
      const a = (i * U.TAU) / 8 + Math.PI / 8;
      const p0 = pt(R * 0.3, a), p1 = pt(R * 0.55, a - 0.2), p2 = pt(R * 0.82, a), p3 = pt(R * 0.55, a + 0.2);
      paths.push(node("path", { d: poly([p0, p1, p2, p3]), class: "rs" }, g));
    }
    for (const p of paths) { p.setAttribute("fill", "none"); p.setAttribute("stroke", color); p.setAttribute("stroke-width", 5); p.setAttribute("stroke-linejoin", "round"); }
    return paths;
  }
  // shamsa cartouche: scalloped circle + inner ring
  function cartouche(g, R, color) {
    let d = "";
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a0 = (i * U.TAU) / n, a1 = ((i + 1) * U.TAU) / n;
      const p0 = pt(R, a0), p1 = pt(R, a1), pm = pt(R * 1.12, (a0 + a1) / 2);
      d += (i ? " L" : "M") + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + " Q" + pm[0].toFixed(1) + " " + pm[1].toFixed(1) + " " + p1[0].toFixed(1) + " " + p1[1].toFixed(1);
    }
    const a = node("path", { d: d + " Z", fill: "rgba(29,35,87,0.92)", stroke: color, "stroke-width": 8 }, g);
    const b = node("circle", { r: R * 0.86, fill: "none", stroke: color, "stroke-width": 3 }, g);
    return [a, b];
  }
  function archD(cx, y0, w, hs, c = 0.38) {
    const cc = c * w, r = w + cc, ys = y0 - hs, a1 = Math.acos(cc / r), pts = [[cx - w, y0], [cx - w, ys]];
    for (let i = 1; i <= 40; i++) { const a = Math.PI + (a1 * i) / 40; pts.push([cx + cc + r * Math.cos(a), ys + r * Math.sin(a)]); }
    for (let i = 1; i <= 40; i++) { const a = -a1 + (a1 * i) / 40; pts.push([cx - cc + r * Math.cos(a), ys + r * Math.sin(a)]); }
    pts.push([cx + w, y0]);
    return poly(pts, false);
  }

  // usage windows (seconds): [group, t0 (draw start), drawDur, tOut]
  const WIN = {
    ros0: [0.1, 1.2, 2.4],           // shot 1: the emblem over the dark opening
    ros1: [100.95, 1.8, 103.7],      // «كرم»: around the cloaked old man
    ros2: [123.6, 1.3, 125.7],       // «نعمة»: the curse blooms into a gift
    cart: [13.42, 1.0, 15.6],        // «الملك لله»
    split2: [134.0, 0.5, 137.0],     // شره | جدواه
    arch: [161.6, 2.2, 999],         // title arch
  };
  S.WIN = WIN;

  S.build = function () {
    const svg = document.getElementById("svg");
    if (!svg) return false;
    const mk = (id, x, y) => { const g = node("g", { id, transform: `translate(${x} ${y})`, opacity: 0 }, svg); el[id] = g; return g; };
    el.ros0p = rosette(mk("ros0", 960, 540), 430, "#e0aa4a");
    el.ros1p = rosette(mk("ros1", 960, 470), 380, "#ffd98a");
    el.ros2p = rosette(mk("ros2", 960, 540), 480, "#ffd98a", true);
    // gold on indigo, inside the screen, 150 px type (draft 1: 120 px on a muddy disc into the border)
    const cg = mk("cart", 820, 430);
    el.cartp = cartouche(cg, 235, "#e0aa4a");
    el.cartText = node("text", { x: 0, y: 48, "text-anchor": "middle", direction: "rtl", class: "svgword", "font-size": 150, fill: "#ffd98a", "fill-opacity": 0 }, cg);
    el.cartText.textContent = "الملك لله";
    const sg2 = mk("split2", 960, 0);
    el.split2p = [node("line", { x1: 0, y1: 90, x2: 0, y2: 990, stroke: "#e0aa4a", "stroke-width": 6 }, sg2)];
    const ag = mk("arch", 0, 0);
    el.archp = [node("path", { d: archD(960, 1010, 400, 380, 0.34), fill: "none", stroke: "#e0aa4a", "stroke-width": 7 }, ag),
      node("path", { d: archD(960, 1010, 375, 360, 0.34), fill: "none", stroke: "#e0aa4a", "stroke-width": 2.5 }, ag)];
    // echo rings (attributes from t by our own code)
    const eg = mk("echo", 0, 0);
    el.voice = node("path", { fill: "none", stroke: "#fff3d0", "stroke-width": 7, "stroke-linecap": "round" }, eg);
    el.echos = [0, 1, 2, 3, 4, 5].map(() => node("path", { fill: "none", stroke: "#e04a36", "stroke-width": 6 }, eg));

    tl = anime.timeline({ autoplay: false, easing: "easeInOutSine" });
    const draw = (paths, t0, dur, stagger = 60) => tl.add({ targets: paths, strokeDashoffset: [anime.setDashoffset, 0], duration: dur * 1000, delay: anime.stagger(stagger) }, t0 * 1000);
    draw(el.ros0p, WIN.ros0[0], WIN.ros0[1]);
    draw(el.ros1p, WIN.ros1[0], WIN.ros1[1]);
    draw(el.ros2p, WIN.ros2[0], WIN.ros2[1], 40);
    draw(el.cartp, WIN.cart[0], WIN.cart[1], 120);
    draw(el.split2p, WIN.split2[0], WIN.split2[1]);
    draw(el.archp, WIN.arch[0], WIN.arch[1], 200);
    // PRIME (AGENTS.md section 12): seek to the end and back so later seeks are pure functions of t
    tl.seek(U.TOTAL * 1000);
    tl.seek(0);
    return true;
  };

  // per-frame: seek the strokes, then visibility windows + transforms from t
  S.render = function (t, ctx) {
    if (!tl) return;
    tl.seek(t * 1000);
    for (const id in WIN) {
      const [t0, dur, tOut] = WIN[id];
      const a = (id === "ros1" ? 0.5 : 1) * U.inv(t0 - 0.05, t0 + 0.2, t) * (1 - U.inv(tOut - 0.3, tOut, t));
      el[id].setAttribute("opacity", a.toFixed(3));
      el[id].style.display = a > 0.001 ? "inline" : "none";
      void dur;
    }
    const rot = (id, cx, cy, deg, s = 1) => el[id].setAttribute("transform", `translate(${cx} ${cy}) rotate(${deg.toFixed(2)}) scale(${s.toFixed(3)})`);
    rot("ros0", 960, 540, t * 6, 1 + 0.05 * t);
    rot("ros1", 960, 470, -t * 4);
    rot("ros2", 960, 540, (t - 123.6) * 30, 0.6 + 0.4 * U.ease.outBack(U.inv(123.6, 124.4, t)));
    el.cartText.setAttribute("fill-opacity", U.inv(13.9, 14.3, t).toFixed(3));
    // echo: clean voice wave from the youth (left) and distorted, delayed echo rings returning
    const ea = ctx && ctx.echo ? 1 : 0;
    el.echo.setAttribute("opacity", ea);
    el.echo.style.display = ea ? "inline" : "none";
    if (ea) {
      const x0 = 520, y0 = 520;
      let d = "M" + x0 + " " + y0;
      for (let x = 0; x <= 600; x += 10) d += ` L${x0 + x} ${(y0 + 34 * Math.sin(x * 0.05 - t * 9) * U.inv(0, 60, x)).toFixed(1)}`;
      el.voice.setAttribute("d", d);
      el.voice.setAttribute("stroke-dasharray", "620 2000");
      el.voice.setAttribute("stroke-dashoffset", (620 - 620 * U.inv(66.96, 67.6, t)).toFixed(1));
      el.echos.forEach((p, i) => {
        const te = 68.7 + i * 0.32; // the echo comes back late, on «واعتلال صداه»
        const k = U.clamp((t - te) / 1.6);
        if (k <= 0) { p.setAttribute("d", ""); return; }
        const R = 120 + k * 520;
        let dd = "";
        for (let j = 0; j <= 64; j++) {
          const a = Math.PI * 0.55 + (j / 64) * Math.PI * 0.9;
          const jag = 1 + 0.09 * Math.sin(j * 2.7 + i * 1.3 + t * 7) * (0.4 + k) + 0.05 * (U.hash(j, i) - 0.5);
          dd += (j ? " L" : "M") + (1500 + Math.cos(a) * R * jag).toFixed(1) + " " + (520 + Math.sin(a) * R * jag).toFixed(1);
        }
        p.setAttribute("d", dd);
        p.setAttribute("stroke-opacity", (1 - k).toFixed(3));
      });
    }
  };
})();
