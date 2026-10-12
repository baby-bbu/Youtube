"""Cleans a voice recording: rumble and noise removed, long pauses shortened, even volume.

Usage: python3 tools/make/prep.py recording.m4a voice_clean.wav
The original file is never modified. Run this BEFORE transcribing, because shortening
pauses changes every timestamp.
"""
import subprocess
import sys

# Phone recordings are usually already quiet, so there is NO noise removal (it only adds a
# watery sound). Instead: remove rumble, thin out muddiness, add clarity and a little
# brightness, tame harsh s sounds, even out the volume, set loudness.
# Pauses longer than 0.45 s are shortened to 0.3 s; short natural pauses are left alone.
FILTERS = ",".join([
    "highpass=f=75",
    "equalizer=f=250:t=q:w=1:g=-2",
    "equalizer=f=3200:t=q:w=0.9:g=2.5",
    "equalizer=f=9000:t=h:w=0.7:g=2",
    "deesser=i=0.3:m=0.5:f=0.5",
    "silenceremove=stop_periods=-1:stop_duration=0.45:stop_threshold=-45dB:stop_silence=0.3",
    "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=1",
    "loudnorm=I=-16:TP=-1.5:LRA=9",
])


def main(src, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", FILTERS,
                    "-ar", "48000", "-ac", "1", out], check=True)
    print(f"prep: {src} -> {out}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
