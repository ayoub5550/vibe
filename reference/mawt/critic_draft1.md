# «الموت الهارب»: critique of draft 1 (one critic)

**Verdict.** The concept works. A black-and-white manga act shatters into a colour anime act on «يا موت», and the cut lands on time (23.16 s; at 60 fps the strip goes from the monochrome «يا م…» type-on, through the shards, to colour within about 8 frames). Most hemistichs have a literal image: the scope, the gazelle and the wolf, the العمر HUD, the upside-down joy panels, the row of shrouds, the monkey with the bread, the cage, the sale tags, and the kite callback. The weak point is the drawing. The hero is a jointed stick puppet: tube limbs, mitten hands, a face shown flat to camera, and a stray black line (a hair strand or cord) across his face in every colour shot. He stands centred at about 45 % of frame height, with the same stance in shots 10, 12, 15, 16, 20 and 22. That reads as a Flash puppet, not anime. Death is a small purple ghost at about 15 % of frame height on the far right in every colour shot, so the antagonist has no presence. The outro (46–57 s) is washed out (white sky, beige floor, low contrast) and nearly static. The required punch, the impact frame at 44.68 s, is an inverted luma frame that reads as a negative, not as a hit. Score: **5.5/10 against the Ultracode bar**, and **5/10 against "best anime/manga motion graphics for this poem"**. The structure and sync are there. Character appeal, staging and the finale are not.

## P0
1. **37.8–40.1 s: the price tag shows «٥٨٤٣٤١٤١» (a random-looking number), not ∞.** The line is «يغلو علي»: Death becomes priceless. A digit string reads as a phone number or a bug. Fix: in `js/shots2.js` (shot 16, price-tag counter), clamp the count-up and switch to a large «∞» glyph after «الرخص» (39.52 s), with a pop scale and a flash. Also check that the digits run RTL as intended.
2. **23.3–23.4 s: one or two frames show «يا مرت» instead of «يا موت».** A shard covers the و. It is visible in a 60 fps scrub and looks like a typo on the most important word. Fix: in `js/svg.js`/`js/overlay.js`, draw the key-word layer above the shard layer, or keep the shards out of the text box.
3. **46.2–50.0 s: near-frozen stretch.** The 0.5 s strip at 47.0 s is 30 almost identical frames: the hero idles in an A-pose, Death is a 20 px speck, and there is no camera move. The "Death flees into the sunrise" beat is unreadable. Fix (`js/shots2.js`, shot 20): stage Death large in the foreground mid-flee, looking back in fear, in silhouette against a real sunrise disc. Tilt the camera up as the storyboard says. Make the dropped rifle-scythe spin down, with a 3-frame hold on impact.

## P1 (by impact)
1. **Hero design and appeal (all colour shots).** Tube limbs, no shoulders or hands, a body that does not taper, and a black line across the face. Fix (`js/chars.js`): redraw with anime proportions (about 7 heads tall, tapered limbs, drawn hands, a jacket silhouette with flaring hem and collar), add 3/4 head turns, and remove the stray face stroke (it looks like a hair strand or headphone path drawn over the face; draw it behind the face or delete it). Add two-tone cel shadows on the jacket and face.
2. **Pose and staging repetition, 23–40 s and 46–57 s.** The same mid shot, centred figure, same roof and same cloud in about 8 shots. Fix (`js/shots.js`/`js/shots2.js`): vary the shot sizes (a low Dutch angle for «أجبن», an over-the-shoulder at Death for «تعال», a big close-up of the hand for «حصتي»), and give each line one held key pose plus a smear frame.
3. **Death has no presence (24–40 s).** It is a tiny cowering cloak at the edge of frame. Fix: in shot 10, give it a reverse-angle close-up (skull sweating, ゴゴゴ reversed), and in shot 15 a large leaping silhouette over the roofs. In `js/chars.js`, give it a scythe and visible bony hands so it matches the manga-act menace.
4. **The impact frame at 44.68 s reads as a photo negative.** Fix (`js/overlay.js` impact): use the anime convention instead: a pure black frame with white speed-line rim and a red flash, then 2 frames of a white silhouette over black, plus screen shake and a radial burst. Make the cage shatter visibly, with the Blender burst atlas large in frame, not a grey ghost.
5. **Outro exposure, 46–57 s.** Sky luma ≈ 240 and a beige floor give a flat look, and the hero fades into it. Fix (`js/stage.js` sky + grade): warm the sunrise gradient (orange → gold → blue), darken the floor shadow band, add a vignette, and bring the mean luma down to about 110–130.
6. **Character on twos looks like stiff puppetry, not limited animation (12–40 s).** The joints rotate rigidly. Fix: alongside `U.onTwos`, add held key poses with eased overshoot, plus squash-stretch on the head and torso on the beat accents (an «نكص» recoil, a «تعال» lean).

## P2
1. **0–2.9 s:** the manga eye-and-iris beat works, but the SFX «نكص!» should get a hand-lettered skew and a black outline, so it reads like manga lettering and not a font.
2. **17.7–20.6 s:** the HUD «العمر» label is small and placed top-right. The large «٢٠» counter is good, but give the HP bar chunks a crash animation on «نقص».
3. **20.6–23.0 s:** the joy panels are good. The crack on «غصص» should physically break the panel borders (SVG), not only show text.
4. **25–27.6 s:** the shrouds read as pills or capsules. Taper them and add a tied knot at the head end so they read clearly as shrouds; the hero should be visible at the end of the row.
5. **27.6–30 s:** the decoration around «تعال» (golden dashes) looks like broken glyph fragments. Remove it or turn it into proper ゴゴゴ marks.
6. **32.5–34.9 s:** the boy in the cage is tiny and hidden behind the bars. Push in, and light the boy (rim light).
7. **The ゴゴゴ glyphs are Japanese katakana** in an Arabic video. That is fine as a manga reference, but consider an Arabic SFX («غغغ») for consistency.
8. **57.15–58.95 s title card:** the type is good (Amiri, correctly joined). The background city is murky grey-violet. Use a deep navy with more contrast, make the poet-name line larger, and draw the gold rules symmetrically.

Spelling check of the sampled lyric words (نقص، انقلبت، غصص، يا موت، أجبن، فتني، تعال، قرد، يهرب، يغلو، رخيص): all correctly joined and RTL, with no missing dots, apart from the occluded frame in P0-2. Words appear on their spoken beats within about 1 frame, where sampled against the storyboard timings.

## Top 5 fixes in order
1. Redraw the hero in `chars.js` (proportions, hands, cel shadows, remove the face line) and vary his poses.
2. Fix the price tag to ∞ and the occluded «يا موت» frames.
3. Rebuild the 46–50 s Death flee and the 44.68 s impact frame as real anime beats.
4. Re-grade the outro (warm sunrise, contrast, vignette).
5. Give Death screen size and a reverse-angle close-up; vary the camera across the colour act.
