# «الخوف» (Al-Khawf): the complete build recipe

This file explains how `reference/khawf/khawf.mp4` was made, and how to make it again, step by step,
with the exact commands, parameters, measured timings and the mistakes that cost time. Read root
[`AGENTS.md`](../../AGENTS.md) first. It is the general contract (rules M1–M8, N1–N6, §§1–14). This file is
the worked example for one video: a recited Arabic poem with no beat.

Every number below was measured in the build environment on 2026-10-13 unless marked otherwise. The
"reproduced" marks show which steps were re-run from the committed files on 2026-10-13 to prove the recipe.

---

## ملخص بالعربية

**ما هذا؟** هذا فيديو موشن جرافيك لقصيدة «الخوف» لتميم البرغوثي، مدته 167.4 ثانية بدقة 1080p30. كل بكسل فيه مرسوم بالكود: three.js للمسرح والكاميرا، وCanvas 2D للعرائس الجلدية والكتابة، وSVG مع anime.js للزخارف، وBlender للتاج والساعة الرملية والفانوس والمرآة، وكلها مبنية بسكربتات Python. يُصيَّر الفيديو إطاراً بإطار بأداة HyperFrames.

**طريقة إعادة البناء بأقصر طريق (قرابة 15 دقيقة):**
1. نزّل الصوت بـ `yt-dlp -f 251`، ثم قصّه بـ `align_excerpt.py` (يخرج مطابقاً بتاً ببت).
2. شغّل `hyperframes render --quality high`.
3. افحص الناتج بـ `check_render.sh`.
4. اضغطه بترميز x264 على مرحلتين بمعدل 2050k، فيخرج قرابة 47 MB.

**الفكرة:** مسرح خيال الظل. الخوف سلطان من جلد يشيخ عبر القصيدة. لا إيقاع في الموسيقى، لذا شبكة الإيقاع مأخوذة من بحر المنسرح (3 تفعيلات لكل شطر)، وكل لقطة تبدأ قبل أول كلمة من شطرها بـ 0.12 ثانية.

**أهم الدروس:**
- خط Aref Ruqaa أسقط النقاط، فاستُبدل بـ Amiri 700.
- Amiri يدمج اللام مع الخاء في ربطة تُقرأ «انخوف»، والحل وضع ZWJ بعد اللام.
- الشاشة الورقية المضاءة احترقت إلى الأبيض حتى ضُبطت إضاءتها.
- ركب العرائس الجانبية تنثني إلى الأمام فقط.

التفاصيل الكاملة بالإنجليزية أدناه.

---

## 1. The result

| item | value |
|---|---|
| Final render | `projects/khawf/out/khawf.mp4` (not committed, 998.5 MB, `--quality high`, about 48 Mbps) |
| Repo copy | `reference/khawf/khawf.mp4`: 1920×1080, 30 fps, H.264 High + AAC-LC 48 kHz stereo, 167.403 s, **47.0 MB** (2-pass 2050 kb/s video + 192 kb/s audio) |
| Length | 167.40 s = 166.40 s audio + 1.00 s silent title tail = 5022 frames |
| Edit | 57 shots: one per hemistich (56) + a title card. 30 theatre, 2 theatre sepia (the remembered past), 18 desert, 6 mirrors, 1 title |
| Hero | Fear, a leather shadow-puppet Sultan who ages from 0 (black beard) to 1 (white beard, torn robe) |
| Gates | `check_render` PASS (envelope correlation 0.987 at 20 ms lag, 0 black runs). `hyperframes lint` 0 errors / 0 warnings. `validate --no-contrast`: no console errors. `motion_check` PASS (0 snaps) |
| Review | Draft 1 got one independent critic (5/10, one P0) → [`reference/khawf/critic_draft1.md`](../../reference/khawf/critic_draft1.md). Every P0/P1 was fixed in the final (see the end of [`storyboard.md`](storyboard.md)) |
| Build time | About 2 h 20 min of wall-clock for one agent (01:24 → 03:46 UTC), including two full renders and one critic pass |

## 2. Inputs and what is (not) in the repo

| input | where | committed? |
|---|---|---|
| Recitation: Tamim Al-Barghouti, «مع تميم: الخوف», AJ+ ساحة | https://youtu.be/Ch7GGoqZ6bM (Content ID registered: `licensedContent: true`) | **no.** Rebuild `assets/song.wav` with Step A1 |
| Excerpt fingerprint (onset envelope only) | `analysis/fingerprint.json` | yes |
| Raw speech-to-text (281 words) | private scratch (`/work/data/vibe/khawf/words_scribe.json`) | no (the proof-read version is) |
| Fonts: Amiri 400/700 (SIL OFL) | `fonts/*.woff2` + `fonts/OFL-Amiri.txt` | yes |
| three.js r158 UMD, GSAP 3, anime.js 3.2.2 | `vendor/` | yes |
| Blender PNG sequences | private scratch (`/work/data/vibe/khawf/blender/`) | no (the atlases are) |
| Blender atlases | `assets/blender/*_atlas.png/.json`, `mirror_opening.json` | yes |
| The final MP4 (it contains the AJ+ recording) | `reference/khawf/khawf.mp4` | **yes**, at the owner's request (2026-10-13). This is the documented N4 exception |

## 3. Environment (check it first, about 1 min)

```bash
hyperframes --version      # 0.6.119 (CLI at /usr/local/bin/hyperframes, Chrome at /usr/local/bin/hyperframes-chrome)
node --version             # v22.23.2
ffmpeg -version | head -1  # 5.1.9
uv --version; uvx --version
bash tools/install_blender.sh   # Blender 4.2.3 LTS into ~/opt (22 s, no root). Only needed to rebuild the props
```
- Machine: 17 CPUs, about 328 GB RAM, **no GPU** (WebGL is SwiftShader on the CPU). `nproc` may report 1
  inside the sandbox, so pass `-threads 16` to ffmpeg yourself.
- Python tools run as `cd /work && uv run --with librosa python repos/vibe/tools/<tool>.py …`.
  `align_excerpt.py` also needs `--with scipy --with soundfile`.
- Paths below: `R=/work/repos/vibe`, `P=$R/projects/khawf`, `T=$R/tools`. Private scratch lives in
  `/work/data/vibe/khawf/` and is never committed.

---

## Part A: rebuild the video from this repo (the fast path, about 15 min)

### A1. The audio → `assets/song.wav` (reproduced, bit-identical)
```bash
mkdir -p /work/data/vibe/khawf && cd /work/data/vibe/khawf
uvx yt-dlp -f 251 -o src.webm https://youtu.be/Ch7GGoqZ6bM          # opus, 48 kHz stereo, 177.66 s, 2.8 MB
ffmpeg -v error -y -i src.webm -ac 2 -ar 48000 -c:a pcm_s16le full.wav  # 177.64 s
cd /work && uv run --with librosa --with scipy --with soundfile python $T/align_excerpt.py \
    cut /work/data/vibe/khawf/full.wav $P/analysis/fingerprint.json $P/assets/song.wav
# → best offset 0.000s  score 1.002 ; wrote …/song.wav (166.400s)
```
The excerpt is the **first 166.40 s** of the upload: the voice runs 1.22–160.10 s and the drone pad
dies out at 166.4 s. It has a 10 ms fade-in and a 150 ms fade-out. On 2026-10-13 the re-cut matched the
original sample for sample (max difference 0). If yt-dlp is bot-walled, use
`tools/capture_youtube_segment.py` (AGENTS.md §12). The score must be > 0.6. If it is lower, you have a
different upload or edit.

### A2. (Optional) Re-render the Blender props (reproduced)
```bash
cd $R && bash projects/khawf/blender/render_all.sh     # about 2-4 min on 17 CPUs (crown 30 s, mirror 32 s measured) + packing
```
This overwrites `assets/blender/*` and regenerates `js/atlas.js`. A re-run of crown and mirror on
2026-10-13 matched the committed atlases. The crown differed by at most 12/255 on a handful of pixels
(mean difference 0.00002), and the mirror by at most 1/255. `mirror_opening.json`
matched exactly. Skip this step unless you change a `blender/*.py` script.

### A3. Gates before rendering (seconds)
```bash
cd $P && hyperframes lint                       # ◇ 0 errors, 0 warnings   (0.6 s)
hyperframes validate --no-contrast              # ◇ No console errors      (7.6 s)
cd $R && node tools/motion_check.cjs projects/khawf 0-167.4
# frames 4966  SNAP(>400px/frame) 0  fast(200-400) 2  -> PASS   (largest 212 px at 37.33 s: the whip lash)
```

### A4. Stills (the review loop, about 1 s per frame)
One frame at 70 % of every shot plus the title card:
```bash
cd $R && TIMES=$(python3 - <<'EOF'
import json; L=json.load(open('projects/khawf/analysis/song.json'))['lines']
t0=[0]+[l['s']-0.12 for l in L[1:]]; t1=t0[1:]+[161.6]
print(','.join(f'{a+0.7*(b-a):.2f}' for a,b in zip(t0,t1))+',164.5')
EOF
)
node tools/frames.cjs projects/khawf "$TIMES" /work/temp/khawf_frames     # any PAGEERROR line is a bug
python3 tools/contact_sheet.py frames /work/temp/khawf_frames /work/temp/khawf_sheet --cols 4
```
Open every sheet with your own eyes (M7) before you spend 10 minutes on a render.

### A5. Render
```bash
cd $P
hyperframes render --quality draft --output out/draft.mp4     # about 8 min, about 77 MB (review copy)
hyperframes render --quality high  --output out/khawf.mp4     # about 10 min, 998.5 MB, about 48 Mbps
```
`--workers` is auto and ran 5 Chrome workers here. Frames render out of order across workers, which is
safe only because every frame is a pure function of `t` (M2, N1).

### A6. Hard gate + exposure + contact sheets
```bash
cd $R
bash tools/check_render.sh projects/khawf/out/khawf.mp4 167.4 projects/khawf/assets/song.wav
# duration 167.403s vs expected 167.400s -> OK / black runs >= 0.5s: 0 / correlation 0.987 at lag 20 ms -> OK / RENDER CHECK: PASS
python3 tools/luma_report.py projects/khawf/out/khawf.mp4
# seconds below target: 3/168 -> [0, 152, 153]   (the fade-in from black, and the dive into the abyss: deliberate)
python3 tools/contact_sheet.py video projects/khawf/out/khawf.mp4 projects/khawf/out/fin --fps 1 --cols 6
# 6 sheets of 6×5 tiles (30 s each), 2880×1350 PNG. The committed ones are scaled to 1800 px wide JPG:
for i in 1 2 3 4 5 6; do ffmpeg -v error -y -i projects/khawf/out/fin_0$i.png -vf scale=1800:-2 -q:v 3 reference/khawf/contact_sheet_0$i.jpg; done
```
Luma is high on purpose. The backlit parchment is the film's look, so theatre shots sit at a mean of
130–170 with < 3 % of pixels above 245. This is the written exception to AGENTS.md §11's 60–90.

### A7. Delivery encodes
**Repo copy (< 50 MB; GitHub warns above 50 MB and rejects files above 100 MB).** Reproduced on
2026-10-13: 82 s, 46,989,694 bytes, `check_render` PASS (0.9869 at 20 ms).
```bash
M=projects/khawf/out/khawf.mp4; O=reference/khawf/khawf.mp4; X="-c:v libx264 -preset slow -b:v 2050k -maxrate 3500k -bufsize 5000k -pix_fmt yuv420p -threads 16"
ffmpeg -v error -y -i $M $X -pass 1 -passlogfile /tmp/x264 -an -f mp4 /dev/null
ffmpeg -v error -y -i $M $X -pass 2 -passlogfile /tmp/x264 -c:a aac -b:a 192k -movflags +faststart $O
bash tools/check_render.sh $O 167.4 projects/khawf/assets/song.wav
```
Sizing rule: video kb/s ≈ 380000 / seconds − 192, so 2050 for 167 s. At 4.1 Mbps (the Mirror Mirror
setting) this video came out at 90 MB. Against the master, frame SSIM is 0.86–0.91. The loss is almost
all in the film grain, which x264 smooths away. Lines, type and faces stay clean (checked by eye at 100 %
crops).

**Chat copy (Slack accepts up to 1 GB):** x264 CRF 18, about 575 MB. Example:
`ffmpeg -i $M -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -threads 16 -c:a aac -b:a 192k -movflags +faststart khawf_final.mp4`.

**YouTube upload file:** 2-pass x264 12 Mbps, AAC 320k. It came out at 257 MB, PASS 0.9871 at 20 ms.
```bash
X="-c:v libx264 -preset slow -b:v 12M -maxrate 18M -bufsize 24M -g 15 -bf 2 -pix_fmt yuv420p -threads 16"
ffmpeg -y -i $M $X -pass 1 -passlogfile /tmp/yt -an -f mp4 /dev/null
ffmpeg -y -i $M $X -pass 2 -passlogfile /tmp/yt -c:a aac -b:a 320k -ar 48000 -movflags +faststart khawf_youtube.mp4
```

### A8. Publishing kit (title, description, tags, captions, thumbnail)
- Metadata: [`reference/khawf/YOUTUBE.md`](../../reference/khawf/YOUTUBE.md). Use Film & Animation
  (categoryId 1). Upload **unlisted** first, because the AJ+ audio is Content-ID registered. The
  description is ≤ 5000 bytes and has chapters at 00:00, 00:31, 00:53, 01:25, 02:05 and 02:23 (the stanza starts).
- Arabic captions (reproduced, byte-identical):
  `python3 projects/khawf/tools/make_srt.py > reference/khawf/khawf_ar.srt`. That gives 56 hemistich cues
  plus a title cue.
- Thumbnail: `bash projects/khawf/tools/thumbnail.sh` (8 s). It renders frame 54.8 s from the
  composition, then lays out «الخوف» and «تميم البرغوثي» in Amiri 700 with `tools/thumbnail.html`. The
  rebuild matches the committed `thumbnail.jpg` in layout; it is not byte-identical.
- API uploads from the shared Viktor/Composio Google project can hit **429 "Video Uploads per day"**.
  That quota resets at midnight Pacific (07:00 UTC). Your own Google Cloud project avoids the shared
  quota, but YouTube locks API uploads to private until the project passes an audit. Uploading
  manually in YouTube Studio has neither limit.

---

## Part B: how it was built (copy this process for your own poem)

### B1. Speech to text → proof-read lyrics (AGENTS Step 2)
```bash
cd /work && uv run python $T/transcribe_words.py $P/assets/song.wav /work/data/vibe/khawf/words_scribe.json   # ElevenLabs Scribe via the Viktor SDK
```
Scribe returned **281 words with good timings but wrong text in places**. `analysis/lyrics.txt` was typed by
hand from the poem (56 hemistichs in 4 stanzas, `[s1_mirror]`…`[s4_mirrors]` headers), and the word **text**
in `analysis/words.json` was corrected while every **timestamp** was kept. The real corrections were:

| Scribe heard | the poem says | why it matters |
|---|---|---|
| صوتين | **سوطين** | the whole whip shot hangs on this word |
| تطيعه، تموت (×2) | **تطعه، تمت** | jussive verbs; «تمت» is the snap/hourglass cue |
| المقاعد الأشباح | **النقائض الأشباه** | completely misheard; the mirrored-twins shot |
| نحنو | **نحنّ** | |
| ها + هنا (2 words) | **هاهنا** (1 word, timings merged 126.18–127.14) | 281 → 280 words |
| بأناه، جناه، مهداه، فلاه | **بأناة، جناة، مهداة، فلاة** | taa marbuta |
| عسرا | عسراً | |
| trailing «.» «؟» on 40+ words | removed | `U.norm` strips them too, but keep the data clean |

Gate: 56 lines and 280 words in `lyrics.txt` = 280 entries in `words.json`. `build_song_js.py` stops with
MISMATCH otherwise.

### B2. Find out there is no beat, then use the metre (AGENTS Step 3 → 3b)
```bash
cd /work && uv run --with librosa python $T/analyze_song.py $P/assets/song.wav --words $P/analysis/words.json --out /work/data/vibe/khawf/song_raw_analyze_song.json
```
Result: "61.38 BPM", `grid_contrast` 1.399 (which looks like a pass!), but `on_grid` is kicks 0.098 /
snares 0.088 / hats 0.085, which is **chance level**. The bed is a beatless drone. Lesson: for
speech over a pad, `grid_contrast` alone lies. Read `on_grid`.
```bash
cd /work && uv run --with librosa python $T/voice_pulse.py $P/assets/song.wav $P/analysis/words.json $P/analysis/lyrics.txt --feet 3 --out $P/analysis/song_raw.json
```
The poem is in **al-munsarih** (مستفعلن مفعولاتُ مستفعلن), so it has **3 feet per hemistich**. The tool spreads 3
beats evenly across each spoken line and fills the pauses with beats of similar length:
**210 beats, 0.49–1.42 s long (mean 0.793 s)**, music autocorrelation peak 0.073 (no pulse), lines on grid
1.0. `kicks` = the 280 word onsets (pose hits), `snares` = the 56 line onsets (cut points).

### B3. Sections and the generated song module (AGENTS Step 4)
`analysis/sections.json` has the 4 stanzas in beats: s1_mirror [0, 45] (0.55–31.46 s), s2_portrait
[45, 111] (31.46–85.12 s), s3_mercy [111, 162] (85.12–125.86 s), s4_mirrors [162, 210] (125.86–166.4 s),
each with a `feel`. Then:
```bash
python3 $T/build_song_js.py $P      # → analysis/song.json (full) + js/song.js (compact; never edit by hand)
```
`js/util.js` reads the **variable** beat list: `U.tb(k)` (beat → seconds) and `U.beatAt(t)` (seconds →
fractional beat) interpolate piecewise-linearly, so every choreography written in beats follows the voice.

### B4. Story, then the storyboard, before any visual code (AGENTS Steps 5–6)
- [`analysis/story.md`](analysis/story.md) contains the poem's meaning stanza by stanza, the concept,
  a symbol table (each recurring image traced to a phrase) and an energy map.
- **The concept: خيال الظل (the Arab shadow theatre).** Fear is a shadow, and a shadow is huge near the
  lamp and small when you walk up to it. That one optical fact carries the poem's "beast that vanishes
  when I stop to face it". There are 3 spaces: the **theatre** (a parchment screen in a carved arch,
  lantern-lit), the **desert** (فلاة, layered paper-cut dunes) and the **mirrors** (a row of Blender
  pointed-arch mirrors).
- **One shot per hemistich.** In `js/shots.js`: `T0(i) = lines[i].s − 0.12` (shot 0 starts at 0). The
  last poem shot ends at `FINALE_END = 161.6`, and the title card runs 161.6–167.4. Key words pop on
  their own spoken syllable (`wf(line, "word")`), and in-shot hits land on word onsets or metre feet (`bt(t)`).
- [`storyboard.md`](storyboard.md) has one row per shot: seconds, hemistich, literal visual, camera, puppet move
  and key word. The full 0 → 167.4 s has no gaps. Writing it first is what made a 57-shot film possible in one pass.
- Decisions made alone (brief §1.4):
  - The whole poem, not a 60–90 s excerpt: it is a ring that ends on its first line.
  - The beat is the metre.
  - "Dance" means puppetry: hits on the feet, and the groove is the puppeteer's rod sway.
  - Arabic only on screen, with 1–2 words per hemistich (N5: no karaoke).

### B5. Architecture (file by file)
Load order is fixed in `index.html`: `song → atlas → util → textures → puppet → stage → overlay → svg → shots
→ main`, then the **inline** `window.__timelines["main"]` registration (N3).

| file | lines | role |
|---|---|---|
| `index.html` | | `#root` `data-duration="167.4"`, canvases `#gl` (three.js) → `#ov` (opaque 2D post) → `<svg id="svg">`; 4 hidden `<img class="atl">` for the Blender atlases (so page load waits for them); hidden font-warm spans with every key word (Amiri 400/700, `font-display: block`); `<audio data-duration="166.4">` |
| `js/song.js` | 3 | GENERATED (B3) |
| `js/atlas.js` | 4 | GENERATED by `blender/atlas_js.py`: atlas grid sizes + the mirror opening polygon |
| `js/util.js` | 149 | clamp/lerp/easing, mulberry32 `U.rng`, `U.hash`, `U.noise1`, the variable beat grid (`U.tb`, `U.beatAt`, `U.beatPulse`, `U.eventPulse`), keyframe `U.track`, Arabic-aware `U.norm` / `U.findWord` |
| `js/textures.js` | 489 | art direction header (palette + type), and every Canvas-2D texture: tone-mapped parchment, proscenium arch, skies, moon, paper-cut dunes, sand, glow, floor, hand shadows, chalk outline, footprints, the horned beast, balance, dais, door … all cached by key |
| `js/puppet.js` | 652 | the leather puppets: skeleton `solve()`, 39 `POSES`, 10 `MOVES`, `choreoPose`, `agePose`, and `drawPuppet` (leather with punched star holes, rivets, rods, whips, crown, beard, tatters, hollow mode, blood, ghost palette) |
| `js/stage.js` | 362 | the three.js world `MV.World` (immediate mode): theatre + desert groups, 5 puppet **slots** (canvas + derived shadow canvas), pools (`pup` 30, `shd` 20, `spr` 60, `sprB` 30, `addv` 40, `dyn` 24), a 900-point glow cloud, `W.reset/cam/setTheatre/setDesert/puppet/shadow/groundShadow/sprite/glow/dot/dyn/atlas/mirror/render` |
| `js/overlay.js` | 254 | the 2D post pass `MV.Overlay`: `begin` (copy GL + midtone lift), `bloom`, Arabic kinetic type `word`, `text`, `letterbox`, `vignette`, `grainPass`, `flash` (colour-dodge) |
| `js/svg.js` | 153 | vector layer: 3 girih rosettes, the cartouche around «الملك لله», a split line, the voice/echo waves, the title arch. One paused anime.js timeline, primed (`seek(END); seek(0)`), seeked to `t*1000` |
| `js/shots.js` | 1218 | THE EDIT: helpers + 57 `shot(i, name, fn)` entries |
| `js/main.js` | 81 | `MV.renderAt(t)`: the per-frame algorithm below; `hf-seek` listener + GSAP proxy tween |
| `blender/*.py` | | `_common.py` (deterministic Cycles setup), `lantern.py`, `mirror.py`, `crown.py`, `hourglass.py`, `render_all.sh`, `atlas_js.py` |
| `tools/` | | `make_srt.py` (captions), `thumbnail.sh` + `thumbnail.html` (YouTube thumbnail) |

**Per-frame algorithm (`js/main.js`):**
1. Clamp `t` to [0, 167.4). On the first call, build lazily: look up the canvases (N2), `W.init`, `O.init`, `MV.Svg.build`.
2. `W.reset()`: hide every pooled mesh, hide theatre and desert, zero the dot cloud, reset the camera.
3. Pick the shot (last `t0 ≤ t`). Build `ctx = {t, b, lt, lb, dur, k, shot, heroPose, post, overlay}`.
   The post defaults are bloom 0.35, vignette 0.9, grain 0.05, lift 0.35 and exposure 1.
4. `shot.apply(ctx)` sets the world, draws puppets into slots, places them, and pushes overlay functions.
5. **Bright-screen cap:** if the theatre is visible, lift ≤ 0.1 and bloom ≤ 0.18, and `O.bright = true`
   (pale type turns into dark ink with a light rim).
6. `W.render()`, then the overlay: `begin(lift)` → `bloom` → the shot's overlay functions (key words) →
   `letterbox` → `vignette` → `grainPass(t)` → `flash` → `MV.Svg.render(t)`.

### B6. The puppets (Canvas 2D on billboards)
- Canvas 720×1180 px, ground at y = 1150. **Heads face +x in profile**, as in real khayal al-zill.
- Five kinds (`fear`, `guest`, `mother`, `youth`, `child`), each with a scale `k`, a head size and a
  robe flag, plus palettes (`ghost` is translucent blue-grey with an ink edge; `white` and `black` are
  the mirrored twins in shot 28).
- **Pose = data**: degrees for `torso, head, lSh, lEl, rSh, rEl, lHip, lKnee, rHip, rKnee`, plus `shift,
  air, squash`, hand shapes, `crackL/crackR` (whip extension), `mouth`, `eyes`.
- **Knees bend forward only.** `solve()` forces `knee = −|knee|`. The Mirror Mirror frontal clamp
  gave backward knees and X-legs. Runs are gallops with the same leg always leading.
- **Moves** loop over beats. A key pose is reached ON its beat: it starts 0.3 beat early, settles 0.22
  beat late, and uses `inOutBack`. Moves flagged `smooth` (run, walk, sway, tremble) interpolate
  continuously. A shot passes `choreo = [{b, pose|move, x}]` on absolute beats, crossfaded over `x`
  (default 0.6) beats with an S-curve.
- **Groove** (`pup()` in shots.js): a rod bob on each beat (squash +0.022, head +2.5°) and a sway every
  2 beats (shift 9 px, torso 2°), scaled by `gv` per shot. Optional `shiver`. Blinks come every 3.3 s,
  deterministic per slot.
- **Age** is a monotonic function of the film's time: 0 → 0.38 at 21.9 s → 0.42 (strut) → 0.46 (يا شيخ) →
  0.5 → 0.6 → 0.85–1 in stanzas 3–4. `agePose` adds a hunch, head down and soft knees. The robe greys,
  and the hair goes from `#24120a` to `#f3ead8`. Stanza 2 (34–51 s) is the remembered past, tinted sepia-red.
- **Slots and shadows:** `W.drawSlot(i)` draws the puppet to slot i's canvas, then derives its shadow
  with `filter: brightness(0) blur(4px)` into a half-size canvas. `W.puppet(i, …)` / `W.shadow(i, …)` /
  `W.groundShadow(i, …)` place as many billboards of that slot as you want (crowds, mirror reflections,
  giant screen shadows). **Slot 0 is always the hero**, which is what `motion_check.cjs` reads.

### B7. Blender props (real 3D, built only from code)
- **Rules** (`blender/_common.py`): factory settings, Cycles on **CPU**, 48 samples (hourglass 64), `seed = 0`,
  `use_animated_seed = False`, OIDN denoise, `film_transparent` (+ transparent glass), view transform
  `Standard`, RGBA PNG, linear keys. No imported models, HDRIs or image textures. Everything is
  primitives + modifiers + Principled BSDF.
- **Assets:**
  - **lantern**: hexagonal, so a 60° spin loops in 48 frames, at 384×512.
  - **crown**: 8 spikes, so a 90° spin loops, at 384×384.
  - **hourglass**: a one-shot drain over 48 frames, at 384×512. Its frame = clamp(f(sung time)), so
    "تمت بأناة" drains on the words.
  - **mirror**: it turns from −80° to +80° in front of an orthographic camera over 49 frames, at 384×480.
- **The mirror trick:** the glass is left open (transparent). Because the camera is orthographic and
  the pivot lies in the glass plane, the opening at angle θ is the frontal opening squeezed by cos θ.
  `mirror.py` writes that polygon to `mirror_opening.json`. `W.mirror(key, angle, …, content)` picks
  the frame for the angle and clips to the squeezed opening. It fills that with a silver gradient, draws
  `content(g, w, h)` (for example `reflect(slot)`, a mirrored puppet) squeezed by cos θ, adds a glass sheen,
  and then draws the Blender frame on top. This is how 11 mirrors can each show a different, ageing reflection.
- **Into the composition:** `tools/sprite_atlas.py` packs each PNG sequence into one atlas (10 columns).
  `W.drawAtlas` blits frame `i` from the hidden `<img>` with Canvas 2D into a `W.dyn` plane. Never make a
  WebGL texture straight from an `<img>` (AGENTS §12). Cyclic props use `W.loopFrame(name, t, rate, offset)`.

### B8. Arabic type
- **Amiri 700** for key words and the title, Amiri 400 for credits. Aref Ruqaa looked better but
  dropped its i'jam dots in Chrome («حق» read «حه», the title read «الحوف»). That was the critic's P0.
  Proof every key word in the HyperFrames Chrome before you commit to a font.
- **`O.shape`**: insert U+200D (ZWJ) after a lam that precedes jeem/hah/khah. Amiri's lam+khah ligature
  otherwise stacks the letters and reads «انخوف».
- Canvas `direction = "rtl"`. The reveal "writes" right to left over 0.32 s, starting 0.12 s before the
  spoken onset, through a **feathered 90 px gradient mask** on a scratch canvas (`destination-in`). A hard
  clip sliced the glyphs.
- Styles: gold = truth and central words, red = violence and lies, bone/silver = neutral. On the bright
  screen, bone/silver become `ink` and gold becomes `goldInk`. Sizes are 150–230 px (one 280 px), kept off the hero's
  face and body and inside the 5 % safe area.
- The SVG cartouche text («الملك لله») uses the same face through the `.svgword` class. The title card is
  canvas type: `O.word("الخوف", size 230)` and `O.text("تميم البرغوثي", 700 70px Amiri)`, revealed 1.0–3.4 s
  after `FINALE_END`, over the anime.js arch.

### B9. Writing one shot (worked example: shot 15 «يحمل سوطين في يديه فذا»)
```js
shot(14, "two-whips", (ctx) => {
  theatre(ctx, { tint: 0xe8a888, hot: [0, 5, 14, 0.55], hotColor: 0xffa070 });   // sepia past: red-tinted screen
  const c1 = wf(14, "يحمل"), c2 = wf(14, "سوطين"), c3 = wf(14, "يديه"), c4 = wf(14, "فذا"); // spoken onsets
  ctx.punch = 1.2 * U.eventPulse(ctx.t, [c2 + 0.08, c3 + 0.08], 0.35);           // camera punch-in on the cracks
  cam(ctx, [[0, [0, 4.8, 15], [0, 4.8, 0], 38], [1, [0, 4.8, 14], [0, 4.8, 0], 38]]); // slow push over shot progress k
  pup(ctx, 0, "fear", [{ b: 0, pose: "bothUp" }, { b: bt(c1), pose: "whipUpL", x: 0.3 }, { b: bt(c2), pose: "lashL", x: 0.22 },
    { b: bt(c3 - 0.2), pose: "whipUpR", x: 0.3 }, { b: bt(c3 + 0.05), pose: "lashR", x: 0.22 }, { b: bt(c4 + 0.1), pose: "bothUp", x: 0.4 }],
    { whips: true }, 0.3);                                                        // poses hit on the words
  W.shadow(0, 0.5, 0.2, 0.02, 8.0, { opacity: 0.45 });                            // his shadow on the screen
  W.puppet(0, 0, 0.4, 0.06, 8.0);                                                 // the leather puppet in front
  flash(ctx, "#ff7050", [c2 + 0.08, c3 + 0.12], 0.2, 0.4);                        // colour-dodge flash, quadratic decay
  word(ctx, "سوطين", c2, 480, 190, { size: 180, style: "red" });                  // key word on its own syllable
});
```
The pattern for every shot:
1. Set the space.
2. Read the spoken times by word (`wf`), never by hand-typed numbers (M5).
3. Set the camera keys over `k`.
4. Set the puppet choreography in beats.
5. Place the instances.
6. Add events on words (flash, punch).
7. Add the key word.

Particles are closed-form (`motes()`: phase = hash + t·speed, modulo 1). There is no state between frames.

### B10. Review, critic, fix: what actually happened
| time (UTC, 2026-10-13, approximate: from file times and chat messages) | step |
|---|---|
| 01:24–01:40 | clone, audio (yt-dlp 251), Scribe, proof-read, analyze_song → voice_pulse, sections, story, storyboard; Blender install + 4 props |
| 01:40–02:15 | engine + 57 shots; frame review loops with `frames.cjs` |
| 02:15–02:23 | draft render (`--quality draft`, about 8 min, 77 MB) + check_render + 2 fps contact sheets (12 sheets) |
| 02:25–02:40 | draft 1 posted to the owner; **one** critic subagent reviewed it the AGENTS Step 12 way (draft MP4, contact sheets, storyboard, lyrics, §2/§11) → 5/10 |
| 02:40–03:05 | fixes: Amiri + ZWJ (P0); parchment tone-map + lift/bloom caps; blue-grey ghost palette with an ink edge; monotonic age + sepia past; forward-only knees; strut/gallop/kneel poses; 11-mirror arc; a new finale (the shadow leaves him and walks into the light) |
| 03:05–03:15 | final render `--quality high` (about 10 min) |
| 03:15–03:46 | gates, 1 fps sheets, 47 MB repo encode, commit `95ee504`, delivery |

The critic's measured findings and the fixes are in `reference/khawf/critic_draft1.md` and at the end of
`storyboard.md`. Following M8, there was one critic, two drafts and no open-ended loops.

### B11. Pitfalls this video hit (also in AGENTS.md §12)
1. Ruqaa dropped its dots → Amiri 700. Amiri's lam+khah ligature → ZWJ.
2. The backlit parchment clipped (10–21 % of pixels > 250) → tone-mapped texture (centre about 215, edges
   about 140, fibres and seams), lamp hotspot halved, lift/bloom capped, a < 3 % > 245 target.
3. White ghosts vanished on the bright screen → blue-grey translucent shadows with an ink edge.
4. Backward knees and X-legs from a frontal-dancer clamp → forward-only knees for profile figures.
5. A canvas path leaked between frames (the title card filled another shot's word plate) →
   `beginPath()` before every path helper. This is nondeterministic across parallel workers.
6. (Applied from the toolbox demo.) anime.js does not paint a child's start values before it has run →
   `svg.js` primes its timeline with `seek(END)` then `seek(0)`.
7. (Applied from the toolbox demo.) A three.js texture from an `<img>` stays black → `W.drawAtlas` blits
   to a canvas first.
8. A 4.1 Mbps repo encode came to 90 MB for 167 s → size the bitrate by the length (A7).
9. For poetry, `analyze_song.py` reported a plausible BPM and `grid_contrast` 1.4 → trust `on_grid`
   (0.09 = chance) and switch to `voice_pulse.py`.

### B12. Make your own poem video from this one
1. Copy `projects/khawf` to `projects/<slug>`. Delete `analysis/*`, `storyboard.md`, `assets/` and the shots
   in `js/shots.js`, keeping the helpers.
2. Run A1-style audio, B1 lyrics, B2 grid (`--feet` = feet per hemistich of your metre; for example kamil 3,
   tawil 4, mutaqarib 4; check the feet against the recitation), B3 sections, B4 story and storyboard.
3. Keep `util.js`, `overlay.js`, `main.js`, the slot/pool core of `stage.js` and the skeleton of `puppet.js`.
   Replace the world (`textures.js`, the sets in `stage.js`), the costumes (`drawPuppet`), the Blender
   props and every shot.
4. Proof every key word in the HyperFrames Chrome before you build shots on a font.
5. A3–A7, one critic, fix the P0/P1s, final render, encode, then update `AGENTS.md` with anything new you learned.
