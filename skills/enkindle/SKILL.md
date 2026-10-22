---
name: enkindle
description: Make a wild, beat-synced hype edit (a meme-energy "speed is life" style video) about a project, product or person, set to a song from YouTube. The agent fetches the song and its credits, splits it into stems, measures every kick, drop, break and sung word, maps the project's story onto the song's sections, and renders a 1080p wide and a 1080x1920 vertical cut in Rust with fframes and Skia shaders. Every bass hit moves something; captions land with the voice; text is written on, slammed, scrambled and exploded; features fly out of a laptop; screenshots cut on every downbeat; numbers count up on a receipt. Use when the user asks for a hype edit, a meme edit, a phonk/edit-style video, a "fun edit to show friends", or a beat-synced promo of their project.
---

# Enkindle

Sets a project on fire, to music. Turns "make a really fun edit about this, here's the song" into two finished videos (wide and vertical) that hit on every beat. Distilled from a real build that took seven rounds of owner feedback; each rule below is a note the owner had to give. Follow them up front and skip those rounds.

It is a meme, not an ad. Calm, slow or tasteful is a failure. The target feeling is a phonk edit: epilepsy-grade flashes on the drops, the screen never resting, every word of the song landing on screen the instant it is sung.

Everything needed is in this folder:

- `template/`: a complete Rust project that renders a 60 s edit to the song in [reference/speed-is-life.md](reference/speed-is-life.md). It builds and renders as is; you replace `src/content.rs`, `src/timeline.rs`, `src/song.rs` and `media/`.
- `scripts/`: fetch the song with its credits, split stems, map the song, align the lyrics, write the Rust song data, encode and AirDrop the result.
- `reference/`: the motion vocabulary, the traps, the owner's feedback rounds, and the measured map of the example song.

## Phase 0: The brief (five minutes, no rendering)

1. **Who it is for and the vibe.** Read how the user talks. "Fun edit for my friends", "meme", "cook" mean maximum energy and jokes; "launch video" means the same energy with fewer jokes. Default to meme.
2. **The story.** What the project went through (versions, renames, rewrites), what it does (its features), where it runs (surfaces, devices), and its proof (stars, releases, commits, days, money saved, benchmark wins). The story follows the song: quiet intro = origin, build-up = the versions racing by, drop = the features firehose, break = a punchline, second drop = everywhere it runs, outro = the numbers.
3. **The maker.** If a person made it, they appear: a silhouette at a laptop (cap, glasses, smirk) that reacts to the music. Owners ask for this every time.
4. **Formats.** Always both: 1920x1080 and 1080x1920, from one codebase (`--portrait`).

## Phase 1: The song and its credits

1. Get it with `scripts/fetch-song.sh <url> [start] [length] [project-dir]`. It runs the latest yt-dlp through `uvx` (an old yt-dlp gets HTTP 403 from YouTube; it also needs `deno` on PATH for YouTube's JS challenge), saves `analysis/source.json`, cuts the window you want, and writes `media/track.mp3`.
2. **Credits are part of the deliverable.** Name the song, the artists, and the uploader of the edit you took it from, on screen for the whole video and bigger on the end card. YouTube titles of edits usually hold the real credit (`Artist + Artist (feat. Singer) "Song" - Edit name`): read `title`, `uploader`, `uploader_id` and the description lines the script prints, and confirm the artists with a web search when the title is unclear.
3. Say it plainly to the user: using a commercial song is fine for a private edit shared with friends. Posting it publicly can get it muted or taken down. For public use, license the track or pick one from the platform's library.
4. Pick the window: the edit should be about 60 s and end on the song's own ending or a big hit, never mid-phrase.

## Phase 2: Map the song (measure, never guess)

The edit is only as good as its timing. Measure everything from stems, then listen.

1. `scripts/stems.sh [project-dir]` splits `analysis/track.wav` with demucs `htdemucs` into vocals, drums, bass, other (`uvx --python 3.12 demucs@4.1.0`, needs `numpy` and `soundfile`, both passed by the script).
2. `uv run --python 3.12 --with librosa --with soundfile --with numpy python scripts/analyze.py --bpm <what you hear> --downbeat <first kick of the drop>` prints the tempo check, voice segments, melody stabs and a per-half-second energy table of the four stems, and writes `analysis/song.json`.
3. Read the energy table and write the section map by hand in `analysis/song-map.md`: intro, quiet part, build or drum roll, drops, breaks, gaps, outro, each with a start time to the millisecond. Sections are where stems switch on or off: drums out = break, everything out = gap, 808s back = drop.
4. Lyrics: `uv run --python 3.12 --with torch --with transformers --with librosa --with soundfile --with numpy python scripts/align.py 2.3 5.9 "you need to move faster than that amigo" [more START END "WORDS" triples]`. It force-aligns the words you heard against the vocal stem (wav2vec2 CTC) and prints each onset and a caption time 50 ms ahead.
5. **Listen to every cue.** Render the frames at the caption times (`frame 2.48s,2.62s -o frames`), watch them with the audio in `preview`, and move a word when it lags. Fricatives (s, f, sh) can align up to 0.1 s late: move those to where the hiss starts.
6. `uv run --python 3.12 python scripts/to_rust.py --until <edit length>` writes `src/song.rs` (`KICKS`, `KICK_POW`, `HITS`, `BEATS`, `DOWNBEATS`, `LOW30`). Delete beats in sections you want quiet and fix the downbeat phase per section if a section's first kick is not on a downbeat.

Traps that cost whole rounds are in [reference/traps.md](reference/traps.md). The worst: Whisper word timestamps (up to 2.4 s early), beat trackers locking onto 2/3 of the tempo, bass hits living in the drums stem, captioning lines in a language the fonts cannot draw.

## Phase 3: Gather the real material

Real pictures, real numbers. A static card with a made-up number is the fastest way to lose the owner.

- **Screenshots** of the real product, in each of its themes, wide and phone-sized; terminal captures; release pages. Name them as `src/content.rs` expects and put them in `media/`. Every image named in content must exist: `inspect` fails on a missing one.
- **Numbers with a source**: stars over time (`gh api -H "Accept: application/vnd.github.star+json" repos/OWNER/REPO/stargazers --paginate --jq '.[].starred_at'`), releases (`gh release list -R OWNER/REPO --limit 1000 --json tagName,publishedAt`), commits (`git rev-list --count HEAD`), first commit date, PRs merged. Money: real billing or usage numbers, cache savings, measured benchmark ratios. Be smart with them: if you know usage value, what was paid, the cache savings and a benchmark ratio against alternatives, compute what the others would have cost and show the saving.
- **Feature list**: one short title and one plain line each, enough for one per downbeat of the drops (16 to 45). No duplicates on screen at the same time.
- **Logo** as `media/logo.png`, and the fonts in `media/` (template: Instrument Sans Bold, Geist SemiBold, Geist Mono Bold, DM Sans Medium, all OFL on Google Fonts). Text in a font that is not in `media/` silently falls back.

## Phase 4: Build it

1. Copy `template/` to the project's folder (keep it out of the product's source tree), `media/` filled.
2. Fill `src/song.rs` (Phase 2), the section times and lyric times in `src/timeline.rs`, and everything in `src/content.rs`. Nothing from the template's example product may survive.
3. `cargo build --release`, then the built binary is the whole toolkit:
   - `inspect` (and `--portrait inspect`): missing media and fonts, clipped text, panics. Must say "no problems found".
   - `strip 4.9s,19.3s,30.3s -n 12 --columns 4 -o strip.png`: a contact sheet. Look at it after every change.
   - `onion 18.4s..19.2s`: one image of a movement's path.
   - `frame 3.15s,3.6s -o frames`: single frames at exact cues (`--crop x,y,w,h` to zoom in).
   - `preview`: real time with sound. The only way to judge sync.
   - `render -o out.mp4` and `--portrait render -o out-portrait.mp4`.
4. Read [reference/motion.md](reference/motion.md) before changing any scene. It lists every move in the template, when each is used and the numbers that made them feel right.

How the template is built:

- `timeline.rs`: section times, lyric times, `Act` per time, the colour world per time, pulses (`kick_pulse`, `boom`, `low`, `beat_pulse`, `hit`), white flashes, and the drop shots (one per downbeat).
- `scenes.rs`: one function per act (`intro`, `build`, `drop_shot`, `brk`, `gap`, `finale`, `stats`, `receipt`, `end_card`), the feature card and its flight, the maker's pose, the HUD counter and the credits.
- `kinetic.rs`: text moves (`slam`, `write_on`, `typewriter`, `type_line`, `scramble`, `decode`, `mono_letters`, `explode`, `sticker`, `meme`), image moves (`cover`, `framed`, `device`, `picture`), effects (`burst`, `streaks`, `bullet`, `callout`, `letterbox`).
- `dev.rs`: the maker silhouette with a laptop, flames, smirk, glint, sweat, laugh and wink.
- `lib.rs`: camera per act, layering, the background shader, the post shader, and the render loop.
- `shaders/bg.sksl`: drifting cells, a duotone of the current screenshot, warp streaks, a pulsing glow. `shaders/post.sksl`: RGB split, band glitch, whip blur, radial zoom blur, barrel, invert, pixelate, scanlines, grain.

## The motion rules

These are the owner's notes, as rules. Break one and expect it back as feedback.

1. **Nothing rests.** No layout holds still longer than about 0.4 s. Something always moves: camera drift, a counter, a typing caret, particles.
2. **Every hit does something.** Kicks: camera punch plus RGB split. Strong 808s: barrel, shake, sparks. Downbeats in a drop: a cut. Section starts: white flash, glitch, invert for two frames, skew slam.
3. **Cuts land on the hit**; the transition happens in the 0.12 s before it (whip pan, zoom blur, glitch with pixelate), and the new shot slams in after.
4. **Text is written, not placed.** Titles draw their outline then fill (`write_on`), labels type with a caret, numbers scramble then lock, punch words slam with chromatic ghosts and explode out when the next one lands. Captions appear 30 to 60 ms before the syllable.
5. **One word per sung word.** During vocal lines, the screen shows the current word huge and the sentence so far as a meme caption. Don't caption lines in a language the fonts can't draw; react to them with camera and glitch instead.
6. **The colour world strobes**: change theme on each punch word and each downbeat of a drop, so the whole frame flips colour on the beat.
7. **Real pictures, always moving**: screenshots enter on a whip, drift, zoom into a detail, cut on the downbeat. The background is a dimmed duotone of the current shot.
8. **Fast to the main part.** Origin and early versions race by in the build-up (a few seconds each); the drops, where the current product shows off, get the time.
9. **Numbers count up**, bounce on the beat and stamp. Money is a receipt that prints line by line and ends in a stamped total.
10. **The maker reacts**: smirks on the punchline, sweats during the scary part, laughs on the laugh, sits in flames on the drop, winks at the end.
11. **No duplicates on screen**, nothing clipped, nothing overlapping the credits, readable at phone size in the vertical cut.

## Phase 5: Check and deliver

1. `inspect` and `--portrait inspect` with no findings.
2. Contact sheets across every section boundary for both formats; look at each frame. Check one frame per caption against its word.
3. `scripts/deliver.sh target/release/<bin> <name>`: inspects, renders both formats, and makes share copies (H.264 CRF 21, AAC 192k, `+faststart`, about 60 MB per minute) that phones and chat apps accept.
4. Show the user contact sheets and a few frames, then hand over the files. To put them on the user's iPhone: `osascript -l JavaScript scripts/airdrop.js <wide.mp4> <vertical.mp4>`, then pick the phone in the AirDrop sheet (computer use can click it). Opening them in QuickTime (`open -a "QuickTime Player" file.mp4`) does not start playback.
5. Write down what you measured in `analysis/song-map.md` (sections, cues, credits) so the next edit to the same song starts there.

The rounds of feedback that shaped these rules, with the fix for each, are in [reference/feedback-rounds.md](reference/feedback-rounds.md).

## Credits

- Rendering: [fframes](https://fframes.studio) with its Skia renderer.
- Stems: [Demucs](https://github.com/adefossez/demucs) (`htdemucs`) by Alexandre Défossez and Meta AI.
- Alignment: [wav2vec2](https://huggingface.co/facebook/wav2vec2-large-960h-lv60-self) by Meta AI, through Hugging Face Transformers.
- Analysis: [librosa](https://librosa.org). Download: [yt-dlp](https://github.com/yt-dlp/yt-dlp). Encoding: [FFmpeg](https://ffmpeg.org).
- Example song: "Speed is Life" by Blade + Into The Void (feat. Jordan Lindley), from the edit by [CowBeans](https://www.youtube.com/@cowbeans327) ([video](https://www.youtube.com/watch?v=AK7cjOdLVf8)).
