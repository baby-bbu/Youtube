"""Builds the sample voice and shot images for fixtures/timeline.sample.json.

The "voice" is a 180 Hz tone that is only on while a word is being spoken (louder on
emphasised words), so the character's mouth has something to follow. Shots 1-3 get a
flat colour card with the shot id; shot 4 has no image on purpose, to exercise the
title-card path. Standard library only; needs ffmpeg and fc-match.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = json.loads((ROOT / "fixtures" / "timeline.sample.json").read_text())
OUT = ROOT / "public" / "fixtures"
COLOURS = {1: "0x2B6CB0", 2: "0xDD6B20", 3: "0x2F855A"}


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def font_file():
    result = subprocess.run(
        ["fc-match", "-f", "%{file}", "Inter:bold"], capture_output=True, text=True
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def voice_expression():
    parts = []
    for shot in TIMELINE["shots"]:
        for w in shot["words"]:
            level = 0.9 if w["emphasis"] else 0.4
            parts.append(f"{level}*between(t,{w['start']},{w['end']})")
    return "+".join(parts) if parts else "0"


def make_voice():
    duration = TIMELINE["duration"]
    ffmpeg(
        "-f", "lavfi", "-i", f"sine=frequency=180:sample_rate=44100:duration={duration}",
        "-af", f"volume=eval=frame:volume='{voice_expression()}'",
        "-ac", "1", str(OUT / "voice.wav"),
    )


def make_image(n, colour, font):
    draw = f"drawtext=fontfile={font}:text='SHOT {n}':fontsize=220:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2"
    args = ["-f", "lavfi", "-i", f"color=c={colour}:s=1080x1920:d=1"]
    if font:
        args += ["-vf", draw]
    ffmpeg(*args, "-frames:v", "1", str(OUT / f"shot{n}.png"))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    make_voice()
    font = font_file()
    for n, colour in COLOURS.items():
        make_image(n, colour, font)


if __name__ == "__main__":
    main()
