# Rundown Guy: Short-Form Video Pipeline: Design

Date: 2026-10-11 (revised: new niche, brand and animation direction)

## 1. Goal

Turn a topic into a finished, fast-paced short-form how-to video (vertical 9:16)
starring the **Rundown Guy**, an animated, talking stickman. The user supplies only
their own voice-over. Everything else is automated.

Channel: **Rundown Guy** (@rundownguy). Niche: quick how-to guides ("the quick
rundown on anything"). Brand details are in `brand/brand.md`.

**Success criteria**
- Given a recorded voice-over and an approved shot list, one command produces
  `final.mp4` (1080x1920) with no further manual steps.
- The character talks in sync with the audio, turns his face side to side, bobs and
  moves around the frame, and gestures on emphasis.
- The video is fast and motion-driven, not a slideshow: a new visual beat at least
  every 0.5s and a shot change at least every 3s.
- Each shot shows a relevant image (free-licensed or generated), with word-by-word
  captions and big outlined labels.
- Audio is clean: noise removed, dead air trimmed, volume normalised, music ducked
  under the voice, sound effects on cuts.
- Rendering is free and repeatable once images and the script exist.

**Non-goals (v1)**
- No text-to-speech (the user records the voice).
- No AI video clips (AI is used for still images only, as a fallback).
- No horizontal 16:9 output; no web UI; no auto-posting.
- No guarantee of reach; the retention rules only improve the odds.

## 2. Automation principle

Per video the user: (a) gives a topic and picks one of three hook variants (default:
the first), and (b) records the voice-over. After that, one command does the rest.
One-time setup (API keys, music and SFX files) is done once, not per video.

## 3. Pipeline

```
1. script   User gives a topic -> Claude (in chat) writes:
              script.md, shots.json (+ 3 hook variants), kit.md (title, caption, hashtags)
2. record   USER records voice-over -> videos/<name>/voiceover.wav   [only manual step per video]
3. make     python make.py <name>
              |- prep       : trim silences/breaths, denoise, loudness-normalise -> voice_clean.wav
              |- transcribe : local Whisper (word timestamps) -> words.json
              |- align      : shots.json + words.json -> timeline.json
              |- assets     : find/generate an image per shot, remove background -> assets log
              |- lint       : retention-rule and name checks (warnings; unknown names are errors)
              |- render     : Remotion -> out/final.mp4 (voice + ducked music + SFX)
              '- qa         : sampled frames + mechanical checks -> out/qa/ report
```

`make.py` runs stages in order, stops at the first failure and names the failing
stage. Each stage can be run alone (`--only align`) and is skipped when its output is
newer than its inputs. Trimming changes timing, so all later stages use
`voice_clean.wav`, never the raw recording.

## 4. Project layout

```
make.py                   orchestrator (Python)
tools/prep/               silence trim, denoise, loudnorm
tools/transcribe/         Whisper wrapper -> words.json
tools/align/              shots.json + words.json -> timeline.json
tools/assets/             image search, licence check, generation fallback, cutouts
tools/lint/               rule checks
tools/qa/                 frame sampling + mechanical checks
brand/                    brand sheet, profile picture, banner, character artwork
assets/
  music/ sfx/ fonts/      royalty-free audio and open-licence fonts + manifests
  cache/                  downloaded or generated images, keyed by query hash
  log.json                source, licence, URL and attribution for every image used
remotion/                 Remotion project (Node/TypeScript)
  src/Guy/                character rig, face-turn, mouth shapes, gestures
  src/Captions/           word-by-word captions and big outlined labels
  src/Scene/              photo backgrounds, camera moves, slide transitions, props
  src/Audio/              music ducking, SFX placement
videos/<name>/            per-video inputs and outputs
  script.md shots.json kit.md voiceover.wav voice_clean.wav
  words.json timeline.json out/final.mp4 out/cover.png out/qa/
docs/superpowers/specs/   design docs
```

**Boundaries.** Python owns text, audio prep, timing and image sourcing; Remotion owns
pixels and the final mix. The contract between them is `timeline.json` plus
`voice_clean.wav` and the cached image files. Either side can be rewritten without
touching the other. Each tool is a small unit testable on its own.

## 5. Data formats

### shots.json (written at script time)
```json
{
  "title": "...",
  "music_mood": "upbeat",
  "hook_variants": ["...", "...", "..."],
  "shots": [
    {
      "id": 1,
      "text": "Learning to cook is not as hard as you think.",
      "role": "hook",
      "label": "COOKING",
      "image": { "query": "home kitchen cooking", "prompt": "a busy home kitchen, photo style", "cutout": false },
      "character": { "position": "left", "action": "point" },
      "transition": "slide-left",
      "camera": "zoom-in",
      "sfx": "whoosh"
    }
  ]
}
```
- `text` is the exact narration for the shot and is what the align step searches for.
- `role` is one of `hook | myth | step | payoff | outro`.
- `label` is an optional single big outlined word shown on screen.
- `image.query` is used for free-source search; `image.prompt` is used only if
  generation is needed; `cutout` removes the background for floating objects.
- `character.position` is `left | centre | right`; `action` is a named gesture.
- `transition`, `camera`, `sfx`, and `music_mood` are names from fixed libraries;
  unknown names fail lint early.

### words.json
Array of `{ "word": "...", "start": 0.00, "end": 0.31 }`.

### timeline.json (the contract)
```json
{
  "fps": 30, "width": 1080, "height": 1920,
  "voice": "voice_clean.wav",
  "music": "assets/music/<track>.mp3",
  "duration": 42.7,
  "seed": 1234,
  "shots": [
    {
      "id": 1, "role": "hook", "start": 0.0, "end": 2.8,
      "label": "COOKING", "image": "assets/cache/<hash>.jpg",
      "character": { "position": "left", "action": "point" },
      "transition": "slide-left", "camera": "zoom-in",
      "sfx": { "name": "whoosh", "at": 0.0 },
      "words": [{ "word": "Learning", "start": 0.0, "end": 0.4, "emphasis": false }]
    }
  ]
}
```
Plain JSON; it may be hand-edited to fix a timestamp. `seed` makes the procedural
character motion deterministic, so a re-render is identical.

## 6. Audio prep

Runs before transcription so every later timestamp is correct.
- **Trim:** shorten silences longer than ~0.35s and clip obvious breaths (ffmpeg
  `silenceremove`, Silero VAD as fallback). Thresholds are config values.
- **Denoise:** DeepFilterNet or RNNoise.
- **Normalise:** ffmpeg `loudnorm` to a consistent target loudness.
- Output `voice_clean.wav`. The original is never modified.

## 7. Align step

Matches each shot's `text` to a contiguous run of words in `words.json` using
normalised fuzzy matching (lowercase, strip punctuation), in order, so ad-libbing is
tolerated. Shot start = first matched word start; shot end = start of the next shot
(last shot ends at audio end). Words are copied into the timeline for captions and
gestures. `emphasis` is set by simple rules (word after a pause > 0.35s, numbers, words
the script marks with `*asterisks*`). Transcription uses word-level timestamps
(WhisperX or faster-whisper with forced alignment) for tight timing.

## 8. Assets step (images)

For each shot, in order, until one succeeds:
1. **Cache:** reuse an image already fetched for the same query.
2. **Free-licensed sources:** Wikimedia Commons (public-domain, CC0, CC-BY, CC-BY-SA),
   then Pexels/Pixabay (free API keys supplied once by the user). Only licences that
   allow reuse are accepted.
3. **Generation fallback:** the user's Higgsfield account via its CLI, using
   `image.prompt`. (Its exact CLI/API access is an assumption to verify when this
   step is built; if unavailable, step 4 applies.)
4. **Placeholder:** a plain title card plus a warning in the QA report. The pipeline
   never fails because an image is missing.

If `cutout` is true, the background is removed locally (rembg or similar, free).

Every image used is written to `assets/log.json` with source, licence, URL and
attribution; required attributions are appended to `kit.md` automatically. Celebrity
photos and other people's copyrighted characters are not used. This is a design
constraint, not legal advice.

## 9. The Rundown Guy (Remotion rig)

Artwork: `brand/character/rundown-guy.svg`, split into named parts (`body`, `head`,
`face`, `mouth`, `cap`). Look: big white head, backwards black trucker cap, shades on,
thick short black body, no feet.

**Procedural motion** (seeded from `timeline.seed`, driven by word timings, emphasis and
audio loudness):
- **Face turn:** the shades and mouth slide left or right inside the head together
  (about +-28px) while the head tilts (about +-10 degrees). The cap stays on the
  head. This fakes a 3D head turn and means the mouth does not always sit on the same
  side.
- **Mouth shapes** swapped per word: closed, small, oh, teeth, big, wide. White
  interior, black outline.
- **Head and body bob** on stressed words, plus idle sway and blinks of the face.
- **Gestures** from `character.action` (point, shrug, bounce, wave): short thick
  limbs, stepped between poses for a snappy, limited-animation feel.
- **Movement** around the frame per `character.position` and across shots.
- **Props** layered on the character (hats, glasses, costume pieces) are cutout
  images from the assets step, used sparingly.
- On dark or busy backgrounds the character gets a white sticker outline.

## 10. Look and editing

- **Backgrounds:** a real or generated image per shot, with a slow zoom or pan.
- **Transitions:** horizontal slide between shots (default), with a few other named
  types (cut, zoom, whip).
- **Captions:** one to three words at a time in the lower third, rounded bold white
  with a thick black outline, pop-in scale on each word. Font to be chosen (rounded,
  open licence) and recorded in `brand/brand.md`.
- **Labels:** an optional single big outlined word in the middle of the frame for key
  beats.
- **Music and SFX:** one track per video, ducked while the voice speaks; short SFX at
  `sfx` cues and on emphasis words. Only royalty-free or CC0 files, with each file's
  source and licence recorded in its manifest.
- **Safe zones:** captions and labels stay clear of the platform UI (right-side
  buttons and bottom description area).

## 11. Content rules and lint

Script rules (applied when Claude writes `shots.json`):
- **Hook in the first 1-3 seconds**, in the channel's own format. Do NOT reuse another
  channel's title format. Three hook variants are written and the user picks one.
- **Structure:** hook -> why it feels hard (myth) -> 2-3 simple steps -> payoff that
  loops back to the hook.
- **Length:** 30-60 seconds, no filler.
- **Pacing:** a new visual beat at least every 0.5s and a shot change at least every
  3s.
- **Accuracy:** every factual or advice claim needs a source or an evident basis. No
  income, health or medical guarantees; keep medical, legal and financial topics
  cautious.

Lint (warnings only, except unknown names):
- hook shot longer than 3.0s
- any gap over 3.0s with no shot change
- total duration outside 20-75s
- first shot role is not `hook`
- unknown `character.action`, `transition`, `camera`, `sfx`, or music mood (error)

## 12. Visual QA

After rendering, `qa` samples frames (about 1 per second) and runs mechanical checks:
stalled stretches (near-identical consecutive frames), captions outside the safe zone,
character off-screen, placeholder images used. It writes a report and a contact sheet
to `out/qa/`. Claude can review the contact sheet on request.

## 13. Posting kit

At script time Claude writes `kit.md` (title, caption, hashtags). `render` exports
`out/cover.png` from the hook frame. Required image attributions are appended
automatically. Nothing is posted automatically.

## 14. Error handling

- Missing input file: stop and name the file and the stage that needs it.
- `prep` yields unusably short or silent audio: stop.
- Whisper failure or empty transcript: stop at `transcribe`.
- A shot whose text cannot be matched: stop at `align`, listing shot ids and best
  candidates. The user re-records, edits `shots.json`, or hand-edits `timeline.json`
  and re-runs from `assets` or `render`.
- No image found and generation unavailable: placeholder plus a warning, never a crash.
- Missing music/SFX files: render without them and warn.
- Lint warnings never block rendering; unknown names do.
- Render failure: show the Remotion error output unchanged.

## 15. Testing

- `prep`: fixture clip; silence shortened, loudness in target range.
- `align`: fixtures for exact match, ad-libbed match, unmatched shot, out-of-order shots.
- `lint`: one test per rule.
- `assets`: mocked source responses for cache hit, free-source hit, licence rejection,
  fallback, and placeholder; the log is written correctly in each case.
- `transcribe`: one smoke test on a short fixture audio file.
- `qa`: stall check on synthetic frames.
- Remotion: render a few frames from a fixture `timeline.json`; visual check of the
  character by eye; same seed gives identical frames.
- End to end: fixture voice-over and `shots.json` produce `final.mp4` that is 1080x1920
  with a duration matching the cleaned audio.

## 16. Build order (small steps)

1. Remotion project and static character rig from the SVG parts.
2. Face-turn, mouth shapes, bob and idle motion, with mouth driven by audio loudness.
3. Captions (rounded outlined font) and big labels.
4. Photo backgrounds, camera moves and slide transitions.
5. Gestures, character positioning and props.
6. `prep` (trim, denoise, normalise).
7. `transcribe` (local Whisper, word timestamps).
8. `align`.
9. `assets`: free sources, licence log, cutouts, placeholders.
10. `assets`: generation fallback (verify Higgsfield CLI access first).
11. `lint`.
12. Music ducking and SFX.
13. `make.py` orchestration and end-to-end test.
14. `qa` and cover export.
15. Script, shot-list and `kit.md` workflow (checklist, hook variants).

Each step ends with something runnable and is its own small commit.

## 17. Backlog (not in v1)

- Rive/Lottie rig for richer expressions; eye-shape changes (shades are fixed for now).
- Higgsfield image-to-video clips for special shots.
- Batch / series mode.
- Performance feedback loop: paste in retention stats and tune the rules.

## 18. Open items and assumptions

- **Caption font** not chosen yet (rounded, open licence).
- **Title/hook format** for the channel is not decided; it must differ from other
  channels'. Proposed: "the rundown on {topic}"; to be confirmed.
- **Tagline** is placeholder copy.
- **Handles:** @rundownguy looked free on YouTube only; confirm and claim on TikTok,
  Instagram and Shorts before posting.
- **Higgsfield access** (CLI/API, credits) is unverified.
- **Pexels/Pixabay keys** are needed for the free-source step.
- Whisper on CPU is assumed fast enough (about 1-2 min for a 1-minute clip).
- Remotion's current packages and guidance are checked at build time, not assumed.
- Python 3, Node and ffmpeg are assumed available (verified in step 1).

## Appendix A: Motion notes from the reference clip

Observed in a user-provided short from another channel (used only to understand
techniques; its character and branding are NOT copied):
- The head swings, tilts and slides around the frame; between poses the eyes and mouth
  slide across the face, sometimes past the edge of the head.
- The mouth is a thin-outline white wedge that changes shape (big open, small, closed
  with end ticks, teeth) and moves left, centre or right.
- The body is a short, thick black blob with stubby limbs, no outline, no feet, sitting
  low behind the captions.
- Real-photo props (cap, glasses, costume pieces) are layered on the character.
- Captions: one to three words at a time in the lower third, rounded, bold, white with
  a thick black outline, a new word every 0.3-0.5s.
- Backgrounds are real photos with a slight zoom; shots change with a horizontal slide.
- Pace: a new head pose or bounce about every third of a second.
