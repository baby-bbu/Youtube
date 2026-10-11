# Stickman Short-Form Video Pipeline: Design

Date: 2026-10-11

## 1. Goal

Turn a topic into a finished, engaging, faceless short-form video starring an
animated, talking stickman. The user supplies only their own voice-over
recording. Everything else is automated.

**Success criteria**
- Given a recorded voice-over and an approved shot list, one command produces
  `final.mp4` (1080x1920, 9:16) with no further manual steps.
- The stickman visibly talks in sync with the audio and gestures on emphasis.
- The video is motion-driven, not a slideshow: a visual change at least every
  3 seconds.
- Scripts follow a retention checklist (hook, pacing, structure, captions).
- Rendering is free and repeatable: no paid AI service is called after the
  script is written.

**Non-goals (YAGNI)**
- No text-to-speech: the user records the voice.
- No Higgsfield / AI image-video generation in v1 (possible later add-on for
  special shots).
- No horizontal 16:9 output in v1.
- No web UI, no auto-posting.
- No guarantee of reach; the retention rules improve odds only.

## 2. Pipeline

```
1. script   User gives a topic -> Claude (in chat) writes script.md + shots.json
2. record   USER records voice-over -> videos/<name>/voiceover.wav   [only manual step]
3. make     python make.py <name>
              |- transcribe : local Whisper -> words.json (word-level timestamps)
              |- align      : shots.json + words.json -> timeline.json
              |- lint       : retention-rule checks on timeline.json (warnings)
              '- render     : Remotion reads timeline.json + voiceover.wav -> out/final.mp4
```

`make.py` runs stages in order, stops at the first failure and names the
failing stage. Each stage can be run alone (`--only align`) and skipped when
its output is newer than its inputs.

## 3. Project layout

```
make.py                   orchestrator (Python)
tools/transcribe/         Whisper wrapper -> words.json
tools/align/              shots.json + words.json -> timeline.json
tools/lint/               retention-rule checks
remotion/                 Remotion project (Node/TypeScript)
  src/Stickman/           character, pose library, mouth/gesture logic
  src/Captions/           word-by-word captions
  src/Scene/              backgrounds, props, camera moves
videos/<name>/            per-video inputs and outputs
  script.md  shots.json  voiceover.wav  words.json  timeline.json  out/final.mp4
docs/superpowers/specs/   design docs
```

**Boundaries.** Python owns text and timing; Remotion owns pixels. The only
contract between them is `timeline.json` (+ the audio file). Either side can be
rewritten without touching the other. Each tool is a small unit that can be
tested on its own.

## 4. Data formats

### shots.json (written at script time)
```json
{
  "title": "...",
  "shots": [
    {
      "id": 1,
      "text": "You are wasting 3 hours a day and you do not even know it.",
      "role": "hook",
      "action": "point",
      "scene": "clock-bg",
      "camera": "zoom-in"
    }
  ]
}
```
- `text` is the exact narration for the shot and is what the align step searches
  for in the transcript.
- `role` is one of `hook | promise | beat | payoff | outro`.
- `action` is a name from the pose/action library; `scene` and `camera` are
  names from the scene and camera libraries.

### words.json (Whisper output)
Array of `{ "word": "...", "start": 0.00, "end": 0.31 }`.

### timeline.json (the contract)
```json
{
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "audio": "voiceover.wav",
  "duration": 42.7,
  "shots": [
    {
      "id": 1, "role": "hook",
      "start": 0.0, "end": 2.8,
      "action": "point", "scene": "clock-bg", "camera": "zoom-in",
      "words": [{ "word": "You", "start": 0.0, "end": 0.2, "emphasis": false }]
    }
  ]
}
```
It is plain JSON and may be hand-edited to fix a timestamp.

## 5. Align step

Matches each shot's `text` to a contiguous run of words in `words.json` using
normalized fuzzy matching (lowercase, strip punctuation), in order. The user may
ad-lib slightly, so exact match is not required. Shot start = first matched
word start; shot end = start of the next shot (last shot ends at audio end).
Words in a shot are copied into the timeline for captions and gestures.
`emphasis` is set from simple rules (word after a pause > 0.35s, numbers, and
words the script marks with `*asterisks*`).

## 6. Talking stickman (Remotion)

- **Mouth sync:** mouth openness is driven by audio loudness per frame (computed
  from the audio in Remotion), clamped and smoothed.
- **Idle life:** blinking, breathing, slight sway when not speaking.
- **Gestures:** emphasis words and pauses trigger arm/eyebrow/head motions; the
  shot's `action` (point, shrug, shocked, walk-in, etc.) layers on top.
- **Look:** a single vector (SVG) character, so it is identical in every shot.
- **Camera/scene:** each shot gets a camera move and a scene background so the
  frame is never static.
- **Captions:** large, centered, word-by-word highlight synced to word timings.

## 7. Engagement rules and lint

Rules the script must follow (applied when Claude writes `shots.json`):
- Hook in the first 1-3 seconds: bold claim, question, or "wait, what?".
- Structure: hook -> promise -> payoff delivered in beats -> outro that loops
  back to the hook or points to the next video.
- Target length 30-60 seconds; no filler.
- A visual change (cut, zoom, scene or action change) at least every 3 seconds.

Lint checks on `timeline.json`, reported as **warnings only**:
- hook shot longer than 3.0s
- any gap over 3.0s with no visual change
- total duration outside 20-75s
- first shot role is not `hook`

## 8. Error handling

- Missing input file: stop and name the file and the stage that needs it.
- Whisper failure or empty transcript: stop at `transcribe`.
- A shot whose text cannot be matched (below a similarity threshold): stop at
  `align`, listing the shot ids and best candidates. The user either re-records,
  edits `shots.json`, or hand-edits `timeline.json` and re-runs from `render`.
- Lint problems never block rendering.
- Render failure: surface the Remotion error output unchanged.

## 9. Testing

- `align`: unit tests on small fixture word lists (exact match, ad-libbed
  match, unmatched shot, out-of-order shots).
- `lint`: unit tests per rule.
- `transcribe`: one smoke test on a short fixture audio file.
- Remotion: render a few frames from a fixture `timeline.json` and check they
  produce output without error; visual check by eye for the character.
- End-to-end: fixture voice-over + fixture `shots.json` -> `final.mp4` exists,
  is 1080x1920, and its duration matches the audio.

## 10. Build order (small steps)

1. Remotion project: static stickman rendering a 1080x1920 clip.
2. Pose/action library and stickman animation (idle + gestures).
3. Mouth sync from audio loudness.
4. Captions synced to word timings.
5. `transcribe` (local Whisper), tested on a sample audio file.
6. `align`, tested on fixtures.
7. `lint`.
8. `make.py` orchestration and end-to-end test.
9. Script + shot-list writing workflow (prompt/checklist) in chat.

Each step ends with something runnable and is its own small commit.

## 11. Open assumptions

- Whisper runs acceptably on CPU with a small model (about 1-2 min for a
  1-minute clip).
- The user's niche is chosen per project and only affects script content, not
  the pipeline.
- Python 3 and Node are available in the environment (to be verified in step 1).
