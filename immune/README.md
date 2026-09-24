# SoulStack immune system

SoulStack's own immune system, built with the `immune-system` skill. The product is the setup script, so the
checks run it the way users do: piped into a shell on a clean machine, from a clone, and again to
update.

| Check | Proves |
|---|---|
| `setup-linux.sh` | detects agents (Empryo skipped when missing), links skills, writes one rules block per agent, never overwrites, backs up, `--check` sees what is installed, `--remove` leaves the user's text |
| `update-linux.sh` | first install from a remote, `soulstack check` sees a new version, `update` shows the version change and what is new, survives a rewritten history (backup branch), keeps local changes that clash, `remove` takes the command out |
| `setup-windows.ps1` | the same install guarantees on Windows PowerShell 5.1 |
| `update-windows.ps1` | the same update guarantees on Windows, through the `soulstack.cmd` shim |

## Arsenal

What gives the cells eyes and hands on the setup script, chosen for this repo:

| Tool | Why |
|---|---|
| Apple `container` (or Docker, Podman) | Clean Linux machines per run: Alpine for BusyBox `sh`, Debian for `dash` |
| A local bare git remote | Stands in for GitHub so updates, clashes and rewritten history are testable offline |
| Windows x64 over SSH | The real PowerShell 5.1 and Windows symlink rules; nothing emulates them faithfully |
| Secret patterns, or Gitleaks when installed | No tokens or private keys in tracked files (`natural-killer`) |
| `bun audit` | Known vulnerabilities in the site's dependencies |
| `script` (pty) | Runs the script in a real terminal to check the animated output |
| The real agents (`claude -p`, `codex exec`, `opencode agent list`, `empryo --headless`) | Proof that each agent actually loads the rules, skills and cells |

## The app

`bun run immune:app` starts the immune app on http://127.0.0.1:4177, in SoulStack's design system:
health, runs, cells, findings and explorations, with buttons to run smoke or full and a live log.
Every run writes `immune/results/<time>.json` and exports a snapshot to `site/public/immunity/`,
which the website serves at `/immunity/`. `bun run immune:report` refreshes the snapshot alone.

## Running

```bash
bun run immune                    # Alpine (BusyBox sh) and Debian (dash) containers, then the dashboard
bun run immune:smoke              # Alpine only
bun run immune:report             # dashboard only
```

The runner uses `container`, `docker` or `podman`, whichever exists. With none it reports a
coverage hole and exits 2.

Windows: copy the repo to a Windows machine (for example over SSH as a `.tgz`), put it in
`%USERPROFILE%\ss.tgz`, then run each script with
`powershell -NoProfile -ExecutionPolicy Bypass -File immune\setup-windows.ps1`. Each prints `ALL OK` or
the first `FAIL`.

Every check runs in a throwaway home folder and cleans up after itself; nothing touches the real
`~/.empryo`, `~/.claude`, `~/.codex` or `~/.copilot`.
Windows: build the archive with `COPYFILE_DISABLE=1 tar` on macOS so no `._*` files ride along.
