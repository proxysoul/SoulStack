# Designing the immune system

A shape that works for any product with more than one front door or platform. Adapt the names to the
project's language and tooling; keep the ideas.

## Layout

```
immune/
  README.md        how to run it, what each platform can prove, traps already paid for
  run.*            the runner: selects checks, runs each on each target and front door, writes a report
  registry.*       where checks are listed and selected (--checks=family/, --tier=smoke, --list)
  types.*          the vocabulary: Check, Target, Door, Tier, Verdict, Evidence, RunEnvelope
  checks/          one file per family: boot, install, sessions, editing, settings, visual, ...
  targets/         one per platform: local, container, remote (SSH), each with the same interface
  doors/           one driver per front door: headless/CLI, terminal UI (pty), desktop, web, API
  lib/             fake dependency server, golden compare, speed ledger, cleanup, report
  goldens/         committed reference text and images (tracked)
  findings/        confirmed bugs written up for users, ready to file (tracked)
  explorations/    one note per exploration: what was checked, found and ruled out (tracked)
  results/         per-run reports and evidence (ignored)
```

Keep run state (caches, speed ledger, staged builds, scratch workspaces) **outside the repo**, for
example `~/.cache/<product>-immune/`. A fixture workspace nested inside the project's own git tree makes
the product see the wrong repository.

## The pieces

**A check** is data plus one function. The data says what it proves (`guards`), where it runs
(front doors, platforms, tier), what it needs (fake dependency, display, git, network, a clean
machine), and whether it is a known open bug. The function drives the product through a context
object, so one check covers every platform. See [checks.md](checks.md).

**A target** is a platform behind one interface: run a shell command with a timeout, copy a file in,
read a file back, check a path exists. Local machine, a throwaway container, a VM, a remote machine
over SSH. Checks never know which one they are on.

**A door** drives one front door and returns what a person would see: exit code and output for a
CLI, a screen grid for a terminal UI (a real pty plus a terminal emulator library), DOM and native
state for a desktop app (drive the real window, and probe the main process for menus and dialogs
that are not in the DOM), HTTP exchanges for an API.

**Equivalence.** When several doors share one engine, a check marked `equivalent` runs through the
cheapest door and records that it stood in for the others. A `--all-doors` flag turns substitution
off. Paint, input and host wiring are never equivalent: they run where they live.

**The subject is the artifact.** On the development machine you may test source or the built
bundle; on other platforms test only what users install. A source tree built for one OS is not an
honest subject on another.

**Fake one thing only.** Put a scripted server at the network edge of the paid or random dependency
and capture every request it receives, so checks can assert on what the product actually sent.
Issue ids and timestamps the way the real service does: a fake that reuses ids hides real bugs.

**An automatic sweep on every result.** Before any check's own assertions, look for the things that
are always wrong: crash traces, unhandled errors in logs, leftover processes, secrets in output,
files written outside the workspace. It catches what nobody wrote a check for.

**Goldens.** Normalise text before comparing (versions, paths, clocks, counts, cost, rotating tips).
Compare a region, not a whole animated screen. Compare images with a tolerance and write a diff
image on failure. A missing golden is written, passed and announced so a human looks at it once.
Updating goldens is a deliberate flag, never automatic.

**Speed ledger.** A check can record a measurement (boot time, request size, memory) with an
absolute budget. The value joins a ledger keyed by check × platform × door × metric, outside the
repo. It fails when over budget, or when it drifts past a tolerance (for example 35%) from the
**median** of at least five earlier samples. Never alarm on the second data point.

**Coverage ratchet.** A patrol says whether the product is healthy today; nothing says whether the
suite still watches what it watched last month. Keep a committed list of load-bearing capabilities,
compute which ones a check actually exercises (by what the check makes the product do, never by
words in its title), and fail when a load-bearing capability loses its last check, loses a platform
it must hold on, or a family guards fewer capabilities than its committed floor.

**Verdicts.** `pass`, `fail`, `known` (a marked open bug still failing), `healed` (a marked bug now
passing: remove the marker), `skip` (with a reason), `error` (the harness failed, not the product).

**The immune app.** `immune/app/` is the immune system's face for developers: a local web app
(`immune:app`) styled with the project's design system that can also start runs and stream their
logs, plus a static export (`immune:report`) for a website. It shows the commit or artifact, the verdict grid (family × platform × door),
red results with links to their evidence, known and healed bugs, the speed table with drift, coverage
holes, and the cells with their last run. Use the project's design system if it has one. Keep the
latest results as JSON (`immune/results/latest.json`) so the page and agents read the same data.

**Report.** One Markdown report per run: verdict table by family × platform × door, every failure
with its `guards` sentence and evidence paths, the speed table, coverage holes, and a cleanup
receipt. A machine-readable JSON beside it for agents.

## Exploration mode

An exploration is a written plan of probes. Each probe has a **hypothesis**, a way to drive the
product, and **expectations as data**: `{ what, op, value, because }`. Refuse a probe without a
hypothesis and an expectation without a `because`. An expectation whose subject was never observed
**fails**: evaluating against nothing is how a suite reports green for a probe that never ran.

**Promotion** compiles a confirmed probe's own expectations into a permanent check, one assertion
per expectation, so the check can never test something weaker than the finding that justified it.

## Clean-machine checks

Install, first run and upgrade happen before the product exists on the machine. Give those checks a
throwaway clean machine (a stock container image), run the installer exactly as it ships, and serve
the download from a local origin you control. A verification step (signature, checksum) is only
proven by a **refusal**: feed it a wrong key, a missing signature, a tampered file, and first check
the installer actually ran, because a dead machine also exits non-zero.
