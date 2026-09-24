---
title: Troubleshooting
summary: Fixes for the common setup and update problems.
order: 9
---

# Troubleshooting

| You see | Do |
|---|---|
| `command skipped soulstack ~/.local/bin is not on your PATH` | Add `~/.local/bin` to your `PATH`, or run the setup one-liner to update |
| `skill skipped ... is not ours` | You have your own skill with that name; SoulStack leaves it alone. Rename one of them |
| `stack skipped you have local changes` | Commit or discard your edits in `~/dev/SoulStack`, then `soulstack update` |
| `stack offline could not reach GitHub` | Nothing changed; try again when online |
| The takeaways load twice in Copilot | You used both the plugin and the script; remove one |
| An agent does not see the rules | Restart it; Empryo reloads rules on the next message |
| Windows: `running scripts is disabled` | Run PowerShell with `-ExecutionPolicy Bypass` as in the one-liner |

Still stuck: `soulstack check` shows the state of every part; open an issue with its output.
