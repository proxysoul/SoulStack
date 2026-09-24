# Components

| Component | Where | Rules |
|---|---|---|
| Top bar | `.bar` | Glass pill, logo + wordmark, section links (hidden under 1100px), world dots, mode toggle, GitHub. The selected world gets a pigment ring |
| Command box | `.install`, `.cmd` | One command per tab, never more than one visible. Copy button in `--pigment`, turns `--ok` with a check after copying |
| Terminal | `.term` | Real script output only. Three neutral dots, the command name on the right. Colours: dim labels, `--ok` for created or linked, `--pigment-alt` for added or updated |
| Layer list | `.layers`, `.layer-view` | Six layers tilted slightly back; the chosen one straightens and moves right. The detail panel lists what the layer does and ends with where it lands |
| Agent matrix | `.matrix` | Rows are layers, columns are agents. A path per cell, or "not supported". On phones each cell carries its agent's name |
| Promise | `.promises` | Icon, bold claim, one sentence. Three at most |
| Immune loop | `.loop` | Four stations on a dashed ring, `tcell-helper` in the centre, one running dot. Hovering an agent card lights its station |
| Agent card | `.agent` | Icon in the agent's tone, mono name, one short line |
| World swatch | `.swatch` | Night and day halves with the world's logo and colour dots; clicking switches the page |
| Takeaway | `.take` | Icon well, a title of three words or fewer, one line |
| Verb | `.verb` | A `soulstack` subcommand in pigment and what it does |

Icons are Lucide-style strokes at 1.75 (`site/src/icons.ts`). Add new ones there; never mix icon
sets.
