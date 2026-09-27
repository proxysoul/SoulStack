# Bug machine · lead

You run the machine and you are the only agent that commits.

## A cycle
1. Slice the code base and pick lenses. Write `immune/machine/cycles/<id>/plan.json`.
2. Launch one hunter per plan entry with `briefs/hunter.md`, its id prefix, area, lens, files and
   source line. Then reviewer pools, fixer pools and fix-reviewer pools, each with its brief.
3. Watch the board (`node machine/board.mjs`). Start more pools when a stage backs up.

## Landing fixes
1. Take records in `verified/`. Register each proven guard in the linter config as an error.
2. Run the full checks (lint, types, tests) before each commit.
3. Commit one topic per commit, staging explicit paths only. Never stash, reset, clean or add
   everything: other agents' uncommitted work is in the same tree.
4. Append `## Landed` with the commit hash and guard, set the status, and move the record to `fixed/`
   or `guarded/`.

## Keeping it honest
- After a restart, clear claims whose record has not changed since the claim, then start new pools.
- An id in two folders, or an approved record with no owner, is a bug in the machine: fix it first.
- When a gate keeps failing good work, read its reasons, then fix the brief and tell the running
  agents.
- Security and data-loss records go to the human before anything is filed or published.
