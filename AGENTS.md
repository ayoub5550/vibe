# AGENTS.md: the strict recipe for an official-style music video (AI-generated assets, code-built edit)

Read this whole file before you touch anything. It is the contract for every agent in this repo
(Claude Code reads it through `CLAUDE.md`). The rules here come from a finished build: the
reference video in `reference/mirror-mirror/` was made by following them. If a step fails, fix
the step and update this file. Do not skip it.

---

## 0. What this repo is

- **Goal:** an official-style **music video**. Every visual asset (characters, worlds, props, textures,
  footage) is **generated with AI** (§1.3, M9, §4c). Code (HyperFrames + Three.js + Canvas 2D + SVG +
  FFmpeg) builds the edit: timing, sync, camera moves on stills, typography, transitions, FX, grading.
  It runs the full length of a song excerpt, stays in sync with the song, and you render it locally to MP4.
- **Owner rule change (2026-10-13), binding:** the first three builds (Mirror Mirror, khawf, mawt draft 1)
  were code-only: every pixel drawn by code from primitives, with only free fonts. The owner rejected that
  look: "very cartoonish… running that looks like dancing, childish content". The code-only rule is
  **removed**. Assets are **always generated with AI** and are never collected from free, stock or
  low-quality sources. The older projects below stay as references for the **pipeline** (audio, timing,
  edit grammar, gates), not for the look.
- **Origin:** Devarf's experiment *"I Had Opus 5.5 Make the Same Music Video at Every Effort"*
  (https://youtu.be/3S4vuHxGh7c). It used one song, one prompt and six runs. The **Ultracode run**
  (chapter 7:43–9:08; the music starts at **7:48.9**) sets the visual bar: a 2D harlequin Jack on a
  3D stage built from playing cards. A shot-by-shot breakdown is in `reference/ultracode/BREAKDOWN.md`.
- **Reference implementation:** `projects/mirror-mirror/` (same song, same brief), rendered to
  `reference/mirror-mirror/mirror-mirror.mp4` (81 s: the 79.22 s song plus a 1.8 s title tail). Its
  edit is in `projects/mirror-mirror/storyboard.md`. Build history: draft 1 scored 5/10 against
  Ultracode with one critic. Everything §11 now demands comes from that critique: exposure, hero
  size, motion, finale, walls, typography. The final fixes the P0s and most P1s.
  To make a new video, copy its **architecture and process**. Do not copy its imagery unless the
  song is the same.
- **Second project: `projects/khawf/`**, «الخوف» (Fear), a poem by Tamim Al-Barghouti recited over a
  beatless drone (167.4 s). It is a shadow-play (خيال الظل) world with a leather-puppet Sultan who ages,
  Blender props and Arabic type. It shows how to handle **spoken word / poetry**: the beat grid comes
  from the metre (`tools/voice_pulse.py`, Step 3b), cuts land on hemistichs, and the type is RTL.
  Build history: draft 1 scored 5/10 with one P0 (the Ruqaa font dropped its dots). The critic report is
  in `reference/khawf/`, and the fixes are listed at the end of its `storyboard.md`.
  **Its full build recipe is [`projects/khawf/BUILD.md`](projects/khawf/BUILD.md)**: every command, parameter,
  measured timing and pitfall, from the YouTube audio to the 47 MB repo copy and the YouTube kit. Several
  steps were re-run to prove they reproduce. Read it before you start a poem or spoken-word video.

## 1. The brief (what the original prompt asked; it is your spec too)

> A full music video, like a real official one, with a lot of dance or some story, made as motion
> graphics only. 2D, 3D or both. What matters is that it is creative and unique. Work alone from
> start to finish. Do not stop to ask.

How to read the brief (binding):
1. "Official" means one world, one concept, a hero, an arc and a title card. A screensaver does
   not count, and neither does a lyric slideshow.
2. "Dance **or** story": every lyric line has a literal visual (see §8). The hero dances only when the
   music is dance music. For poetry and spoken word the hero **acts** (grounded, adult body language,
   real weight), and nobody dances or bounces on the beat. A run must read as a run, not as a dance.
3. **Assets are always AI-generated (owner rule, 2026-10-13).** Characters, worlds, props, textures,
   keyframes and footage come from the best available AI image and video models (§4c), designed for
   this video and reviewed shot by shot. **Never** collect assets from free or stock libraries, clip-art,
   random web images or random repos. Never substitute code-drawn primitives (stick puppets, flat shapes)
   for characters or worlds: that is what read as childish. Code still draws what code does best: kinetic
   type, HUDs, flashes, particles, grading, transitions and camera moves over generated stills. Self-hosted
   OFL fonts are fine for type. Blender is optional and only for things AI cannot do (exact geometry).
4. "Work alone" means you never stop to ask. Make the decision, write it into `storyboard.md`
   or `analysis/story.md`, and keep going.

## 2. Definition of done (every box must be true)

- [ ] `out/<name>.mp4` is **1920×1080, 30 fps (or the fps the owner asked for: mawt is 60), H.264 + AAC**. Duration = excerpt (+ an optional
      end-card tail of ≤ 2 s), within 0.1 s.
- [ ] The audio is the **unaltered song excerpt**, starting at frame 0 and in sync:
      `tools/check_render.sh` prints `RENDER CHECK: PASS` (envelope correlation > 0.9, lag ≤ 30 ms).
- [ ] **Every lyric line** has an on-screen literal visual (a shot, or a timed event inside a shot)
      that starts **0–0.25 s before** the line's first sung word.
- [ ] Cuts sit on the beat grid (§8). The hero hits poses **on beats**.
- [ ] There are no unintended black runs ≥ 0.5 s, no frozen stretches > 1 s, no flicker and no
      missing-font fallback text.
- [ ] **Deterministic:** each frame is a pure function of `t`. Rendering twice gives the same frames.
      (AI generation itself is not deterministic, so every generated file is kept and listed with its
      prompt and model in `assets/ai/manifest.json`; the render from those files is deterministic.)
- [ ] **Every visual asset is AI-generated** (M9) and listed in the manifest. No stock, no scraped images.
- [ ] `hyperframes lint` reports 0 errors. `hyperframes validate --no-contrast` reports 0 errors.
- [ ] You looked at a full-video contact sheet (2 fps) yourself, and one independent critic
      reviewed the draft. All P0/P1 findings are fixed or written up as deliberate.
- [ ] The repo is updated: `analysis/*`, `storyboard.md`, the code, and `reference/<name>/<name>.mp4` (if
      the repo licence allows, see §3). The song audio and third-party recordings are **not** committed.

## 3. Hard rules

**MUST**
- M1. One HyperFrames project per video, in `projects/<slug>/`. The composition length equals the
  excerpt length, plus an optional title tail of up to 2 s after the music.
- M2. Frame = f(t). All motion comes from `t` (seconds) or beat `b = (t − beat_offset) / beat_period`.
  "Random" values come from seeded hashes (`U.hash(i, j)`, `U.rng(seed)`, `U.noise1(x, seed)`).
  Particles are closed-form functions of `t` (life cycles via modulo), never integrated step by step.
- M3. Reset the whole world every frame (`W.reset()`), then let the active shot configure it.
  No shot may depend on what an earlier frame did.
- M4. Vendor every dependency (three.js UMD, gsap, anime.js, fonts) into the project. Nothing loads from
  the network at render time.
- M5. Verify every number you use (BPM, offsets, word times) against the audio analysis.
  Never guess a timing.
- M6. Proof-read the lyrics by hand after speech-to-text (see Step 2).
- M7. Review rendered frames with your own eyes (`view_image`) before every full render.
- M8. Keep cost under control: one agent builds the whole video, and at most **one** critic subagent
  reviews each draft. This is the Ultracode lesson (§13).
- M9. **Generate every visual asset with AI** (§4c): character sheets first, then keyframes that use the
  sheets as reference images, then image-to-video clips from the approved keyframes. Look at every
  generated image and clip yourself (`view_image` on stills or contact sheets) and regenerate anything
  off-model, childish, malformed (hands, faces, text) or off-brief. Log every file with model, prompt,
  reference images and cost in `assets/ai/manifest.json`.

**MUST NOT**
- N1. No `Math.random()`, `Date.now()`, `performance.now()`, `requestAnimationFrame` loops, CSS
  animations or transitions, `setTimeout`/`setInterval` animation or GIFs. AI footage enters the
  composition only as HyperFrames clips (`<video muted playsinline data-start … data-media-start …>`,
  which the framework seeks frame by frame) or pre-cut into one base plate with FFmpeg (§4c).
  HyperFrames seeks frames **out of order across parallel workers**, so any state that builds up
  over time will break.
- N2. Do not query the DOM at the top level of a script. The HyperFrames compiler may hoist scripts
  above `<body>`. Look canvases up lazily on the first render (see `main.js` → `build()`).
- N3. Do not put the `window.__timelines` registration in an external file. The linter only finds it
  **inline** in `index.html`.
- N4. Size, not licence, limits what goes into git. **The repo is private since 2026-10-13 and the owner
  confirmed that all licences are covered**, so the song excerpt, the final MP4, approved AI keyframes and
  character sheets may be committed. GitHub rejects files over 100 MB and warns above 50 MB: keep raw AI
  video clips and `--quality high` masters out of git (`/work/data/vibe/<slug>/` or the cloud store, listed
  in `assets/ai/manifest.json`), commit the < 50 MB repo copy (Step 13), and store stills as JPG
  (about 1600 px, q 88). Never commit secrets or API keys.
- N5. No karaoke. Show at most 1–3 key words per line as kinetic type, never the full lyric line.
- N6. Do not end on a fade to black over the last sung word. End on the concept resolving, then a title card.

## 4. Environment (check before starting, ~30 s)

```bash
hyperframes --version          # 0.6.119   (CLI at /usr/local/bin/hyperframes)
node --version                 # v22.x
ffmpeg -version | head -1      # 5.1.x
ls /usr/local/bin/hyperframes-chrome          # headless Chrome used by renders + tools/frames.cjs
ls /usr/lib/node_modules/hyperframes/node_modules/puppeteer-core   # used by tools/frames.cjs
cd /work && uv run --with librosa python -c "import librosa; print(librosa.__version__)"
nproc; free -g                 # this build: 17 CPUs, 328 GB RAM, no GPU (WebGL = SwiftShader, CPU)
bash tools/install_blender.sh  # only if the video uses Blender assets (§4b); prints "Blender 4.2.3 LTS"
```
Python tools that need librosa run as `cd /work && uv run --with librosa python <tool> …`.
The other tools only need the stdlib, PIL or ffmpeg. Speech-to-text uses the Viktor SDK
(`sdk.tools.utils_tools.speech_to_text`, ElevenLabs Scribe). The fallback is `faster-whisper`.

## 4b. Toolbox: every allowed technology, what it is for, and how to keep it deterministic

These are the tools the original Ultracode run had (three.js, Canvas 2D, SVG, frame-to-video),
plus the ones this repo adds. Every row was **tested in this environment** by
`projects/_toolbox-demo/`, a 6 s composition that uses five of them at once (screenshot recipe below).
The engine contract still applies to all of them: **one clock `t`, frame = f(t)** (M2), and nothing
plays by itself (N1).

| Tool | Role in a video | How to use it here (tested) | Rule |
|---|---|---|---|
| **three.js** (r158 UMD, vendored) | The 3D world: stage, camera, lights, pooled objects | `projects/mirror-mirror/js/stage.js`. WebGL is SwiftShader (CPU), see §12 | Cache textures by key. Never create geometry or textures per frame |
| **Canvas 2D** | The hero, card faces, kinetic type, the post pass (bloom, flashes, vignette) | `textures.js`, `jester.js`, `overlay.js` | The overlay is opaque and starts by copying `#gl` (§12) |
| **SVG** | Crisp vector layers: line art, rays, frames, diagrams, logo/title outlines | Inline `<svg viewBox="0 0 1920 1080">` above the canvases (`_toolbox-demo`) | Animate attributes only from `t`, via anime.js `seek` or your own code. No SMIL `<animate>`, no CSS animation |
| **anime.js** (v3.2.2, MIT, vendored `vendor/anime.min.js`) | Easing, staggers, SVG stroke draws and morphs on DOM/SVG layers | `anime.timeline({ autoplay: false })`, then `tl.seek(t * 1000)` inside your `renderAt(t)`. HyperFrames also has a built-in anime.js adapter (`window.__hfAnime`), but one clock is simpler | **Prime it** right after building: `tl.seek(END); tl.seek(0)` (§12). Stroke draws (`anime.setDashoffset`) work on path/rect/line/circle, **not `<text>`** |
| **web engine** (headless Chrome + HyperFrames 0.6.119) | Runs the composition, seeks each frame, captures it, muxes the audio | `hyperframes lint`, `validate --no-contrast`, `render`. Chrome is `/usr/local/bin/hyperframes-chrome` | Frames render out of order across workers. Proof: the demo renders identically with `-w 1` and `-w 6` (SSIM 0.9998) |
| **Blender** (4.2.3 LTS, CPU) | Real 3D objects you cannot fake in 2.5D: bevelled cards, glass, cloth, fluids, hard-surface props | `bash tools/install_blender.sh` (≈20 s, no root, installs under `~/opt`). Write a Python scene script like `tools/blender/card_spin.py` | Build the scene from a committed script. Textures and HDR-like backdrops may be AI-generated (§4c); never downloaded free models, HDRIs or textures. Render with **Cycles on CPU**, because EEVEE/Workbench need OpenGL and fail headless. Fixed `cycles.seed`, `use_animated_seed=False`, linear keys, `film_transparent=True`, view transform `Standard` |
| **Blender runner** | Runs any Blender script headless and reproducibly | `tools/blender_run.sh <script.py> -- <args>` (`-b --factory-startup -noaudio`, exits non-zero on a Python error). Example: 48 frames of 320² in about 5 s on 17 CPUs | Blender outputs a **PNG sequence**, never the final video. Pack it with `tools/sprite_atlas.py` and draw frame `floor(t·fps) % N` (Canvas 2D `drawImage` sub-rect, or a three.js texture with `repeat`/`offset`) |
| **FFmpeg** (5.1) | Encode, cut, probe and compare | Excerpt cutting (Step 1), `check_render.sh`, contact sheets, SSIM checks, repo/Slack re-encodes (Step 13) | Never re-time the song. Delivery = H.264 + AAC 1080p30 |
| **Python** (uv, 3.13) | Audio analysis, data files, image tooling | `cd /work && uv run --with librosa python tools/analyze_song.py …`; Pillow for atlases and contact sheets | Analysis numbers are the ground truth for timing (M5) |
| **Node.js** (22) | Puppeteer tools around the composition | `tools/frames.cjs` (stills at chosen t), `tools/motion_check.cjs` (dance-snap gate) | Same Chrome as the renderer |
| **AI (assets: required)** | **Every visual asset**: character sheets, keyframes, backgrounds, textures, footage (§1.3, M9). Also lyric transcription, analysis, the one critic (M8) | Viktor SDK: `coworker_text2im` (images) and `text_to_video` (image-to-video), recipe in §4c; `tools/transcribe_words.py` | Generated assets only, never free/stock/scraped. Review every output with your own eyes and log it in `assets/ai/manifest.json` |

**Choosing a layer (since 2026-10-13):** the picture comes from AI assets (§4c). Code layers sit on top
or around them. The older guidance below applies to code-drawn layers only. Use three.js for the world, Canvas 2D for the hero and everything drawn by
hand, SVG plus anime.js for precise vector graphics and type layouts that need easing, and Blender
for a hero prop that must look physically real. Use Blender for a few signature assets, not the whole
world. Every Blender asset needs its script in `projects/<slug>/blender/` and its atlas in
`assets/blender/`, and must be re-renderable with one command written in `storyboard.md`.

**Layer order in `index.html`:** `#gl` (three.js) → `#ov` (Canvas 2D, opaque post pass) → `<svg>`
→ hidden `<img>` sources and font-warm spans. Put a sprite atlas in a hidden `<img>` so the page load
waits for it. Then copy it into a natural-size canvas before using it as a WebGL texture (§12).

**Toolbox demo:** `projects/_toolbox-demo/` (6 s, no audio, lint 0/0, validate clean).
```bash
bash tools/install_blender.sh
tools/blender_run.sh tools/blender/card_spin.py -- --out /tmp/card --frames 48 --size 320
cd /work && uv run --with pillow python repos/vibe/tools/sprite_atlas.py "/tmp/card_*.png" \
    repos/vibe/projects/_toolbox-demo/assets/blender/card_atlas.png
cd repos/vibe/projects/_toolbox-demo && hyperframes lint && hyperframes render --output /tmp/demo.mp4
```
Expected: a ring of 12 Blender cards orbiting in three.js, a big Blender card spinning in Canvas 2D
on the beat rings, SVG rays drawn by an anime.js stagger, and a title frame drawn by an anime.js
stroke. The whole render takes about 15 s.

## 4c. AI asset pipeline (owner rule since 2026-10-13: every asset is AI-generated)

Tools (Viktor SDK, `from sdk.tools.utils_tools import coworker_text2im, text_to_video`; scripts run with
`cd /work && uv run python …`):
- **Images:** `coworker_text2im(prompt, image_paths=[refs…], aspect_ratio="3:2")`. The default model
  (`gpt-image-2.5-sunburst`) is the quality choice. Use `gemini-nano-banana-2.1` as a second opinion
  when a character drifts. 3:2 output is cropped to 16:9 and upscaled to 1920×1080 with Lanczos.
- **Video:** `text_to_video(prompt, model=…, image_paths=[keyframe], aspect_ratio="16:9", duration_seconds=N)`.
  Image-to-video from an approved keyframe keeps the design on-model. The response has
  `usd_cost_estimate`: log it.
- **Nothing else.** No free/stock/clip-art libraries, no scraped images, no code-drawn stand-ins for
  characters or worlds.

Order of work (each step has a gate you check with `view_image`):
1. **Style bible** in `storyboard.md`: the look in one paragraph (medium, studio references, line, light,
   palette, mood), plus what is forbidden (for a serious poem: chibi, big-eyed cute faces, bouncing,
   dancing, toy-like props, flat clip-art). Prompts reuse this paragraph word for word.
2. **Character sheets** for the hero and the antagonist (front, three-quarter, profile, close-up of the
   face, costume details) on a plain background. Gate: adult proportions, the same face in every view,
   readable silhouette, nothing childish.
3. **Keyframes**, one per shot, each generated with the sheets passed as `image_paths`. Gate: on-model,
   the line's literal image reads with the sound off, hands and faces are correct, no garbage text
   (put all type in code, never in the generated image).
4. **Motion:** image-to-video for shots that need acting or physical motion (cloth, smoke, a run, a
   turn). Camera moves over a still (push, pan, parallax) are cheaper and exact when done in code at the
   project fps. Prompts describe ONE clear action and the camera, and end with the style paragraph and
   "no dancing, no bouncing, no text". Gate: watch a contact sheet of every clip and reject morphing,
   extra limbs, cartoon timing or drift off-model.
5. **Conform:** cut each clip to its shot length with FFmpeg, then bring it to the project fps.
   Generated video is usually 24 fps; for 60 fps use motion interpolation (the exact command and its
   measured cost are in the project's `BUILD.md`).
6. **Composite in HyperFrames:** footage as muted clips or one base plate, then the code layers (Arabic
   kinetic type, impact frames, speed lines, screentone, flashes, grading, title card), so the
   §2/§11 gates still apply.
7. **Manifest** `assets/ai/manifest.json`: one entry per file with `file, kind, model, prompt, refs,
   seconds, usd, approved`. This is what makes a non-deterministic generator reproducible enough to
   rebuild the video.

## 5. Repo map

```
AGENTS.md                 this recipe (the source of truth)
CLAUDE.md                 pointer to AGENTS.md
README.md                 short overview + credits
tools/                    reusable pipeline tools (all documented in their headers)
  capture_youtube_segment.py  record a YouTube segment (picture + sound) for PRIVATE study
  align_excerpt.py            fingerprint an excerpt / find + cut it from a full track
  transcribe_words.py         word-level lyric timestamps (Scribe; --whisper fallback)
  analyze_song.py             BPM + beat phase grid search, per-beat energy, kicks/snares/hats
  build_song_js.py            song_raw + lyrics.txt + sections.json -> analysis/song.json + js/song.js
  frames.cjs                  render chosen still frames (MV.renderAt) to PNG, ~1 s/frame
  contact_sheet.py            tile frames or a video into labelled contact sheets
  luma_report.py              per-second mean luma of a render, with dark stretches flagged (exposure gate)
  voice_pulse.py              beat grid from the voice/metre for beatless poetry (Step 3b)
  motion_check.cjs            per-frame joint travel of the hero over the whole video (dance snap gate)
  check_render.sh             hard gate: codec/size/fps/duration/black runs/audio sync
  install_blender.sh          Blender 4.2.3 LTS into ~/opt (no root), idempotent
  blender_run.sh              the Blender runner: headless, factory settings, fails on Python errors
  blender/card_spin.py        example procedural Blender scene (Cycles CPU, transparent PNG sequence)
  sprite_atlas.py             PNG sequence -> one atlas PNG + JSON (frame = f(t) playback)
projects/_toolbox-demo/   6 s proof that three.js + Canvas 2D + SVG + anime.js + Blender atlas work together
projects/mirror-mirror/   reference implementation (copy its structure for a new song)
  index.html              composition root: canvases, <audio>, scripts, inline timeline registration
  js/song.js              GENERATED: tempo grid, sections, lines + word times, energy, kicks, snares
  js/util.js              math, easing, seeded noise, beat helpers (U.tb, U.beatAt, U.findWord …)
  js/textures.js          palette (MV.P, MV.SHADOW) + every Canvas-2D drawing (cards, eye, sunburst …)
  js/jester.js            the 2D hero: skeleton, POSES, MOVES, choreoPose, drawJester
  js/reflector.js         mirror floor (planar reflection, tinted)
  js/stage.js             the 3D world (MV.World): pools, reset(), hero(), text(), glow(), camLook()
  js/overlay.js           2D post pass (MV.Overlay): bloom, grain, vignette, letterbox, flash, HUDs
  js/shots.js             THE EDIT: one entry per shot, each a function (ctx) => configure world
  js/main.js              frame loop: reset → shot.apply(ctx) → draw hero → render → overlay
  analysis/               fingerprint, words, lyrics, sections, song.json, story.md
  storyboard.md           the shot list (edit decision list) with the literal reading of each line
  vendor/ fonts/          three.js r158 UMD, gsap 3.14.2, woff2 fonts (all local; add anime.min.js if used)
  assets/song.wav         NOT COMMITTED: produce it in Step 1
projects/khawf/          second video (poetry, no beat). Same architecture + puppet.js, svg.js, blender/, tools/
  BUILD.md                the complete, measured build recipe of this video (start here for a poem)
reference/
  ultracode/BREAKDOWN.md  shot-by-shot of the Ultracode video + timestamps + low-res stills
  mirror-mirror/          our final render, its contact sheets and the draft-1 critic report
  khawf/                  «الخوف» final render (47 MB), contact sheets, critic report, YouTube kit
```

## 6. The pipeline (in order; each step has an output and a gate)

Throughout: `P=/work/repos/vibe/projects/<slug>` and `T=/work/repos/vibe/tools`.

### Step 0: Project
Copy the reference skeleton (`index.html`, `js/`, `vendor/`, `fonts/`, `hyperframes.json`,
`package.json`), or run `hyperframes init` and port the same structure. Rename ids and titles.
**Gate:** `hyperframes lint` runs.

### Step 1: The exact song excerpt → `assets/song.wav`
- If you are remaking the **same** song as a reference video, the excerpt must be the one the
  reference used. Sources, best first:
  1. The full track from the user, or a download from the YouTube Audio Library →
     `uv run --with librosa python $T/align_excerpt.py cut full.mp3 $P/analysis/fingerprint.json $P/assets/song.wav`
     (the score must be > 0.6, and a true match is usually > 0.8).
  2. Record the reference video privately (never commit the recording):
     `cd /work && uv run python $T/capture_youtube_segment.py 3S4vuHxGh7c 461 88 /work/data/ref/ultracode.webm`,
     then `ffmpeg -i /work/data/ref/ultracode.webm -vn -ac 2 -ar 48000 /work/data/ref/rec.wav` and the
     same `align_excerpt.py cut /work/data/ref/rec.wav …` as above. In the reference, the music starts
     at YouTube time 468.87 s (7:48.87) and runs 79.22 s. The original cut used a 10 ms fade-in and a
     150 ms fade-out, and `align_excerpt.py` applies the same.
  3. Last resort for Mirror Mirror only: decode the audio of `reference/mirror-mirror/mirror-mirror.mp4`
     (it *is* the excerpt) and re-check it with `align_excerpt.py`.
- For a new song: pick a 60–90 s excerpt that runs from a section start to a natural ending
  (end of a hook). Never cut mid-word.
- Make a fingerprint so the next agent can find the same excerpt again:
  `uv run --with librosa python $T/align_excerpt.py fingerprint $P/assets/song.wav $P/analysis/fingerprint.json`.
- YouTube audio: try `yt-dlp -f 251` (opus audio only) first. For khawf it worked on 2026-10-13 while
  the browser capture hit the bot wall. If yt-dlp is blocked too, use the browser capture tool. Either
  way, the recording is for private study and is never committed (N4).
**Gate:** `ffprobe` gives the exact duration. The first sung word is at the expected time.

### Step 2: Lyrics with word timestamps → `analysis/words.json`, `analysis/lyrics.txt`
- `cd /work && uv run python $T/transcribe_words.py $P/assets/song.wav $P/analysis/words.json`
  (use `--whisper` for the local fallback).
- Write `lyrics.txt` by hand: one sung line per row, with section headers in brackets (`[hook1]`,
  `[verse]` …). Fix every misheard word. Keep the STT **times** and replace the **text**.
  Example: the Ultracode run shows "ON SURFACE" because STT misheard "gon' surface". Do not repeat that.
**Gate:** the number of words in `lyrics.txt` matches `words.json`, give or take merges. Read every line once against the timing.

### Step 3: Beat grid (the AI cannot hear the song, so numbers stand in) → `analysis/song_raw.json`
- `cd /work && uv run --with librosa python $T/analyze_song.py $P/assets/song.wav --words $P/analysis/words.json --out $P/analysis/song_raw.json --bpm-lo 90 --bpm-hi 180 --check-from <drop_s>`
- The tool grid-searches one **constant** BPM and phase (produced songs sit on a click) and writes
  `checks` into the JSON. Read them every time:
  - `grid_contrast` = onset strength on the beats ÷ on the off-beats. **Must be ≥ 1.3.**
    Mirror Mirror: 1.685.
  - `tempo_candidates`: the half-time and double-time readings. Use the **pulse a dancer nods to**
    (hats/kick), not the slow backbeat. The 90–180 range does this for hip-hop and pop. With the
    default 60–200 range, Mirror Mirror comes out as 75 BPM, because every other beat is stronger.
    That grid is too coarse for the edit.
  - `on_grid`: the share of detected snares, kicks and hats within ±40 ms of a beat after
    `--check-from`. **Snares must be ≥ 0.6.** Mirror Mirror: snares 0.748, kicks 0.626, hats 0.372.
    The band detector counts 808 bass notes as kicks, so kicks score lower.
- Mirror Mirror: **150.000 BPM, beat k at t = 0.06 + 0.4·k**, 198 beats, a half-time feel (the snare
  mostly on beat 3 of 4). A bar is 4 beats = 1.6 s.
**Gate:** `grid_contrast ≥ 1.3`, snares `on_grid ≥ 0.6`, and at least half of the lyric-line onsets
lie within ±0.05 s of a beat or half-beat. Mirror Mirror: 67% (59% on whole beats). If the grid
fails, it is the wrong tempo or the wrong phase. Fix the grid; do not nudge the shots.

### Step 3b: No beat in the music (poetry, spoken word)
If `analyze_song.py` gives `on_grid` near chance (about 0.1 for every band) and no autocorrelation
peak, the bed is a drone. Do not force a BPM. Use the voice as the clock instead:
`uv run --with librosa python $T/voice_pulse.py song.wav words.json lyrics.txt --feet 3 --out analysis/song_raw.json`.
It puts N beats (the feet of the metre) across every line, so `MV.SONG.beats` becomes a variable list
that `U.beatAt` / `U.tb` interpolate. Every line starts on a beat, kicks are the word onsets and snares
are the line onsets. khawf: al-munsarih, 3 feet per hemistich, 210 beats of 0.49–1.42 s.

### Step 4: Sections → `analysis/sections.json`, then `js/song.js`
- Read `beat_energy` (one value per beat) and the line starts. Mark section boundaries where
  the energy steps, the drums enter or drop, or the lyrics repeat. Give each section a `feel`.
- `python3 $T/build_song_js.py $P` merges everything into `analysis/song.json` and the generated
  `js/song.js` (never edit `song.js` by hand).
- Mirror Mirror: hook1 b0–32 (0–12.86 s), verseA b32–64 (quiet), **kick drop at 25.66 s (b64)**,
  verseB b64–136, hook2 b136–168, hook3 b168–198 (ends 79.22 s).
**Gate:** `song.js` loads, and `MV.U.findWord("mirror")` returns the first word time (0.06 here).
Re-running the tool over the committed analysis reproduces `js/song.js` byte for byte.

### Step 5: Story note → `analysis/story.md`
One paragraph on what the song says. Then a **symbol table** that ties each recurring idea to a
visual built from **one motif** (the title is usually the motif: Mirror → mirrors and a reflected
twin, plus a deck of cards as the world). Then an **energy map** that sets camera speed and cut density per section.
**Gate:** every chorus image traces back to a lyric phrase.

### Step 6: Storyboard → `storyboard.md` (the edit decision list)
A table with one row per shot: `# | beats | seconds | lyric | literal visual | camera | hero move | text`.
Rules:
- One shot per lyric line in verses. Hooks may take two lines per shot.
- Each repeat of the hook must **escalate**: a new set piece every time (hook 1 establishes,
  hook 2 grows, hook 3 is the biggest). Never reuse a shot as is.
- Quiet sections get longer shots and slow camera. After the drop, cut faster, use flashes and
  punch-zooms on kicks.
- The finale resolves the concept (here: the hand meets the reflected hand) and ends on a title
  card with the song title and artist.
**Gate:** the table covers 0 → end with no gaps, and every lyric line is in the "literal visual" column.

### Step 7: Art direction (write it at the top of `textures.js`)
- **Palette:** at most 6 core colours plus 1 accent family, split by the concept. Mirror Mirror:
  real = gold `#e3b553`, red `#c9302c` and blue `#2b56b8` on navy `#0a1230` / void `#04060d`;
  reflection = an ice-blue "shadow" palette (`MV.SHADOW`).
- **Type:** two or three display faces, all self-hosted woff2 (here: Big Shoulders Display 900/600,
  Limelight, Josefin Sans 700). Warm them with hidden DOM spans and use `font-display: block`.
- **Finish:** a bloom glow on bright parts, a vignette, a light grain, flashes on downbeats and
  a letterbox for big moments. Do all of this in the 2D overlay pass, which is cheap on CPU.

### Step 8: Build the engine (contract in §7). Step 9: Build the shots (rules in §8–§10)

### Step 10: Frame review loop (the main loop; repeat until clean)
```bash
node $T/frames.cjs $P 0.5,2.6,4.4,… /work/temp/frames      # 1 frame per shot at ~70% of its length
python3 $T/contact_sheet.py frames /work/temp/frames /work/temp/sheet
```
Then open the sheets with `view_image`. Check each frame against the §11 checklist, fix, and
re-render only the frames you changed. `PAGEERROR` lines in the output are bugs.
Then check the dance motion over the whole video (pose only, so it takes seconds):
`node $T/motion_check.cjs $P 0-<duration>` prints `PASS` when no joint teleports.
**Gate:** every shot passes §11, and `motion_check` says PASS.

### Step 11: Draft render + hard gate
```bash
cd $P && hyperframes lint && hyperframes validate --no-contrast
hyperframes render --quality draft --output out/draft1.mp4          # ~3 min here (~2400 frames)
bash $T/check_render.sh out/draft1.mp4 <duration> assets/song.wav
python3 $T/luma_report.py out/draft1.mp4
python3 $T/contact_sheet.py video out/draft1.mp4 out/d1 --fps 2 --cols 6   # writes out/d1_01.png …
```
**Gate:** `RENDER CHECK: PASS`, the luma report is within §11 targets (or each exception is
deliberate), and you have viewed all the contact sheets.

### Step 12: One independent critic (exactly one subagent per draft)
Give it the draft MP4, the contact sheets, `storyboard.md`, the lyrics and §2/§11. It reports
P0 (broken: sync, black, unreadable, wrong lyric), P1 (weak: misses the line, confusing, off-beat)
and P2 (polish). Fix P0 and P1, re-check those frames, and render again.

### Step 13: Final render + delivery
```bash
hyperframes render --quality high --output out/<slug>.mp4
bash $T/check_render.sh out/<slug>.mp4 <total_s> assets/song.wav      # total = excerpt + tail
```
`--quality high` writes about 41 Mbps (402 MB for 81 s here), so always re-encode the repo copy
to under 50 MB. GitHub warns above 50 MB and rejects files over 100 MB. Use a 2-pass x264 sized to
the length: video kbps ≈ 380000 / seconds − 192. For 81 s that is `-b:v 4100k -maxrate 6500k
-bufsize 9000k`; khawf (167 s) needed `-b:v 2050k -maxrate 3500k -bufsize 5000k`, because 4.1 Mbps
gave 90 MB. Always `-preset slow`, `-pass 1` then `-pass 2`, `-c:a aac -b:a 192k -movflags +faststart`,
then run the check again on the re-encoded file. Send the user a CRF 18 copy: it looks better and
Slack takes up to 1 GB (khawf's grainy parchment made CRF 18 575 MB, and the upload still worked).
Copy the MP4 and its 1 fps contact sheets (JPG, about 1800 px wide) to `reference/<slug>/`, commit,
and deliver the MP4 with a short note on the concept and the process. The repo is private and the
owner covers the licences (N4), so the < 50 MB MP4 is always committed.

## 7. Engine contract (as implemented in `projects/mirror-mirror`)

**index.html**
- `#root` has `data-composition-id="main" data-start="0" data-duration="<excerpt + tail>" data-width="1920" data-height="1080"`
  (Mirror Mirror: 79.22 + 1.8 = 81.02, which `U.TOTAL` in util.js mirrors).
- Two canvases: `#gl` (Three.js, `preserveDrawingBuffer: true`) and `#ov` (2D overlay drawn on top).
- `<audio id="song" src="assets/song.wav" data-start="0" data-duration="<excerpt>" data-track-index="0" data-volume="1">`.
  The renderer muxes it.
- Scripts load in dependency order (song → util → textures → hero → reflector → stage → overlay
  → shots → main). After them comes the **inline** registration:
  `const tl = gsap.timeline({paused:true}); MV.attachTimeline(tl); window.__timelines["main"] = tl;`

**Per-frame algorithm (`MV.renderAt(t, opt)` in main.js; `opt.poseOnly` stops after step 5 and is used by `motion_check.cjs`)**
1. Clamp `t`. On the first call, build the world (fonts are ready by then).
2. `W.reset()` hides every pooled object and restores defaults.
3. Find the active shot (`t0 ≤ t`). Build `ctx = {t, b, lt, lb, dur, k, choreo, pose, post, overlay}`,
   where `k` is the shot progress from 0 to 1 and `lb` is the local beat.
4. `shot.apply(ctx)` places the camera, sets, hero instances, words, glows and post settings,
   and pushes overlay draw functions.
5. Hero pose = `ctx.pose`, or `MV.choreoPose(ctx.choreo, b)`, plus the **groove layer**: a knee
   dip on every beat, hip sway and weight shift. It is full strength after the drop, 0.6 before it
   and 0.2 on static story poses; `ctx.groove` overrides it. Lip sync opens the mouth from word
   timestamps (a vowel group counts as a syllable). Blinks come every 3.3 s for 0.12 s.
   Draw the hero to its canvas, then draw the blue shadow twin to the second canvas.
6. `W.render()` billboards the heroes and glows, then renders. The mirror floor re-renders the scene
   reflected, with glows dimmed (`onPreReflect`).
7. Overlay (opaque): copy the GL frame and apply the midtone lift (`post.lift`) → bloom → glitch →
   shot overlays (HUDs, credits, counters, quotes, the finale close-up) → letterbox → vignette →
   grain → flash (colour-dodge, or black for fades).
- HyperFrames drives this from both the paused GSAP proxy tween (`onUpdate → renderAt(proxy.t)`)
  and the `hf-seek` window event (`e.detail.time`). Rendering the same `t` twice is a no-op.

**Hero (2D puppet on a 3D billboard).** It is drawn on Canvas 2D at 720×1180 px with the ground at y = 1150.
A pose is plain data: angles in degrees (`torso, head, lSh, lEl, rSh, rEl, lHip, lKnee, rHip, rKnee`),
plus `shift, air, squash, spin`, hand shapes (`open | fist | point | limp`) and `mouth` and `eyes`.
`MV.MOVES` are beat-looped key lists (`[beatOffset, pose, ease]`). A key pose is **reached ON its
beat**: the transition starts 0.3 beat before and settles 0.22 beat after, with a gentle
anticipation/overshoot ease (`inOutBack`), and the pose holds between hits. That hold is what reads
as dancing on the beat. Moves flagged `smooth` (the run cycle) interpolate continuously instead.
`ctx.choreo = [{b, move|pose}, …]` sequences moves on absolute beats with a 0.6-beat S-curve crossfade.
Up to 12 copies of the hero can be placed per frame with `W.hero(x, z, scale, {shadow, flip, y, opacity})`
(clones in the mirror hall, the twin, the eye's iris).

**Text.** `W.text(str, style, pos, height, opts)` puts a word in 3D space (cached canvas texture, so
the mirror floor reflects it). `opts.reflText` shows a *different* word in the reflection only
(shot 19: TRUTH above, HATE in the floor). In shots, `word(ctx, str, STYLE, t0, pos, h, {t1, rise, ry, sx:-1 …})`
pops a word in at a sung time `t0 = U.findWord("word", after)`, with overshoot.

**Overlay HUDs** (overlay.js): `viewfinder` (REC/crop box), `counter` (big number + tally),
`credits` (scrolling cast list), `quote` (word-by-word typed quote), `filmStrip`, `glitch`, `text`.

## 8. Edit grammar (timing rules, in numbers)
- All shot boundaries are written **in beats** (`shot(b0, b1, name, fn)`, `t = 0.06 + 0.4·b`),
  on a 0.1-beat grid.
- **A cut lands 0.02–0.22 s before the first sung word of the line it illustrates.** The picture
  must be there when the word starts. In Mirror Mirror, every shot that opens a line starts
  0.02–0.22 s before that line. Lines that do not get their own shot get a timed event inside the shot.
- Shot length is 1.1–3.6 s (here: 31 shots, mean 2.56 s). Hook 1 shots are short (about 1.5–2 s),
  verse shots are longer (about 3 s), and the final hook uses quick cuts on every beat (shot 30).
- Events inside a shot sync to **sung words** (`U.findWord`) or to **kicks/snares**
  (`U.eventPulse(t, MV.SONG.kicks)`). A key word pops in on its own syllable.
- The drop gets a flash plus shake. From then on there are camera punch-zooms on kicks (`cam(ctx, keys, {punch})`).
- Transitions are hard cuts, often with an exposure flash of 0.24 s or less, or a fade-in from black.
  Do not use slow crossfades.

## 9. Visual grammar (what makes it read as "official")
1. **One world from one motif.** Sets, props, characters and type all come from it (cards: walls of
   card backs with eyes, court cards as kings/queens/Mama, a fan of cards, a cage of card edges,
   a house of cards, a card tornado).
2. **A hero with a twin.** The concept device repeats in every shot (the reflection lives in the
   mirror floor, in mirrors, and in the shadow dancer).
3. **Literal and clever** readings of lines: "ten feet tall" gets a ruler from 1 to 10, "count my
   regrets" gets a counter with tally marks, "credits never roll" gets a credit roll that never ends,
   "crop you out the frame" gets a REC crop box that drops him, "fake love" gets hearts drawn as
   upside-down spades, "game rigged… pivot" gets marionette strings that snap on "pivot".
4. **The camera always moves:** dolly, orbit and crane, eased per shot. Use extreme scale changes
   (an extreme close-up next to a wide shot).
5. **Light:** gold sunburst and bloom, spotlights, a flash on downbeats, a dark vignette.
   Big moments get a letterbox.
6. **Escalation and payoff:** set pieces grow toward hook 3. The finale resolves the idea, then the title card.

## 10. Choreography rules
**Poetry and spoken word: no dance.** The owner rejected mawt draft 1 because the hero's run "looked like
dancing" and the whole thing felt childish. For a poem, the hero acts like an adult in a film: weight,
stillness, small gestures, real runs from generated footage. The rules below are for dance songs only.
- There is always a move on the beat unless the line is a story beat (pray, bow, fall). A pose
  change is a hit, so put one on the downbeat of each bar at least.
- Match the move to the words: `run` on "runnin'", `count` on "count", `pray` on "pray",
  `tall` on "ten feet tall", `puppet` on "rigged", `kicks`/`strike` after the drop.
- Silhouettes must read at 1/4 size. The limbs here are thick, and the arms stay off the torso
  in hit poses.
- The twin mirrors the hero (`flip`), or deliberately does something else to show a lie
  or an imperfection.

## 11. Frame review checklist (every reviewed frame) and numeric targets
These targets come from the critic pass on our draft 1 (scored 5/10 against Ultracode). Each one
is a defect we actually shipped in a draft.
- **Exposure:** the shot's mean luma (0–255) should be **60–90, hooks 80+**. Ultracode's stills
  average about 77. Our draft 1 had a median of 28 and looked muddy; the final has a median of 91.
  Measure with `python3 tools/luma_report.py <video.mp4> --hook-from <s>`. A dark mood is a choice
  for one section, not the default for the film. In the final, only the void intro, verse A
  ("lights dim") and the "silence" shot sit at 38–58, and they are dark on purpose.
- **Hero size:** **55–70% of frame height** in dance shots and **≥ 40%** in wide set pieces.
  Clones and reflections are smaller or dimmer (≤ 80% size or about 60% brightness) so the hero
  stays the focal point. "Ten feet tall" must make him *big*.
- **Motion:** every pose change eases over **at least 4 frames** with gentle anticipation and
  overshoot. Here a key pose starts 0.3 beat early and settles 0.22 beat late, about 6 frames.
  Cyclic moves such as `run` interpolate continuously, with no holds (one stride per beat).
  `motion_check.cjs` flags any joint that moves more than 400 canvas px (35% of the figure) in one
  frame as a SNAP. Moves of 200–400 px are allowed only for kicks, pops and spins. Draft 1 had
  1-frame jumps of up to 418 px; the final has 0 snaps and a 326 px maximum. Always run the groove:
  a knee dip on every beat (3.5% squash), hip sway and weight shift. Legs never cross into an X
  (the knees are clamped in `solve()`).
- **Typography:** one display system, gold for truth words and red for lies. Key words are
  **≥ 90 px cap height**, centred in clean space, with a glow or plate, and **never over the hero's
  face or body**. Negated words get negated visibly (strike, crack, "AIN'T").
- **Background:** the set must not fight the hero. Avoid big fields of tiny high-contrast icons,
  which shimmer when the camera moves. Use bigger elements or lower the contrast behind the hero.
  Rim-light or separate the hero from look-alike props (court cards share his colours).
- **Flashes:** a colour-dodge exposure hit with a quadratic decay of 0.24 s or less (visible for about
  3–4 frames), never a milky full-frame mix. Alternate flashes with punch-zooms.
- **Escalation:** a repeated hook gets new angles and bigger, brighter set pieces, never the same shot again.
- **Finale:** the payoff is legible as a close-up, held through the last sung word. The title
  card comes **after** the last word (an end-card tail of up to 2 s after the excerpt is allowed;
  set the composition duration to excerpt + tail and keep the `<audio>` at the excerpt length).
- Per frame, also check: can you tell what the line means with the sound off? Is the key word
  spelled right? Is everything inside a 5% safe area? Is anything blown out to flat white? Is the
  reflection darker than the real thing? Look for z-fighting, popping pooled objects, leaks from
  other shots and fallback fonts.

## 12. Pitfalls that cost real time (avoid them)
- **Arabic type:** Aref Ruqaa looks great but drops dots in Chrome. Its final qaf is a single contour,
  so «حق» rendered as «حه», and the khah dot of «الخوف» vanished. A critic caught this as a P0 in khawf
  draft 1. Before you commit to a font, render a proof page of **every** key word in the HyperFrames
  Chrome (`/usr/local/bin/hyperframes-chrome`) and zoom in. Amiri 700 is safe. Its lam + jeem/hah/khah
  ligature stacks the letters (it reads «انخوف»), so insert a ZWJ after the lam (`O.shape` in
  `projects/khawf/js/overlay.js`). Canvas text needs `direction = "rtl"`. A word reveal that uses a hard
  clip slices the glyphs, so reveal through a feathered gradient mask on a scratch canvas
  (`destination-in`).
- **Bright worlds (paper, backlit screens, snow):** the §11 luma targets assume a dark stage. A backlit
  parchment is a legitimate look, but the midtone lift (screening the frame with itself) plus additive
  bloom clip it to flat white and swallow every pale object (khawf draft 1: 10–21 % of pixels above 250).
  Tone-map the backdrop texture (centre ≈ 215, edges ≈ 140, visible fibre), cap lift and bloom while it is
  on screen, measure the **share of pixels above 245 (< 3 %)** as well as the mean, and write the bright
  target into the storyboard as a deliberate exception. On a bright backdrop, pale type must become dark
  ink with a light rim, and dark text plates look like smudges, so use a warm halo instead.
- **Canvas paths survive across frames.** `save()`/`restore()` do not reset the current path. Any
  `fill()` without a `beginPath()` first also fills whatever path the previous frame left behind
  (khawf's title card filled a word plate from another shot). Frames render out of order on parallel
  workers, so this is nondeterministic. Always `beginPath()` before a path helper.
- **Profile puppets (heads facing +x):** knees bend forward only. Mirror Mirror's frontal-dancer clamp
  (`lShin ≤ 12°`, `rShin ≥ −12°`) gave khawf's puppets backward knees, X-legs when running, and a kneel
  that could not kneel. khawf `solve()` sets `knee = −|knee|`. Write runs as a gallop with the same leg
  always leading so the shins never cross.
- **Age/costume arcs:** if the hero ages, make age a monotonic function of time, and mark any look
  back as the past (khawf tints stanza 2 sepia). A critic will flag a black beard returning between
  grey shots.
- **YouTube from the sandbox:** yt-dlp and timedtext are often bot-walled (format 251 got through for
  khawf on 2026-10-13, so try it first). Otherwise use `capture_youtube_segment.py`
  (Viktor browser with proxy, MediaRecorder on the `<video>`, start playback with a click and the
  player API, seek with `player.seekTo`). Captions come from the player's own timedtext response.
- **WebGL here is SwiftShader (CPU).** Keep the reflection target ≤ 960×540. Do bloom on the 2D
  overlay canvas (a downscaled, thresholded blur of `#gl`), not with WebGL post-processing.
- **The reflection pass doubles additive glows.** Dim the sunburst and glows in `onPreReflect` and
  restore them in `onPostReflect`. Tint the floor blue and square its strength, or the floor
  outshines the stage.
- **Fonts:** canvas text drawn before a webfont loads falls back silently. Build lazily on the
  first seek, warm each face with a hidden span and use `font-display: block`. The compiler warns
  "No deterministic font mapping" for inline-styled warm spans. The fonts are embedded anyway,
  but prefer classes.
- **Three.js:** use the r158 UMD `three.min.js` (vendored). Cache text and card textures by key,
  and never create a texture per frame.
- **Workers:** `--workers 12` still ran 6 here. A draft takes about 3 min (60 MB). A `--quality high`
  render takes about 4 min 50 s (402 MB, about 41 Mbps). khawf (5022 frames, heavier canvases, 5 workers)
  took about 8 min as a draft and about 10 min at high quality (999 MB, about 48 Mbps).
- **The 2D overlay must be opaque.** Start it by copying the GL frame (`O.begin` → `copy`), then
  composite bloom, flashes and HUDs on top. Draft 1 drew bloom onto a transparent overlay: the
  crushed-black pixels of the bloom buffer veiled the whole frame at the bloom alpha, a hidden
  30–40% darkening. The midtone lift (`post.lift`, screening the frame with itself) also lives here.
- **Colour flashes use `color-dodge`, not a translucent fill.** A fill washes the frame milky;
  a dodge blows out the brights and keeps blacks black. Use a quadratic decay of 0.24 s or less.
- **End-card tail:** a title card over the last sung word kills the payoff. Make the composition
  the excerpt plus 1.8 s (`#root data-duration`, `U.TOTAL`), keep `<audio data-duration>` at the
  excerpt, and show the title after the music. Run `check_render.sh` with the total duration.
- **three.js texture from an `<img>` stays black** ("glTexSubImage2D: Offset overflows texture
  dimensions"). three reads `image.width`, which for a DOM `<img>` is its CSS box, not the bitmap.
  Copy the bitmap into a canvas of natural size once it has decoded, then texture the canvas.
- **anime.js v3 does not paint a child's start values until that child has run once.** A seek to a
  time before a later child's offset shows the element's raw state (the title appeared at 0.5 s).
  Prime every timeline right after creating it: `tl.seek(END); tl.seek(0)`. `anime.setDashoffset`
  returns 0 on `<text>`, which has no geometry length. Draw a path or rect and fade the text in instead.
- **Blender headless:** EEVEE and Workbench need an OpenGL context, so use Cycles on CPU. Apply the
  scale (`transform_apply`) before parenting text or pips to a scaled object, or the children get
  squashed. `/opt` is read-only for the sandbox user, so install under `~/opt`.
- **AAC priming** shifts the audio about 21 ms. That is acceptable (`check_render.sh` allows 30 ms).
- **Pool limits:** `W.hero()`, `W.text()` and `W.glow()` return `null` when the pool is full.
  Raise the pool size in `stage.js` instead of silently losing objects.

## 13. Cost discipline: the Ultracode lesson
AI generation costs real money per call. Plan the shot list first, generate keyframes (cheap) before
clips (expensive), approve each keyframe before animating it, prefer code camera moves over stills when
no acting is needed, and log `usd_cost_estimate` per file in the manifest.
Devarf's runs used Claude Code 2.1.287 with Opus 5.5 in the terminal (2–4 Oct 2026), a folder per
run with info and tools (three.js, Canvas 2D, SVG, frame-to-video), his own audio-analysis tool
(beats, notes, instruments, loud/quiet, lyrics, a story note), and no guides or examples.
Low took about 42 min, 78k tokens and about $3. Max took about 3 h, 625k tokens and about $49.
**Max + Ultracode** (multi-agent) delivered the reference video after 3 h 56 min, 2.3M output
tokens and about $280. The whole run wrote at least 2.5M tokens (at least $348) and never finished:
review agents kept rebuilding their own caches and restarting. **So:** build with one agent,
review with one critic per draft, cap it at two drafts unless a P0 remains, and do not run
open-ended review loops.

## 14. New-song checklist (short form)
1. Step 1 excerpt → 2 lyrics → 3 grid → 4 sections → 5 story → 6 storyboard. Have **all six files**
   before you write any visual code.
2. Choose a new motif from the title and lyrics. Keep the engine (util, overlay, main, reflector,
   jester skeleton) and replace the world (`textures.js`, `stage.js`), the hero costume
   (`drawJester`) and every shot.
3. Steps 10–13: frames → draft → gate → one critic → final → deliver → update this file with
   anything new you learned.
