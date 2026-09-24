---
title: Best with Empryo
summary: What SoulStack does better inside Empryo, the agent it comes from.
order: 1.5
---

# Best with Empryo

SoulStack comes from the team that builds [Empryo](https://empryo.com). Everything works in Claude
Code, Codex, Copilot CLI, pi and OpenCode, and it all goes further in Empryo:

| In Empryo | What it changes |
|---|---|
| Rules reload live | Edits to `EMPRYO.md`, and every `soulstack update`, apply on the next message. No restart |
| The Genome | Immune cells ask the code map where a bug lands (`navigate`, `genome_impact`) before they attack or judge it |
| The `project` tool | Checks run the same way for every agent: `immune`, `immune:smoke`, `immune:list` |
| Background agents | `tcell-helper` sends cells off in parallel with `background_dispatch` and keeps working |
| Memory | Confirmed bugs, disproved claims and traps are saved and read before the next run |
| Browser and computer use | Cells drive web apps and desktop apps through their real front doors |
| Routines | A `/routine` runs `immune:smoke` every night and wakes `tcell-helper` on red |
| Presets | ProxySoul's own models, theme and tools, one flag away |
| `EMPRYO.md` that fills itself in | The [template](https://github.com/proxysoul/SoulStack/blob/main/templates/EMPRYO.md) asks Empryo to study the project and write only what the Genome can't |

## Grow an immune system in Empryo

Open the project in Empryo and ask:

> Grow an immune system for this project with the immune-system skill.

Empryo studies the product with the Genome, scaffolds `immune/`, writes the first checks, wires the
commands for the `project` tool, grows the ten cells into `.agents/agents/` with this project's
details, and proves it by putting a known bug back and watching a check catch it.

SoulStack itself is grown this way: see its [`immune/`](https://github.com/proxysoul/SoulStack/tree/main/immune)
and [`.agents/agents/`](https://github.com/proxysoul/SoulStack/tree/main/.agents/agents).
