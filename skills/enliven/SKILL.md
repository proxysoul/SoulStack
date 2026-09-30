---
name: enliven
description: Make an Electron or web app measurably faster without losing a feature, and prove it. The agent builds a repeatable A/B harness that drives the real production build through Playwright and reads Chromium's own counters over the DevTools protocol, finds the cause of the cost with a Blink style-invalidation trace and a React commit probe instead of guessing, fixes root causes, re-measures the same way, and writes a self-contained HTML report that shows the regressions as loudly as the wins. Use when the user asks to profile, speed up, slim down, find memory leaks in, or benchmark before and after on a desktop or web app, or asks for a performance report.
---

# Enliven

Turns "make the app fast" into a number you can defend. The output is three things: root causes named at `file:line`, a harness anyone can re-run, and an HTML report whose every figure comes from a JSON file the harness wrote.

It is distilled from a real Electron audit where the first two attempts failed independent review. Every rule below is a mistake that got caught. Follow them up front and skip those rounds.

`ensoul` gives a product a soul, `immune-system` keeps it well, and this one makes it lively: an app that answers the instant you touch it and carries no weight it does not need. Same construction as `ensoul`, same idea one step further in: not what it looks like, but how alive it feels to use, proved with numbers rather than asserted.

The shape of the work is one loop: **measure → find the cause → fix the cause → measure the same way → report honestly**. Never skip a step, never reorder, and never let the report get ahead of the data.

## The short path

The scripts in `scripts/` are the audit already written down. Do not rebuild them from scratch; the exploration is what took the time, and it is already spent.

```sh
cp scripts/profile.example.mjs perf-profile.mjs   # fill in: entry, selectors, phases, cycle
node scripts/perf-ab.mjs --profile=./perf-profile.mjs --app=<build> --label=before --out=./perf
node scripts/style-trace.mjs --profile=./perf-profile.mjs --app=<build> --phase=<worst phase>
#   fix what the trace names, rebuild from a purged output directory
node scripts/perf-ab.mjs --profile=./perf-profile.mjs --app=<build> --label=after --out=./perf
node scripts/perf-report.mjs --before=./perf/before.json --after=./perf/after.json \
     --changes=./perf/changes.json --out=./perf/report.html
```

Writing `perf-profile.mjs` is the only real work: name the phases people actually perform, and make the leak cycle end where it began. Read [reference/traps.md](reference/traps.md) first, in full. Every line in it cost a failed review.

These scripts have been run end to end against a real Electron build, not just written: a five-phase profile produced boot timings, per-phase CDP counters, a three-cycle leak series with flat node counts, and an HTML page. On that run the orphan count came back at 866 files and 43 MB, which was correct: the output directory had accumulated stale chunks from earlier builds. Purge it before you trust any bundle number, exactly as Phase 4 says.

The phases below explain why each script does what it does. Read them when something does not fit your app, not before your first run.

## Phase 1: Build the harness before you look at any code

The first instinct is to open a profiler and start reading flame graphs. Resist it. A flame graph of one run on a busy laptop tells you nothing you can defend later. Build the measuring instrument first, and make it produce a JSON file.

One script, checked into the repo, that takes `--app=<dir> --label=<name> --out=<dir> --repeats=N` and writes `<label>.json`. It must:

1. **Launch the real production build**, not a dev server and not a test renderer. Optimisations that only exist in a dev build are not optimisations. For Electron, Playwright's `_electron.launch` against the built main entry.
2. **Run every phase N times and report the median.** Three is the floor. A single run on a shared machine moves by tens of percent.
3. **Read the engine's own counters, not a stopwatch.** Over the DevTools protocol, `Performance.getMetrics` gives `TaskDuration`, `ScriptDuration`, `RecalcStyleDuration`, `LayoutDuration`, `RecalcStyleCount`, `LayoutCount`, `Nodes`, `JSEventListeners`, `JSHeapUsedSize`. Those last four are the leak triad plus the DOM size.
4. **Count renders without React DevTools.** Install a `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` stub in an init script with `supportsFiber`, a `renderers` Map, `inject`, and `onCommitFiberRoot`. Counting commits is one line. Walking the fiber tree for `flags & PerformedWork` gives per-component render counts and which of them had identical props and state, which is the wasted-render number.
5. **Count animation frames.** Wrap `requestAnimationFrame` in the same init script. An idle window doing 74 callbacks per second is a finding on its own.
6. **Be hermetic.** Seed a throwaway config home per run: a temp dir, `HOME`/`USERPROFILE`/`LOCALAPPDATA` pointed at it, and a config file written with the onboarding and intro flags already set. Without this the benchmark silently inherits the developer's real settings, the numbers are not reproducible on another machine, and the run stops on a first-run screen on any clean OS. This one item is what makes the harness portable; it is not optional.

### The phases are what people actually do

Not microbenchmarks. Every desktop app has the same five shapes; name them in your own product's words:

| Shape | A chat client | An editor | A dashboard | A media app |
| --- | --- | --- | --- | --- |
| **Load a big document** | restore a long session | open a 5,000 line file | load a board with 200 cards | open a large library |
| **Take content in over time** | stream an answer | type a paragraph | receive a live metric feed | scrub a timeline |
| **A burst of list churn** | 40 tool calls | rapid autocomplete | a filter over every row | a playlist reorder |
| **Move between views** | switch tabs | switch files | switch boards | switch albums |
| **Scroll, hover, sit still** | the transcript | the gutter | the grid | the grid |

Idle is the most revealing phase and the one everyone forgets: an app that costs anything while nothing is happening is burning battery for free. The examples throughout this skill come from a chat client because that is where it was distilled; the harness itself knows nothing about chat, and every app-specific detail lives in your profile.

### The leak loop has to close

Run 6-10 identical cycles at the end, force garbage collection twice between each (`HeapProfiler.collectGarbage`), and fit a least-squares line through heap, node count and listener count.

The cycle must return the app to the same state it started in. If each cycle appends a message, opens a panel, or otherwise adds content, the series measures accumulation, not retention, and the "leak" it reports is fiction. End every cycle by replaying the identical restore payload, then assert the DOM node count is flat before you believe any heap number.

## Phase 2: Find the cause, do not guess it

Three probes answer three different questions. Run the one that matches the phase that came out worst.

| Probe | Answers |
| --- | --- |
| Blink invalidation trace | Which CSS rule scheduled each style recalculation, and how many elements it touched |
| React commit probe | Which component rendered, how often, which renders were wasted, and what triggered the root of each render |
| React Compiler bailout report | Every function the compiler refused to memoize, with the reason and the line |

### The style trace is the one people skip

Start a `Tracing` session over CDP with `blink.style`, `devtools.timeline` and `disabled-by-default-devtools.timeline.invalidationTracking`, drive one interaction, then aggregate `ScheduleStyleInvalidationTracking` by reason and node, and `StyleRecalcInvalidationTracking` by reason. It names the selector.

In the audit this came from, style recalculation was 47% of main-thread time, and two CSS rules caused most of it. Neither drew anything.

**The `:has()` trap.** A descendant `:has()` whose subject is an ancestor of frequently-mutated content makes the engine schedule an invalidation on that ancestor for *every* DOM mutation underneath it. `html .app:has(> .backdrop) :is(.header, .main, .footer)` scheduled 1,211 whole-application invalidations during one burst of incoming content, re-styling 107 elements each time, while the backdrop was not even mounted. Any app with a live region has this shape: a log tail, a chat, a table that updates, a canvas with a DOM overlay. Sibling `:has()` (`:has(~ .x)`) is much cheaper than descendant `:has()`; an attribute the component already knows how to set is free. Replace `:has()` on a hot ancestor with a `data-` attribute set from the same condition the component renders on.

**The compositor-layer trap.** `will-change: transform` on an element that is 18 pixels wide costs more than it saves. Promote only what visibly moves, and check the size at which it is actually rendered.

**The per-instance listener trap.** A component that registers its own `window` listener costs N listeners for N instances, and every event wakes all of them. One shared dispatcher in a coordinator that already tracks which instances are on screen, fanning out only to those, is the fix. While you are there: element `scroll` events do not bubble to `window`, so a `window` scroll listener meant for an inner scroller has never fired. Check before you "optimise" it; you may be optimising dead code.

**React Compiler bailouts.** One bailout unmemoizes a whole component, and if that component is high in the tree it re-renders on every state change below it. The usual causes are `try`/`finally` inside the component, reading a ref during render, a dynamic `import()` of a module also imported statically, and update expressions on variables captured in closures. Hoist the offending code to a module-level function; the compiler does not compile those. Keep a baseline file of skipped-function counts per file and fail the build when a file rises above it.

## Phase 3: Fix causes, and revert what does not pay

Fix the thing the trace named, not the thing nearby that looks untidy.

**Bundler chunk grouping is a trap with a high failure rate.** Hand-written vendor groups produce cross-chunk edges that drag large feature chunks into the boot graph. The temptation is to rewrite the grouping. Measure the rewrite against a *clean* build before keeping it: in the audit this came from, the rewrite pushed 379 KB *into* the boot path and the problem it was meant to fix turned out to be an artifact of an incremental build. It was reverted. A change that does not pay for itself in the measurement is not a change, however clever the reasoning was.

**Framework upgrades are measured like everything else.** Pin them to the one app under test rather than a shared catalog when other surfaces in the repo would be affected mid-flight. Read the release notes for the thing you are actually fixing: a minor that batches resize-driven updates to the next frame is relevant to a layout-thrash finding; most of the rest is not.

## Phase 4: Measure bundles from the graph, never from the directory

Summing every file in the output directory is wrong twice over. Incremental builds leave stale hashed chunks behind, so the total counts files no shipped page loads; and it treats a lazily-loaded 4 MB editor the same as the entry chunk.

Parse the built entry HTML, walk static imports for the **boot-critical** set, then walk every asset-path string literal for the **reachable** set. Modern bundlers emit lazy chunk paths in a dependency array rather than a literal `import("./x.js")`, so a regex for `import(` alone finds nothing and reports every lazy chunk as an orphan. Report boot-critical, reachable, and orphans as three separate numbers, and purge the output directory before each build so orphans mean something.

## Phase 5: Every claim in the report is a check that can fail

A metric that cannot come out badly is decoration. Before you put a number in the report, ask what value would embarrass you, and confirm the harness could produce it.

The worked example: a claim that panels never show a loading skeleton, measured by a counter that only incremented while nothing ever navigated. It read zero on both sides and proved nothing. Rewritten to click through real destinations and record, per switch, whether a skeleton appeared between the click and the panel arriving, it read 3 of 3 on both sides. That is a real finding, it contradicts the stated policy, and it belongs in the report.

## Phase 6: The report

One self-contained HTML file, generated by a script from the two JSON files. No network, no build step, opens from disk. Generated, never hand-written, so it cannot drift from the data. It should regenerate in one command after any re-run.

- **Lead with the honest headline.** If streaming got no faster, the headline does not say streaming got faster. Derive the hero figures from the data so they cannot go stale when the numbers change.
- **Show where the time went, not just how much.** A stacked bar per phase, split into style, layout, script and other, before above after on one shared scale. The shape of the bar is the finding.
- **Print the regressions in red, in the same table.** Add a "phases that came out slower" block that lists them by name. A report that shows only wins is not a measurement.
- **Say which numbers to trust.** Wall-clock milliseconds on a shared machine move by tens of percent between runs of the same binary; counts do not. State the observed spread, and say plainly: where a timing and a count disagree, believe the count.
- **State what the method cannot conclude.** If the heap climbs monotonically, say monotonic growth is what a leak looks like, give the unchanged build's slope for comparison, and say that separating retained objects from uncollected garbage needs a heap-snapshot diff this suite does not take. Do not write "no leak" when what you measured is "no DOM or listener leak".
- **List every change at `file:line` with the evidence that motivated it**, including the ones you reverted and why.

### Let `ensoul` design the page

`scripts/perf-report.mjs` ships a neutral dark theme so it works in any repo on day one. When the project has a `design_system/` folder, the report should look like the product, not like a tool:

1. Read `design_system/README.md`, then `worlds-and-color.md` and `type-layout-scale.md`.
2. Replace the `:root` block in the generator with that project's tokens: paper, ink, ink-soft, rule, the brand colour and the status colours. The generator already uses four segment colours and three text weights, so it is a direct swap.
3. Use the brand colour for *this* product's bars and a muted ink for the comparison, the same rule `ensoul` gives charts.
4. Check it the way `ensoul` checks a page: screenshot at 390, 1440 and 3440 wide, in dark and light, and confirm no number wraps and no bar overflows its track.
5. If the project has no `design_system/` and the user wants the report to carry the brand, run `ensoul` phase 1 and 2 only (understand the product, pick tokens) and stop there. A full redesign is not part of a performance audit.

Either way the page stays a page, not a dump: one type family for prose and one for figures so columns align, generous space, no decoration that is not a number. Tables only where there are three or more things to compare on two or more dimensions.

## Phase 7: Other platforms

The same harness, the same two builds, on each OS the app ships to. Expect the harness itself to be what breaks first, and fix it for everyone rather than special-casing:

- Build a `file://` URL with `pathToFileURL`, never string concatenation. `file://C:\...` is not a URL.
- Seed the config home (Phase 1). A clean machine stops on the first-run screen; your machine does not, because it has your real config.
- Some package managers use directory junctions that the platform's own shell refuses to traverse. Point the runtime at an extracted distribution through its documented environment variable instead of writing inside the dependency tree.
- Build scripts that shell out to tools missing on that box need to be invoked directly rather than through the package script.

When a platform cannot be measured in the time available, say exactly how far it got and what the remaining blocker is. "Builds and launches, stops at X, no renderer errors" is a useful result. "Not tested" and a claim that it probably works is not.

## With Empryo

SoulStack comes from Empryo's creator. Every step above works in any agent; in Empryo there is more
to work with, and skipping it means doing by hand what the tools already know.

- **Ask the Genome before you read anything.** `genome_query` chains search, filter, dependents and
  outline in one call, so "which files import the component the trace named" is one question, not a
  grep loop. `navigate` gives callers and definitions; `genome_impact` tells you the blast radius of
  a hot file before you touch it, and `cochanges` names the files that historically move with it.
- **Check for the fix before writing one.** `api.genome.clones` and `identifierFrequency` in
  `explore_script` name the near-duplicate and the canonical helper. Three components with the same
  `dangerouslySetInnerHTML` want one shared function, and the graph finds the third one you missed.
- **`project` runs the verification.** Name the scripts so the `project` tool finds them
  (`perf`, `perf:report`, `perf:trace`) and run checks through it, never as raw shell lines.
- **The browser tool is a second renderer.** For a web target, `browser` gives snapshot, eval and
  responsive screenshots without leaving the session, and the report can be read at 390, 1440 and
  3440 before anyone else sees it.
- **Dispatch the platform runs.** `background_dispatch` sends one worker per operating system with
  its own bounds while you keep working; each returns its JSON and the report merges them. Two runs
  never share a machine, because a benchmark measures its neighbours.
- **Memory carries the floor.** Save the harness's numbers and every trap you hit as a `gotcha`, so
  the next run starts from the real baseline instead of re-deriving it. Read memory before starting:
  a past session already learned which phase is noisy on this machine.
- **Routines keep it honest.** A nightly `/routine` re-runs the harness against the current build
  and wakes you when a count crosses its floor, which is how a fix stays fixed.

## Rules

- Measure before you change anything, with the instrument you will use afterwards. A before taken with a different method is not a before.
- Clean build on both sides. Purge the output directory; stale chunks have produced fake regressions more than once.
- One variable at a time where the budget allows, so each gain is attributable.
- Never present a red number as a win. Check every sentence of the report against the JSON it claims to describe before you ship it.
- Do not touch files another agent is editing; in a shared checkout, report the conflict and let the owner fix their own code.
- Keep secrets, hostnames, usernames and machine addresses out of the harness, the report and the skill. Take them from environment variables or arguments.
- The artifacts are not publishable by default. A run's JSON carries absolute paths, a DOM census and phase names from a real session, and the screenshot next to it carries whatever was on screen. Write them to a directory your repository ignores (`perf/` or similar, added to `.gitignore`), and read the HTML before sending it anywhere.

## Verify

- Both JSON files exist, were produced by the same harness version, and their `platform` and `repeats` fields match.
- Boot-critical and reachable bundle sizes are equal on both sides unless a bundling change was intentional and kept.
- The leak series for DOM nodes is flat; if it is not, the cycle does not close and the heap number means nothing.
- Every figure in the HTML is interpolated from the JSON, not typed.
- Typecheck, lint and the project's own test suite pass, and the counts of failures and compiler bailouts are no worse than before the work started.
