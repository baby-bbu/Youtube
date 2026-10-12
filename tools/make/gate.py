"""Removes breaths, lip smacks and room noise between spoken words.

Usage: python3 tools/make/gate.py voice.wav voice_gated.wav

Speech has a pitch (voiced sound); a breath is just airy noise. So the recording is split
into 10 ms frames and every frame that has a clear pitch is kept, plus a short run-in before
it and a longer tail after it (so "s" and "f" sounds at the edges of words survive). All the
rest is muted with soft fades. It does not use the transcript's word times, because those
can be off by a few tenths of a second. Timing is unchanged (it only mutes).
"""
import sys
import wave

import numpy as np

HOP = 0.010          # seconds per frame
WINDOW = 0.040       # seconds analysed per frame
LEAD = 0.11          # seconds kept before voiced sound (word run-ins: the "s" in "step", "p", "t")
TAIL = 0.16          # seconds kept after voiced sound (word endings, "s", "th")
FADE = 0.02          # seconds to fade in and out
FLOOR = 0.02         # gain between words (not total silence)
VOICED = 0.45        # how pitch-like a frame must be (0..1) to count as speech
MIN_LEVEL = 0.03     # ignore frames quieter than this fraction of the average speech level
LOW_HZ, HIGH_HZ = 70, 400


def voiced_frames(mono, rate):
    hop, win = int(HOP * rate), int(WINDOW * rate)
    n = max(0, (len(mono) - win) // hop + 1)
    overall = np.sqrt((mono**2).mean()) + 1e-9
    lo, hi = int(rate / HIGH_HZ), int(rate / LOW_HZ)
    out = np.zeros(n, bool)
    for i in range(n):
        f = mono[i * hop : i * hop + win]
        f = f - f.mean()
        energy = float((f * f).sum())
        if np.sqrt(energy / win) < MIN_LEVEL * overall:
            continue
        spec = np.fft.rfft(f, 2 * win)
        ac = np.fft.irfft(spec * np.conj(spec))[: hi + 1]
        out[i] = ac[lo : hi + 1].max() / (ac[0] + 1e-9) > VOICED
    return out


def main(src, out):
    with wave.open(src) as w:
        rate, channels = w.getframerate(), w.getnchannels()
        audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32).reshape(-1, channels)
    mono = audio.mean(axis=1)
    voiced = voiced_frames(mono, rate)
    keep = np.zeros(len(voiced), bool)
    lead, tail = round(LEAD / HOP), round(TAIL / HOP)
    for i in np.flatnonzero(voiced):
        keep[max(0, i - lead) : i + tail + 1] = True
    gain = np.full(len(audio), FLOOR, np.float32)
    hop, win = int(HOP * rate), int(WINDOW * rate)
    for i in np.flatnonzero(keep):
        # a frame's centre decides it; frames overlap, so assign its middle hop
        mid = i * hop + (win - hop) // 2
        gain[mid : mid + hop] = 1.0
    fade = max(1, int(FADE * rate))
    gain = np.convolve(gain, np.ones(fade, np.float32) / fade, mode="same")
    pcm = np.clip(audio * gain[:, None], -32768, 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    print(f"gate: kept {float((gain > 0.5).mean()):.0%} of the audio (the rest was breaths and gaps) -> {out}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
