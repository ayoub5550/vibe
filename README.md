# vibe: code-only music videos made by AI agents

Official-style music videos built **only from code** (Three.js + Canvas 2D, rendered frame by frame
with [HyperFrames](https://hyperframes.heygen.com)), synced to a song, and rendered locally to MP4.
The repo started as a remake of the "Ultracode" run from Devarf's experiment
[*I Had Opus 5.5 Make the Same Music Video at Every Effort*](https://youtu.be/3S4vuHxGh7c).

- **Agents: read [`AGENTS.md`](AGENTS.md) first.** It is the strict recipe (brief, definition of done,
  hard rules, pipeline, engine contract, pitfalls).
- Reference implementation: [`projects/mirror-mirror`](projects/mirror-mirror). Its shot list is in
  [`storyboard.md`](projects/mirror-mirror/storyboard.md).
- Second video: [`projects/khawf`](projects/khawf), «الخوف» (Fear), a poem by Tamim Al-Barghouti made as a
  shadow-play (خيال الظل) with a leather-puppet Sultan who ages, Blender props and Arabic kinetic type.
  The beat grid comes from the poem's metre (`tools/voice_pulse.py`). Shot list:
  [`storyboard.md`](projects/khawf/storyboard.md).
- Toolbox (three.js, Canvas 2D, SVG, anime.js, Blender + runner, FFmpeg, Python, Node, AI): see
  `AGENTS.md` §4b and the tested demo [`projects/_toolbox-demo`](projects/_toolbox-demo).
- Reference videos: [`reference/`](reference). That folder holds our render and a breakdown of the
  Ultracode video.

```bash
cd projects/mirror-mirror
# put the song excerpt at assets/song.wav first (AGENTS.md → Step 1; it is not committed)
hyperframes lint && hyperframes render --quality high --output out/mirror-mirror.mp4
bash ../../tools/check_render.sh out/mirror-mirror.mp4 <duration> assets/song.wav
```

**Credits:** song "Mirror Mirror" by Anno Domini Beats (YouTube Audio Library). The original
experiment and the Ultracode video are by Devarf (@VibeDevarf). Fonts: Big Shoulders Display,
Limelight and Josefin Sans (SIL OFL). «الخوف»: poem by Tamim Al-Barghouti, recited in AJ+ Saha's «مع تميم»
(the recording is not redistributed here). Fonts: Amiri (SIL OFL). Libraries: three.js (MIT), GSAP, anime.js (MIT), Blender (GPL, used as a tool; nothing of it is shipped).

---

**بالعربية:** هذا المستودع يصنع فيديوهات موسيقية رسمية الطابع بالكود فقط (موشن جرافيك ثلاثي/ثنائي الأبعاد) وتُرندَر محلياً.
على كل وكيل ذكاء اصطناعي أن يقرأ `AGENTS.md` كاملاً قبل أي عمل. فيه الوصفة الصارمة خطوة بخطوة، مع شروط القبول والأخطاء التي يجب تجنبها.
المرجعان هما فيديو Ultracode (مع تفكيك لقطاته) وفيديو Mirror Mirror الذي صُنع هنا.
الفيديو الثاني «الخوف» لتميم البرغوثي موجود في `projects/khawf`، وهو مسرح خيال ظل يشيخ فيه سلطان الخوف. شبكة الإيقاع فيه مأخوذة من بحر القصيدة لأن الموسيقى بلا إيقاع.


## Watch
- Full-quality render (Google Drive): https://drive.google.com/file/d/15uVnFPUiNHsTS45HzXr_gxqQuAkzo_ZM/view
- Publishing kit (YouTube title, description, tags): [reference/mirror-mirror/YOUTUBE.md](reference/mirror-mirror/YOUTUBE.md)
