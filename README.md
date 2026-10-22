<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/mote/mote-dark.gif">
    <img src="assets/mote/mote-light.gif" width="150" alt="Mote, Empryo's mascot, looking around">
  </picture>
</p>

<h1 align="center">SoulStack</h1>

<p align="center">
  <b>ProxySoul × Empryo</b><br>
  The skills, presets, prompts and habits behind Empryo, ready for your own agent.
</p>

<p align="center">
  <a href="https://soulstack.proxysoul.com"><b>Website</b></a>&nbsp;&nbsp;&nbsp;
  <a href="https://soulstack.proxysoul.com/docs">Docs</a>&nbsp;&nbsp;&nbsp;
  <a href="https://soulstack.proxysoul.com/immunity/">Immunity</a>&nbsp;&nbsp;&nbsp;
  <a href="#get-started">Get started</a>&nbsp;&nbsp;&nbsp;
  <a href="#pick-a-skill">Skills</a>&nbsp;&nbsp;&nbsp;
  <a href="#also-inside">Also inside</a>&nbsp;&nbsp;&nbsp;
  <a href="LICENSE">MIT</a>
</p>

<br>

## Get started

**macOS, Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh
```

**Windows**

```powershell
irm https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.ps1 | iex
```

That's it. It finds your agents (Empryo, Claude Code, Codex, Copilot CLI, pi, OpenCode, Gemini CLI), links the skills and immune cells, and adds the [rules](guides/takeaways.md). Every file it touches is backed up first, and your own rules stay.

Other ways in:

| Want | Run |
| --- | --- |
| Let your agent do it | `Set up SoulStack for me from https://github.com/proxysoul/SoulStack and follow its AGENTS.md.` |
| Only some skills, any agent | `npx skills add proxysoul/SoulStack` (pick **Universal** for Empryo) |
| Copilot CLI plugin | `copilot plugin marketplace add proxysoul/SoulStack` then `copilot plugin install soulstack@soulstack` |

Stay current:

```bash
soulstack update    # get the latest and show what changed
soulstack check     # is a new version out?
soulstack remove    # take it out; your own rules stay
```

## Pick a skill

Just ask your agent. It loads the right skill when the task matches.

| You want to… | Skill |
| --- | --- |
| Make a hype edit of your project, synced to a song | [**enkindle**](skills/enkindle/SKILL.md) |
| Make your app faster, with before-and-after proof | [**enliven**](skills/enliven/SKILL.md) |
| Redesign your site with a real design system | [**ensoul**](skills/ensoul/SKILL.md) |
| Find security holes in your code and dependencies | [**enshield**](skills/enshield/SKILL.md) |
| Test the real app and never see the same bug twice | [**immune-system**](skills/immune-system/SKILL.md) |
| Launch and market it with real evidence | [**marketing**](skills/marketing/SKILL.md) |

Each skill has a page in the [docs](https://soulstack.proxysoul.com/docs).

## Also inside

| Part | What it is |
| --- | --- |
| [Rules](guides/takeaways.md) | How every agent works: finish the job, prove it, report with visuals, use memory |
| [Ten immune cells](agents/) | Agents that scout, attack, verify and guard your app, led by `tcell-helper` |
| [Working habits](guides/agent-guidance.md) | Map first, read before editing, check after every change, answer short |
| [SoulStack's own immune system](immune/) | The worked example; run `bun run immune:app` to see it |
| [Prompts](prompts/) and [templates](templates/) | The redesign brief in one message, and starting points for your own skills |
| [Mascot guide](guides/mote-mascot.md) | Draw a calm mascot of your own. Shown with Mote, Empryo's mascot, which is not part of the stack |
| [Website](site/) | Every layer shown visually, plus `llms.txt` for agents |

<img src="assets/mote/renderings.png" width="100%" alt="Example output of the mascot guide: Mote, Empryo&#39;s mascot, in six styles">

## Best with Empryo

SoulStack works in any agent and goes further in [Empryo](https://empryo.com): rules reload live, immune cells ask the code map where a bug lands, memory keeps confirmed bugs and traps, cells drive real apps through browser and computer use, and a nightly routine patrols for you.

<details>
<summary>Setup options</summary>

From a clone:

| macOS, Linux | Windows | Does |
| --- | --- | --- |
| `--presets proxysoul,proxysoul-mcp` | `-Presets proxysoul,proxysoul-mcp` | Also add my Empryo presets |
| `--check` | `-Check` | Change nothing, show what is installed |
| `--remove` | `-Remove` | Take SoulStack out again |
| `--skills <folder>` | `-Skills <folder>` | Link the skills somewhere else |
| `--plain` | `-Plain` | No colour or animation |

Rules go into each agent's global rules file inside a marked block that updates in place. Setup follows `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `COPILOT_HOME`, `PI_CODING_AGENT_DIR` and `GEMINI_CLI_HOME`.

</details>

<details>
<summary>My Empryo setup</summary>

My global config as three presets in [`plugins/presets/`](plugins/presets/):

| Preset | Sets |
| --- | --- |
| `proxysoul` | GPT-6 Sol as the main model, Astra for reviews and second opinions, Luna for grunt work and subagents; Undertow-style theme, desktop appearance, editor, agent features |
| `proxysoul-trusted` | Full autonomy: yolo, auto-approve, every computer-use switch. Trusted machines only |
| `proxysoul-mcp` | MCP servers; tokens come from environment variables, never the file |

Add them with `scripts/setup.sh --presets proxysoul,proxysoul-mcp`, or for one launch with `empryo --plugin <path>`. After changing settings in Empryo, refresh them with `bun scripts/export-config.ts`: it drops machine-only state, moves risky switches into the trusted preset, and refuses to write anything that looks like a secret.

</details>

## Credits

- **enshield** builds on [Cloudflare's security-audit-skill](https://github.com/cloudflare/security-audit-skill) and [OpenAI's Codex Security](https://github.com/openai/codex-security).
- **marketing** was contributed by <a href="https://github.com/smakosh"><img src="site/public/contributors/smakosh.jpg" width="16" height="16" alt=""></a> [Ismail Ghallou](https://github.com/smakosh).
- **enkindle**'s example song is a mashup of "Blade" by D'Angello &amp; Francis and "Into The Void" by POLTERGST and RØØTZ (feat. Jordan Lindley), from the edit by [CowBeans](https://www.youtube.com/@cowbeans327). It is built on [fframes](https://fframes.studio), [Demucs](https://github.com/adefossez/demucs), wav2vec2, librosa and yt-dlp.

<br>

<p align="center">
  <sub>Made by <a href="https://github.com/proxysoul">ProxySoul</a> with <a href="https://empryo.com">Empryo</a>. Code and docs are MIT licensed. Mote and the Empryo name and logo are not: see <a href="LICENSE">LICENSE</a>.</sub>
</p>
