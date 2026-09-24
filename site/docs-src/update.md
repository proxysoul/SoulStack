---
title: Updating
summary: How soulstack update works, what it shows, and what happens to your local changes.
order: 3
---

# Updating

```bash
soulstack check     # is a new version out? changes nothing
soulstack update    # get it, set everything up again, show what changed
```

An update prints the version change and one line per new change:

```
stack   updated  ~/dev/SoulStack v1.0.0 to v1.1.0
new     feat(scripts): add soulstack update, check and remove
```

## Your changes

- **You edited files in your copy**: they are kept. If an update clashes with them, it is skipped
  and says so.
- **The published history was rewritten**: your old copy is saved as a `backup-<time>` branch
  first.

## Copilot plugin and skills CLI

- Copilot plugin: `copilot plugin update soulstack`.
- `npx skills` installs copies; run it again to update.
