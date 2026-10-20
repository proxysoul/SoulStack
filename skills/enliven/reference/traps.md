# Traps, with the evidence that exposed each one

Every row below cost a round of review or a wasted rebuild in the audit this skill came from. Read this before the first measurement, not after the first failure.

## Measurement traps

**Summing the output directory for a bundle size.** Incremental builds leave stale hashed chunks behind. A directory sum counted three copies of the same entry chunk and reported a 13% regression that did not exist. Walk the module graph from the built entry HTML and purge the output directory before each build.

**Finding no lazy chunks.** Modern bundlers emit lazy chunk paths in a dependency array (`__vite__mapDeps`, or similar), not as a literal `import("./x.js")`. A regex for `import(` reports every lazy chunk as unreachable. Treat any `"./name.js"` string literal that is not a static import as a lazy edge.

**Inheriting the developer's config.** A benchmark that reads the real user config is not reproducible and stops on a first-run screen on any clean machine. Seed a throwaway home and point `HOME`, `USERPROFILE` and `LOCALAPPDATA` at it. This is also the single fix that made a Windows run possible.

**A leak loop that accumulates.** If a cycle appends content, the heap slope measures growth of the app's own state, not retention. End every cycle by restoring the identical starting state and assert the node count is flat before reading the heap.

**Trusting wall-clock on a shared machine.** The same unchanged binary measured 3,330 ms and 4,927 ms for one phase in two rounds an hour apart, because other builds were running. Counts (recalcs, layouts, commits, frame callbacks) barely moved. Report both and say which to believe.

**A metric that cannot fail.** A skeleton counter that only incremented while nothing ever navigated read zero on both sides and proved nothing. For every claim, name the value that would embarrass you and confirm the harness can produce it.

**Nav timings under `file://`.** `performance.getEntriesByType("resource")` is empty and first-contentful-paint reads 0 for a `file://` renderer. Use wall time to first commit and the CDP counters instead.

**Reading a CPU profile as a wall-clock trace.** Chrome samples the renderer at an interval and stores each sample's duration in `timeDeltas`. Count milliseconds from those deltas, not from sample count, and label the sampling interval in the report. A profile names where the renderer spent time; it does not measure startup, GPU, main-process, or un-sampled work.

**Profiling a different state than the A/B phase.** Starting the profiler after the interaction changes the evidence and misses the setup that made the phase expensive. Launch the same hermetic profile, replay the earlier phases, then start CDP `Profiler` immediately before the target phase. Use `cpu-analyze.mjs --anchor` or `--window` to narrow a saved profile without rerunning the app.

**Publishing absolute profile paths.** Chrome profiles contain file URLs with the runner's home directory. Pass `--root=<project>` to the analyzer and keep raw profiles in an ignored output directory; do not paste machine paths into a report or issue.

**Playwright hides the background.** It emulates focus, so `document.hasFocus()` stays true, and `BrowserWindow.hide()` leaves `document.hidden` false. A second CDP session that turns focus emulation off does not undo it. Measure the behind-another-window state through the app's own focus signal (the profile's `focus` hook) and the hidden or occluded state without Playwright at all.

**GPU-process CPU is not GPU utilization.** The GPU process's CPU time is what a profile and `getAppMetrics` show; the GPU's own load is not in either. Count drawn frames and composited layers, which drive both, and say in the report which one you measured.

**RSS on a process that maps files.** A database opened with a large `mmap_size` counts clean, droppable file pages in RSS: the same workload measured 1.5 GB in one run and 7.4 GB in the next. Use the platform's footprint number (`footprint` / phys_footprint on macOS, private working set on Windows).

**LayerTree sizes are device pixels.** A full-window layer on a 1440x900 window at scale 2 reports 2880x1800. Multiplying by `devicePixelRatio` again overstates texture memory four times on every high-density screen.

**Diagnostic probes change the cost.** Blink invalidation tracking, a React fiber walk or a timer census each add work. Take the baseline without them and run them as separate diagnostic passes.

**Driving the app through an event nobody listens to.** A harness that dispatched a synthetic "switch tab" event kept passing after the app stopped listening for it, and measured nothing. Click the real control and assert the destination is visible (a non-zero box) before timing anything.

**Other work on the same machine.** File sync, indexers and a parallel build land in "idle" CPU. Note what else was running, and never pause a shared service without asking its owner.

**A static listener scan is a triage list.** A scan flagged 45 files for listeners, frames and observers without a visible cleanup; every one traced so far either lived as long as the process or was already removed on close. Listeners that live as long as the process are fine. Check that per-window and per-component listeners are removed on their own lifecycle, and fix only those.

## Rendering traps

**Descendant `:has()` on a hot ancestor.** `html .app:has(> .backdrop) :is(.header, .main, .footer)` scheduled 1,211 whole-application invalidations during one streamed answer, re-styling 107 elements each time, with the backdrop not even mounted. The engine cannot bound it, so every DOM mutation anywhere under `.app` re-evaluates it.

- Fix: an attribute on the same element, set from the same condition the component renders on. `html .app[data-backdrop] :is(…)`.
- When a wrapper needs to react to a child's state, move the rule onto the child instead of reaching up with `:has()`.
- Sibling `:has(~ .x)` is far cheaper than descendant `:has()`. If you must keep one, make the subject the element itself.

**`will-change` on something tiny.** An 18-pixel icon promoted to its own compositor layer costs more than it saves, and the cost lands on every mount. Check the rendered size, not the source viewBox.

**One `window` listener per component instance.** Six instances meant six `pointermove` handlers, each waking its own animation loop. Route them through one dispatcher that already knows which instances are on screen and fans out only to those.

**A `window` scroll listener for an inner scroller.** Element `scroll` events do not bubble to `window`. That handler has never fired. Decide whether the behaviour was wanted: either remove the dead code, or make it work with a capturing listener that only bumps a counter, and do the expensive part lazily when something actually needs the fresh value.

**Animating an SVG child's transform in JS at a capped frame rate** is sometimes *better* than a CSS animation, because SVG element transforms force layout in Blink and a CSS animation runs at display rate. Measure before converting either direction, and gate the work by rendered size.

**A blur under an opaque fill.** The default appearance put `backdrop-filter: blur(20px)` on every pane while the pane's own background was fully opaque. Nothing showed, but the compositor built render surfaces every frame, lost the cheap native overlays and pinned GPU memory while the caret blinked. Turn the blur off whenever the fill is opaque and keep it where the surface is really translucent; prove it with the look check.

**Removing `will-change` everywhere to cut layers.** It reduced the layer count and made main-thread scrolling slower (596 to 621 ms per 120 frames). Layer count is not the goal; drawn frames and main-thread time are.

**Animated `<svg>` and `box-shadow` keyframes.** An animated `<svg>` element is never composited, so every tick needs a main-thread frame; animate a wrapping element. `box-shadow` keyframes repaint on the main thread every frame; fade a pseudo-element that carries the shadow instead.

**Idle loops that keep themselves alive.** A decorative animation's settle loop re-armed on its own `animationend` events and ticked forever at rest; a canvas library kept a display-rate ticker alive after its last scene closed. Look for loops whose stop condition is fed by their own output, and stop shared tickers explicitly.

## React traps

**One compiler bailout unmemoizes a whole component.** If it sits high in the tree, everything under it re-renders on every commit. Common causes and their fixes:

| Compiler says | Cause | Fix |
| --- | --- | --- |
| `Handle TryStatement without a catch clause` | `try`/`finally` in the component body | Hoist to a module-level function that takes the setters |
| `Cannot access refs during render` | reading `ref.current` while rendering | Read it in an effect or a handler |
| `Handle Import expressions` | dynamic `import()` of a statically imported module | Pick one |
| `Support value blocks within a try/catch` | a ternary or optional chain inside `try` | Assign to a variable first, or use `.then(ok, err)` |
| `Handle UpdateExpression to variables captured within lambdas` | `i++` on a closed-over variable | Use a ref or a reducer |

Keep a baseline of skipped functions per file and fail the build when a file rises above it, so the count only goes down.

**Counting renders without React DevTools.** Install a `__REACT_DEVTOOLS_GLOBAL_HOOK__` stub in an init script. `onCommitFiberRoot` gives commits; walking the tree for `flags & PerformedWork` gives per-component counts, and comparing `alternate.memoizedProps === memoizedProps && alternate.memoizedState === memoizedState` gives the wasted ones. Following `fiber.return` until you find another fiber that also performed work identifies the render *root*, which is the component actually responsible.

## Memory traps

**Decoded images stay in the renderer.** Removing 40 large pasted images from the page freed nothing: Chromium kept the encoded bytes (about 52 MB) and the decoded copies (about 61 MB), growing linearly, and garbage collection, a critical memory-pressure signal and a cache clear did not release them. Draw a preview sized to twice the box it fills, keep the image's colour profile, and load the full image only when it is opened.

**Image bytes in app state.** Base64 images in a store make every state copy, persist and devtools snapshot carry them. Keep the bytes out of band (IndexedDB, a file) and only an id, type and size in state, and reserve the box from the stored size so nothing jumps while it loads.

**Undo history that keeps whole files.** Twenty full versions of up to 200 files, kept for every open document, reached about 1 GB on a large project; one non-Latin-1 character made each copy two bytes per character. Compressing each entry (zstd took an 860 KB file to 201 KB in about 2 ms), a global byte budget and a trim on memory pressure brought it to 48 MB with the same undo depth.

**A worker's heap outlives the worker.** A Bun process that ran a one-off 800 MB scan in a worker kept most of that memory after the worker ended. Collect in chunks during the scan, or run it in a child process that exits.

## Host-process traps

**Durable writes on the event loop.** A full-disk flush (`F_FULLFSYNC` on macOS) for every step of a background job blocked a busy back-end for long enough that its Stop button went unanswered with twenty jobs running. Move the flush to a worker, give it a timeout, and fall back to the main thread only when the worker is gone.

**Startup calls drained one at a time.** Calls queued before a worker finished starting were replayed with `await` in a loop, so a slow index scan at the front held a priority change behind it for 65 seconds. Start queued calls together, as calls that arrive later already are.

**Polling a file for each running command.** Following output by opening, `fstat`ing and closing a log every 40 ms cost 14% of the loop with many commands running. Read once per change, or keep the handle open.

## Cross-platform traps

**`file://` plus a Windows path is not a URL.** `` `file://${path}` `` produces `file://C:\...`, which loads nothing. Use `pathToFileURL`. This one is worth fixing in every harness you own, not just the one under test.

**Directory junctions.** Some package managers lay out `node_modules` with junctions that the platform's own shell refuses to traverse ("the path cannot be traversed because it contains an untrusted mount point"). Never write into the dependency tree from a shell script; extract elsewhere and point the runtime at it with its documented environment variable.

**Build scripts that need tools the box does not have.** A root `prepare` script that calls `git` fails on a machine without `git` on `PATH`, taking the whole install with it. Install with scripts disabled and invoke the build tool directly.

**Onboarding gates.** A clean profile shows the first-run screen. Seeding the config home (above) is the fix; clicking "skip" is not, because the next gate is behind it.

## Reporting traps

**Narrating a red number as a win.** If the table shows `+12%` in red and the prose says the change removed weight, the report is wrong and a reviewer will find it in one pass. Generate the prose from the same JSON as the table, and re-read every sentence against the numbers before shipping.

**Prose that contradicts a series.** "Nothing accumulates" next to a monotonically rising line fails immediately. Print the series inline, state whether it is monotonic, and if it is, say so and give the unchanged build's slope as the comparison.

**Overclaiming a leak result.** Flat node and listener counts prove there is no DOM or listener leak. They do not prove there is no retained-object leak; that needs a heap-snapshot diff. Say which one you measured.

**Keeping a change that did not pay.** A bundler chunk-grouping rewrite looked clever, was reasoned about at length, and pushed 379 KB into the boot path. Revert it and say so in the change list. A reverted change with its reason is more useful to the next reader than a silent one.
