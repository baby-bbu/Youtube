"""Matches each shot's text to the spoken words and writes timeline.json.

Usage: python3 tools/align/align.py shots.json words.json voice.wav out.json [voice_name_in_timeline]

Matching ignores case and punctuation and tolerates small ad-libs: the whole script is
lined up against the whole transcript in order, then each shot takes the time of the
words that matched inside it. A shot with no matched words is an error.
"""
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher

PAUSE = 0.35
ALLOWED = {"hook", "myth", "step", "payoff", "outro"}


def norm(word):
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def audio_seconds(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def align(shots, words, duration):
    script = []  # (shot index, token)
    for i, shot in enumerate(shots):
        for tok in shot["text"].split():
            if norm(tok):
                script.append((i, norm(tok)))
    spoken = [norm(w["word"]) for w in words]
    matcher = SequenceMatcher(None, [t for _, t in script], spoken, autojunk=False)
    hit = {}  # script position -> transcript position
    for a, b, size in matcher.get_matching_blocks():
        for k in range(size):
            hit[a + k] = b + k
    spans = {}  # shot index -> (first, last) transcript word index
    for pos, (i, _) in enumerate(script):
        if pos in hit:
            lo, hi = spans.get(i, (hit[pos], hit[pos]))
            spans[i] = (min(lo, hit[pos]), max(hi, hit[pos]))
    missing = [shots[i]["id"] for i in range(len(shots)) if i not in spans]
    if missing:
        raise SystemExit(f"align: could not find these shots in the recording: {missing}")
    ordered = sorted(spans)
    # Words between two shots (ad-libs) go on the far side of the longest pause.
    cuts = [0]
    for a, b in zip(ordered, ordered[1:]):
        last, first = spans[a][1], spans[b][0]
        gaps = [(words[k + 1]["start"] - words[k]["end"], k + 1) for k in range(last, first)]
        cuts.append(max(gaps)[1] if gaps else first)
    cuts.append(len(words))
    out = []
    for n, i in enumerate(ordered):
        shot = shots[i]
        run = words[cuts[n]:cuts[n + 1]]
        start = 0.0 if n == 0 else run[0]["start"]
        end = duration if n == len(ordered) - 1 else words[cuts[n + 1]]["start"]
        out_words = []
        prev_end = None
        for w in run:
            text = w["word"].strip()
            emph = bool(re.search(r"\d", text)) or (prev_end is not None and w["start"] - prev_end > PAUSE)
            out_words.append({"word": text, "start": round(w["start"], 2),
                              "end": round(w["end"], 2), "emphasis": emph})
            prev_end = w["end"]
        entry = {
            "id": shot["id"], "role": shot["role"], "start": round(start, 2), "end": round(end, 2),
            "character": shot["character"], "transition": shot["transition"],
            "camera": shot["camera"], "words": out_words,
        }
        if shot.get("label"):
            entry["label"] = shot["label"]
        if shot.get("scene"):
            entry["scene"] = shot["scene"]
        if shot.get("sfx"):
            entry["sfx"] = {"name": shot["sfx"], "at": round(start, 2)}
        out.append(entry)
    return out


def main(shots_path, words_path, voice, out_path, voice_name=None):
    shots = json.load(open(shots_path))["shots"]
    words = json.load(open(words_path))
    duration = audio_seconds(voice)
    timeline = {"fps": 30, "width": 1080, "height": 1920, "voice": voice_name or voice,
                "duration": round(duration, 2), "seed": 1234,
                "shots": align(shots, words, duration)}
    json.dump(timeline, open(out_path, "w"), indent=2)
    print(f"align: {len(timeline['shots'])} shots, {timeline['duration']}s -> {out_path}")


if __name__ == "__main__":
    main(*sys.argv[1:6])
