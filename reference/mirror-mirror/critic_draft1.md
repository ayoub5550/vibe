# Critic report on draft 1 (kept as a worked example of the review step)

This is the one independent critic pass from AGENTS.md Step 12, run on draft 1 before the fixes. Every
numeric target in AGENTS.md §11 comes from it. Paths inside refer to the build sandbox. The final
render (`mirror-mirror.mp4`) fixes the P0s and most P1s: luma median 28 → 91, 0 dance snaps,
the hand-touch finale, the title after the music, big wall cards, white face walls after the drop,
a struck-through PERFECT, the giant L, and the hero growing to the 10 mark.

---

# Critic 1: Mirror Mirror draft1.mp4, compared with the Devarf "Ultracode" reference

**Verdict:** The concept work is good. Lyric sync is excellent: cuts land within about 0.1 s of nearly every line start, and the 25.66 drop hits exactly. Verse B has a run of witty, literal gags (reels, credits, crop, TRUTH/HATE, strings snapping). Execution is a clear step below the reference: the whole piece is underexposed, the hero is often small, and the dance is stiff pose-to-pose semaphore with 1–2-frame snaps. Typography is inconsistent. Hook 3 and the finale, the loudest part of the song, are the weakest part of the film.
**Score: 5/10 vs reference.**

Measured: mean luma per frame (0–255) is median 28 / p90 61 for the draft, against median 77 / p90 107 for the reference tiles, so the draft is about 2.7× darker. Hero height (by eye, about 50 frames): draft median about 45% of frame height. The reference hooks run about 60–85%.

## P0: must fix
1. **Exposure, whole film; worst at 22–24.6, 32–35, 38–45 and 67.5–70.8** (per-second luma 15–25). Principles: contrast, readability, energy. Lift the midtones by about +1 to +1.5 stops and reduce the vignette. Push the sunburst and floor brighter. As the reference does, swap in bright face-up white card walls for verse B and the hooks. Targets: shot mean luma 60–90, hooks 80+.
2. **Hook 3 climax, 67.5–73.9.**
   - Card tornado (67.5–70.8): near black. Red and blue jesters overlap into one double image, and cards fly across the hero's face and torso, so there is no focal point. Fix: put a key light and rim light on the hero, separate the two figures by at least 1 body width, and keep cards behind or around him, never over his head or torso.
   - House of cards (70.8–73.9): the hero is only 10–19% of frame height on "standin' ten feet tall", the opposite of the lyric, and the shot is static. Fix: push in so he is at least 50% of frame height by "ten" (73.22), or grow him into a giant above the pyramid. Reference 78 s does this: the hero towers over the set with the ruler hitting 10.
3. **Finale, 77.5–79.25.**
   - The payoff is a glow at his feet. A cream whiteout at 78.5 (luma 180) then wipes out "surface every time".
   - The end card cuts in mid-lyric at 78.7 and is held only 0.55 s. Blue reflection legs show through "ANNO DOMINI BEATS".
   - Fix: build to an extreme close-up of his hand meeting the reflection's hand on the floor on "surface" (78.02). Hold that glow through "time" (79.1). Bring in the end card at 79.1 or later and add a 1.5–2 s tail. Remove the legs behind the title. Reference 83 s does the finger touch.
4. **Dance motion, everywhere.** Checked at 30 fps in 4 windows and at 10 fps in 6.
   - Pose changes land on the beat but have no in-betweens: arms jump in one frame (26.47, 26.87, 58.10, 58.50, 62.50). The legs stay planted and there is no bounce, so it reads as robotic semaphore.
   - 33.47→33.53: the whole body snaps into a frog squat in 2 frames (head drops about 125 px), with no anticipation.
   - 33.5–34.0: the shins cross into an X, which reads like a broken rig.
   - Fix: ease every transition over 3–5 frames with anticipation and overshoot. Add a dip of 3–5% of body height on every kick, plus hip sway and weight shifts. Use lunges, kicks and deep knee bends in the hooks; the reference poses are far bigger. Clamp the leg IK so the shins never cross.

## P1: should fix
- **Hero size and hierarchy** (14.2, 23.2–25.0, 44.4–45.7, 55.6–57, 74.0–74.8). The hero is 15–38% of frame height, and in the mirror halls he is the same size as the reflections. Make him 55–70% of frame height in dance shots and at least 40% in wide set pieces. Shrink the reflections to 80% or dim them to about 60%. Principle: focal point.
- **Literal misses.**
  - 33.6–34.3 "pray for 'em": he has hands on hips, then palms out. Give him palms together.
  - 50.7–52.4: "PERFECT" stays un-negated, which says the opposite of the lyric. Crack or strike it on "ain't", or shatter the centre mirror.
  - 37.2–38.0 "graveyard": the tilted cards don't read as graves. Use tombstone-shaped cards or "RIP".
  - 60.2–61.2 "ten feet tall": he stays at about 5 on the ruler. Grow him to the 10 mark.
  - 3.0 "rise and fall": only "RISE" appears. Add a "FALL" drop.
  - 47.6: "scar" has no visual. Add a crack on the J card.
- **Scar/sermon/L, 47.4–50.6.** "SERMON" (top right) and "L" (left) are faint gold on the eye-card grid, and the whole 3 s is one static J card. Make them giant centred 3D letters (L about 40% of frame height, like reference 55 s) and change the angle on 49.06.
- **Typography system.** There are about 7 styles mixed (grey glow, gold condensed, white, red neon, pink, pale blue, deco serif). Words low in contrast or tucked in corners: EVERY 11.6, SERMON 48.6, L 49.6, PIVOT 53.8, THE WALL 55.7, EYES 77.3. Text crosses the hero: SURFACE over his legs at 11.6 and 66.0. "ON THE WALL" at 1.2 is about 25 px tall. Fix: one display face, gold for truth words and red for lies, key words at least 90 px cap height, centred in clean space, with a shadow or plate, and never over the hero.
- **Background clutter, every shot with eye walls.** Hundreds of roughly 35 px card icons make high-frequency noise that fights the hero and the text and shimmers when the camera moves. Fix: cards 2–3× larger (8–10 per row, as in the reference), walls about 40% lower in contrast behind the hero, depth-of-field blur, and white walls for the bright sections.
- **Figure/ground merges** (19.2–22.0 queen, 25.3–31.6 kings/queens, 47.4–50.6 J card). The hero stands on court cards whose red/blue checker matches his costume, and the card's face sits stacked right above his head. Fix: stage the card beside him (as in reference 24–27 s) or push it back, blur it and dim it 40%, and rim-light the hero.
- **Cage, 34.9–38.0.** Fat card pillars hide his face and torso. Use thin bars (no more than 3% of frame width) and keep his face clear (reference 42 s).
- **Repeats don't escalate.** Hook 2 copies hook 1 shots: 4.4↔58.6, 6.0↔60.2, 9.5↔62–64.6. Hook 3 reuses the eye and the mirror hall twice. Add new angles and more mirrors each time, and make each repeat brighter and bigger. Principle: pacing/energy.
- **75.0 close-up framing.** His head is jammed at the bottom edge with the face cut at the mouth and about 70% headroom. Put his eyes on the upper third (y about 360 px).
- **White flashes** (64.8, 74.8, 75.6, 76.4, 77.2). Each milky full-frame mix decays over about 6 frames, so the final montage looks washed out. Cut the decay to 2–3 frames, use additive bloom, and alternate flashes with zoom punches.

## P2: nice to have
- **Opening, 0–3.7.** It is dark, grey and small compared with the reference's warm card filling about 90% of the frame. Brighten it and enlarge the card and text.
- **75.6 artifact.** The eye plane intersects the card wall, leaving a jagged stair-step edge on the left. Move the eye forward of the wall.
- **38–41 credits panel.** The backing panel has a hard vertical edge at about x=1075 that cuts the sunburst. Feather it.
- **30.6.** A crown is clipped at the top edge. Keep it inside the 5% safe area.
- **Motion blur.** Add it on spins and whip moves and on flying cards; the reference uses radial blur on the pivot.
- **73.8.** His hat is tangent to the arch line. Offset him by at least 30 px.

## 3 strongest moments
1. **25.3–28.4, the kick drop.** A flash lands exactly on 25.66, the kings fall like dominoes on "fall", and a film strip appears on "reels".
2. **41.3–44.3, crop.** REC, a red CROP box, then "OUT OF FRAME" with the hero shoved to the edge. Literal, funny and readable.
3. **44.4–45.7, TRUTH/HATE.** Gold "TRUTH" mirrors as pink "HATE" in the floor, the best use of the mirror idea. The strings snapping on "pivot" (53.6) is a close runner-up.

## 3 weakest moments
1. **67.5–70.8, card tornado.** The loudest hook is the darkest shot, with a red/blue double image and cards covering the hero.
2. **70.8–73.9, house of cards.** The hero is 10–19% of frame height on "ten feet tall", and the shot is static.
3. **78.4–79.25, finale.** A foot glow, then a whiteout, then a 0.55 s end card over the last words. There is no hand-touch payoff.
