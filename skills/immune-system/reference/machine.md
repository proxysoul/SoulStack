# The bug machine

Patrols and explorations prove a product works. The bug machine is for the other job: many agents
hunting a large code base at once, and every report they file going through the same checks until it
is fixed, guarded and committed, or rejected with a reason. Grow it when one agent can no longer read
the whole code base, after a burst of agent-written code, or before a release.

It was built for Empryo and ran there at 312 hunters in one cycle: 213 records filed, 189 approved,
16 rejected, 6 out of scope. Nothing below needs Empryo, only agents that can run shell commands and
write files.

## A record is a file, and its folder is its state

There is no database and no orchestrator process. A bug is one markdown file. The folder it sits in
is its stage, and a `- status:` line under its title says where it is inside that stage.

```
immune/machine/
  found/        hunters file here
  ready/        approved; fixes happen here (status: approved, fixed-unverified, fix-rejected)
  rejected/     with the reason
  verified/     a fix passed its review, not committed yet
  fixed/        committed; the record names the commit
  guarded/      committed and a guard is live
  claims/       one empty directory per claim (see Claims)
  cycles/<id>/  plan.json for each hunting cycle
  repro/<id>/   reproduction scripts and their output
  briefs/       one brief per role
  ledger.json   who reviewed what, keyed by record id
```

The rules that keep it honest:

- **Exactly one copy.** A role moves the file; it never copies it. The board flags an id found in two
  folders.
- **The file is the truth.** Not an agent's final message, not a chat log. Final messages get lost
  when sessions end or contexts are compacted; the record survives.
- **Append, never rewrite.** Each role appends its own section and changes only the status line. Earlier
  sections stay as evidence.
- **Ids never change.** `<cycle>-h<hunter>-<n>`, for example `c05-h123-2`. A record that splits into
  several claims becomes `<id>-1`, `<id>-2`.

The record shape is in [../machine/record.md](../machine/record.md).

## Roles

| Role | Takes | Writes | Moves to |
|---|---|---|---|
| Hunter | one slice of the code and one lens | `found/<id>.md` with Bug, Trigger, Evidence, Reproduction, Guard idea | `found/` |
| Reviewer | an unclaimed record in `found/` | Verdict, Reproduction (its own), Fix plan, Guard | `ready/` or `rejected/` |
| Fixer | an approved record, or one whose fix review failed | Fix, Proof, Guard; `status: fixed-unverified` | stays in `ready/` |
| Fix reviewer | a record with `status: fixed-unverified` | Fix review: PASS or FAIL with each defect at its line | `verified/`, or back with `status: fix-rejected` |
| Lead | everything verified | commits, registers guards, closes records | `fixed/`, `guarded/` |
| Human | new reports and flagged records | a decision with a reason | wherever the decision says |

Briefs for each role are in [../machine/briefs](../machine/briefs). Copy them into
`immune/machine/briefs/` and grow them: the project's front doors, platforms, commands, the rules file,
the guard tool, the things that are not findings (deprecated features, generated folders).

### Models

- The hunter and the reviewer never run on the same model. Different models miss different things,
  and a reviewer that shares the hunter's blind spot approves its fan fiction.
- The fixer runs the strongest coding model you have, at high effort. Fixes are where cheap models
  cost the most.
- The fix reviewer is a different top model from the fixer.
- Small, fast models are fine for hunters at scale if every report must be reproduced before filing.
  The reproduction rule is what keeps a cheap hunter honest, not the model.

## Claims and pools

Agents claim work with one atomic command:

```sh
mkdir immune/machine/claims/review/<id>      # a reviewer claims a found record
mkdir immune/machine/claims/fix/<id>         # a fixer claims an approved record
mkdir immune/machine/claims/fix/<id>-r<n>    # rework after the nth failed fix review
mkdir immune/machine/claims/fixrev/<id>-<n>  # review of the nth fix
```

`mkdir` succeeds for exactly one caller, so two agents racing for the same record cannot both win. No
queue, no lock files, no scheduler. The suffixes let a record be claimed again after a rework without
anyone deleting old claims.

Run **pools**, not one agent per record. A pool agent loops:

1. List claimable records: right folder and status, no claim, and last modified at least two minutes
   ago, so a writer has finished.
2. Claim one with `mkdir`. If it fails, take the next.
3. Do the job, append the section, move the file.
4. Go back to 1. When nothing is claimable, sleep and look again. Stop after N records or M idle
   minutes, so a pool never runs forever.

Pools keep going while hunters are still filing, and a pool that dies loses one record at most.

**After a restart**, every running agent is gone but every claim directory is still there. The lead
clears claims whose record has not moved since the claim was made, then starts new pools. Nothing
else needs recovering, because the files are the state.

## A hunting cycle

1. **Slice the code.** Areas small enough for one agent to read every line: a package, a feature, a
   front door. Big files get their own slice.
2. **Pick lenses.** One kind of bug per hunter keeps reports sharp:
   - wiring: built but not connected, an event nobody handles, two sources of truth;
   - config: a setting read nowhere, not applied live, wrong in one scope;
   - platform: paths, quoting, shells, line endings, process spawn and kill, per OS;
   - failure paths: an error swallowed, shown as success, a state that never rolls back;
   - weird behaviour: double actions, lost input, wrong order, notices that lie;
   - parity: the same command on every front door gives the same result and the same errors;
   - security and data loss.
3. **Write `cycles/<id>/plan.json`**: one hunter per slice and lens, each with an id prefix, the
   files, the lens and the source line it writes into its records. See
   [../machine/cycle.json](../machine/cycle.json).
4. **Launch the hunters, then the reviewer pools, then the fixer pools.** Each pool starts as soon as
   there is anything to claim.
5. **Close the cycle** when `found/` is empty, nothing is claimed, and every approved record is fixed,
   deferred with a reason, or waiting on a human.

Start with 16 hunters and prove the loop end to end: one record found, reviewed, fixed, reviewed,
committed and guarded. Then go to hundreds.

### Reproduce before filing

A hunter files a bug only after it has made it happen, in isolation:

- a fresh temporary `HOME` and `TMPDIR`, never the developer's real config or credentials;
- no system credential store, no project `.env` (Bun loads it by default: pass `--no-env-file`);
- no public network, and the paid dependency faked at the network boundary;
- the product's real front door, or a script under `repro/<id>/`;
- the command, its exit code and the decisive output line written into the record.

A suspect that could not be reproduced is not filed. The reviewer runs the reproduction again itself
and does not trust the hunter's output.

## Every fix ships a guard

A fix without its guard is not done. A guard makes the same mistake impossible to merge again,
anywhere in the code base, not just in the file that had it.

1. **A lint rule, when the mistake has a shape.** Write it in the project's linter: a GritQL plugin
   for Biome, an ast-grep or Semgrep rule, a custom ESLint or oxlint rule, a clippy lint. Name it
   `m-<slug>`, make it an error, and make its message say what to do instead.
2. **Two fixtures.** `bad` is the real bug, reduced; `good` is the intended pattern.
3. **Prove it three ways**: the rule flags `bad`, passes `good`, and finds zero matches in the
   product. Matches in the product are the same bug somewhere else: fix them in the same change.
4. **When no syntax rule can express it**, use a type that makes the bad state unrepresentable, or an
   assertion at the boundary plus an end-to-end check. Say why in the record.

Only the lead registers rules in the linter config, so two fixers never fight over it.

## The antigen census

Some bad patterns are too common to fix in one go: swallowed promise rejections, empty catch
blocks, unsafe casts, fixed sleeps standing in for a condition, suppression comments. Count them.

- A census script counts each pattern per area and writes the totals.
- The counts are committed as a **floor**. The check fails when any count rises above it.
- The floor goes down when the code gets better. It goes up only through a deliberate commit that says
  who raised it and why.
- The immune app shows the floor next to the latest census, and a new site names its file.

The census catches the long tail the guards were never written for.

## The lead

The lead is the only agent that commits. Its jobs:

- plan cycles and launch pools;
- register proven guards in the linter config;
- run the full checks before each commit, then commit one topic at a time, staging explicit paths;
- close records: move them to `fixed/` or `guarded/` with the commit hash;
- clear stale claims after a restart;
- read why a gate keeps saying no, and fix the brief when the gate is wrong;
- keep the board honest: no record in two places, no approved record without an owner.

The working tree is shared. No agent stashes, resets, cleans or checks out, because that deletes
other agents' uncommitted work. Fixers re-read a region right before each edit of a shared file and
never reformat code they did not change.

## The human

The machine decides almost everything. It hands you what it should not decide alone:

- new reports nobody has reviewed yet;
- records whose fix review failed, or where two reviewers disagree;
- anything with security or data-loss severity.

The immune app's triage view shows them one at a time, with keys: approve, reject with a reason,
already fixed (with the commit), skip. Filing anything publicly is always a human step.

## Scaling

More agents find more bugs, and also find the limits of your own tooling first.

- **Per-process HTTP pools.** Bun allows 256 open fetch requests per process by default
  (`BUN_CONFIG_MAX_HTTP_REQUESTS`, read once at startup). Agent 257 waits for a free slot and shows
  zero steps. Set it in the environment of the process that launches the agents.
- **Provider rate limits** and per-key concurrency.
- **Your agent host's own concurrency cap.** Make sure "unlimited" means unlimited, and that changing
  it applies to agents already queued.
- **Notification floods.** Group back-to-back agent notices into one row per burst.
- **Disk.** Repro folders fill up; ignore generated homes and caches in git.

Go 16, then 64, then hundreds, and watch the board at each step.

## The board

`node machine/board.mjs [immune/machine]` prints the counts per stage and status, the claimable work
per role, duplicates and stale claims. The immune app's Machine view shows the same, live, with
triage.
