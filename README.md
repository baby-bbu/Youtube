# Rundown Guy

A YouTube Shorts / TikTok channel where a cartoon stickman, **Rundown Guy**, gives
quick how-to rundowns, using **your voice**. This repo holds the brand and the tool
that makes the videos.

> "the quick rundown on anything."

## Making one video

1. **Pick a topic.** Tell Claude, and it writes the script for you.
2. **Record yourself reading it** on your phone and put the file in the video's folder.
3. **Run one command.** The finished video comes out ready to upload.

Tip: run it in "preview" mode first. It makes a fast rough version so you can check
it before the full one.

## What the computer does for you

- Cleans your voice and cuts the quiet gaps.
- Works out when you say each word.
- Animates the stickman so his mouth matches your voice and he bounces around.
- Puts a picture behind each part, plus big captions.
- Adds music and sound effects.

If a picture can't be found, it uses a big icon instead, so it never gets stuck. You
can also drop in your own picture for any part.

## What's in this repo

- `brand/`: the channel's profile picture, banner, the stickman artwork and the brand
  sheet (colours, name, description).
- `docs/superpowers/specs/`: long technical notes for building the tool. You don't
  need to read these.

## Where things are

- **Done:** the brand (name, look, character) and the design of the tool.
- **Not built yet:** the tool itself. It gets built in small steps, and a first
  working video comes early so you can tell me what to change.

## Still to decide (small things)

- The caption font (the text on screen).
- How you word your video titles.
- The tagline on the banner.

## Optional one-time setup

Two free keys (Pexels and Pixabay) give the tool more pictures to choose from. They go
in a private `.env` file that is never uploaded. See `.env.example`. The tool works
without them.
