// frames.cjs — fast still-frame harness (no HyperFrames runtime needed).
// Serves a project dir, opens it in the bundled headless Chrome (SwiftShader WebGL), calls
// MV.renderAt(t) for each requested time and saves 1920x1080 PNGs. Prints page errors.
// Usage: node tools/frames.cjs <projectDir> <t1,t2,...> <outDir>
// Typical: ~1 s per frame. Use it for every review pass; render the MP4 only when frames look right.
const path = require("path"), fs = require("fs"), http = require("http");
const puppeteer = require("/usr/lib/node_modules/hyperframes/node_modules/puppeteer-core");
const dir = process.argv[2], times = (process.argv[3] || "1").split(",").map(Number), out = process.argv[4] || "/work/temp/dbg/out";
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".wav": "audio/wav", ".png": "image/png" };
const srv = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p.endsWith("/") ? p + "index.html" : p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" }); res.end(d); });
}).listen(0, async () => {
  const port = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: "/usr/local/bin/hyperframes-chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on("console", (m) => { if (!m.text().includes("deprecated")) console.log("console:", m.type(), m.text()); });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message, e.stack));
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  for (const t of times) {
    const t0 = Date.now();
    try { await page.evaluate((tt) => MV.renderAt(tt), t); } catch (e) { console.log("RENDER ERR", t, e.message); }
    const ms = Date.now() - t0;
    await page.screenshot({ path: `${out}/t${String(t.toFixed(2)).padStart(6, "0")}.png` });
    console.log("rendered", t, ms + "ms");
  }
  await browser.close(); srv.close();
});
