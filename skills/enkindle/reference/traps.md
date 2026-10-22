# Traps

Each of these cost at least one round.

## Song analysis

- **Whisper is not a clock.** Its word timestamps were up to 2.4 s early and its DTW token times 0.15 to 0.35 s late on a song. Use it only to learn what is sung, then force-align (`scripts/align.py`) on the vocal stem.
- **Beat trackers lock onto the wrong tempo.** On a 156 BPM phonk track librosa returned 103 BPM (2/3). Trust the spacing of the kicks in the drums stem, and pass `--bpm` with what you hear so `analyze.py` warns.
- **Hits are in the drums stem.** 808s live in the drums stem's 20 to 140 Hz band, not in the bass stem. Kicks drive the camera, `LOW30` (per-frame low-end envelope) drives the glow and warp.
- **Bleed is not voice.** Claps and hats leak into the vocal stem as quiet blips; voice starts where the segment's peak is high and the aligner agrees.
- **A model hears what it expects.** Lines in another language get "transcribed" as English nonsense, and silence after a repeated word gets that word again. Listen to every line you caption.
- **Fricatives align late.** "s", "f", "sh" starts can be 0.1 s before the aligner's onset. Check by rendering the caption frame and listening.
- **Downbeat phase per section.** One tempo and phase rarely fits a song with a slower intro and a faster drop. Anchor the phase on the drop (`--downbeat`), then fix earlier sections by hand.
- **Old yt-dlp gets 403.** Run the latest through `uvx`; YouTube also needs `deno` for its JS challenge.

## fframes and the renderer

- Pin the fframes crates exactly (`=1.3.1-rc.3`). An older fframes 1.1.0 broke when a new `usvgr` release added a shape variant it didn't match.
- Fonts and images must be in `media/`. A missing image is an error in `inspect`, `strip` and `render`; a missing font silently falls back.
- Build scene layers as `Vec<Svgr<'static>>`. Mixing `Svgr<'a>` vectors with helpers that return `'static` fails with "borrowed data escapes outside of method".
- Write real glyphs (`·`, `—`, `→`) in strings inside `svgr!`; `\u{..}` escapes can render literally.
- `Transform { .. }` needs `..Default::default()` or every field including `skew_x` and `skew_y`.
- The template's `main.rs` builds a Metal renderer (macOS). On Linux or Windows, swap it for the backend your platform supports; `--help` lists the renderers (`--renderer`).
- Heavy machines: rendering 60 s at 1080p with the GPU takes about 30 s; a full contact sheet a few seconds. Render once per change, look, then change again.

## Layout

- Big words collide with a big logo. Show the logo after the lyric line, or shrink it into a corner on the first beat after the drop.
- Feature chips clustered at the laptop look like clutter. Spread flights over fixed slots and give each a life of about 1.5 s.
- Vertical is not the wide cut cropped: move titles above the maker, stack split screens vertically, keep 120 px clear above the credits.
- Credits at the bottom edge get covered by the maker in the outro unless the maker moves up.
