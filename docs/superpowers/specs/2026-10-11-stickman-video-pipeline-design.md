# Stickman Short-Form Video Pipeline: Design

Date: 2026-10-11 (revised: quality upgrades folded in, automation kept high)

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
- Audio sounds clean and professional: noise removed, dead air trimmed, volume
  normalized, music ducked under the voice, sound effects on cuts.
- Scripts follow a retention checklist (hook, pacing, structure, captions).
- Rendering is free and repeatable: no paid AI service is called after the
  script is written.

**Non-goals (YAGNI) for v1**
- No text-to-speech: the user records the voice.
- No Higgsfield / AI image-video generation (possible later add-on).
- No horizontal 16:9 output.
- No web UI, no auto-posting.
- No guarantee of reach; the retention rules improve odds only.

## 2. Automation principle

The only per-video manual steps are (a) giving a topic and picking one of three
hook variants (default: variant 1 if you don't choose), and (b) recording the
voice-over. Everything after the recording is one command. One-time setup
(dropping music and sound-effect files into `assets/`) is done once, not per
video.

## 3. Pipeline

```
1. script   User gives a topic -> Claude (in chat) writes:
              script.md, shots.json (+ 3 hook variants), kit.md (title, caption, hashtags)
2. record   USER records voice-over -> videos/<name>/voiceover.wav   [only manual step per video]
3. make     python make.py <name>
              |- prep       : trim silences/breaths, denoise, loudness-normalize -> voice_clean.wav
              |- transcribe : local Whisper (forced alignment) -> words.json
              |- align      : shots.json + words.json -> timeline.json
              |- lint       : retention-rule checks on timeline.json (warnings)
              |- render     : Remotion -> out/final.mp4 (voice + ducked music + SFX)
              '- qa         : sampled frames + mechanical checks -> out/qa/ (report)
```

`make.py` runs stages in order, stops at the first failure and names the
failing stage. Each stage can be run alone (`--only align`) and is skipped when
its output is newer than its inputs. Because trimming changes timing, all
downstream stages use `voice_clean.wav`, never the raw recording.

## 4. Project layout

```
make.py                   orchestrator (Python)
tools/prep/               silence trim, denoise, loudnorm
tools/transcribe/         Whisper wrapper -> words.json
tools/align/              shots.json + words.json -> timeline.json
tools/lint/               retention-rule checks
tools/qa/                 frame sampling + mechanical checks
assets/
  music/                  royalty-free tracks + tracks.json (mood tags, licence notes)
  sfx/                    whoosh, pop, ding, etc. + sfx.json (cue names)
  fonts/                  caption fonts (Google Fonts, open licences)
  icons/                  OpenMoji / Lucide subset for shot props
remotion/                 Remotion project (Node/TypeScript)
  src/Stickman/           character, pose library, mouth/gesture logic
  src/Captions/           word-by-word captions
  src/Scene/              backgrounds, props, camera moves
  src/Audio/              music ducking, SFX placement
videos/<name>/            per-video inputs and outputs
  script.md  shots.json  kit.md  voiceover.wav  voice_clean.wav
  words.json  timeline.json  out/final.mp4  out/cover.png  out/qa/
docs/superpowers/specs/   design docs
```

**Boundaries.** Python owns text, audio prep and timing; Remotion owns pixels
and the final mix. The contract between them is `timeline.json` plus
`voice_clean.wav`. Either side can be rewritten without touching the other.
Each tool is a small unit that can be tested on its own.

## 5. Data formats

### shots.json (written at script time)
```json
{
  "title": "...",
  "music_mood": "tense",
  "hook_variants": ["...", "...", "..."],
  "shots": [
    {
      "id": 1,
      "text": "You are wasting 3 hours a day and you do not even know it.",
      "role": "hook",
      "action": "point",
      "scene": "clock-bg",
      "camera": "zoom-in",
      "props": ["clock"],
      "sfx": "whoosh"
    }
  ]
}
```
- `text` is the exact narration and is what the align step searches for.
- `role` is one of `hook | promise | beat | payoff | outro`.
- `action`, `scene`, `camera`, `props`, `sfx` are names from the matching
  libraries; unknown names fail the lint step early, not at render time.
- `music_mood` picks a track from `assets/music/tracks.json` (deterministic: first
  match, rotating by video name so consecutive videos differ).

### words.json
Array of `{ "word": "...", "start": 0.00, "end": 0.31 }`.

### timeline.json (the contract)
```json
{
  "fps": 30, "width": 1080, "height": 1920,
  "voice": "voice_clean.wav",
  "music": "assets/music/<track>.mp3",
  "duration": 42.7,
  "shots": [
    {
      "id": 1, "role": "hook", "start": 0.0, "end": 2.8,
      "action": "point", "scene": "clock-bg", "camera": "zoom-in",
      "props": ["clock"], "sfx": { "name": "whoosh", "at": 0.0 },
      "words": [{ "word": "You", "start": 0.0, "end": 0.2, "emphasis": false }]
    }
  ]
}
```
Plain JSON; may be hand-edited to fix a timestamp.

## 6. Audio prep

Runs before transcription so every later timestamp is correct.
- **Trim:** remove silences longer than ~0.35s down to a short natural gap, and
  clip obvious breaths, using ffmpeg `silenceremove` (Silero VAD as a fallback if
  results are rough). Thresholds are config values.
- **Denoise:** DeepFilterNet or RNNoise.
- **Normalize:** ffmpeg `loudnorm` to a consistent target loudness.
- Output: `voice_clean.wav`. The original is never modified.

## 7. Align step

Matches each shot's `text` to a contiguous run of words in `words.json` using
normalized fuzzy matching (lowercase, strip punctuation), in order. The user may
ad-lib slightly, so exact match is not required. Shot start = first matched
word start; shot end = start of the next shot (last shot ends at audio end).
Words in a shot are copied into the timeline for captions and gestures.
`emphasis` is set from simple rules (word after a pause > 0.35s, numbers, and
words the script marks with `*asterisks*`). Transcription uses forced alignment
(WhisperX or faster-whisper with word timestamps) for tight word timing.

## 8. Talking stickman and look (Remotion)

- **Mouth sync:** mouth openness driven by voice loudness per frame, clamped
  and smoothed.
- **Idle life:** blinking, breathing, slight sway when not speaking.
- **Gestures:** emphasis words and pauses trigger arm/eyebrow/head motions; the
  shot's `action` (point, shrug, shocked, walk-in, etc.) layers on top.
- **Character:** a single vector (SVG) character so it is identical in every
  shot, with a hand-drawn "sketchy" line style (rough.js) to look less sterile.
  The character interface is kept narrow so it can later be swapped for a Rive
  or Lottie rig without changing the timeline format.
- **Props and icons:** per-shot props from the local icon set (OpenMoji / Lucide)
  so shots have visual content without generating images.
- **Camera and scene:** every shot has a camera move and scene background; the
  frame is never static. Use Remotion's official packages (transitions, motion
  blur, noise, captions, audio visualization) rather than hand-rolling effects.
- **Captions:** large, centered, word-by-word highlight, bold high-contrast
  fonts, positioned inside the platform-UI safe zone (clear of the right-side
  buttons and bottom caption area).

## 9. Music and sound effects

- **Music:** one track per video from `assets/music/`, volume-ducked while the
  voice is speaking (driven by the word timings), faded in/out. Mood chosen via
  `music_mood`.
- **SFX:** whoosh/pop/ding placed at the `sfx` cue times in the timeline and on
  emphasis words, kept short and quiet relative to the voice.
- **Licensing:** only royalty-free / CC0 files go in `assets/`; each file's
  source and licence is recorded in `tracks.json` / `sfx.json`. The user is
  responsible for confirming licences when adding files.

## 10. Engagement rules and lint

Rules the script must follow (applied when Claude writes `shots.json`):
- Hook in the first 1-3 seconds: bold claim, question, or "wait, what?". Three
  hook variants are written; the user picks one (default: first).
- Structure: hook -> promise -> payoff delivered in beats -> outro that loops
  back to the hook or points to the next video.
- Target length 30-60 seconds; no filler.
- A visual change (cut, zoom, scene or action change) at least every 3 seconds.

Lint checks on `timeline.json`, reported as **warnings only** (except unknown
asset names, which are errors):
- hook shot longer than 3.0s
- any gap over 3.0s with no visual change
- total duration outside 20-75s
- first shot role is not `hook`
- unknown `action`, `scene`, `camera`, `props`, `sfx`, or music mood (error)

## 11. Visual QA

After rendering, `qa` samples frames (e.g. 1 per second) and runs mechanical
checks: stalled stretches (near-identical consecutive frames), caption text
outside the safe zone, character off-screen. It writes a short report and a
contact sheet to `out/qa/`. Claude can then look at the contact sheet on
request and suggest fixes. The mechanical checks run automatically; the visual
review by Claude is optional and done in chat.

## 12. Posting kit

At script time Claude also writes `kit.md` (title, caption, hashtags). `render`
exports `out/cover.png` from the hook frame. Nothing is posted automatically.

## 13. Error handling

- Missing input file: stop and name the file and the stage that needs it.
- `prep` produces unusably short or silent audio: stop and say so.
- Whisper failure or empty transcript: stop at `transcribe`.
- A shot whose text cannot be matched (below a similarity threshold): stop at
  `align`, listing the shot ids and best candidates. The user either re-records,
  edits `shots.json`, or hand-edits `timeline.json` and re-runs from `render`.
- Lint warnings never block rendering; unknown asset names do.
- Missing music/SFX files: render without them and warn, never crash.
- Render failure: surface the Remotion error output unchanged.

## 14. Testing

- `prep`: check on a fixture clip that silence is shortened and loudness lands
  in the target range.
- `align`: unit tests on small fixture word lists (exact match, ad-libbed
  match, unmatched shot, out-of-order shots).
- `lint`: unit tests per rule.
- `transcribe`: one smoke test on a short fixture audio file.
- `qa`: unit tests for the stall check on synthetic frames.
- Remotion: render a few frames from a fixture `timeline.json` and check they
  produce output without error; visual check by eye for the character.
- End-to-end: fixture voice-over + fixture `shots.json` -> `final.mp4` exists,
  is 1080x1920, and its duration matches the cleaned audio.

## 15. Build order (small steps)

1. Remotion project: static stickman rendering a 1080x1920 clip.
2. Pose/action library and stickman animation (idle + gestures).
3. Mouth sync from audio loudness.
4. Captions (styled, safe-zone placement) synced to word timings.
5. `prep` (trim, denoise, normalize), tested on a sample clip.
6. `transcribe` (local Whisper, forced alignment), tested on a sample.
7. `align`, tested on fixtures.
8. `lint`.
9. Props/icons, scene and camera libraries.
10. Music ducking and SFX placement.
11. `make.py` orchestration and end-to-end test.
12. `qa` stage and cover frame export.
13. Script, shot-list and `kit.md` writing workflow (checklist and hook variants).

Each step ends with something runnable and is its own small commit.

## 16. Backlog (not in v1)

- Rive/Lottie character rig with proper lip-sync mouth shapes.
- Free stock B-roll cutaways (Pexels / Pixabay video APIs).
- Higgsfield / AI clips for special shots.
- Batch / series mode with consistent branding.
- Performance feedback loop: paste in view/retention stats and tune the hook
  and pacing rules from real results.

## 17. Open assumptions

- Whisper runs acceptably on CPU with a small model (about 1-2 min for a
  1-minute clip).
- Remotion's current packages and agent guidance are checked at implementation
  time rather than assumed.
- The user's niche is chosen per project and only affects script content, not
  the pipeline.
- Python 3, Node and ffmpeg are available in the environment (to be verified in
  step 1).
