"""Checks that make_fixtures.py builds the sample voice and images."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "fixtures" / "make_fixtures.py"
OUT = ROOT / "public" / "fixtures"
TIMELINE = json.loads((ROOT / "fixtures" / "timeline.sample.json").read_text())


def run_script():
    subprocess.run([sys.executable, str(SCRIPT)], check=True, cwd=ROOT)


def probe(args, path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", *args, "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    )
    return out.stdout.strip()


class MakeFixturesTest(unittest.TestCase):
    def test_voice_matches_timeline_duration(self):
        run_script()
        voice = OUT / "voice.wav"
        self.assertTrue(voice.exists())
        duration = float(probe(["-show_entries", "format=duration"], voice))
        self.assertAlmostEqual(duration, TIMELINE["duration"], delta=0.05)

    def test_three_portrait_images(self):
        run_script()
        for n in (1, 2, 3):
            img = OUT / f"shot{n}.png"
            self.assertTrue(img.exists(), img)
            self.assertEqual(probe(["-show_entries", "stream=width,height"], img), "1080,1920")

    def test_shot_four_has_no_image_on_purpose(self):
        run_script()
        self.assertFalse((OUT / "shot4.png").exists())

    def test_running_twice_gives_the_same_files(self):
        run_script()
        first = {p.name: p.stat().st_size for p in OUT.iterdir()}
        run_script()
        second = {p.name: p.stat().st_size for p in OUT.iterdir()}
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
