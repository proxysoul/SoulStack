# SoulStack for agents

You are working with SoulStack, a collection of skills, Empryo presets and prompts. This file tells you how to use it and how to add to it.

## Setting it up for a user

When the user asks you to set up SoulStack, run the setup script and show its output. It asks nothing, prints plain lines when run by an agent, and backs up every file it changes to `<file>.bak-<time>`.

- macOS and Linux: `curl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh`
- Windows: `powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.ps1 | iex"`

It clones SoulStack to `~/dev/SoulStack` (or updates it), links the skills, and adds `guides/takeaways.md` as a marked block to the global rules of each agent it finds (Empryo, Claude Code, Codex, Copilot CLI, pi, OpenCode) and links the immune cells from `agents/` into the agents that support custom agents. Existing rules are kept. Empryo parts are skipped when Empryo is not installed.

Presets are optional and change the user's models, theme and permissions: add them only when the user asks for ProxySoul's setup, by running the script from the clone with `--presets proxysoul,proxysoul-mcp` (`-Presets` on Windows). Add `proxysoul-trusted` only when they explicitly ask for full autonomy, and say what it turns on. `proxysoul-mcp` needs `CLOUDFLARE_API_TOKEN`.

Setup adds a `soulstack` command. When the user asks to update SoulStack, run `soulstack update` (or the one-liner again) and show its output: it pulls the latest version, refreshes skills and rules, and lists what changed. `soulstack check` shows whether an update is out, `soulstack remove` takes SoulStack out again. If the user only uses GitHub Copilot CLI, the plugin is an alternative to the script: `copilot plugin marketplace add proxysoul/SoulStack`, then `copilot plugin install soulstack@soulstack`. Use one or the other, not both, or the takeaways load twice. If the user only wants some skills, use `npx skills add proxysoul/SoulStack -s <skill> -a <agent> -y` (`-a universal` for Empryo).

## Using the stack

- **Skills** live in `skills/<name>/SKILL.md`. The frontmatter `description` says when a skill applies. When the user's task matches, read the whole `SKILL.md` and any files it points to under `reference/` or `scripts/`, then follow it. Do not follow a skill from memory or from its description alone.
- **Presets** in `plugins/presets/*.json` change Empryo settings. Load one with `empryo --plugin <path>` or through the `presets` array in a config file. Never copy their values into the user's config by hand.
- **Prompts** in `prompts/*.md` are complete briefs. Fill in the bracketed placeholders from the user's project; ask only for what the code cannot tell you.
- **Guides** in `guides/` are rules for you. Read `guides/takeaways.md` before any task and follow it; `guides/agent-guidance.md` covers working habits, `guides/mote-mascot.md` how to build a mascot.
- **Immune cells** in `agents/` are stem cells: general versions installed globally. The immune system is grown per project with the `immune-system` skill, and grown copies of the cells live in the project (`.agents/agents/` for Empryo, `.claude/agents/` for Claude Code) with a filled `## This project` section. SoulStack's own grown cells are in `.agents/agents/`.
- **Design systems** are built by the agent: when a project has UI and no `design_system/`, run the `ensoul` skill before any visual work.

## Adding to the stack

1. Start from the matching folder in `templates/`.
2. Names are lowercase with hyphens, and the folder name equals the `name` in the frontmatter or JSON.
3. A skill's `description` says what it does and when to use it, in one or two sentences, because agents choose skills from it.
4. Keep `SKILL.md` focused: steps and rules. Move long background into `reference/`, runnable helpers into `scripts/`.
5. Nothing confidential: no API keys, tokens, private URLs, customer data or private screenshots.
6. Add a row to the catalog in `README.md`. When `guides/takeaways.md` changes, copy it to `com.github.copilot/rules/soulstack.instructions.md` so the Copilot plugin matches.
7. Never rewrite published history: users update with `soulstack update`. Add commits on top and raise `version` in `plugin.json` and `.github/plugin/marketplace.json` for every release; commit subjects are what users see as "new" when they update, so write them for users.
8. Commit one topic at a time with a short scoped conventional subject (`feat(skills): add <name>`, `fix(plugins): …`) and a body of short scoped one-liner bullets (`- skills/<name>: what changed`).

## Layout

```
skills/<name>/SKILL.md            required
skills/<name>/reference/*.md      optional background
skills/<name>/scripts/*           optional helpers
plugins/presets/<name>.json       Empryo preset: name, version, description, config
prompts/<name>.md                 standalone prompt
templates/                        copy these to start
guides/<name>.md                  takeaways, working habits, mascot how-to
assets/                           images used by the README and guides (kept out of the Genome by .empryoignore)
morphs/                           Empryo morphs
agents/<name>.md                  immune cells (Claude Code, Empryo, Copilot and OpenCode agent format)
immune/                           SoulStack's own immune system: setup and update tests for Linux and Windows
design_system/                    SoulStack's design system, built with ensoul; the site follows it
site/                             the SoulStack website and docs (bun run dev); docs also ship as Markdown and llms.txt for agents
EMPRYO.md                         SoulStack's own rules; templates/EMPRYO.md is the template for other projects
plugin.json                       Copilot plugin manifest (Agent Plugins 1.0): skills/ plus com.github.copilot/rules/
.github/plugin/marketplace.json   Copilot marketplace listing the plugin
scripts/setup.sh, setup.ps1       set everything up on macOS and Linux, or Windows: links skills, adds the takeaways to each agent, adds the soulstack command (update, check, remove)
scripts/install.sh                links skills into an agent's skills folder
scripts/export-config.ts          regenerates plugins/presets from ~/.empryo/config.json
```
