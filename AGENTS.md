# AGENTS.md: the strict recipe for a code-only music video

Read this whole file before you touch anything. It is the contract for every agent in this repo
(Claude Code reads it through `CLAUDE.md`). The rules here come from a finished build: the
reference video in `reference/mirror-mirror/` was made by following them. If a step fails, fix
the step and update this file. Do not skip it.

---

## 0. What this repo is

- **Goal:** an official-style **music video made only from code** (motion graphics: Three.js +
  Canvas 2D, rendered frame by frame by HyperFrames). It runs the full length of a song excerpt,
  stays in sync with the song, and you render it locally to MP4.
- **Origin:** Devarf's experiment *"I Had Opus 5.5 Make the Same Music Video at Every Effort"*
  (https://youtu.be/3S4vuHxGh7c). It used one song, one prompt and six runs. The **Ultracode run**
  (chapter 7:43–9:08; the music starts at **7:48.9**) sets the visual bar: a 2D harlequin Jack on a
  3D stage built from playing cards. A shot-by-shot breakdown is in `reference/ultracode/BREAKDOWN.md`.
- **Reference implementation:** `projects/mirror-mirror/` (same song, same brief), rendered to
  `reference/mirror-mirror/mirror-mirror.mp4`. Its edit is in `projects/mirror-mirror/storyboard.md`.
  To make a new video, copy its **architecture and process**. Do not copy its imagery unless the
  song is the same.

## 1. The brief (what the original prompt asked; it is your spec too)

> A full music video, like a real official one, with a lot of dance or some story, made as motion
> graphics only. 2D, 3D or both. What matters is that it is creative and unique. Work alone from
> start to finish. Do not stop to ask.

How to read the brief (binding):
1. "Official" means one world, one concept, a hero, an arc and a title card. A screensaver does
   not count, and neither does a lyric slideshow.
2. "Dance **or** story": do both. The hero dances on the beat **and** every lyric line has a
   literal visual (see §8).
3. "Motion graphics only" means code draws every pixel: no AI-generated images or video, no stock
   footage, no photos, no pre-made 3D models. Self-hosted OFL fonts are allowed.
4. "Work alone" means you never stop to ask. Make the decision, write it into `storyboard.md`
   or `analysis/story.md`, and keep going.

## 2. Definition of done (every box must be true)

- [ ] `out/<name>.mp4` is **1920×1080, 30 fps, H.264 + AAC**. Duration = excerpt (+ an optional
      end-card tail of ≤ 2 s), within 0.1 s.
- [ ] The audio is the **unaltered song excerpt**, starting at frame 0 and in sync:
      `tools/check_render.sh` prints `RENDER CHECK: PASS` (envelope correlation > 0.9, lag ≤ 30 ms).
- [ ] **Every lyric line** has an on-screen literal visual (a shot, or a timed event inside a shot)
      that starts **0–0.25 s before** the line's first sung word.
- [ ] Cuts sit on the beat grid (§8). The hero hits poses **on beats**.
- [ ] There are no unintended black runs ≥ 0.5 s, no frozen stretches > 1 s, no flicker and no
      missing-font fallback text.
- [ ] **Deterministic:** each frame is a pure function of `t`. Rendering twice gives the same frames.
- [ ] `hyperframes lint` reports 0 errors. `hyperframes validate --no-contrast` reports 0 errors.
- [ ] You looked at a full-video contact sheet (2 fps) yourself, and one independent critic
      reviewed the draft. All P0/P1 findings are fixed or written up as deliberate.
- [ ] The repo is updated: `analysis/*`, `storyboard.md`, the code, and `reference/<name>/<name>.mp4` (if
      the repo licence allows, see §3). The song audio and third-party recordings are **not** committed.

## 3. Hard rules

**MUST**
- M1. One HyperFrames project per video, in `projects/<slug>/`. The composition length equals the excerpt length.
- M2. Frame = f(t). All motion comes from `t` (seconds) or beat `b = (t − beat_offset) / beat_period`.
  "Random" values come from seeded hashes (`U.hash(i, j)`, `U.rng(seed)`, `U.noise1(x, seed)`).
  Particles are closed-form functions of `t` (life cycles via modulo), never integrated step by step.
- M3. Reset the whole world every frame (`W.reset()`), then let the active shot configure it.
  No shot may depend on what an earlier frame did.
- M4. Vendor every dependency (three.js UMD, gsap, fonts) into the project. Nothing loads from
  the network at render time.
- M5. Verify every number you use (BPM, offsets, word times) against the audio analysis.
  Never guess a timing.
- M6. Proof-read the lyrics by hand after speech-to-text (see Step 2).
- M7. Review rendered frames with your own eyes (`view_image`) before every full render.
- M8. Keep cost under control: one agent builds the whole video, and at most **one** critic subagent
  reviews each draft. This is the Ultracode lesson (§13).

**MUST NOT**
- N1. No `Math.random()`, `Date.now()`, `performance.now()`, `requestAnimationFrame` loops, CSS
  animations or transitions, `setTimeout`/`setInterval` animation, video elements or GIFs.
  HyperFrames seeks frames **out of order across parallel workers**, so any state that builds up
  over time will break.
- N2. Do not query the DOM at the top level of a script. The HyperFrames compiler may hoist scripts
  above `<body>`. Look canvases up lazily on the first render (see `main.js` → `build()`).
- N3. Do not put the `window.__timelines` registration in an external file. The linter only finds it
  **inline** in `index.html`.
- N4. Do not commit `assets/song.*`, recordings of other people's videos, or renders other than the
  final reference MP4. The repo is public. The song is from the YouTube Audio Library, which allows
  use inside videos but not standalone redistribution.
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
```
Python tools that need librosa run as `cd /work && uv run --with librosa python <tool> …`.
The other tools only need the stdlib, PIL or ffmpeg. Speech-to-text uses the Viktor SDK
(`sdk.tools.utils_tools.speech_to_text`, ElevenLabs Scribe). The fallback is `faster-whisper`.

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
  check_render.sh             hard gate: codec/size/fps/duration/black runs/audio sync
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
  vendor/ fonts/          three.js r158 UMD, gsap 3.14.2, woff2 fonts (all local)
  assets/song.wav         NOT COMMITTED: produce it in Step 1
reference/
  ultracode/BREAKDOWN.md  shot-by-shot of the Ultracode video + timestamps + low-res stills
  mirror-mirror/          our final render + its contact sheet
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
- Do not use yt-dlp or downloader sites from this sandbox. YouTube's bot wall blocks them.
  Use the browser capture tool.
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
**Gate:** every shot passes §11.

### Step 11: Draft render + hard gate
```bash
cd $P && hyperframes lint && hyperframes validate --no-contrast
hyperframes render --quality draft --output out/draft1.mp4          # ~3 min here (2377 frames)
bash $T/check_render.sh out/draft1.mp4 <duration> assets/song.wav
python3 $T/luma_report.py out/draft1.mp4
python3 $T/contact_sheet.py video out/draft1.mp4 out/d1 --fps 2 --cols 6
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
bash $T/check_render.sh out/<slug>.mp4 <excerpt_s> assets/song.wav
```
If the file is over 45 MB, re-encode (`ffmpeg -i in.mp4 -c:v libx264 -crf 22 -preset slow -c:a copy out.mp4`)
and run the check again. GitHub rejects files over 100 MB. Copy the MP4 and one 2 fps contact sheet to
`reference/<slug>/`, commit, and deliver the MP4 with a short note on the concept and the process.

## 7. Engine contract (as implemented in `projects/mirror-mirror`)

**index.html**
- `#root` has `data-composition-id="main" data-start="0" data-duration="<excerpt>" data-width="1920" data-height="1080"`.
- Two canvases: `#gl` (Three.js, `preserveDrawingBuffer: true`) and `#ov` (2D overlay drawn on top).
- `<audio id="song" src="assets/song.wav" data-start="0" data-duration="<excerpt>" data-track-index="0" data-volume="1">`.
  The renderer muxes it.
- Scripts load in dependency order (song → util → textures → hero → reflector → stage → overlay
  → shots → main). After them comes the **inline** registration:
  `const tl = gsap.timeline({paused:true}); MV.attachTimeline(tl); window.__timelines["main"] = tl;`

**Per-frame algorithm (`MV.renderAt(t)` in main.js)**
1. Clamp `t`. On the first call, build the world (fonts are ready by then).
2. `W.reset()` hides every pooled object and restores defaults.
3. Find the active shot (`t0 ≤ t`). Build `ctx = {t, b, lt, lb, dur, k, choreo, pose, post, overlay}`,
   where `k` is the shot progress from 0 to 1 and `lb` is the local beat.
4. `shot.apply(ctx)` places the camera, sets, hero instances, words, glows and post settings,
   and pushes overlay draw functions.
5. Hero pose = `ctx.pose`, or `MV.choreoPose(ctx.choreo, b)`. Lip sync opens the mouth from word
   timestamps (a vowel group counts as a syllable). Blinks come every 3.3 s for 0.12 s.
   Draw the hero to its canvas, then draw the blue shadow twin to the second canvas.
6. `W.render()` billboards the heroes and glows, then renders. The mirror floor re-renders the scene
   reflected, with glows dimmed (`onPreReflect`).
7. Overlay: bloom → glitch → shot overlays (HUDs, credits, counters, quotes) → letterbox →
   vignette → grain → flash.
- HyperFrames drives this from both the paused GSAP proxy tween (`onUpdate → renderAt(proxy.t)`)
  and the `hf-seek` window event (`e.detail.time`). Rendering the same `t` twice is a no-op.

**Hero (2D puppet on a 3D billboard).** It is drawn on Canvas 2D at 720×1180 px with the ground at y = 1150.
A pose is plain data: angles in degrees (`torso, head, lSh, lEl, rSh, rEl, lHip, lKnee, rHip, rKnee`),
plus `shift, air, squash, spin`, hand shapes (`open | fist | point | limp`) and `mouth` and `eyes`.
`MV.MOVES` are beat-looped key lists (`[beatOffset, pose, ease]`). A move **snaps into the next
pose in the first 45% of the segment, then holds**, which is what reads as dancing on the beat.
`ctx.choreo = [{b, move|pose}, …]` sequences moves on absolute beats with a 0.35-beat crossfade.
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
- Transitions are hard cuts (often with a 0.2–0.35 s flash or a fade-in from black). Do not use slow crossfades.

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
  average about 77; our draft 1 had a median of 28 and looked muddy. Measure with
  `python3 tools/luma_report.py <video.mp4>`. A dark mood is a choice for one shot, not the
  default for the film.
- **Hero size:** **55–70% of frame height** in dance shots and **≥ 40%** in wide set pieces.
  Clones and reflections are smaller or dimmer (≤ 80% size or about 60% brightness) so the hero
  stays the focal point. "Ten feet tall" must make him *big*.
- **Motion:** every pose change eases over **3–5 frames** with anticipation and overshoot. Never
  jump in 1–2 frames. Add a body dip of 3–5% of height on kicks, plus hip sway and weight shift.
  Legs never cross into an X (clamp the knees).
- **Typography:** one display system, gold for truth words and red for lies. Key words are
  **≥ 90 px cap height**, centred in clean space, with a glow or plate, and **never over the hero's
  face or body**. Negated words get negated visibly (strike, crack, "AIN'T").
- **Background:** the set must not fight the hero. Avoid big fields of tiny high-contrast icons,
  which shimmer when the camera moves. Use bigger elements or lower the contrast behind the hero.
  Rim-light or separate the hero from look-alike props (court cards share his colours).
- **Flashes:** decay in 2–3 frames (additive), never a milky 6-frame wash. Alternate flashes with punch-zooms.
- **Escalation:** a repeated hook gets new angles and bigger, brighter set pieces, never the same shot again.
- **Finale:** the payoff is legible as a close-up, held through the last sung word. The title
  card comes **after** the last word (an end-card tail of up to 2 s after the excerpt is allowed;
  set the composition duration to excerpt + tail and keep the `<audio>` at the excerpt length).
- Per frame, also check: can you tell what the line means with the sound off? Is the key word
  spelled right? Is everything inside a 5% safe area? Is anything blown out to flat white? Is the
  reflection darker than the real thing? Look for z-fighting, popping pooled objects, leaks from
  other shots and fallback fonts.

## 12. Pitfalls that cost real time (avoid them)
- **YouTube from the sandbox:** yt-dlp and timedtext are bot-walled. Use `capture_youtube_segment.py`
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
- **Workers:** `--workers 12` still ran 6 here. A draft takes about 3 min. A `--quality high`
  render takes longer and is about 2× the size.
- **AAC priming** shifts the audio about 21 ms. That is acceptable (`check_render.sh` allows 30 ms).
- **Pool limits:** `W.hero()`, `W.text()` and `W.glow()` return `null` when the pool is full.
  Raise the pool size in `stage.js` instead of silently losing objects.

## 13. Cost discipline: the Ultracode lesson
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
