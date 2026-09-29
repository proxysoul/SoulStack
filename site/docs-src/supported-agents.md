---
title: Supported agents
summary: Where SoulStack writes for Empryo, Claude Code, Codex, Copilot CLI, pi, OpenCode and Gemini CLI, and how each is detected.
order: 4
---

# Supported agents

Setup detects an agent by its command on your `PATH`, or by a file the agent itself writes in its
folder. An empty folder is not enough, so a folder another tool created does not count. It skips
agents you don't have. All paths are defaults in your home folder; setup follows each agent's own
variable when you set it (see [setup](setup.md#environment)).

| Agent | Detected by | Rules | Skills | Immune cells |
|---|---|---|---|---|
| Empryo | `empryo`, `~/.empryo/config.json`, the app | `~/.empryo/EMPRYO.md` | `~/.agents/skills` | `~/.agents/agents` |
| Claude Code | `claude`, `settings.json`, `CLAUDE.md` or `projects/` in `~/.claude` | `~/.claude/CLAUDE.md` | `~/.claude/skills` | `~/.claude/agents` |
| Codex | `codex`, `config.toml`, `auth.json`, `AGENTS.md` or `sessions/` in `~/.codex` | `~/.codex/AGENTS.md` | `~/.agents/skills` | not supported (Codex agents are TOML) |
| Copilot CLI | `copilot`, `config.json`, `copilot-instructions.md`, `session-state/` or `agents/` in `~/.copilot` | `~/.copilot/copilot-instructions.md` | `~/.agents/skills` | `~/.copilot/agents/*.agent.md` |
| pi | the `pi` coding agent command, `~/.pi/agent` | `~/.pi/agent/AGENTS.md` | `~/.agents/skills` | not supported |
| OpenCode | `opencode`, `opencode.json`, `AGENTS.md` or `agents/` in `~/.config/opencode` | `~/.config/opencode/AGENTS.md` | `~/.agents/skills` | `~/.config/opencode/agents` (and `agent/` when the older layout exists) |
| Gemini CLI | `gemini`, `settings.json`, `GEMINI.md` or `oauth_creds.json` in `~/.gemini` | `~/.gemini/GEMINI.md` | `~/.agents/skills` | not supported |

Codex and pi read `AGENTS.override.md` instead of `AGENTS.md` when it exists in the same folder.
Setup still writes the block and reports the rules as `hidden`, so you can move them over.

The immune cells set `include-custom-instructions: true`, so Copilot CLI (1.0.86 and later) gives
them your rules too.

Presets are Empryo only. Setup counts a preset as already added when the config names the same file
by any path, including `~` or a link.

## Historical checks from SoulStack 1.2.0

This table preserves the checks recorded before the marketing skill was added; it is not
a current skill inventory or a fresh compatibility test. Each agent was asked, after setup,
whether its instructions contain the takeaways, which of the then-available skills it has,
and which immune cells it can call:

| Agent | Rules | Skills | Immune cells |
|---|---|---|---|
| Empryo 3.8 | yes | ensoul, immune-system | all cells found |
| Claude Code 2.1 | yes | ensoul, immune-system | all cells listed |
| Codex 0.154 | yes | ensoul, immune-system | not supported |
| OpenCode 1.18 | loaded | loaded | all cells in `opencode agent list` |
