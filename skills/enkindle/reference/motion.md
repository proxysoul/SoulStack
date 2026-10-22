# Motion vocabulary

Every move in the template, what it is for, and the numbers that made it feel right. Times are seconds; `age` is time since the cue.

## Text

| move | use it for | feel |
| --- | --- | --- |
| `slam(word, …, age, rot)` | punch words, sung words, section titles | spring from 2.6× to 1×, rotation settles in 0.3 s, two chromatic ghosts (alt and accent colours) split 22 px and close in 0.35 s |
| `write_on(body, …, p)` | titles that should look drawn | outline stroke draws over 0.7 of `p`, fill fades in from 0.45 to 0.8 |
| `type_line` / `typewriter` | labels, subtitles, terminal lines, receipt rows | 26 to 60 characters per second, block caret blinking at 2.4 Hz once done |
| `scramble(body, age, dur)` | names and numbers that lock in | random glyphs every frame, left to right lock over `dur` (0.12 to 0.35) |
| `decode` | short mono labels | the same, as a drawn text |
| `mono_letters` | a name dropping in letter by letter | each letter falls 1.4 em with back-out over 0.22 s, 0.09 s stagger, random spin |
| `explode` | the previous punch word when the next lands | letters fly 500 to 1200 px with gravity and spin, fade over 0.6 s |
| `meme` | the running caption of the sung line | white, black stroke 9% of size, back-out pop, optional shake |
| `sticker` | laughs, reactions | rounded label, spring pop, wobble that dies in 1.5 s |

Captions lead the sound by 30 to 60 ms. Words above 2 per second get one slam each; the sentence so far sits below as a `meme` caption until the punchline.

## Pictures

- `cover(img, focus, zoom, rot, op)`: full-frame screenshot zooming toward a focus point. Dive shots go from 1.0 to 2.4 over the shot, with a `burst` at the focus.
- `device(img, id, width, radius, bezel, w, glow)`: a screenshot in a rounded device frame with glow and shadow. Version chapters whip in from the side with ±22° rotating to −2.5°.
- `framed`: a screenshot card with a glow ring. Split shots slide two in from opposite sides.
- Mosaic: a grid of every screenshot, tiles switching image each beat, some tinted per beat.

## Feature flights

A feature card is born at the laptop, flies along a curve to one of six slots, then either keeps drifting out or rushes past the camera (40% of cards, scale ×4.6). In: 0.32 s with a flip (horizontal scale from cos) and 3 trailing ghost rectangles. Life: about 1.5 s. Wall shots stamp a card into a grid on each beat (1.7× to 1× back-out, random tilt).

## Camera (in `lib.rs`)

| moment | move |
| --- | --- |
| every kick | zoom +0.02 to +0.07 by kick power |
| strong 808 | shake ±15 px, barrel 0.5 |
| each sung word | rotate ±2.5° alternating, settles in 0.2 s |
| the punchline word | push to the maker's face, zoom 1.55 |
| punch words | zoom +0.18, side jolt ±40 px |
| scary or foreign line | face zoom 2.35 with ±35 px shake and ±4.5° jitter, +7% per syllable |
| drum roll | shake growing with the roll |
| last 0.45 s before a drop | zoom ×8 into the laptop, rotate 12° |
| each downbeat in a drop | rotate ±2.2° alternating |
| after a cut | zoom +17%, rotate ±3.5°, settling in 0.22 s |
| 0.12 s before a cut | by shot number: whip left, zoom in, whip right, or spin 28° |
| section start | skew 24° and 260 px shove, gone in 0.1 s |
| break stabs | face punch-ins 1.09 → 1.65 → 2.6, then zoom through ×14 into the laptop |

## Post pass (`shaders/post.sksl`, set in `post_params`)

| uniform | rest | on a hit |
| --- | --- | --- |
| `uRgb` (split px) | 1.5 | +6 kick, +10 808, +30 section start, +26 after a cut, +22 per foreign syllable |
| `uGlitch` | 0 | 0.65 section start, 0.7 cut, 0.45 syllable, 0.22 laugh |
| `uZoom` (radial blur) | 0 | ramps to 1.2 in the 0.24 s before a chapter or drop, 1.6 on zoom-throughs |
| `uWhip` (px) | 0 | ±280 before whip cuts |
| `uInvert` | 0 | 1 for two frames on punch words and drops |
| `uBarrel` | 0 | 0.5 × 808, +0.7 section start |
| `uPix` | 0 | 14 in the last half of a glitch cut |
| `uScan` | 0 | 0.12 in drops, 0.3 in the finale |

Plus a white flash overlay (0.85 × `flash(t)`), which also ramps up over the 0.44 s before the first drop.

## Background (`shaders/bg.sksl`)

Voronoi cells drifting, with bright centres that pulse on the kick, a duotone of the current screenshot (`uImgMix` 0 in the intro, 0.17 in the build, 0.28 in drops), radial warp streaks (`uWarp`, ramping up through the build), a centre glow on the kick, and a vignette. Colours come from the current world, so the whole background flips colour with the world.

## Colour worlds

Six palettes in `theme.rs`, each with backdrop, raised, sunken, ink, soft, rule, accent, alt and spark. `world_at` picks one per time: the punch words and each downbeat of a drop step through `STROBE`. Use the product's own themes when it has them.
