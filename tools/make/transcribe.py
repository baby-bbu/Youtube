"""Turns a voice recording into words.json (word + start + end) with faster-whisper.

Usage: python3 tools/make/transcribe.py recording.m4a words.json [script_text_file]

The optional script text is given to the recogniser as a hint, so it prefers the words you were
supposed to say (names, "rundown", "um") over similar-sounding ones.
"""
import json
import subprocess
import sys
import tempfile
import wave

import numpy as np
from faster_whisper import WhisperModel


def main(src, out, prompt_file=None):
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ar", "16000", "-ac", "1", tmp.name], check=True)
        with wave.open(tmp.name) as w:
            audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    prompt = open(prompt_file).read().strip() if prompt_file else None
    segments, _ = WhisperModel("base.en", compute_type="int8").transcribe(audio, word_timestamps=True, initial_prompt=prompt)
    words = [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segments for w in s.words]
    if not words:
        raise SystemExit("transcribe: no speech found in the recording")
    json.dump(words, open(out, "w"), indent=1)
    print(f"transcribe: {len(words)} words -> {out}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
