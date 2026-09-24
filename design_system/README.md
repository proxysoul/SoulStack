# SoulStack design system

Built with SoulStack's own `ensoul` skill, as the worked example of what that skill produces. The
site in `site/` follows it. Read this before any visual change.

| Read | For |
|---|---|
| [identity.md](identity.md) | The concept, the one idea every screen expresses, and what the site must never look like |
| [worlds-and-color.md](worlds-and-color.md) | The six worlds, two modes, tokens, and what changes with them |
| [type-and-layout.md](type-and-layout.md) | Typeface, the voice each world gives it, the type and spacing scales, widths |
| [components.md](components.md) | Every building block on the site and its rules |
| [motion.md](motion.md) | What moves, why, and how it stops for reduced motion |
| [words.md](words.md) | How the site talks |
| [preferences.md](preferences.md) | What the owner asked for or rejected. Follow without asking |
| [screenshots.md](screenshots.md) | How to check a visual change before reporting it |

## Where things live

- Tokens: `site/src/living.css` (scale, radii, motion, mixes) and `site/src/worlds.css` (the six
  palettes). Both come from Empryo's site so the two feel like one family; change them there first.
- World data for scripts: `site/src/content.ts` (`WORLDS`).
- Logos per world: `site/public/brand/logo-*.webp`. Mote per mode: `site/public/mote-{dark,light}.gif`.
- Page components: `site/src/pages/` (React, TanStack Router), styles in `site/src/site.css`.

## Run it

`bun run dev` from the repo root opens the site on http://localhost:5190. Add
`?world=<id>&mode=dark|light` to open a given world, `&motion=still` to freeze it.
