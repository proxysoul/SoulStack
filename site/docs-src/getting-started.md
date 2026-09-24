---
title: Getting started
summary: Install SoulStack for every agent on your machine with one command, then check it worked.
order: 1
---

# Getting started

SoulStack adds working rules, skills, immune cells and optional presets to the coding agents you
already use: Empryo, Claude Code, Codex, Copilot CLI, pi and OpenCode.

## Install

macOS and Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.ps1 | iex
```

Or ask your agent: "Set up SoulStack from github.com/proxysoul/SoulStack and follow its AGENTS.md."

## What happens

1. SoulStack is cloned to `~/dev/SoulStack` in your home folder (set `SOULSTACK_DIR` to choose
   another place).
2. Setup finds the agents you have and writes only where each one reads. See
   [supported agents](supported-agents.md).
3. Every file it changes is backed up first to `<file>.bak-<time>`.
4. A `soulstack` command is added so you can update later.

## Check it

```bash
soulstack check
```

Every line should say `same`. Restart your agent (Empryo picks up the rules on the next message
without a restart).

## Next

- [Setup options](setup.md) for presets, a custom skills folder and plain output.
- [Updating](update.md).
- [The immune system](immune-system.md), SoulStack's way of testing a product.
