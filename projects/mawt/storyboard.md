# «الموت الهارب» (The Fleeing Death): storyboard / edit decision list

Tamim Al-Barghouti, recited by the poet («مع تميم», AJ+ ساحة, https://youtu.be/TCTGgQNQpOI). Anime / manga motion
graphics, code only. Story, symbols and energy map: [`analysis/story.md`](analysis/story.md).

## Decisions made alone (brief §1.4) and deliberate deviations
- **60 fps** (owner-approved deviation from AGENTS §2's 30 fps): `hyperframes render --fps 60`; `U.FPS = 60`.
  Characters are drawn **on twos** (pose time quantised to 1/30 s by `U.onTwos`) for authentic limited
  animation; camera, speed lines, flashes, SFX and every other FX run at the full 60 fps.
  `tools/check_render.sh … 60` checks the frame rate; `tools/motion_check.cjs <dir> 0-58.95 60` measures joint
  travel over 1/30 s so its 400/200 px thresholds keep their meaning at 60 fps.
- **The whole upload** (57.15 s): voice 0.54–40.12 s + the 17 s instrumental outro, which becomes the anime
  finale. Only 17 ms of tail were trimmed (57.1675 → 57.15 s, a whole number of 60-fps frames; 10 ms fade-in,
  150 ms fade-out like `align_excerpt.py`). Composition 58.95 s = 57.15 s + 1.8 s title tail = 3537 frames.
- **Beat = metre**: rajaz mashtūr, 3 feet (mustafʿilun) per line → `voice_pulse.py --feet 3` (72 beats). The
  outro has no beat (`analyze_song.py` on_grid 0.0 after 40.3 s), so its cuts sit on the continued 0.76 s grid.
- **Manga act is bright on purpose** (paper white, luma above the §11 60–90 target), like khawf's parchment:
  a written exception. The colour act sits near the §11 targets.
- Arabic only on screen, 1–3 words per line (N5). Lalezar for sound effects and punchy words, Amiri 700 for
  the title and credits (both proofed in the HyperFrames Chrome; Amiri needs the ZWJ for «الخصص/الحصص»).
- **Render with `--no-browser-gpu --workers 6`** (draft: `hyperframes render --quality draft --fps 60
  --no-browser-gpu --workers 6 --output out/draft1.mp4`, 10 min 22 s for 3537 frames). On this machine
  HyperFrames' GPU auto-probe picked `--use-angle=gl-egl` (Mesa llvmpipe) and only 3 workers; one worker then
  hung for more than 5 minutes inside `HeadlessExperimental.beginFrame` at frame 2926 (48.77 s) and the 1-worker
  retry hung on the same frame. SwiftShader (what `tools/frames.cjs` uses) renders that frame in milliseconds.
- `tools/luma_report.py` now reads the fps from the file, so its "seconds" are real seconds at 60 fps too.
- Respect: the row of the dead is shown as white shrouds in a still row at dusk, no wounds, no blood.

## Shot list (T0(i) = first word of line i − 0.12 s; times in seconds)
| # | s | line | literal visual | camera | hero / characters | key word |
|---|---|---|---|---|---|---|
| 1 | 0.00–2.94 | رأيت موتي مقبلاً ثم نكص | MANGA page 1: (A) night city strip; (B) extreme eye close-up, Death's silhouette grows in the iris on «رأيت…مقبلاً», jerks away on «نكص» with focus lines; (C) Death walks up the street, recoils | slow pan (A), fixed (C) | Death: breathe → recoil on «نكص» | «موتي» (0.98), SFX «نكص!» (2.40) |
| 2 | 2.94–5.58 | مالك يا قناص قد خفت القنص | page 2: (A) Death aims from a roof, ゴゴゴ menace marks; (B) scope view, SVG reticle on the hero, trembling harder on «خفت»; (C) Blender rifle-scythe weapon reveal spinning on focus lines | push-in (A) | Death: aim → recoil, fear (sweat, shake) on «خفت» | «قناص» (3.82) |
| 3 | 5.58–7.76 | تبعته بين القصور والخصص | one full panel: hero runs after Death down a street of domed palaces and tin huts; motion streaks | tracking | hero `run`, Death `run` | «تبعته» (5.70), SFX «القصور» / «والخصص» |
| 4 | 7.76–10.44 | ظبي تحرى أثر الذئب وقص | page: gazelle sniffs along the wolf's pawprints; nose on a print; the wolf looks back, startled on «وقص» | panel cuts | gazelle walk (side view), wolf | «ظبي» (7.88), «الذئب» (9.38) |
| 5 | 10.44–12.54 | منتهزا من غفلاته الفرص | page: the wolf dozes («خرررر»), the gazelle creeps up; close-up of the shut wolf eye; the gazelle's eye glints on «الفرص» | panel cuts | gazelle crouch-walk | «الفرص» (12.18) |
| 6 | 12.54–15.06 | بالظبي للذئب التشهي والخمص | page: the gazelle looms with fangs and drool over a tiny terrified wolf; insert faces | focus lines | — | «التشهي» (13.68), SFX «جوع!» |
| 7 | 15.06–17.70 | تلك لعمري من أعاجيب القصص | pull back: the panels are pages of an open book; a page flips on every foot | zoom out 2.6× → 1× | — | «أعاجيب» (16.36), «القصص» |
| 8 | 17.70–20.64 | والعمر فاعلم كلما زاد نقص | game HUD over the hero on a roof: «العمر» counter +1 per foot (١٨, ١٩, ٢٠), SVG HP bar loses a block per foot and crashes on «نقص» | slow push | hero sad → cry on «نقص» | «زاد» (19.68), «نقص» (20.04) |
| 9 | 20.64–23.04 | وانقلبت أفراحه إلى غصص | three joy panels (kite, hero + boy laughing, bread) flip upside down one per foot on «وانقلبت», crack on «غصص»; below, the crying eye | fixed | — | «انقلبت» (20.76), «غصص» (22.46) |
| 10 | 23.04–25.16 | يا موت لا أجبن منك أو ألص | **COLOUR BURST** at «يا» (23.16): 5-frame black/white impact frame, SVG shards fly, a radial colour wipe from the hero's chest; hero points at Death on a dusk roof, red scarf, speed lines; Death cowers | low heroic angle, punch-ins on «يا»/«موت»/«أجبن» | hero shout → pointAt; Death tremble | «يا موت» (23.16), «أجبن» (23.96), «ألص» (24.96), SFX «بوم!» |
| 11 | 25.16–27.64 | لم فتني في الصف والقتلى ترص | the row of white shrouds at a violet dusk; Death walks the row and passes the hero, who stands at its end | dolly along the row | hero sad → reach; looks after Death | «فتني» (25.48), «الصف» |
| 12 | 27.64–30.00 | تعال أرج حصتي بين الحصص | hero beckons, battle aura rises, golden ゴゴゴ; Death trembles far back | slow push-in | fight → beckon on «تعال» → open arms | «تعال» (27.76), «حصتي» (28.60) |
| 13 | 30.00–32.48 | قرد بخبز الولد الباكي رقص | the monkey dances on the feet with the flatbread held high; the boy cries; music notes | mid shot | monkey `dance`, boy cry | «قرد» (30.12), «رقص» (31.98) |
| 14 | 32.48–34.90 | والقرد حر والصبي في القفص | the boy inside the spinning Blender birdcage; the monkey sits free on top | slow push | boy cry, monkey sit | «حر» (33.16), «القفص» (34.28) |
| 15 | 34.90–37.72 | يهرب مني وهو قد عم وخص | Death leaps away over the roofs, hero chasing; on «عم» a violet shadow sweeps the whole city | tracking | hero `run`, Death `run` | «يهرب» (35.02), «عم» (36.70), «وخص» (37.02) |
| 16 | 37.72–40.12 | يغلو علي في مواسم الرخص | sale tags («رخيص», ٠) rain down; Death's price tag runs up to ∞ | slow push | hero reach; Death tiptoes away | «يغلو» (37.84), «الرخص» (39.52) |
| 17 | 40.12–41.64 | (outro) | colour eye close-up: the iris ignites red-gold, pupil contracts, speed lines | static + zoom | — | SFX «ووووش» |
| 18 | 41.64–43.16 | (outro) | power-up: aura, hair flare, white ゴゴゴ, speed lines | low orbit | power → vUp | — |
| 19 | 43.16–46.20 | (outro) | the dash (streaks) → 5-frame impact frame at 44.68 → the Blender cage bursts open (cageburst atlas), the boy jumps free, the monkey runs | tracking → punch + shake | dash → punch; boy jump | SFX «كرررك!» |
| 20 | 46.20–50.00 | (outro) | dawn: Death flees into the sunrise, drops the rifle-scythe (it spins down and sticks in the roof), scatters into crows at 48.48 | slow tilt up | hero pointAt | SFX «ووش» |
| 21 | 50.00–53.80 | (outro) | the boy flies the kite again (callback to shot 9), hero smiles | crane up | hero groove, boy vUp | — |
| 22 | 53.80–57.15 | (outro) | close-up: the hero smiles, scarf in the wind; the abandoned rifle in the roof behind; a kite in the sky | slow push | breathe | — |
| 23 | 57.15–58.95 | (tail) | title card: «الموت الهارب», «تميم البرغوثي», credit line; SVG gold rules drawn by anime.js | static | — | title |

## Tools (where each one is visible)
- **three.js**: the cel-shaded city (MeshToonMaterial + 3-step gradient map, inverted-hull ink outlines),
  roof stage, row of shrouds, sky dome, character billboards; also the 3D manga panels (scissored per panel).
- **Canvas 2D**: all characters (hero, boy, Death, monkey, gazelle, wolf, the eye close-ups), the manga
  screentone pass (`O.manga`, native canvas threshold filters), impact frames, speed lines, SFX, HUD, kinetic type.
- **SVG + anime.js**: manga panel borders drawn in, the scope reticle, ゴゴゴ menace marks, the burst shards,
  the HP bar frame, the title rules (one primed paused timeline, seeked to t).
- **Blender** (committed scripts in `blender/`, Cycles CPU + Freestyle ink + node-maths cel shading): the
  birdcage (spin loop), the cage bursting (one-shot), the rifle-scythe (turntable).
  Re-render: `bash projects/mawt/blender/render_all.sh` (≈30 s).
- **FFmpeg**: excerpt cut and fades, render mux, check_render, contact sheets, chat/repo encodes.
- **Python**: Scribe transcription, voice_pulse, build_song_js, sprite_atlas, luma report, contact sheets.
- **Node**: frames.cjs stills, motion_check.cjs.
