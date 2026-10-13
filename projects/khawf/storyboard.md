# الخوف (Fear): storyboard (edit decision list)

Poem: "الخوف" by Tamim Al-Barghouti, recited by the poet (AJ+ Saha, "مع تميم"). Excerpt 166.40 s
(the whole recitation, 1.22–160.10 s, plus the pad's natural end). Composition 167.40 s (+1.0 s silent
title tail). **No musical beat:** the grid is the metre (al-munsarih, 3 feet per hemistich, from
`tools/voice_pulse.py`), so beats are 0.49–1.42 s long (mean 0.79 s). The code is `js/shots.js`:
shot *i* starts 0.12 s before the first word of hemistich *i* (`MV.SONG.lines[i].s − 0.12`), which is
inside the AGENTS.md §8 window (0.02–0.22 s). Key words pop on their own sung word (`U.findWord`).

Concept (see `analysis/story.md`): **خيال الظل, the shadow play of Fear.** Fear is a leather
shadow-puppet Sultan with a crown and two whips. His shadow is his power, and he ages from mighty
to an old man across the film. The **theatre** is a glowing parchment screen in a carved arch, lit
by the Blender lantern. The **desert** is the poem's فلاة, built from layered paper-cut dunes. In the
**mirrors**, a row of Blender pointed-arch mirrors shows the truth.

Tools used: three.js (world, cameras, puppet billboards), Canvas 2D (puppets, props, type, post),
SVG + anime.js (girih rosette, cartouche, echo rings, title arch), Blender (lantern, mirror, crown,
hourglass: `blender/*.py`, re-render all with `bash projects/khawf/blender/render_all.sh`).

| # | seconds | hemistich | set: literal visual | camera | hero / move | key text |
|---|---|---|---|---|---|---|
| 01 | 0.00–3.64 | يا خوف حدق في هذه المرآة | theatre: Black. The Blender lantern flares on; pull back to the glowing shadow screen. Fear's giant blurred SHADOW fills it. The Blender mirror turns to face him on «المرآة» | lantern → screen, slow pull-back | shadow, whips raised (majesty) | المرآة |
| 02 | 3.64–6.12 | قد شبت يا شيخ مثلنا والله | theatre: Close on the mirror: the leather Sultan (age 0) in front, his reflection is an old man (age 1, white beard). White hairs drift | push into the mirror | majesty → lookClose | شبت |
| 03 | 6.12–8.32 | شماتة فيك غير خافية | theatre: A crowd of 7 youth puppets on the screen points and laughs at him | truck right along the crowd | youths: point/laugh on feet; Fear cowers | شماتة |
| 04 | 8.32–11.04 | يا عامر الملك يا عظيم الجاه | theatre: Mock majesty: the Blender crown (2.9 u, 2× draft 1) spins over his head in front of a rotating gold sunburst; the Sultan towers | crane up | throne/majesty | الملك · الجاه |
| 05 | 11.04–13.32 | أصبحت منا وكنت سيدنا | theatre: He shrinks from giant to the size of the crowd and stands in their row («منا») | pull back to wide | majesty → neutral | منا |
| 06 | 13.32–15.72 | والملك لله لا إله سواه | theatre: The crown drops from his head and bounces; an SVG cartouche draws itself around «الملك لله» | tilt up to the cartouche | bow | الملك لله |
| 07 | 15.72–18.02 | مولاي أمسى حسابكم عسراً | theatre: A shadow-puppet balance: his pan sinks with a heavy weight on «حسابكم» | slow push | pointDown/shrug | حسابكم |
| 08 | 18.02–20.78 | ليلة تحكيم العبد في مولاه | theatre: Night: the moon rises behind the screen (indigo). The youth sits on a dais; the Sultan kneels below | low angle | youth seated, Fear kneels | العبد · مولاه |
| 09 | 20.78–23.32 | قتلتنا فانظر كيف تقتلنا | theatre: The crowd falls flat one by one; on «تقتلنا» they rise again as pale ghosts | static wide, flash on fall | youths fall → ghosts | قتلتنا |
| 10 | 23.32–26.02 | من بعدها يا فطين يا تياه | theatre: The Sultan (greying, age 0.42) struts with nose high: one high step + chin-up per metre foot, travelling in steps, whips swung wide | tracking | strut (hit per foot) | تياه |
| 11 | 26.02–28.30 | بل كيف تنجو يا شيخ من يدنا | theatre: He runs; giant hand shadows close in from both sides («يدنا») | whip pan | run → cower | يدنا |
| 12 | 28.30–31.34 | وهل نجا المرء قط من قتلاه | theatre: A ring of blue-grey ghost shadows circles him in the plane of the screen (near ones bigger, in front); he cowers | slow drift | cower | قتلاه |
| 13 | 31.34–34.00 | هل أنت يا هذا الرث صاحبنا | theatre: Close-up of the shabby Sultan: torn robe, patches, crooked crown (age 0.6) | slow push to face | tired | الرث |
| 14 | 34.00–36.64 | ذاك المهيب الذي تعودناه | theatre: Red sepia flashback: his majestic shadow fills the screen and the tiny crowd bows below | crane down | majesty | المهيب |
| 15 | 36.64–38.84 | يحمل سوطين في يديه فذا | theatre (sepia past): He raises two whips; thick lashes with motion smear crack on «سوطين» and «يديه», a white star spark at the tip | punch-in on cracks | whipUp L/R | سوطين |
| 16 | 38.84–41.62 | لمن عصاه وذا لمن أرضاه | theatre: Split: a rebel (left) and an obedient youth (right); the left whip lashes on «عصاه», the right on «أرضاه» | static two-shot | lashL, lashR | عصاه · أرضاه |
| 17 | 41.62–44.88 | إن لم تطعه تمت مفاجأة | theatre: A youth stands; on «تمت» his rod snaps with a red flash and he drops instantly | hard punch-in | youth fall (fast) | مفاجأة |
| 18 | 44.88–48.26 | وإن تطعه يوما تمت بأناة | theatre (sepia past): The Blender hourglass drains; its sand streams across into a leather sand mound that rises around the obedient youth to his chest as he bows | slow dolly | youth bowDeep → sinks | بأناة |
| 19 | 48.26–51.12 | يعدمنا رغم أنه عدم | theatre: The Sultan turns hollow: only his outline and punched holes remain | slow orbit | majesty (hollow) | عدم |
| 20 | 51.12–53.90 | بعض الجنايات ما لهن جناة | theatre: A chalk outline of a fallen figure with red drops; an empty spotlight where the culprit should be | top-down crane | none (empty) | جناة |
| 21 | 53.90–56.50 | كالوحش في الحلم إذ يطاردني | desert: Blue desert dream: the youth gallops across paper-cut dunes; the giant horned beast lunges at him on every metre foot (54.02, 54.76, 55.50), dust kicks behind him | fast lateral track | run | يطاردني |
| 22 | 56.50–59.22 | ويختفي لو وقفت كي ألقاه | desert: He stops and turns on «وقفت»; the beast shrinks to a toy-sized Sultan and puffs into sand on «ألقاه» | push in as he turns | run → face (stop) | ألقاه |
| 23 | 59.22–61.40 | فلا يراه الذي يواجهه | desert: The youth faces the empty dunes (+x); the beast looms right behind him, filling the upper frame, translucent: he cannot see it | static close | face | يواجهه |
| 24 | 61.40–64.04 | ولا الذي فر من أذاه يراه | desert: The youth flees with his back to us; the shadow stalks right behind him unseen | following | run (away) | فر |
| 25 | 64.04–66.84 | تظهر آثاره مؤجلة | desert: Bare footprints (heel, arch, toes) appear one per half foot of the metre, late, with no walker | crane along the prints | none | آثاره |
| 26 | 66.84–70.52 | كصحة الصوت واعتلال صداه | desert: SVG: a clean voice wave leaves the youth; the echo returns delayed, jagged and red | static | youth calls (hands at mouth) | صداه |
| 27 | 70.52–74.46 | حق ولكن كأنه كذب | theatre: Gold leather letters «حق» on the screen; the lamp swings and their shadow becomes «كذب» | slow push | none | حق · كذب |
| 28 | 74.46–77.36 | كما تكون النقائض الأشباه | theatre: Two Sultans, white and black, dance the same move mirror-symmetric | orbit | mirrored strut | النقائض |
| 29 | 77.36–80.96 | ضيف على كمه اليسار دم | theatre: A guest in a travel cloak enters through an arch; his left sleeve drips red | dolly in | walk | دم |
| 30 | 80.96–85.00 | يخطو إلينا ولا نرى يمناه | theatre: He walks toward the camera, right arm hidden behind his back | low angle, he grows | walk toward camera | يمناه |
| 31 | 85.00–88.48 | ما باله متعبا ومرتبكا | desert: Pre-dawn desert: the old Sultan trembles, confused, swaying | handheld drift | tired (trembling groove) | متعباً |
| 32 | 88.48–91.18 | تكاد أن لا تقله قدماه | desert: His knees go on «تقله» (buckle) and he kneels on «قدماه» | tilt down | tired → buckle → kneel | قدماه |
| 33 | 91.18–93.88 | يا شيخ لا بأس هاك خذ كتفي | desert: Still kneeling, he reaches for the shoulder the youth offers | two-shot push | kneel / reach; youth offer | كتفي |
| 34 | 93.88–96.34 | وقم فمن ذا السعيد في دنياه | desert: On «وقم» the youth lifts him to his feet; Blender lanterns rise into the sky | crane up | kneel → stand up | السعيد |
| 35 | 96.34–98.40 | مهما اختصمنا فأنت صاحبنا | desert: They walk side by side across the frame (parallax: they move faster than the camera, tufts slide past) | wide lateral | walk (pair) | صاحبنا |
| 36 | 98.40–100.76 | ونحن لا ننسى المرء صاحبناه | desert: Two sets of footprints side by side in the sand | crane along the prints | none | صاحبناه |
| 37 | 100.76–103.84 | نحنّ حتى للخوف من كرم | theatre: The crowd wraps him in a cloak; warm amber light, a soft girih rosette | slow push | kneel, cloaked | كرم |
| 38 | 103.84–107.06 | من بعد ما عشنا كل ما خفناه | theatre: The old fears (whips, beast, hourglass, chalk outline) appear as shadows and burn into embers | slow pull | none | خفناه |
| 39 | 107.06–109.60 | ورب خوف في القلب أجمل من | theatre: Close on a youth's chest: a small flame of fear glows in his heart | push to chest | hand on heart | القلب |
| 40 | 109.60–112.58 | شجاعة لو أمعنت في معناه | theatre: The flame grows and becomes the Blender lantern, which he lifts high | crane up | liftLantern | شجاعة |
| 41 | 112.58–115.26 | كخوف أم على ابنها فإذا | theatre: A mother shields her child against her | slow push | mother holds child | أم |
| 42 | 115.26–118.56 | ما مات عنها ما عاد ما تخشاه | theatre: The child rises as light; the mother's arms are empty (deliberately dim) | static | mother arms empty | تخشاه |
| 43 | 118.56–122.02 | شجاعة إجبارية جعلت | theatre: The mother stands tall and faces his giant shadow; her shadow grows bigger than his | low angle | stand tall, palm out | إجبارية |
| 44 | 122.02–125.74 | من نقمة الخوف نعمة مهداة | theatre: «نقمة» (red) turns into «نعمة» (gold): one letter changes; the shadow blooms into a girih rosette | static, flash on the swap | none | نقمة → نعمة |
| 45 | 125.74–128.82 | قف هاهنا في طريق صبيتنا | desert: A road in the desert, a file of boys walking; the Sultan steps into their path | wide | stopPalm | صبيتنا |
| 46 | 128.82–131.86 | والبس لهم زي قيصر أو شاه | desert: Costume change: Caesar's laurel and red cape on «قيصر», then the Blender crown on «شاه» | punch-ins | majesty | قيصر · شاه |
| 47 | 131.86–133.90 | كي يعرفوا الخوف ما حقيقته | desert: The boys look up at him (low angle from the boys) | low angle | majesty | حقيقته |
| 48 | 133.90–137.10 | الأولى وما شره وما جدواه | desert: Split: his left half dark red «شره», his right half gold «جدواه» | static split | neutral | شره · جدواه |
| 49 | 137.10–140.48 | وانظر مليا تدرك تغيرنا | desert: The Sultan peers closely at a youth who grows taller under his gaze | slow push | lookClose | تغيرنا |
| 50 | 140.48–143.14 | فربما تخدع الفتى عيناه | desert: The image doubles and swims (eyes deceive) | drift | youth face | عيناه |
| 51 | 143.14–145.86 | نحن مراياك إذ نشيب معا | mirrors: The biggest set: an arc of 11 tall Blender mirrors held by the people; the camera orbits; every mirror shows the old Sultan, each greyer than the last, and the holders grey together | orbit | neutral | مراياك |
| 52 | 145.86–148.62 | وقد يشيب الإنسان رغم صباه | mirrors: Close on a boy whose hair turns white across the line | static close | face | صباه |
| 53 | 148.62–150.74 | نحن مراياك هل ترى أحدا | mirrors: The mirrors turn one after another to face him | orbit | lookClose | أحداً |
| 54 | 150.74–154.28 | فيها سوى هوة بحجم فلاة | mirrors: Dive into a mirror: inside, an endless desert abyss under stars | push through the glass | none | فلاة |
| 55 | 154.28–157.34 | إنا وإياك هالكون معا | mirrors: He and the people walk into the desert together and dissolve into sand | wide pull-back | walk | معاً |
| 56 | 157.34–161.60 | يا خوف حدق في هذه المرآة | mirrors: Finale: the old Sultan faces the tall mirror; on «حدق» we push in over his shoulder until the glass holds his own old face, eye to eye; on «المرآة» the glass fills with lantern light and his shadow peels off the sand, stands up and walks into the light without him. Held to the end of the music | push in to face-to-face, then ease back | lookClose | المرآة |
| 57 | 161.60–167.40 | (music outro, then 1.0 s silent tail) | Title card over the dawn desert: an SVG pointed arch draws itself (anime.js); «الخوف» and «تميم البرغوثي» in Amiri 700, a small Latin credit | slow push | – | الخوف |

## Draft 2 changes (after critic 1: 5/10, one P0)

Every P0/P1 from `reference/khawf/critic_draft1.md` is fixed or written up here:
- **P0 type:** key words and the title are now **Amiri 700**. Aref Ruqaa's final qaf and several mark
  dots did not render in Chrome («حق» read «حه», the title read «الحوف»). Proofed all 65 key words in the
  HyperFrames Chrome. Amiri's lam+khah ligature reads «انخوف», so `O.shape` inserts a ZWJ after lam
  before jeem/hah/khah.
- **Exposure (deliberate exception to §11's 60–90):** the backlit parchment is the film's look, so
  theatre shots sit at **mean luma 130–170 with < 3 % of pixels above 245** (draft 1: 160–206 and
  10–21 %). The parchment is tone-mapped (centre ~215, edges ~140, fibres and stitched seams), the lamp
  hotspot is halved, and `main.js` caps lift at 0.1 and bloom at 0.18 whenever the theatre is on. On the
  screen, pale words become dark ink with a light rim and plates become a warm halo.
- **Age is monotonic:** 0 → 0.38 at 21.9 → 0.42 strut → 0.46 «يا شيخ» → 0.5 → 0.6 → 0.85–1 in stanzas 3–4.
  Stanza 2's portrait (34–51 s) is the remembered past and is tinted sepia-red throughout. Shot 46 is a
  costume (Caesar/Shah) that makes him look younger on purpose.
- **Motion:** knees bend forward only (profile figures). Draft 1 clamped like a frontal dancer, which
  gave backward knees and X-legs. The run is a gallop with the front leg always leading, and kneel is
  a real kneel. motion_check: 0 snaps.
- The reveal wipe is feathered (90 px), and type was moved off the moon, the hero and the frame edges.

