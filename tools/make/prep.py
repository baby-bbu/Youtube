"""Cleans a voice recording: rumble and noise removed, long pauses shortened, even volume.

Usage: python3 tools/make/prep.py recording.m4a voice_clean.wav
The original file is never modified. Run this BEFORE transcribing, because shortening
pauses changes every timestamp.
"""
import subprocess
import sys

# keep up to 0.3 s of any pause longer than 0.45 s; leave short natural pauses alone
FILTERS = ",".join([
    "highpass=f=80",
    "afftdn=nr=12:nf=-35",
    "silenceremove=stop_periods=-1:stop_duration=0.45:stop_threshold=-45dB:stop_silence=0.3",
    "acompressor=threshold=-21dB:ratio=3:attack=5:release=80",
    "loudnorm=I=-16:TP=-1.5:LRA=9",
])


def main(src, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", FILTERS,
                    "-ar", "48000", "-ac", "1", out], check=True)
    print(f"prep: {src} -> {out}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
