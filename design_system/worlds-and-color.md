# Worlds and colour

Six worlds, each with a night (dark) and a day (light), matching the proxySoul themes in Empryo. A
first visit lands in a random world and mode follows the system; the choice is remembered in
`localStorage` (`soulstack-world`).

| id | Name | Habitat | Night: paper, ink, pigment, pigment 2, nucleus | Day: paper, ink, pigment, pigment 2, nucleus |
|---|---|---|---|---|
| `empryo` | Empryo | The culture | #060807 #f3f7f3 #1deb1b #d89b65 #eca3c4 | #f7faf7 #111a12 #0f7a0e #8f5f22 #a34170 |
| `soul` | proxySoul | The night garden | #0a0812 #e9e7f2 #9b6af5 #ff3d7f #ff8fb4 | #faf8ff #1c1830 #5b2fd6 #c40046 #c40046 |
| `coffee` | Coffee | The café | #0b0906 #f0ece4 #e88a1a #d4a35a #f0a08a | #fdf9f3 #2a1d10 #a34a00 #ad3d15 #ad3d15 |
| `water` | Water | The pond | #070b10 #e6eef3 #1eb4e0 #1ab8a4 #f28fb0 | #f5fafc #10222b #00708f #00705f #b8336a |
| `crimson` | Crimson | The heart | #0e0812 #f6eaf1 #f43a6b #ab7bf0 #ffb3c8 | #fdf6f8 #2a1520 #c4184a #6b3fc4 #9c2247 |
| `undertow` | Undertow | The deep | #0c0e11 #e8ebee #98b0c2 #c49aa4 #e0a9b6 | #f4f6f8 #1a2028 #4a6a80 #914d5e #914d5e |

## What switches with the world

- Every token below, the typeface's voice ([type-and-layout.md](type-and-layout.md)), the logo in the
  top bar, footer, matrix and favicon (`LOGO` in `main.ts`), and the painting's colours.
- Mote switches with the mode (`mote-dark.gif`, `mote-light.gif`).

## Tokens

Use only these; never a hex value in page CSS.

- Surfaces: `--paper`, `--paper-raised`, `--paper-sunken`, `--glass`, `--glass-strong`
- Text: `--ink`, `--ink-soft` (secondary), `--ink-faint` (meta and small print only)
- Lines: `--rule`, `--rule-soft`
- Brand: `--pigment` (primary action, the running dot, selected layer), `--pigment-alt`, `--nucleus`,
  mixes `--pigment-06/12/20/36`
- Status: `--ok` (created, linked), `--warn`, `--bad` (hostile, hunter), `--info`

The one exception is the world swatch, which must show every world at once and reads the palette
from `WORLDS` in `content.ts`.

## Checks

Light worlds are where contrast breaks: always check Undertow day and Water day, and the loudest dark
world, Crimson night.
