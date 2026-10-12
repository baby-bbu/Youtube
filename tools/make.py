"""Makes a finished video from a recording: one command.

Usage: python3 tools/make.py <video-folder-name> [--preview]

Example: python3 tools/make.py stop-procrastinating

It expects videos/<name>/shots.json (the script cut into scenes) and your voice recording
(any .m4a, .mp3, .wav, .aac, .mp4 or .mov file) in the same folder. It then:
  1. cleans the voice (prep.py), 2. finds each word's time (transcribe.py),
  3. mutes breaths between words (gate.py), 4. lines the scenes up with your voice (align.py),
  5. draws the video (Remotion) and the thumbnail, if shots.json has a "thumbnail" entry.
Results go in videos/<name>/out/. --preview makes a smaller, quicker draft (same speed and
smoothness, just lower resolution).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = (".m4a", ".mp3", ".wav", ".aac", ".mp4", ".mov", ".ogg", ".flac")


def run(cmd, cwd=ROOT):
    print("  $", " ".join(str(c) for c in cmd))
    if subprocess.run([str(c) for c in cmd], cwd=cwd).returncode != 0:
        sys.exit(f"make: a step failed: {' '.join(str(c) for c in cmd[:3])}")


def step(n, text):
    print(f"\n[{n}/5] {text}")


def main(name, preview):
    folder = ROOT / "videos" / name
    shots = folder / "shots.json"
    if not shots.exists():
        sys.exit(f"make: {shots} not found. Write the script and its scenes first.")
    recordings = sorted(p for p in folder.iterdir() if p.suffix.lower() in AUDIO)
    if not recordings:
        sys.exit(f"make: no voice recording found in {folder}. Record the script and drop the file there.")
    recording = recordings[0]
    if len(recordings) > 1:
        print(f"make: several recordings found, using {recording.name}")

    work = folder / "work"
    out = folder / "out"
    work.mkdir(exist_ok=True)
    out.mkdir(exist_ok=True)
    public = ROOT / "remotion" / "public" / "work"
    public.mkdir(parents=True, exist_ok=True)
    voice_name = f"work/{name}.wav"
    voice = ROOT / "remotion" / "public" / voice_name
    py = sys.executable

    step(1, "Cleaning your voice")
    run([py, "tools/make/prep.py", recording, work / "voice_prep.wav"])
    step(2, "Listening for each word")
    prompt = work / "script.txt"
    prompt.write_text(" ".join(s["text"] for s in json.load(open(shots))["shots"]))
    run([py, "tools/make/transcribe.py", work / "voice_prep.wav", work / "words.json", prompt])
    step(3, "Removing breaths between words")
    run([py, "tools/make/gate.py", work / "voice_prep.wav", voice])
    step(4, "Lining the scenes up with your voice")
    timeline = work / "timeline.json"
    run([py, "tools/align/align.py", shots, work / "words.json", voice, timeline, voice_name])

    step(5, "Drawing the video")
    target = out / ("preview.mp4" if preview else "full.mp4")
    cmd = ["npx", "remotion", "render", "src/index.ts", "Short", target, f"--props={timeline}", "--audio-bitrate=320k"]
    if preview:
        cmd.append("--scale=0.5")
    run(cmd, cwd=ROOT / "remotion")
    thumb = json.load(open(shots)).get("thumbnail")
    if thumb:
        props = work / "thumbnail.json"
        props.write_text(json.dumps(thumb))
        run(["npx", "remotion", "still", "src/index.ts", "Thumbnail", folder / "thumbnail.png", f"--props={props}"],
            cwd=ROOT / "remotion")
    print(f"\nDone: {target}" + (f" and {folder / 'thumbnail.png'}" if thumb else ""))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    main(args[0], "--preview" in sys.argv)
