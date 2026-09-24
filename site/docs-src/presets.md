---
title: Empryo presets
summary: ProxySoul's optional Empryo configuration layers and how to add them.
order: 6
---

# Empryo presets

Presets are layers on top of your Empryo config. They are optional and never replace your settings.

| Preset | Adds |
|---|---|
| `proxysoul` | Models and routing, theme and appearance, agent features |
| `proxysoul-mcp` | MCP servers; tokens come from your environment (for example `CLOUDFLARE_API_TOKEN`) |
| `proxysoul-trusted` | Full autonomy. Only add it when you mean it |

```bash
sh ~/dev/SoulStack/scripts/setup.sh --presets proxysoul,proxysoul-mcp
```

The presets list in `~/.empryo/config.json` is backed up before it changes.
