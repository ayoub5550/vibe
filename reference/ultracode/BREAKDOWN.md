# Ultracode reference: shot-by-shot breakdown

**Source:** Devarf (@VibeDevarf), *"I Had Opus 5.5 Make the Same Music Video at Every Effort"*,
https://youtu.be/3S4vuHxGh7c. Chapter "Ultracode" runs 7:43–9:08. The stats card is shown 7:43.9–7:48.9,
and **the music runs 7:48.87–9:08.1** (song time 0 = YouTube 468.87 s).
The run used Claude Code 2.1.287 with Opus 5.5 at **Max effort plus Ultracode** (multi-agent),
2–4 Oct 2026. The stats card reads: 3 h 56 min 37 s, ≥ 2,305,435 output tokens, ≥ $280.28 at API
prices up to the delivered video. The creator says the full run cost ≥ $348 and never finished.

`stills.jpg` holds 40 low-res stills (one every 2 s of song time) for study. The video itself is
**not** in this repo because it is Devarf's work. To study it frame by frame, record it privately:
`cd /work && uv run python tools/capture_youtube_segment.py 3S4vuHxGh7c 461 88 /work/data/ref/ultracode.webm`
(root `AGENTS.md`, Step 1).

## What to take from it (the design DNA)
1. **One motif builds everything:** a deck of cards becomes the hero (Jack of Mirrors), the walls (card
   backs with eyes, later white face cards), the props (fan, cage bars, credits "The Deck: 56 cards")
   and the end (a finger touching its reflection).
2. **2D character, 3D stage:** a flat vector Jack on a perspective art-deco stage with a **mirror
   floor**. The blue reflection is a second character.
3. **Bright, warm and big:** mean luma is about 77/255 (measured on the stills). The hero fills
   60–85% of frame height in the hooks. From the drop on, the walls turn to white face cards.
4. **Literal lyric gags with UI language:** a counter with tally marks, a ruler from 1 to 10, a crop box
   dragged by a cursor, a credits roll, FAKE LOVE on a fan of cards, L/J letters for "every L".
5. **Big poses:** deep lunges, kicks, squats, and a radial-blur spin on "pivot".
6. **Payoff:** an extreme close-up of the finger touching its reflection's finger on the floor.
7. Mistakes to avoid: misheard lyrics printed on screen ("ON SURFACE" for "gon' surface") and
   stray words as type ("THE", "FROM").

## Shot list (song time → YouTube time)
| song s | YouTube | lyric | what is on screen |
|---|---|---|---|
| 0–7 | [7:48.9](https://youtu.be/3S4vuHxGh7c?t=468) | Mirror, mirror on the wall / Tell me who gon' rise and fall | Hero card: the **Jack of Mirrors** playing card (J index with an eye pip). The top half is a red/gold harlequin Jack with a feathered cap; the bottom half is the same Jack mirrored in blue. It floats on a gold diamond lattice. The camera drifts and rotates around it, and the card tilts flat. |
| 5–7 | [7:53.9](https://youtu.be/3S4vuHxGh7c?t=473) | Still, I'm standin' ten feet tall | A ruler from 1 to 10 rises beside the tilted card; the card climbs it. |
| 8–8.9 | [7:56.9](https://youtu.be/3S4vuHxGh7c?t=476) | Mirror, mirror, don't you lie | Extreme close-up: the Jack's gloved hand pointing down (the finale's hand is planted here). |
| 9–10 | [7:57.9](https://youtu.be/3S4vuHxGh7c?t=477) | I can see it in my eyes | A giant graphic eye (black on cream); the blue Jack stands inside the pupil. |
| 10–13 | [7:58.9](https://youtu.be/3S4vuHxGh7c?t=478) | Truth gon' surface every time | A small card in space on a blue horizon line. The type reads **ON SURFACE · EVERY TIME** (sic: misheard lyric) with a mirrored reflection, and the card cracks with blue lightning. |
| 13–16 | [8:01.9](https://youtu.be/3S4vuHxGh7c?t=481) | Even when the lights dim / Dancin' with my shadow | The gold art-deco **sunburst stage** with a dark-blue mirror floor. He dances on a round platform while his blue reflection dances upside down below. Walls of card backs with eyes surround the stage. |
| 16–19 | [8:04.9](https://youtu.be/3S4vuHxGh7c?t=484) | Tryna count all my regrets | Huge gold numbers (18 → 23) with tally marks above him while he dances; eye walls left and right. |
| 19–23 | [8:07.9](https://youtu.be/3S4vuHxGh7c?t=487) | Mama said, Boy, don't sell your soul | A big Queen card (Mama) stands beside him (not behind him); gold marionette strings run from above. |
| 23–26 | [8:11.9](https://youtu.be/3S4vuHxGh7c?t=491) | But the silence louder now than a million gods | Eye walls under a spotlight. He hangs as a marionette on strings and kneels; some wall cards get red frames. |
| 26–35 | [8:14.9](https://youtu.be/3S4vuHxGh7c?t=494) | (kick drop) kings fall … queens trade crowns | The walls flip to **white face cards** (the whole deck). Cards fly and fall in, kings and queens line up, and crowns float off. A blue-hero insert follows, then a red circle on the Ace of Spades. |
| 36–37 | [8:24.9](https://youtu.be/3S4vuHxGh7c?t=504) | We all one mistake from the cage | Title word **THE CAGE** over the blue hero in the dark. |
| 37–38 | [8:25.9](https://youtu.be/3S4vuHxGh7c?t=505) | …or the graveyard | He stands inside a cage of thin card-edge bars with his arms crossed. |
| 39–40 | [8:27.9](https://youtu.be/3S4vuHxGh7c?t=507) | Livin' like a movie | Film strips run down both sides; the blue hero sits in the middle. |
| 40–41 | [8:28.9](https://youtu.be/3S4vuHxGh7c?t=508) | …but the credits never roll | A cast list between film strips: *The King: K of Spades · The Queen: Q of Hearts · The Boy: J of Mirrors · The Shadow: Himself · Mama: Q of Mirrors · The Deck: 56 cards · A Million: 10 of Mirrors*. |
| 42–44 | [8:30.9](https://youtu.be/3S4vuHxGh7c?t=510) | They gon' crop you out the frame | A red **crop box** labelled 032/005 is dragged by a mouse cursor; it crops the Jack out until only a thin strip is left, with motion blur. |
| 45–47 | [8:33.9](https://youtu.be/3S4vuHxGh7c?t=513) | But the fake love louder than a eight | A fan of white spade cards turns red (**FAKE LOVE** in red type), then the fan explodes. |
| 48–50 | [8:36.9](https://youtu.be/3S4vuHxGh7c?t=516) | Every scar got a sermon / Every L got a learn | A split mirror world: gold hero above, blue upside-down reflection below. Giant chrome **L** and **J** letters with their mirrored copies. |
| 51–54 | [8:39.9](https://youtu.be/3S4vuHxGh7c?t=519) | If the game rigged, then I still pivot | The blue puppet on strings in dark space with a gold streak; he flips into a radial-blur **vortex spin** (pivot). |
| 55–56 | [8:43.9](https://youtu.be/3S4vuHxGh7c?t=523) | Mirror, mirror on THE wall | Hook 2: the word **THE** over the blue hero. |
| 56–62 | [8:44.9](https://youtu.be/3S4vuHxGh7c?t=524) | rise and fall / runnin' / ten feet tall | Face-card walls; big dance moves (deep lunges, kicks); the 1–10 ruler returns beside him; the reflection mirrors him. |
| 63–64 | [8:51.9](https://youtu.be/3S4vuHxGh7c?t=531) | don't you lie / see it in my eyes | A giant gold eye over the eye-card wall while he dances in front. |
| 65–66 | [8:53.9](https://youtu.be/3S4vuHxGh7c?t=533) | Truth gon' surface | Huge italic **ON SURFACE** while he spins. |
| 67–75 | [8:55.9](https://youtu.be/3S4vuHxGh7c?t=535) | Hook 3: Mirror, mirror on the wall … | **Mirror booths**: art-deco glass cabinets with clone Jacks dancing inside. **THE WALL** and **FROM** type, a blue negative variant, and booths in an arc. He towers above the booths next to the ruler at 10. |
| 76–77 | [9:04.9](https://youtu.be/3S4vuHxGh7c?t=544) | I can see it in my eyes | Eye walls; he stands alone, and a giant eye shows up in the floor reflection. |
| 78–79.2 | [9:06.9](https://youtu.be/3S4vuHxGh7c?t=546) | Truth gon' surface every time | **Finale**: an extreme close-up of his gloved finger pointing down and touching the finger of his blue reflection on the mirror floor, with a spark at the contact. |
