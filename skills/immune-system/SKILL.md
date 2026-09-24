---
name: immune-system
description: Build and run an immune system that proves a product works through its real front doors (CLI, terminal UI, desktop app, web, API) on every platform it ships to, finds what is missing as well as what is broken, and turns every confirmed bug into a permanent check. Use when a project needs testing beyond unit tests, before a release, when a bug keeps coming back, or when the user asks for specialized immune cells.
---

# Immune system

A test system modelled on an immune system: patrols that recognise known bugs, scouts that find what is missing, a check that kills false alarms, and a memory that makes every confirmed bug impossible to miss again. The names are the metaphor; each agent below also says its job in plain words.

Unit tests prove that functions behave. They do not prove that the product **works**: that the thing
a user installs starts on their machine, draws its screen, edits their file without breaking it,
survives a flaky network, and comes back tomorrow with their data intact. This skill builds the
system that proves that, and the roster of immune cells that runs it.

Its job is to find defects, not to report green.

An immune system is **grown for one project**, the way a project's `EMPRYO.md` is: an agent studies
the product and builds the checks, the runner and the cells that fit it. Nothing here is copied in
as is. The cells SoulStack installs are **stem cells**: general versions that know the method and
turn into this project's cells the first time they run here.

## Growing it for a project

1. **Dive deep into the product first.** Read the code map, the docs, the git history, the issues
   and memory; run the product yourself through every front door. Write down:
   - its **front doors**: CLI, headless/JSON mode, terminal UI, desktop app, web app, API, installer;
   - the **platforms** it ships to, and which of them you can reach from here (this machine,
     containers, a VM, a remote machine over SSH);
   - the **one thing worth faking**: usually the paid or non-deterministic dependency (an AI model,
     a payment provider, a third-party API). Fake that at the network boundary and nothing else;
   - the **load-bearing capabilities**: the 10 to 20 things whose loss is an outage, each with one
     sentence saying what breaks for the user.
2. **Research the arsenal, as of today.** For this product's stack and platforms, look up the
   current (this month's) tools for driving and seeing it: browser and Electron drivers, pty and
   terminal emulators, API recorders, network fakes, profilers, log and crash collectors, accessibility
   and visual checkers, container and VM runners. Search with the month and year in the query, read
   changelogs, and prefer the newest stable tool. Include security: dependency and malicious-package
   scanners, secret scanners, signature and provenance checks, for the `natural-killer` cell. Pick what gives each T cell eyes and hands on the
   real product, write the choices and why in `immune/README.md` (Arsenal), and install them.
3. **Scaffold `immune/`** following [reference/design.md](reference/design.md): a runner, one driver
   per front door, one target per platform, checks grouped by family, goldens, a speed ledger kept
   outside the repo, findings, and exploration notes.
4. **Write the first checks** with [reference/checks.md](reference/checks.md): one smoke check per
   front door per platform (it starts, it answers, it exits the way it should), then one check per
   load-bearing capability.
5. **Wire one entry point.** `immune` is the front door of the immune system: every run goes through
   it (`immune` full, `immune:smoke` seconds, `immune:list`, `immune:guard` the coverage ratchet,
   `immune:report` the dashboard). Name them the way the `project` tool looks for scripts in Empryo.
6. **Build the immune app.** The immune system has a face: a small local web app in
   `immune/app/` that shows the developer everything and lets them run it. Start from this skill's
   `app/` (a dependency-free Node server plus `index.html`, `app.css`, `app.js`, `theme.css`) and
   make it the project's own:
   - **Design it with the project's design system.** Replace `theme.css` with the project's tokens,
     fonts and themes (if it has none, build one first with the `ensoul` skill). It must look like the
     product it guards, in every theme and mode, and be checked with screenshots like any UI.
   - **Views**: Health (verdict, counts, the family × platform × front door grid, red, coverage holes,
     a strip of recent runs), Runs (every kept run, expandable), Cells (grown or stem, what each does),
     Findings, Explorations. Add views the project needs (speed trends, screenshots, security).
   - **Run from the app**: buttons for the commands in `immune/app/immune.config.json`, with the log
     streamed live; the page refreshes itself when results change.
   - **Data**: every run writes `immune/results/<time>.json` and `latest.json`; the app reads only these
     and the cells, findings and explorations folders.
   - **Scripts**: `immune:app` starts it (`node immune/app/server.mjs immune/app/immune.config.json`,
     port 4177), `immune:report` exports a static snapshot (`--export <dir>`) that any static host can
     serve, for example the project's website.
   - Use the project's script runner: `package.json` scripts, a `Makefile`, `justfile`, `Taskfile`,
     `pyproject` scripts or `cargo` aliases, whichever the project already uses.
7. **Write `immune/README.md`** for the next agent: how to run, what each platform can honestly prove,
   and the traps you already paid for ([reference/traps.md](reference/traps.md) is the starting
   list).
8. **Grow the cells.** Copy each cell from SoulStack's `agents/` into the project
   (`.agents/agents/` for Empryo, `.claude/agents/` for Claude Code; a project copy wins over the
   global one) and fill in its `## This project` section: the real commands, platforms, front doors,
   fake, load-bearing capabilities and traps. Delete what does not apply. A cell that still has
   `[brackets]` is not grown yet.
9. **Append the immune system section** to the project rules file (`EMPRYO.md`, `CLAUDE.md` or
   `AGENTS.md`), so every future agent keeps it alive:
   - the entry point (`immune`, `immune:smoke`) and the app (`immune:app` on http://127.0.0.1:4177;
     every run refreshes it; `immune:report` exports a static snapshot);
   - after changing behaviour, run `immune:smoke` and refresh the dashboard before reporting;
   - every confirmed bug becomes a check (`memory-cell`), every claim meets `negative-selection`;
   - where findings go (`immune/findings/`) and where grown cells live.
10. **Prove it**: run smoke on every reachable platform, put one known bug back and watch a check
   catch it, and write both results in `immune/README.md`.

## The two ways it runs

| | Patrol | Exploration |
|---|---|---|
| asks | is what we knew still true? | is there something nobody asked about? |
| driven by | committed checks | an agent, with a written plan |
| verdict | pass, fail, known, healed | held, broken, observed |

A patrol cannot notice something that is **missing**: it only re-asks questions someone already
wrote. An exploration can, but has no memory and will happily blame the product for a harness
fault. They are joined by **promotion**: a confirmed exploration finding is compiled into a
permanent check that asserts exactly what the exploration asserted, never something weaker.

## The loop

```
explore or hunt  →  try to refute the claim  →  make it a permanent check  →  patrol forever
```

- **Nothing is a bug until something tried to disprove it.** Every claim goes to the skeptic before
  it is filed, fixed or turned into a check. A disproved claim is worth as much as a confirmed one.
- **Every confirmed bug becomes a check** that fails before the fix and passes after it. Prove both.
- **Every "we have no way to measure this" becomes a tool order** for the toolsmith.

## Rules every immune cell follows

- **Declare the run before running it**: at most three hypotheses, a time budget, a command budget,
  and the exact platforms and front doors in scope. Every command gets a timeout. Anything asked for
  but not exercised is reported as a **coverage hole**, never implied green.
- **Name the subject**: the commit (`git rev-parse HEAD`) or the artifact path plus its checksum.
- **Test the artifact users get** where the source tree is not honest (other OSes, packaged apps).
- **Prove the probe is live** with a negative control (known-bad input, or the bug put back) before
  trusting a result either way.
- **Exit 0 is not an assertion.** Assert on the bytes on disk, the exact exit code, the message sent,
  the region of the screen.
- **Never weaken an assertion to get green.** Either the product is wrong (file it) or the check is
  wrong (say why, then fix it).
- **Wait for conditions, never for time.** A fixed sleep is the worst case on every machine and a
  race on the slow ones.
- **Every check says what it guards** in one sentence a future reader recognises.
- **Known bugs are marked, not left red.** A marked check reports `known`; when it starts passing it
  reports `healed` and asks for the marker to be removed.
- **Own and clean every resource** you start: processes, containers, remote paths, caches. Never
  kill processes by name broadly. The receipt lists what was stopped, removed or kept on purpose.
- **Numbers must not flatter.** Count what the product was made to *do*, not what a check mentions.
  Publish the gap between the honest count and the flattering one.
- **"No bug reproduced" is a valid result.** Stop at the budget; do not sharpen forever.
- Use **memory**: read past findings before starting, save what you confirmed or ruled out after.

## With Empryo

SoulStack is made by the Empryo team, and the immune system is Empryo's own, generalised. In Empryo
it has more to work with; use it:

- **Genome first.** Before writing a check or chasing a failure, ask the code map where the damage
  lands: `navigate` for callers and definitions, `genome_impact` for what a change can break. A
  hunter reads the sink before attacking it; a skeptic reads the intent before judging.
- **`project` runs the checks.** Name the scripts so the `project` tool finds them (`immune`,
  `immune:smoke`, `immune:list`) and run them through it, never as raw shell lines.
- **Cells run in parallel.** `tcell-helper` sends specialists off with `background_dispatch`, each
  with its own bounds, and keeps working; reports arrive when they finish. Two cells that need quiet
  timing never run at the same time.
- **Memory is the immune memory.** Read memory before every run; save each confirmed bug, each
  disproved claim and each trap as a memory the next run will see.
- **Real front doors are in reach.** Drive a web front door with the `browser` tool, a desktop app
  with computer use, and Empryo-style CLIs through headless `--json` events.
- **Patrols on a schedule.** A `/routine` can run `immune:smoke` nightly and wake `tcell-helper` when
  something turns red.
- **Rules stay live.** Edits to `EMPRYO.md` apply on the next message, so a new rule from a
  confirmed bug takes effect at once.
- **Grown cells live in `.agents/agents/`**, where Empryo's custom-agent loader and `find_agent`
  see them; `role: code` lets them run commands.

## The agents

SoulStack's setup script installs the stem cells globally for Empryo, Claude Code, Copilot CLI and
OpenCode. Grow project copies as described above; the project copy is the one that runs.

| Agent | Use it for |
|---|---|
| `tcell-helper` (the lead) | **Start here.** Reads the current state of the immune system, decides which specialists run and in what order, owns the final verdict |
| `tcell-patrol` (the patrol) | Runs the suite and sorts every red result into real bug, check bug, environment problem, known, or healed |
| `dendritic` (the scout) | Finds what is **missing**: states a screen forgets, platform conventions, one door behaving unlike another |
| `tcell-hunter` (the attacker) | Attacks a feature or a diff with hostile inputs, environments, timing and dependencies |
| `negative-selection` (the skeptic) | Tries to disprove a claimed bug from two sides: is it intended, and does it reproduce by hand |
| `memory-cell` (the memory) | Turns a confirmed bug into a permanent check that fails before the fix and passes after |
| `tcell-platform` (the OS specialist) | Failures on one OS only; knows which failures are the transport lying |
| `tcell-retina` (the eye) | Rendering defects: resolves them layer by layer instead of from a screenshot alone |
| `natural-killer` (the security cell) | Vulnerable and malicious packages, leaked secrets, unsafe installers and downloads, input that reaches a shell; researches this month's tools first |
| `tcell-armorer` (the toolsmith) | Audits the immune system itself: empty checks, dull speed budgets, missing instruments |

In Empryo, `tcell-helper` dispatches the others as background agents; in Claude Code it uses subagents.
Each agent loads this skill (`skills: immune-system`) so the rules above travel with it.

## Before you report

- Every finding has: what was expected and why (a source, not an opinion), what happened, the
  evidence file, the commit, the platform and front door, and the check that now guards it.
- Findings users feel are written up in `immune/findings/` in plain words, ready to file. Filing publicly
  is a separate, deliberate step the user approves.
- The report lists coverage holes and resources cleaned, not just results.
