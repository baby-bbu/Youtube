"""Finds a free-licensed background picture for every shot and adds it to timeline.json.

Usage: python3 tools/make/images.py shots.json timeline.json video_dir public_dir

For each shot, in order: your own file in <video_dir>/images/<id>.(png|jpg) always wins;
otherwise a search of the CC0 stock-photo collections on Openverse (no key needed) using
the shot's image.query (write plain literal words: "sandwich", "group friends"). A shot
with no picture found is left without one and the video maker shows a title card. Every picture used is logged to
<video_dir>/images/log.json, and required credits are written to <video_dir>/credits.md.
"""
import json
import shutil
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.openverse.org/v1/images/"
UA = {"User-Agent": "rundown-guy-video-tool/0.1"}
LICENCES = "cc0,pdm,by"
MIN_WIDTH = 640


def get(url, retries=3):
    for n in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except Exception as e:
            if n == retries - 1:
                raise
            time.sleep(3 * (n + 1))


STOCK = "stocksnap,nappy"  # proper stock-photo collections (all CC0), tried first


def search(query, stock=True):
    params = {"q": query, "license": LICENCES, "mature": "false", "page_size": 20}
    if stock:
        params["source"] = STOCK
    else:
        params.update({"category": "photograph", "aspect_ratio": "tall"})
    results = json.loads(get(f"{API}?{urllib.parse.urlencode(params)}")).get("results", [])
    ok = [r for r in results if (r.get("width") or 0) >= MIN_WIDTH and r.get("url")]
    # keep the search engine's own best-match order
    return ok


def main(shots_path, timeline_path, video_dir, public_dir):
    shots = {s["id"]: s for s in json.load(open(shots_path))["shots"]}
    timeline = json.load(open(timeline_path))
    video_dir, public_dir = Path(video_dir), Path(public_dir)
    own = video_dir / "images"
    out = public_dir / "work"
    out.mkdir(parents=True, exist_ok=True)
    log, credits, used = [], [], set()
    for shot in timeline["shots"]:
        sid = shot["id"]
        mine = next((p for ext in ("png", "jpg", "jpeg") if (p := own / f"{sid}.{ext}").exists()), None)
        if mine:
            dest = out / f"shot{sid}{mine.suffix}"
            shutil.copy(mine, dest)
            shot["image"] = f"work/{dest.name}"
            log.append({"shot": sid, "source": "own file", "file": str(mine)})
            continue
        img = shots[sid].get("image", {})
        query = img.get("query")
        if not query:
            continue
        # stock photos only (a loose search returns unrelated pictures); then the icon's name
        attempts = [(query, True)]
        if img.get("icon"):
            attempts.append((img["icon"].replace("-", " "), True))
        try:
            candidates = []
            for q, stock in attempts:
                candidates = [r for r in search(q, stock) if r["url"] not in used]
                if candidates:
                    break
                time.sleep(3.2)
            for r in candidates:
                try:
                    data = get(r["url"])
                except Exception:
                    continue
                used.add(r["url"])
                dest = out / f"shot{sid}.jpg"
                dest.write_bytes(data)
                shot["image"] = f"work/{dest.name}"
                log.append({"shot": sid, "query": query, "title": r.get("title"),
                            "creator": r.get("creator"), "licence": r["license"].upper(),
                            "licence_url": r.get("license_url"), "page": r.get("foreign_landing_url"),
                            "file": r["url"]})
                if r["license"] == "by":
                    credits.append(f'"{r.get("title")}" by {r.get("creator")}, '
                                   f'{r["license"].upper()} ({r.get("license_url")}), {r.get("foreign_landing_url")}')
                break
            else:
                print(f"images: shot {sid}: nothing usable for '{query}' (title card will be used)")
        except Exception as e:
            print(f"images: shot {sid}: search failed ({e}); title card will be used")
        time.sleep(3.2)  # stay under the free 20-requests-a-minute limit
    json.dump(timeline, open(timeline_path, "w"), indent=2)
    own.mkdir(exist_ok=True)
    json.dump(log, open(own / "log.json", "w"), indent=2)
    (video_dir / "credits.md").unlink(missing_ok=True)
    if credits:
        (video_dir / "credits.md").write_text("## Image credits (required by the CC-BY licence)\n\n"
                                              + "\n".join(f"- {c}" for c in credits) + "\n")
    print(f"images: {sum(1 for s in timeline['shots'] if s.get('image'))}/{len(timeline['shots'])} shots have a picture")


if __name__ == "__main__":
    main(*sys.argv[1:5])
