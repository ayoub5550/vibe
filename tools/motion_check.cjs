// motion_check.cjs: dance-snap detector. For every frame in the given windows it renders the
// frame, reads the hero pose (MV.lastPose), solves the joints and measures how far the wrists,
// ankles and neck move between consecutive frames (canvas px; the figure is ~1100 px tall).
// Gate (AGENTS.md section 11): SNAP = a joint moving > 400 px (~35% of the figure) in one frame inside a
// shot (a teleport, i.e. missing in-betweens). FAST = > 200 px: allowed only for kicks, pops and spins.
// Usage: node tools/motion_check.cjs <projectDir> <t0-t1,t0-t1,...> [fps=30]
const path = require("path"), fs = require("fs"), http = require("http");
const puppeteer = require("/usr/lib/node_modules/hyperframes/node_modules/puppeteer-core");
const dir = process.argv[2], wins = (process.argv[3] || "0-5").split(",").map((w) => w.split("-").map(Number));
const fps = Number(process.argv[4] || 30);
const types = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".wav": "audio/wav" };
const srv = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p.endsWith("/") ? p + "index.html" : p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" }); res.end(d); });
}).listen(0, async () => {
  const browser = await puppeteer.launch({ executablePath: "/usr/local/bin/hyperframes-chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  let worst = [], snaps = 0, fast = 0, frames = 0;
  for (const [a, b] of wins) {
    const res = await page.evaluate((a, b, fps) => {
      const out = [];
      let prev = null, prevShot = null;
      for (let f = Math.round(a * fps); f <= Math.round(b * fps); f++) {
        const t = f / fps;
        MV.renderAt(t, { poseOnly: true });
        const J = MV.jesterJoints(MV.lastPose);
        const CX = MV.JESTER_CANVAS.w / 2;
        const pts = [J.wrL, J.wrR, J.ankL, J.ankR, J.neckTop].map((p) => [CX + (p[0] - CX) * MV.lastPose.spin, p[1]]);
        if (prev && prevShot === MV.lastShot) {
          let m = 0;
          pts.forEach((p, i) => { m = Math.max(m, Math.hypot(p[0] - prev[i][0], p[1] - prev[i][1])); });
          out.push([t, m, MV.lastShot]);
        }
        prev = pts; prevShot = MV.lastShot;
      }
      return out;
    }, a, b, fps);
    for (const [t, m, sh] of res) {
      frames++;
      if (m > 400) { snaps++; console.log(`SNAP t=${t.toFixed(3)} max joint move ${m.toFixed(0)} px/frame  (${sh})`); }
      else if (m > 200) fast++;
      worst.push([m, t, sh]);
    }
  }
  worst.sort((x, y) => y[0] - x[0]);
  console.log(`frames ${frames}  SNAP(>400px/frame) ${snaps}  fast(200-400) ${fast}  -> ${snaps ? "FAIL" : "PASS"}`);
  console.log("largest per-frame moves:", worst.slice(0, 6).map((w) => `${w[1].toFixed(2)}s ${w[0].toFixed(0)}px`).join(", "));
  await browser.close(); srv.close();
});
