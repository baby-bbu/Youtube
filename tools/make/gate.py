"""Silences everything between spoken words (breaths, lip smacks, room noise).

Usage: python3 tools/make/gate.py voice.wav words.json voice_gated.wav
Each word keeps a small cushion either side, anything loud enough to be speech is also kept
(word times from the transcript can be a little early or late), and the edges are faded so
it does not sound chopped. Timing is unchanged (it only mutes).
"""
import json
import sys
import wave

import numpy as np

BEFORE = 0.05   # seconds kept before a word starts
AFTER = 0.09    # seconds kept after a word ends (tails of words)
FADE = 0.03     # seconds to fade in and out
FLOOR = 0.0     # gain between words
LOUD = 0.25     # anything above this fraction of the average speech level is kept as speech
HOLD = 0.06     # seconds kept around loud bits


def main(src, words_path, out):
    with wave.open(src) as w:
        rate, channels, frames = w.getframerate(), w.getnchannels(), w.getnframes()
        audio = np.frombuffer(w.readframes(frames), np.int16).astype(np.float32)
    audio = audio.reshape(-1, channels)
    gain = np.full(len(audio), FLOOR, np.float32)
    for word in json.load(open(words_path)):
        a = max(0, int((word["start"] - BEFORE) * rate))
        b = min(len(audio), int((word["end"] + AFTER) * rate))
        gain[a:b] = 1.0
    mono = audio.mean(axis=1)
    win = max(1, int(0.02 * rate))
    n = len(mono) // win
    rms = np.sqrt((mono[: n * win].reshape(n, win) ** 2).mean(axis=1))
    loud = rms > LOUD * np.sqrt((mono**2).mean())
    hold = max(1, int(HOLD / 0.02))
    loud = np.convolve(loud.astype(float), np.ones(2 * hold + 1), mode="same") > 0
    for i in np.flatnonzero(loud):
        gain[i * win : (i + 1) * win] = 1.0
    fade = max(1, int(FADE * rate))
    gain = np.convolve(gain, np.ones(fade, np.float32) / fade, mode="same")  # soft edges
    pcm = np.clip(audio * gain[:, None], -32768, 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    kept = float((gain > 0.5).mean())
    print(f"gate: kept {kept:.0%} of the audio (the rest was breaths and gaps) -> {out}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
