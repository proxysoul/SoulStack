# Immune console

A plain Node server and plain browser JavaScript. No install, network fonts or build step is needed to run it.

```sh
node immune/app/server.mjs immune/app/immune.config.json
IMMUNE_PORT=4318 node skills/immune-system/app/server.mjs --demo
node skills/immune-system/app/server.mjs --export site/public/immunity
```

Run from the project root. `IMMUNE_PORT=0` chooses a free port and prints the address. The server binds only to `127.0.0.1`.

## Views

Overview starts with one sentence about the human queue and the fixed and guarded summary, then shows where every record is, from new report to guarded, with the reports thrown out on review below. Its secondary navigation retains Health (checks by platform and front door, families, failures, coverage holes and run history), Runs (expandable), Cells (grown/stem), Findings and Explorations. Records puts new reports, failed fix reviews, security and data loss first. Opening a record shows all six life steps, the recorded actors and escaped, readable markdown. Unknown actors are explicitly “Not recorded”.

Triage shows one record. `A` approves, `R` asks for a rejection reason, `X` asks for the fixing commit, `J`/`K` move, `?` shows all keys and `Escape` closes dialogs. No decision shortcuts fire while typing. Successful decisions advance the queue; errors stay visible. Static exports are read-only, including keyboard shortcuts.

Machine has Cycles (hunters, lenses and stage outcomes), Commits (what landed in the last `commitDays` days and the records each commit closed), Guards (proof and originating record), Antigen census (floor/latest/delta, including unknown counts), GitHub issues (a read-only snapshot, open first) and Board (counts, claimable work, duplicates and stale claims). The CLI and server both import `app/board.mjs`. Its CLI output and claim rules are unchanged.

A commit closes a record when its hash starts with a hash in the record's `## Landed` or `## Decision` section, or when its message names the record's id (`c03-h12-1`). The console never calls GitHub: save a snapshot with the GitHub CLI and it appears, and refreshes when the file changes.

```sh
gh issue list --state all --limit 200 --json number,title,state,url,labels,createdAt > immune/github/issues.json
```

When the config is a demo, a sample-project banner says so on every view and links to the skill.

All six SoulStack worlds, day/night and reduced motion are local. Choices are remembered in `soulstack-world`. Hash routes work on ordinary static hosts.

## Files and configuration

`immune.config.json` resolves paths from the working directory. `machine` defaults to `immune/machine`, `issues` to `immune/github/issues.json` and `commitDays` to 1. `commits` points at a JSON list of `{ "hash", "author", "at", "subject" }` to use instead of `git log`; the demo uses it. The existing `results`, `cells`, `findings`, `explorations`, `commands` and `keepRuns` settings remain supported. Commands are explicitly configured by the project; they run through the existing streaming log. A recursive watcher uses the existing `api/events` SSE refresh, including nested cycle plans and a configured folder that does not exist yet at startup.

Machine folders are `found`, `ready`, `rejected`, `verified`, `fixed`, `guarded`, `claims/<role>/<id>`, and `cycles/<id>/plan.json`. A record is markdown with the machine record template's title, metadata and sections. A cycle plan has a `hunters` array (or keyed object), each with `id`/`prefix`, `area`, `lens` and `files`. The record's `- cycle:` or its `<cycle>-h...` id associates it with the plan.

Optional `guards.json` is an array (or `{ "guards": [...] }`) of `{ "name", "record", "description", "status", "proof" }`. Guarded records supply guards when no registry entry exists. `antigens/floor.json` and `antigens/latest.json` are objects mapping pattern names to counts. Missing files are honest empty states, not fabricated results; malformed files produce a visible read error.

## Human decision contract

`POST /api/decision`, JSON body:

```json
{
  "path": "found/c01-h01-1.md",
  "version": "the record's SHA-256 from api/state",
  "decision": "reject",
  "reason": "Why this report should not be fixed"
}
```

Send the `x-immune-token` value returned by the local `GET /api/state`. Only `approve`, `reject`, and `already-fixed` are accepted. Reject needs a nonempty single-line reason (maximum 2,000 characters); already-fixed needs `commit` (7–64 hexadecimal characters). Approval records a default reason if one is not supplied.

The endpoint validates the local host, same-origin requests, token, JSON content type and an 8 KiB body limit. Only markdown basenames under open stages are allowed. Absolute paths, traversal, symlinked files/folders, hardlinked records, duplicates, stale content versions and records not waiting for a human are refused. An atomic per-record `claims/decision/<id>` directory serializes human decisions. A surviving lock after an interrupted process requires the lead's inspection; the server never silently steals it.

Each decision appends `## Decision` with decision, reason, `who: human`, ISO time and (when supplied) commit. It changes only the metadata status plus new sections, preserving the earlier evidence. Approval goes to `ready/`; a failed fix stays `fix-rejected` so rework is claimable, and a written fix or verified record retains its review/landing stage. Rejection goes to `rejected/`. Already-fixed adds `## Landed` and goes to `fixed/`, never pretending a guard exists. Records move rather than copy. Conflicts return 409; validation errors return 400. Only browser assets are served, not server code, config or machine files.

## Demo and export

`demo/` is **Lantern**, a fictional shared notebook: 20 original records, two cycles, three claims, guards, a census (including one rise), eight commits, eight GitHub issues, runs, cells, a finding and an exploration. `node skills/immune-system/app/demo/generate.mjs` regenerates it. This is fictional evidence, not a claim about SoulStack's test coverage.

`--demo` runs those fixtures. `--export <directory>` deliberately exports the demo, all views, fonts and themes, with no token, commands or private host paths. Use `--live-export` with `--export` explicitly for a snapshot of configured project data. Read-only exports never open an event stream or submit decisions.

## Verification

`proof.test.mjs` is a front-door HTTP integration test, not a copy of the implementation. It starts a real Node server over a disposable demo copy. `proof-browser.mjs` drives Chromium, measures layout, checks decisions and refresh, and captures every view. Playwright is verification tooling only; install it outside the product and set `PLAYWRIGHT_MODULE` to its module entry if it is not otherwise available.

```sh
node --test skills/immune-system/app/proof.test.mjs
PLAYWRIGHT_MODULE=/tmp/soulstack-immune-browser/node_modules/playwright/index.mjs \
  node skills/immune-system/app/proof-browser.mjs /path/to/app-shots
```

See `PROOF.md` for the results. Test servers, browsers and temporary machine copies are cleaned in `finally`. The generated screenshots are intentionally kept for human review.
