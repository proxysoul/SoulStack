---
title: Setup options
summary: Every flag and environment variable of the setup script, what it writes, and how it behaves when an agent runs it.
order: 2
---

# Setup options

The script is `scripts/setup.sh` on macOS and Linux and `scripts/setup.ps1` on Windows. Both behave
the same way. It asks nothing.

## Commands

| macOS, Linux | Windows | Does |
|---|---|---|
| `soulstack update` (or no command) | `soulstack update` | Get the latest SoulStack and set everything up again |
| `soulstack check` | `soulstack check` | Change nothing; show what is installed and whether an update is out |
| `soulstack remove` | `soulstack remove` | Take SoulStack out; your own rules and files stay |

## Flags

| macOS, Linux | Windows | Does |
|---|---|---|
| `--presets proxysoul,proxysoul-mcp` | `-Presets proxysoul,proxysoul-mcp` | Also add Empryo presets (see [presets](presets.md)) |
| `--skills <folder>` | `-Skills <folder>` | Link skills somewhere other than `~/.agents/skills` |
| `--plain` | `-Plain` | No colour or animation |
| `--check`, `--remove` | `-Check`, `-Remove` | Same as the commands above |

## Environment

| Variable | Default | Does |
|---|---|---|
| `SOULSTACK_DIR` | `~/dev/SoulStack` | Where SoulStack is kept |
| `SOULSTACK_REPO` | the GitHub repo | Where it is cloned from |
| `COPILOT_HOME` | `~/.copilot` | Copilot CLI's folder |
| `XDG_CONFIG_HOME` | `~/.config` | Where OpenCode's folder is looked for |
| `NO_COLOR` | unset | Plain output |

## What it never does

- Overwrite your text: SoulStack's rules live between `<!-- soulstack:start -->` and
  `<!-- soulstack:end -->`; everything else in the file is yours.
- Replace a file or folder it did not create: a skill or agent with the same name that you made is
  kept and reported.
- Change anything without a backup.

## When an agent runs it

Output is plain when it is not a terminal: one line per change, no colour, no animation. Agents
should run it and show the output as is.
