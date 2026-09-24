# SoulStack

SoulStack is ProxySoul's agent stack: skills, immune cells, working rules and Empryo presets, plus the
scripts that install and update them for Empryo, Claude Code, Codex and Copilot. This file is
SoulStack's own rules, filled in from `templates/EMPRYO.md` the way that template asks any project
to do it. `AGENTS.md` (and `CLAUDE.md`) explain how to use and extend the stack.

## How we work

- **Finish the job.** A change to the stack is done when the scripts, the site, the README, the
  Copilot plugin and the agents' rules all agree with it.
- **Reproduce before fixing** and **prove with before and after**, on the platform that broke.
- **Prove it where people use it**: the setup script run the way users run it (piped, from a
  clone, by an agent), the site in a browser, the plugin installed from GitHub.
- **Show, don't tell.** Report with screenshots of the site and the script's real output.
- **Use memory.** Read it before starting; save decisions and traps when you finish.

## Rules this repo keeps

- **Never rewrite published history.** Users update with `soulstack update`. Add commits on top and
  raise `version` in `plugin.json` and `.github/plugin/marketplace.json` for every release. Commit
  subjects are what users see as "new", so write them for users.
- **Nothing private.** No tokens, private URLs, owner's sessions, customer data or screenshots of
  private windows. Presets read secrets from the environment (`${CLOUDFLARE_API_TOKEN}`).
- **Mote belongs to Empryo.** The mascot art under `assets/` and `site/public/` is not covered by the
  MIT licence; never ship full sprite sheets.
- **One source per rule.** `guides/takeaways.md` is the source. Copy it to
  `com.github.copilot/rules/soulstack.instructions.md` in the same change; the scripts read the
  guide directly.
- **Setup never asks and never overwrites.** Every file it changes is backed up first; SoulStack's
  text lives only between `<!-- soulstack:start -->` and `<!-- soulstack:end -->`.
- **Agents run the script too.** Output must stay plain when stdout is not a terminal: no colour,
  no animation, one line per change.
- **Both scripts move together.** A change to `scripts/setup.sh` has its twin in
  `scripts/setup.ps1`, tested on both.
- **Paths in copy are the user's, not ours.** When the site or docs mention a path, say it is a
  default in the user's home folder.

## Traps

- `String.replace` in a Bun edit script treats `$'` and `$&` in the replacement as patterns and
  silently corrupts PowerShell. Pass a function as the replacement.
- Windows PowerShell 5.1: native stderr is dropped unless redirected; a `.cmd` shim that deletes
  itself prints "The batch file cannot be found" unless the line ends with `& (goto) 2>nul`.
- Git on Windows checks symlinks out as text files, so the Copilot rules file is a copy, not a link.
- Copilot plugin installs are cached; reinstall to pick up local edits.

## Immune system

- Entry point: `immune` (containers, every platform reachable), `immune:smoke` (Alpine only, fast).
  Run them through the `project` tool.
- App: `immune:app` on http://127.0.0.1:4177 (SoulStack's design system, runs smoke or full from the
  page). Every run also exports a snapshot to `site/public/immunity/`, which the website serves as
  "View SoulStack immunity"; `immune:report` refreshes it alone.
- After touching `scripts/setup.sh` or `scripts/setup.ps1`, run `immune:smoke`; before a release, run
  `immune` and the Windows scripts, and say which platforms were not covered.
- Every confirmed bug becomes a check in `immune/`; every claim meets `negative-selection` first.
- Grown cells for this repo: `.agents/agents/`. Findings: `immune/findings/`.

## Commands

Run them through Empryo's `project` tool:

- `dev`: the site at http://localhost:5190 (`site/`).
- `build`, `typecheck`: the site.
- `test`: setup and update tests in Linux containers (`immune/run.sh`); Windows steps are in
  `immune/README.md`.
- `lint`: syntax check of the shell scripts.

## Design

The site follows `design_system/`. Read `design_system/README.md` before any visual change, and look
at every world in dark and light at 390, 1440 and 3440 wide before calling it done.

## Commits

A short scoped conventional subject (`feat(skills): …`, `fix(scripts): …`) with a body of short
scoped one-line bullets. Commit and push only when the owner asks.
