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

## Rendering traps

**Descendant `:has()` on a hot ancestor.** `html .app:has(> .backdrop) :is(.header, .main, .footer)` scheduled 1,211 whole-application invalidations during one streamed answer, re-styling 107 elements each time, with the backdrop not even mounted. The engine cannot bound it, so every DOM mutation anywhere under `.app` re-evaluates it.

- Fix: an attribute on the same element, set from the same condition the component renders on. `html .app[data-backdrop] :is(…)`.
- When a wrapper needs to react to a child's state, move the rule onto the child instead of reaching up with `:has()`.
- Sibling `:has(~ .x)` is far cheaper than descendant `:has()`. If you must keep one, make the subject the element itself.

**`will-change` on something tiny.** An 18-pixel icon promoted to its own compositor layer costs more than it saves, and the cost lands on every mount. Check the rendered size, not the source viewBox.

**One `window` listener per component instance.** Six instances meant six `pointermove` handlers, each waking its own animation loop. Route them through one dispatcher that already knows which instances are on screen and fans out only to those.

**A `window` scroll listener for an inner scroller.** Element `scroll` events do not bubble to `window`. That handler has never fired. Decide whether the behaviour was wanted: either remove the dead code, or make it work with a capturing listener that only bumps a counter, and do the expensive part lazily when something actually needs the fresh value.

**Animating an SVG child's transform in JS at a capped frame rate** is sometimes *better* than a CSS animation, because SVG element transforms force layout in Blink and a CSS animation runs at display rate. Measure before converting either direction, and gate the work by rendered size.

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
