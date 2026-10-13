# Critic 1: «الخوف» (Fear) draft1.mp4, compared with the Devarf "Ultracode" reference

**Verdict:** The concept is strong and the sync is the best I have seen in this repo. Every one of the 55 hemistichs after the intro opens on a hard cut 0.09–0.12 s before its first sung word. I checked all 55 cuts: 47 by scene detection, and the other 8 (lines 22, 23, 32, 33, 34, 46, 50, 52) by frame-diff. Line 1 opens the film at t = 0. The shadow-theatre world is coherent. The hero is clearly recognisable (a tall red hat, a leather Sultan on rods) and he visibly ages from a black beard to a white beard with a patched robe. Several readings are genuinely clever: the old man in the mirror, the beast shrinking to a toy Sultan, the "old fears" callback, نقمة→نعمة, and the mother's shadow outgrowing his. Execution is below the reference in four ways:
1. **Every calligraphic key word is missing most of its i'jam dots, including the title.** For an Arabic-reading viewer the film shows misspelled lyrics throughout.
2. **The parchment screen clips to flat white**, which swallows every pale element (ghosts, white Sultan, hollow outline).
3. **The "dance" is mostly tableaux with small rod sways.** It has very few visible hits on the metre.
4. **Stanza 4 and the finale do not escalate.** The climax image is a white arch with a lantern.

With sound off, stanzas 1 and 3 read clearly, stanza 2 reads as a chain of vignettes, and stanza 4 is the weakest.
**Score: 5/10 vs reference** (about 6.5 once the font and the screen exposure are fixed).

Measured:
- **Sync:** cuts land at line start −0.09 to −0.12 s on 55/55 lines with no misses. In-shot events also land on the sung word: the red snap flash at 43.23 is on «تمت» (43.22), the whip flash at 37.3 on «سوطين» (37.24), and the نعمة swap flash at 123.67 on «نعمة» (123.62).
- **Exposure:** theatre frames have a mean luma of 160–206. In them, **20–35 % of pixels are > 240 and 10–21 % are > 250** (7.0, 17.5, 23.1, 32.5, 43.6, 108.4, 111.0). 123.7 peaks at 42.7 % > 240. Desert frames sit at 108–140 with < 1.5 % clipped, and the title card is at 109.
- **Hero height (by eye, about 60 frames):** Fear is about 55 % of frame height in his own shots, 85–100 % in 85–95 s and 129–132 s, and 35–45 % in the crowd and mirror shots (12.5, 14.5, 17.5, 29.5, 102.9, 150.4). The people-only lines (44.9–48.3, 64–70, 98.5–100.8, 151–157) leave him out by design.
- **Gates:** no black runs (dark 0–1 s and 152–154 s are deliberate). The flashes are 3–6 frames. I saw no fallback fonts and no z-fighting.

## P0: must fix
1. **The Aref Ruqaa key words have lost most of their dots, across the whole film and the title card.** Principle: correct lyric on screen, readability.
   - **Examples:**
     - 73.0–74.4 «حق» renders as «حه/حو» with no dots on the ق. This breaks the whole حق/كذب gag.
     - 55.4 «يطاردني»: no dots on ي, ن or the final ي.
     - 37.3 «سوطين»: no dots on ي or ن.
     - 143.7 «مراياك»: no ي dots.
     - Also 139.4 «تغيرنا», 133.4 «حقيقته», 93.2 «كتفي», 35.5 «المهيب» and 111 «شجاعة» (the ج dot).
     - The title at 162.5–167.4 reads **«الحوف»**: the خ has no dot.
   - **What survives:** only dots drawn inside the base glyph (the ش caret, the isolated ق). The font's `ccmp` splits most letters into a dotless shape plus separate mark glyphs (`glyph00121`, `glyph00122` and so on). Those marks are lost or drawn at zero offset inside the letter body: at 23.1 the dashes of «قتلتنا» sit inside the stems.
   - **The cause is the Ruqaa file, not the pipeline.** On the same title card, Amiri «تميم البرغوثي» renders every dot. The subset itself is also damaged: PIL+raqm with the same woff2 still drops the dots of the final ق in «حق».
   - **Fix:**
     1. Replace `fonts/ArefRuqaa-700.woff2` with the unsubset upstream `ArefRuqaa-Bold.ttf`, keeping GDEF, GPOS mark/mkmk and ccmp.
     2. Render a proof page of all ~65 key words plus «الخوف» **in the same HyperFrames Chrome** and check every dot.
     3. If marks still fail, set the key words in Amiri 700 or Reem Kufi 700, which use precomposed dots.
     4. Cut the edge stroke in `O.word` from `size*0.07` to about `size*0.04` so the small Ruqaa dash-dots don't merge into the letters.

## P1: should fix
- **The parchment screen blows out, in every theatre shot (0–53.9, 70.5–81, 100.8–125.7, 134–137).** The backlit screen reads as a deliberate khayal-al-zill style, and the carved frame sells it, so the brightness itself is fine. The problem is that the hotspot clips to textureless paper-white over a fifth to a third of the frame. That looks milky and kills every pale object.
  - Fix: tone-map the screen so its centre peaks at about 215 luma with a falloff to about 140 at the edges. Add parchment fibre and stitched panel seams, and keep fewer than 3 % of pixels above 245.
  - Write a theatre target of 130–150 mean luma into the storyboard as the deliberate exception to §11's 60–90.
- **The ghosts are invisible and leak out of the screen (21.9–23.3 «تقتلنا», 28.4–31.3 «قتلاه»).** The ghosts that "rise again" are white at low alpha on the 250-luma hotspot, so at 28.6 almost none are visible. At 29.5–31.0 their legs are drawn below the screen onto the gold proscenium.
  - Fix: draw ghosts as cool blue-grey translucent **shadows** with an ink edge, which also fits the shadow-theatre logic, and clip every screen puppet to the screen rectangle. The same contrast problem hits the white Sultan at 74.5–77.3: give him a dark ink outline.
- **Line 23 «فلا يراه الذي يواجهه» does not read (59.3–61.4).** The beast "behind him" is a smudge of about 10 % alpha at the far-left edge, so the shot reads as "a boy standing".
  - Fix: put a large dashed or 35 %-alpha beast outline directly behind the boy, filling the upper frame, with the boy's eyeline clearly away from it.
- **Line 21 «يطاردني» has no chase (54.0–56.5).** The boy walks in place mid-frame and the beast is static. At 55.5 the boy's shins cross into an X (§11).
  - Fix: a fast lateral track with a full run cycle (one stride per metre foot), the beast lunging on each foot (54.02, 54.72, 55.44) and kicked-up dust. Clamp the knees.
- **Line 32 «قدماه» never pays off, and continuity breaks into 33–34 (88.5–94.0).** He never sinks to his knees: at 90.3 his legs just splay. At 91.3 he stands tall again, twice the youth's height, so «خذ كتفي… وقم» has nothing to lift.
  - Fix: knees buckle on «تقله» (89.50) and he kneels on «قدماه» (90.18). Start shot 33 still kneeling, and rise only on «وقم» (94.00) together with the lanterns.
- **The hourglass line «تمت بأناة» reads as "boy leaves frame" (44.9–48.3).** The obedient youth is about 15 % of frame height in the bottom-left corner and slides off the bottom edge, outside the safe area. There is no sand.
  - Fix: add a sand mound fed by the hourglass. The youth stands beside it at 40 % or more of frame height and sinks in step with the draining sand.
- **«المهيب» is off-screen and touches the shadow (34.0–36.6).** The word sits at y≈130, half over the black proscenium and outside the 5 % safe area, on the shadow's crown tip.
  - Fix: move it to about (1400, 330) on the screen, beside the shadow's head.
- **The ageing arc goes backwards.**
  - 23.3–26.0 (shot 10, «يا فطين يا تياه»): black beard and full hat, between grey shots at 13.4–20.8 and 26–31. The very next line calls him «يا شيخ» (27.32).
  - 134.0–137.1 (shot 48): young and black-bearded again in stanza 4.
  - Fix: make age a monotonic function of t (0 → 0.3 at 13.4 → 0.5 at 26 → 0.6 at 31.3 → 1 by 85). If shot 10 (mock swagger) or shot 48 («حقيقته الأولى») is meant as the past, mark it as the past: sepia like 34–36, or a mask/costume he holds up.
- **Choreography is tableaux, not puppet dance.** Most shots are a static pose with about ±5° of rod sway and a slow push.
  - 23.4–26.0 «تياه»: there is no strut and no whip twirl. He sways in place for 2.6 s.
  - 36.7–38.9 «سوطين»: the whips are about 2 px lines, and the crack exists only as an orange full-frame tint.
  - 96.4–98.4 «صاحبنا»: "walking side by side" is two figures standing face to face.
  - Fix: at least one visible pose hit per metre foot (`song.json` beats) in the hero shots. For the strut, one step plus a chin-up per foot and wide whip arcs. For the cracks, a thick motion-blurred whip arc with a white tip spark. For the walk, a parallax track with stepping legs.
- **The finale under-delivers (157.4–161.6).**
  - The mirror shows an empty night, then fills white with a lantern; at 160.8 11 % of the frame is clipped.
  - "His shadow leaves him" never happens, and we never see Fear actually **stare** (حدق) at his own face.
  - Fix: on «حدق» (158.06), push in until the mirror holds the old man's own face in close-up. On «المرآة» (159.62), have his shadow peel off the sand and walk into the light, or let the reflection turn into the row of people ("we are your mirrors").
  - Hold through 160.1. Ultracode ends on a single intimate gesture (the finger touch), and this needs one too.
- **No escalation; the frames get monotonous.** About 30 theatre shots share one layout: cream screen, puppet centre-bottom, word in a top corner on a grey plate, slow push. The promised stanza-4 set pieces are five small mirrors (143–146) and a dark plain (152–154).
  - Fix: vary the scale. Use an extreme close-up of a puppet's punched star eye, a shot from behind the screen showing rods, lantern and puppeteer hands, and a top-down view.
  - Build 143–154 into the biggest set: an arc of 9–12 tall mirrors at 40–60 % of frame height, the camera orbiting, each mirror greyer than the last, then a real vertigo dive into the abyss.

## P2: nice to have
- **The reveal wipe slices glyphs.** A hard vertical clip over 0.32 s leaves broken fragments for about 10 frames on every word: 43.6 «مفاجأة» (sliced alif/hamza), 108.0 «القلب» shows "اا", 2.5 «المرآ», 64.5 «آثا», 153.0 «فا». Feather the clip edge by 60–80 px, or reveal by connected letter group.
- **Dark plates look like dirty smudges on the bright screen** (4.5, 7.0, 12.5, 32.5, 47.5, 111.0). On the parchment use a warm light halo, or drop the plate alpha to about 0.2. Keep dark plates only on the night desert.
- **The hollow "bone"/outline words are low contrast** (شبت 4.5, منا 12.5, فطين 24.4 at only 120 px, الرث 32.5, بأناة 47.5). Fill them, and bring فطين up to at least 170 px.
- **Text sits on the moon or on lattice:** «مولاه» (19.8, red on the moon disc, 130 px), «ألقاه» (58.5), «فر» (62.2), and «دم» (80.1, red on the brown lattice pillar). Never place type over the moon; move it to clean sky.
- **The «الملك لله» cartouche is too small (13.4–15.4).** The body text is about 40 px, under the 90 px target, on a muddy grey disc that runs into the black top border. Use 140 px or more, gold on indigo, kept inside the screen.
- **Frame-edge crops:**
  - 2.5–3.6: the mirror is half below the bottom edge.
  - 7.0: the Sultan's whip touches the right edge.
  - 14.5: the dropped crown sits at the right edge.
  - 43.6: the fallen youth is cut by the bottom.
  - 144: the rightmost mirror is cut.
  - 158–161: the mirror is cut at the right.
  - 162–167: the top of the title arch is cropped.
- **Desert set edges show (54–56.5, 61.5–63.7).** The dune planes end in hard vertical edges, visible as pale-blue rectangles at x≈460 and x≈1530, and the gold dune lines run across the beast's body. Extend the planes past the frustum and layer the beast between dune planes.
- **Mock majesty is too modest (8.3–11.0).** The crown is about 10 % of the frame and the promised gold sunburst is missing. Add the rays and scale the crown 2×.
- **«عيناه» goes milky (140.6–143.2).** The haze lifts luma from 124 to 181 over 1.1 s and holds there. Use a chromatic double image with a little blur instead of washing the sky pink-white.
- **Footprints are too small (64–67 «آثاره»).** Three tiny prints sit in about 85 % empty sand. Bring the camera low along the track so the prints are big in the foreground, and land each print on a metre foot (64.16, 64.78, 65.58).
- **Prop placement:**
  - 111.0: the lantern covers the youth's face. Lift it above his head on «شجاعة».
  - 133.5: the crown floats about 20 px above his head.
  - 4.5 and 50.5: the type touches his crown.
  - 90.3: «قدماه» sits against his nose.
- **The whip-crack flash is a translucent tint (37.3, 38.2).** It is a warm full-frame tint rather than a colour-dodge hit. Switch it to dodge (§12).

## 3 strongest moments
1. **3.6–6.1 «قد شبت يا شيخ».** The young Sultan stands in front while the mirror shows him white-bearded. The whole concept is in one frame, exactly on the line.
2. **56.5–59.2 «ويختفي لو وقفت كي ألقاه».** The boy turns, the giant beast is gone, and a toy-sized Sultan stands in the corner. Literal, witty and true to the poem's optics.
3. **103.9–106.6 «كل ما خفناه».** The whip Sultan, the hourglass, the beast and the chalk outline return as shadows on the screen, a real callback structure. Runners-up: 118.6–125.7, the mother's shadow outgrowing his and نقمة→نعمة blooming into the girih.

## 3 weakest moments
1. **Every Ruqaa key word plus the title «الخوف» (P0).** For the poem's own audience the on-screen lyric is misspelled from 2.7 s to the end card.
2. **21.9–31.3, ghosts.** The rising ghosts and the ghost ring are white on a clipped white screen and nearly invisible, and their legs leak below the screen.
3. **157.4–161.6, finale.** The payoff is a white arch with a lantern. His shadow never leaves him, and the "stare into the mirror" is never shown as a face-to-face image.
