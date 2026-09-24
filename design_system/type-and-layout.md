# Type and layout

## Typeface

One family: **Recursive** (`site/public/fonts/recursive-living.woff2`), a variable font with weight,
casual and mono axes. Each world sets a voice for headings and the wordmark:

| World | Weight | Casual | Feel |
|---|---|---|---|
| empryo | 820 | 0.55 | confident, a little soft |
| soul | 620 | 1 | playful |
| coffee | heavy, fully casual | | warm, hand-lettered |
| undertow | 360 | 0 | quiet, precise |

Body text stays at 400, casual 0. Code, commands, agent names and paths use the mono axis
(`--font-code`), never another family.

## Scales

- Type: `--t-mega` (hero at ×1.22), `--t-1` (section titles), `--t-3`, `--t-4`, `--t-lede`,
  `--t-body`, `--t-small`, `--t-micro`.
- Space: `--s-1` … `--s-10`; sections use `--section`, page edges `--gutter`.
- Widths: `--w-wide` for the page, `38rem` for any paragraph or command box.
- Radii: 14px for small cards and command boxes, 16–20px for panels, `--r-pill` for the bar and
  tabs, `--r-blob` for icon wells.

Never invent a size: if a value is missing, add it to the scale and use it everywhere.

## Layout

- The top bar floats; the hero starts below it with room to breathe.
- Section heads put the title left and the one-line explanation right, on the same baseline.
- Two-column sections break asymmetry on purpose: the list or visual on one side, the detail on the
  other. Below 1100px every section becomes one column; below 760px the matrix turns into one card
  per row, each path labelled with its agent.
