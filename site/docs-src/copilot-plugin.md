---
title: Copilot plugin
summary: Install SoulStack as a GitHub Copilot CLI plugin instead of running the setup script.
order: 5
---

# Copilot plugin

```bash
copilot plugin marketplace add proxysoul/SoulStack
copilot plugin install soulstack@soulstack
```

The plugin carries the skills and the takeaways as always-on rules. Use the plugin or the setup
script for Copilot, not both, or the takeaways load twice.

Update with `copilot plugin update soulstack`. In a session, `/skills list` and `/instructions` show
what loaded.
