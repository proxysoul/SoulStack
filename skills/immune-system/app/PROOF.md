# Immune console proof

## Result

- All 13 views rendered live and from the static export: Overview, Triage, Records, one record, Cycles, Guards, Antigen census, Board, Health, Runs, Cells, Findings and Explorations.
- **338 view screenshots**: all six worlds at 390 and 1440, both day/night, plus Undertow at 3440 in both modes. Three additional screenshots cover keyboard help, rejection and already-fixed dialogs.
- **351 DOM measurements** passed: document width, overlapping sibling controls/text containers, child spill outside cards, and clearance below the top bar. Zero browser JavaScript errors.
- Real keyboard input proved `J`, `K`, `?`, `Escape`, `R`, `X`, and `A`. Typing a decision key into a reason/commit field did not submit a decision. Each saved decision appended a human section, changed the status and left exactly one record in the right folder.
- A real file change under the temporary machine refreshed the browser through SSE without reloading. Every static view rendered; disabled controls and decision keys did not write.
- The world picker and day/night controls changed the real page.
- HTTP integration suite passed through the project test runner (Bun's node:test compatibility); its server, CLI and export subprocesses explicitly use **Node**. Seven subtests cover data/CLI agreement, validation, unsafe files, all decisions, failed-fix rework (including a later CRLF review), nested SSE and export safety.
- Both real, non-demo configurations started successfully: the template read four runs/four cells, and the grown SoulStack app read four runs/ten cells. Their missing machine folders correctly produced an empty machine rather than hiding the patrol views.
- `node --check` passed on every `.js` and `.mjs` under the skill app, grown app and static export, plus `skills/immune-system/machine/board.mjs`.
- Both plain and JSON board output matched a saved pre-refactor CLI byte for byte. `git diff --check` passed.

Screenshots and the per-view geometry receipt go to the folder given to `proof-browser.mjs` (by default `soulstack-immune-shots` in the system's temporary folder), including `proof.json`. Images were saved for the lead, **not visually inspected**; geometry is not a substitute for that human review. No dedicated browser tool was exposed in this session, so Playwright drove a real headless Chromium browser instead. The app itself has no Playwright dependency.

## Commands

From the SoulStack root:

```sh
node --test skills/immune-system/app/proof.test.mjs

# Optional verification tooling, outside the product:
npm install --prefix /tmp/soulstack-immune-browser --no-package-lock --no-audit --no-fund playwright

node skills/immune-system/app/server.mjs --export site/public/immunity
PLAYWRIGHT_MODULE=/tmp/soulstack-immune-browser/node_modules/playwright/index.mjs \
  node skills/immune-system/app/proof-browser.mjs /tmp/soulstack-immune-shots

find skills/immune-system/app immune/app site/public/immunity -type f \
  \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
node --check skills/immune-system/machine/board.mjs
git diff --check
```

The browser proof starts Node on a free port against a disposable demo copy and stops its server and browser in `finally`. Its read-only static server and temporary files are also cleaned. The canonical demo remains at 20 records. No commits, pushes, stashes, resets or cleans were run.

## Failures found and resolved during proof

- HTTP: `0 !== 20`. The inherited argument parser skipped the first config filename when `--export` was absent. Fixed the argument condition.
- HTTP: `200 !== 404` for `/server.mjs`. Added a browser-asset allowlist; config/server/machine files cannot be served as static assets.
- Browser: `Cannot set properties of null (setting 'textContent')`. The motion control selector also matched the root's `data-motion` attribute and replaced the document. Scoped the selector to the button. A malformed intermediate CSS selector was corrected before the passing run.
- Browser live assertion: `page.waitForFunction: Timeout 30000ms exceeded`. A newly filed record was outside Overview's five-row preview. Corrected the proof to assert the actual live queue-count change, not an offscreen preview item.
- Mixed-runtime CLI comparison: `ERR_ASSERTION`, claimable ids ordered differently by Bun and Node. Both subprocesses now use Node, matching the supported app runtime. The CLI logic itself was not sorted or otherwise changed.

All final checks above passed. Typecheck/build are not applicable to this dependency-free, unbuilt JavaScript app; no unrelated workspace checks or SoulStack's container patrol were run.

## Commits, GitHub issues and the sample-project banner

- `node --test skills/immune-system/app/proof.test.mjs`: 8 passed, 0 failed. New assertions: the demo returns eight commits, `aaaaa19` closes `c02-h09-1` through the record's `## Landed` hash, a docs commit closes nothing, eight issues (five open) with no links, and the static export carries both lists.
- SoulStack's own config reads `git log` for the last day (three commits) and reports the missing issues snapshot instead of inventing one.
- Browser: Overview, Commits and GitHub issues at 1440 wide in Undertow night and 390 wide in Water day, with no sideways scroll.
