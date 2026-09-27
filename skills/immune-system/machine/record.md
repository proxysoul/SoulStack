# <what goes wrong, for whom, in one line>
- status: found
- area: <area from the cycle plan>
- file: <path>:<line>
- severity: security | data-loss | crash | hang | leak | wrong-behavior | ux
- kind: bug | wiring | failure-path | hand-rolled | fragile
- lens: <lens from the cycle plan>
- platform: all | macos | windows | linux
- door: <front door: cli, terminal ui, desktop, web, api, installer>
- source: <hunter id> · <model> <effort>

## Bug
What goes wrong, when, and who feels it.

## Trigger
The exact steps or input, on a real front door.

## Evidence
At most 15 quoted lines with path:line, and the reasoning from trigger to wrong result.

## Reproduction
The command, its exit code and the decisive output line, run in isolation.

## Guard idea
The rule that would block the whole class, or "none" and why.

<!-- The reviewer appends: -->

## Verdict
APPROVED | REJECTED: one line why.

## Reproduction (review)
The reviewer's own run: commands, exit codes, decisive output.

## Fix plan
Root cause, where, and how to prove the fix on a real front door.

## Guard
Rule name `m-<slug>`, the pattern sketch, one bad and one good snippet.

<!-- The fixer appends, then sets status: fixed-unverified and adds `- touched: <paths>`: -->

## Fix
Root cause and the change, with path:line.

## Proof
Commands, exit codes and decisive output, before and after.

## Guard
The rule, its fixtures, and the output that proves bad flagged, good clean, zero product matches.

<!-- The fix reviewer appends: -->

## Fix review
PASS | FAIL, the commands it ran, and for FAIL each defect at path:line with the right fix.

<!-- The lead appends when it commits, then moves the file to fixed/ or guarded/: -->

## Landed
Commit <hash>, guard <rule> registered.
