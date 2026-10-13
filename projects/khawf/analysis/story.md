# الخوف (Fear): story note

**Poem:** "الخوف" by Tamim Al-Barghouti, recited by the poet (AJ+ Saha, series "مع تميم").
Metre: al-munsarih (مستفعلن مفعولاتُ مستفعلن), 28 lines (abyat) = 56 hemistichs, in four stanzas.
The recitation runs from 1.22 s to 160.10 s over a drone pad that has no beat. The pad ends at 166.4 s.

## What the poem says
The speaker addresses Fear as an old king who ruled "us" for a lifetime and has now grown old.
*Stanza 1:* "Fear, stare into this mirror. You have gone grey like us." The people openly gloat. The
master has become one of them. Sovereignty belongs to God alone. Tonight the slave judges the
master. "You killed us, so how will you kill us now? How will you escape the ones you killed?"
*Stanza 2* is a portrait of Fear as he was. He carried two whips: one for whoever disobeyed him
and one for whoever pleased him. Disobey and you die suddenly; obey and you die slowly. He
annihilates us although he is nothing, a crime without a criminal. He is the beast in a dream that
vanishes when you stop and face it. Nobody sees him, neither those who face him nor those who
flee. His traces come late, like a sound echo. He is true yet looks like a lie. He is a guest with
blood on his left sleeve who walks toward us while we cannot see his right hand.
*Stanza 3* turns to mercy. Fear is tired and confused, and his feet can barely carry him. "Old
man, it's all right, lean on my shoulder." We are generous even to fear. Some fear is more
beautiful than courage: a mother's fear for her son. When he dies she has nothing left to fear,
and that forced courage turns the curse of fear (نقمة) into a gift (نعمة).
*Stanza 4:* "Stand in our children's way, dress up as Caesar or Shah, so they learn what fear is.
Look closely and you will see how we have changed. We are your mirrors, greying together. Do you
see anyone in them? Only an abyss the size of a desert. We and you perish together." The poem ends
on its first line: "Fear, stare into this mirror."

## The concept: خيال الظل (the shadow play of Fear)
Fear is a **shadow**. The Arab shadow theatre (khayal al-zill, Ibn Daniyal, 13th c.) is the world.
A lantern lights a parchment screen inside a carved arch. The hero is **Fear, a shadow-puppet
Sultan** made of translucent coloured leather: punched star holes, riveted joints, control rods,
a tall crown and two whips. Lit from behind, he glows like stained glass. **His shadow is his
power.** Close to the lamp it is huge and blurred. Step away and it is small and sharp. That one
optical fact carries the poem: the beast "vanishes if I stop to face it" because the shadow
shrinks when you walk to the puppet.
Fear **ages** across the film: age 0 (mighty, black beard, upright) → 1 (white beard, hunched,
crown crooked, robe torn). The **mirror** (the poem's first and last word) shows the truth, the
old man, before he admits it.
"We" are the people: smaller leather puppets in teal and bone (youths, children, a mother).
The night **desert** (فلاة) is the second space. It is built as layered paper-cut dunes, so it
is still a shadow-theatre set.

## Symbol table (every recurring image traces to a phrase)
| idea | phrase | visual |
|---|---|---|
| truth | حدق في هذه المرآة | the Blender pointed-arch mirror; it shows Fear as old (شبت) |
| power | الملك، الجاه، زي قيصر أو شاه | the Blender crown, the shadow's size |
| fear's cruelty | سوطين، مفاجأة، بأناة | two whips; a rod that snaps; the Blender hourglass |
| fear as nothing | عدم، ما لهن جناة، لا يراه | a hollow puppet (outline only); an empty spotlight |
| the dream beast | كالوحش في الحلم | a giant horned shadow that shrinks when the youth turns |
| lies | كذب، يمناه، دم | red: the lying shadow word, the bloody left sleeve |
| mercy | خذ كتفي، كرم، صاحبنا | shoulder support, a cloak, two pairs of footprints |
| courage | شجاعة، أم | the heart flame grows into the Blender lantern |
| curse → gift | نقمة → نعمة | one letter changes (ق → ع); the shadow blooms into a girih rosette |
| we are mirrors | نحن مراياك، هوة بحجم فلاة | a row of mirrors that turn to face him and show the desert abyss |

## Energy map (no beat: camera speed and cut density follow the voice)
- **Stanza 1 (0–31.3 s), gloating, declamatory:** warm amber theatre, one cut per hemistich,
  quick camera moves. The highest exposure.
- **Stanza 2 (31.3–85 s), the portrait:** the darkest stanza. Red sepia flashback in the theatre,
  then the blue desert dream (53.9–66.8 s). The long pauses (73–85 s) get slow pushes. Flashes
  only on violence (whip, snap).
- **Stanza 3 (85–125.7 s), mercy:** pre-dawn desert going warm. Slow cranes, soft light. The
  mother (112–122 s) is the quiet low point, deliberately dim, then it rises.
- **Stanza 4 (125.7–166.4 s), mirrors:** cooler silver and gold, bigger set pieces (a row of
  mirrors, the dive into the abyss) building to the finale close-up. Title card in the music
  outro, after the last word.

## Decisions made alone (brief §1.4)
- **Full poem, not a 60–90 s excerpt:** the poem is a ring that ends on its first line. Cutting it
  breaks its meaning. 56 hemistichs give 57 shots of about 2.9 s each, inside the 1.1–3.6 s rule
  except the pause-holding shots (≤ 4.1 s).
- **The beat is the metre:** `tools/voice_pulse.py` puts 3 beats (feet) per hemistich, because the
  pad has no pulse (autocorrelation peak 0.073; analyze_song.py on_grid at chance level, 0.09).
- **"Dance" means puppetry:** the Sultan's hits (whip, strut, bow) land on the feet. The groove
  is the puppeteer's rod sway, not a knee bounce.
- **Text:** Arabic only on screen (the poem's words, 1–2 per hemistich). There is a small Latin
  credit on the title card.
