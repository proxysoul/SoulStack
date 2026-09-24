---
title: Supported agents
summary: Where SoulStack writes for Empryo, Claude Code, Codex, Copilot CLI, pi and OpenCode, and how each is detected.
order: 4
---

# Supported agents

Setup detects an agent by its command on your `PATH` or its folder in your home folder. It skips
agents you don't have. All paths are defaults in your home folder.

| Agent | Detected by | Rules | Skills | Immune cells |
|---|---|---|---|---|
| Empryo | `empryo`, `~/.empryo`, the app | `~/.empryo/EMPRYO.md` | `~/.agents/skills` | `~/.agents/agents` |
| Claude Code | `claude`, `~/.claude` | `~/.claude/CLAUDE.md` | `~/.claude/skills` | `~/.claude/agents` |
| Codex | `codex`, `~/.codex` | `~/.codex/AGENTS.md` | `~/.agents/skills` | not supported |
| Copilot CLI | `copilot`, `~/.copilot` | `~/.copilot/copilot-instructions.md` | `~/.agents/skills` | `~/.copilot/agents/*.agent.md` |
| pi | `pi`, `~/.pi` | `~/.pi/agent/AGENTS.md` | `~/.agents/skills` | not supported |
| OpenCode | `opencode`, `~/.config/opencode` | `~/.config/opencode/AGENTS.md` | `~/.agents/skills` | `~/.config/opencode/agents` (and `agent/` when the older layout exists) |

Presets are Empryo only.

## Checked on a real machine

Each agent was asked, after setup, whether its instructions contain the takeaways, which of the
two skills it has, and which immune cells it can call:

| Agent | Rules | Skills | Immune cells |
|---|---|---|---|
| Empryo 3.8 | yes | ensoul, immune-system | all cells found |
| Claude Code 2.1 | yes | ensoul, immune-system | all cells listed |
| Codex 0.154 | yes | ensoul, immune-system | not supported |
| OpenCode 1.18 | loaded | loaded | all cells in `opencode agent list` |
