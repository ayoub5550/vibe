# «الخوف» (Al-Khawf): publishing kit

- **YouTube:** not uploaded yet. Four API upload attempts on 2026-10-13 got **429 "Video Uploads per day"**:
  the daily quota of the shared Composio Google project was used up. The quota resets at 07:00 UTC, and a retry is scheduled.
  Upload as **unlisted** first. The AJ+ Saha source (https://youtu.be/Ch7GGoqZ6bM) is Content-ID registered
  (`licensedContent: true`), so a claim on the audio is likely. Check YouTube Studio, then switch to public.
- **Upload file:** 2-pass x264 12 Mbps (`-maxrate 18M -bufsize 24M -g 15 -bf 2`), AAC 320k, faststart, made
  from the high-quality render: 257 MB, `check_render` PASS (0.9871 at 20 ms).
- **Thumbnail:** [thumbnail.jpg](thumbnail.jpg) (1280×720). Rebuild with `bash projects/khawf/tools/thumbnail.sh`. It is frame 54.8 s (the beast chasing the youth)
  with «الخوف» and «تميم البرغوثي» in Amiri 700. Lam+khah gets a ZWJ, as in `O.shape`.
- **Arabic captions:** [khawf_ar.srt](khawf_ar.srt). It has 56 hemistichs from `analysis/song.json`
  (start = first word − 0.1 s) plus the title card. Rebuild with
  `python3 projects/khawf/tools/make_srt.py > reference/khawf/khawf_ar.srt` (byte-identical).

## Title
تميم البرغوثي | الخوف — فيلم خيال ظل متحرك مصنوع بالكود

## Category / privacy
Film & Animation (categoryId 1) · unlisted first, then public

## Description
```
«الخوف» للشاعر تميم البرغوثي، في فيلم خيال ظل متحرك مصنوع بالكامل بالكود.

الخوف هنا سلطان من جلد، بتاج وسوطين، يشيخ أمامنا بيتاً بعد بيت. المرآة تكشف شيبه، والصبية يشمتون، ووحش الحلم يطارد ثم يختفي حين نقف له. بعدها نرحم الشيخ المتعب، ويقوم قوس من المرايا يشيب معه، حتى ينفصل ظله عنه في النهاية ويمشي وحده إلى الضوء.

بلا صور ذكاء اصطناعي ولا لقطات جاهزة ولا نماذج ثلاثية الأبعاد جاهزة: كل بكسل مرسوم بالكود. المسرح والكاميرا بـ Three.js، والعرائس الجلدية بـ Canvas 2D، والزخارف بـ SVG وanime.js، والتاج والساعة الرملية والفانوس والمرآة مجسمات Blender مبنية بسكربتات Python. التصيير إطاراً بإطار بـ HyperFrames، والقطعات على تفعيلات بحر المنسرح.

🎙 القصيدة والإلقاء: تميم البرغوثي، «مع تميم: الخوف» على قناة AJ+ ساحة
https://youtu.be/Ch7GGoqZ6bM
💻 الكود الكامل: https://github.com/ayoub5550/vibe

⏱ الفصول
00:00 يا خوف حدق في هذه المرآة
00:31 ذاك المهيب الذي تعودناه
00:53 كالوحش في الحلم
01:25 يا شيخ لا بأس
02:05 قف هاهنا في طريق صبيتنا
02:23 نحن مراياك

Al-Khawf (Fear) by Tamim Al-Barghouti, a shadow-play motion graphics film made 100% from code (Three.js, Canvas 2D, SVG/anime.js, procedural Blender props, rendered with HyperFrames). Poem and recitation: Tamim Al-Barghouti via AJ+ Saha. All rights to the poem and the recording belong to their owners.

#تميم_البرغوثي #شعر #موشن_جرافيك #خيال_الظل #motiongraphics #creativecoding
```

## Tags
["تميم البرغوثي", "الخوف", "قصيدة الخوف", "تميم البرغوثي الخوف", "مع تميم", "شعر", "شعر عربي", "خيال الظل", "موشن جرافيك", "رسوم متحركة", "Tamim Al-Barghouti", "Al-Khawf", "motion graphics", "shadow play", "creative coding", "three.js", "Blender", "HyperFrames", "code animation"]
