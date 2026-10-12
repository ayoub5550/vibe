#!/usr/bin/env python3
"""transcribe_words.py — word-level lyric timestamps for the song excerpt.

Primary (Viktor sandbox): ElevenLabs scribe via the Viktor SDK.
  cd /work && uv run python /work/repos/vibe/tools/transcribe_words.py assets/song.wav analysis/words.json
Fallback (no SDK): faster-whisper with word timestamps (CPU, ~real time):
  python tools/transcribe_words.py --whisper assets/song.wav analysis/words.json
Output: [{"text": "Mirror,", "timestamp": [0.06, 0.32]}, ...]
ALWAYS proof-read the words against the real lyrics and fix spelling; keep the timestamps.
"""
import asyncio, json, sys


async def scribe(src, out):
    sys.path.insert(0, "/work")
    from sdk.tools.utils_tools import speech_to_text
    r = await speech_to_text(file_path=src, diarize=False)
    if r.error:
        sys.exit(f"speech_to_text error: {r.error}")
    words = []
    for c in r.chunks:
        d = c.model_dump() if hasattr(c, "model_dump") else dict(c)
        if d.get("text", "").strip():
            words.append({"text": d["text"].strip(), "timestamp": d["timestamp"]})
    json.dump(words, open(out, "w"), indent=1)
    print(f"{len(words)} words -> {out}\n{r.text}")


def whisper(src, out):
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel("small", compute_type="int8").transcribe(src, word_timestamps=True, vad_filter=False)
    words = [{"text": w.word.strip(), "timestamp": [round(w.start, 3), round(w.end, 3)]} for s in segs for w in s.words]
    json.dump(words, open(out, "w"), indent=1)
    print(f"{len(words)} words -> {out}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        sys.exit(__doc__)
    if "--whisper" in sys.argv:
        whisper(*args)
    else:
        asyncio.run(scribe(*args))
