# Plugins

## Presets

A preset is a JSON file of Empryo settings: model routing, agent features, theme, MCP servers, privacy rules. It is applied on top of the defaults at startup and never rewrites the user's config.

```json
{
  "name": "my-preset",
  "version": "1.0.0",
  "description": "What this preset sets up",
  "config": {}
}
```

`config` accepts any Empryo configuration field. Load with `empryo --plugin ./plugins/presets/my-preset.json`, or list it in `presets` in `~/.empryo/config.json` or `.empryo/config.json`. Several presets stack; the later one wins. Debug with `empryo --verbose-presets`.
