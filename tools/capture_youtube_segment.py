#!/usr/bin/env python3
"""capture_youtube_segment.py — record a segment of a public YouTube video for PRIVATE study.

Why: from the Viktor sandbox, yt-dlp and timedtext are blocked by YouTube's bot wall. The Viktor
browser tool with its managed proxy can play the video; MediaRecorder on the <video> element's
captureStream() records picture + sound in real time, then the file is pulled out in base64 chunks.
Never commit the recording to a public repo (it is someone else's work). Use it to study shots,
timing and to cut the exact song excerpt.

  cd /work && uv run python /work/repos/vibe/tools/capture_youtube_segment.py <video_id> <start_s> <dur_s> <out.webm>
  e.g. ... 3S4vuHxGh7c 461 88 /work/data/ref/ultracode.webm     (Ultracode music video = 7:43-9:08)

Also writes <out>.captions.json (the video's caption track) when one exists.
Lessons baked in: start playback via a click + player API (unmuted autoplay is blocked otherwise),
seek with player.seekTo (setting video.currentTime directly stalls buffering), poll from Python
instead of awaiting inside page.evaluate (a stalled play() promise hangs the call forever).
"""
import asyncio, base64, json, sys, time
sys.path.insert(0, "/work")
from sdk.utils.browser import get_browser, close_browser


async def main(vid, start, dur, out):
    b = await get_browser("yt-capture", proxy=True, viewport_width=1280, viewport_height=800, timeout_seconds=3600)
    p = b.page
    caps = []

    async def on_resp(r):
        if "timedtext" in r.url:
            try:
                caps.append(await r.text())
            except Exception:
                pass
    p.on("response", lambda r: asyncio.ensure_future(on_resp(r)))
    await b.goto(f"https://www.youtube.com/watch?v={vid}&t={int(start)}s", timeout=60000)
    await asyncio.sleep(5)
    await p.mouse.click(460, 300)
    await asyncio.sleep(2)
    # toggle captions twice to force the caption request (it carries the needed tokens)
    for _ in range(2):
        try:
            await p.locator("#movie_player").focus()
            await p.keyboard.press("c")
        except Exception:
            pass
        await asyncio.sleep(2)
    for _ in range(20):
        st = await p.evaluate("() => { const pl = document.querySelector('#movie_player'); const v = document.querySelector('video'); return {s: pl.getPlayerState(), rs: v.readyState}; }")
        if st["s"] == 1 and st["rs"] >= 3:
            break
        await p.evaluate("() => document.querySelector('#movie_player').playVideo()")
        await asyncio.sleep(2)
    await p.evaluate(f"() => {{ const pl = document.querySelector('#movie_player'); try {{ pl.unloadModule('captions'); }} catch(e) {{}} pl.unMute(); pl.setVolume(100); pl.seekTo({start}, true); pl.playVideo(); }}")
    await asyncio.sleep(3)
    await p.evaluate("""() => {
      const v = document.querySelector('video');
      const stream = v.captureStream();
      const rec = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 5000000, audioBitsPerSecond: 192000});
      window.__chunks = []; window.__recState = 'rec'; window.__recStartT = v.currentTime;
      rec.ondataavailable = e => { if (e.data && e.data.size) window.__chunks.push(e.data); };
      rec.onstop = () => { window.__recBlob = new Blob(window.__chunks, {type: 'video/webm'}); window.__recState = 'done'; };
      window.__rec = rec; rec.start(1000);
    }""")
    t0 = time.time()
    while True:
        await asyncio.sleep(5)
        t = await p.evaluate("() => document.querySelector('video').currentTime")
        print(f"recording… video time {t:.1f}", flush=True)
        if t >= start + dur or time.time() - t0 > dur + 120:
            break
    await p.evaluate("() => { window.__rec.stop(); document.querySelector('video').pause(); }")
    for _ in range(20):
        if await p.evaluate("() => window.__recState") == "done":
            break
        await asyncio.sleep(1)
    total = await p.evaluate("() => window.__recBlob.size")
    rec_start = await p.evaluate("() => window.__recStartT")
    with open(out, "wb") as f:
        off = 0
        while off < total:
            b64 = await p.evaluate("""async ([off, len]) => {
                const buf = await window.__recBlob.slice(off, off + len).arrayBuffer();
                let s = ''; const bytes = new Uint8Array(buf);
                for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
                return btoa(s);
            }""", [off, 4_000_000])
            f.write(base64.b64decode(b64))
            off += 4_000_000
    print(f"wrote {out}: {total} bytes, recording starts at video time {rec_start:.3f}s")
    if caps:
        best = max(caps, key=len)
        open(out + ".captions.json", "w").write(best)
        print(f"captions -> {out}.captions.json")
    await close_browser("yt-capture")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]))
