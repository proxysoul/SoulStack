# Traps already paid for

Each of these cost a real debugging session in a product that runs on macOS, Linux and Windows.
Check for them before blaming the product.

| Symptom | Cause |
|---|---|
| A whole tier fails on Windows with no output | A long inline PowerShell script sent over SSH hits the ~8191 character command-line limit. Push scripts as files |
| Help text looks empty on Windows | PowerShell drops a native command's stderr unless redirected, and PS 5.1 writes redirected output as UTF-16LE with a BOM |
| Windows exits 0 but nothing happened | Non-terminating PowerShell errors exit 0. Assert on output text, never on the exit code alone |
| Output order looks wrong on Windows over SSH | stdout and stderr arrive merged; there is no separate remote stderr |
| A GUI launched over SSH on Windows never paints | sshd runs in session 0, which has no window station. Start it in the logged-in user's session |
| Every faked run takes exactly the timeout and fails | A shell variable was inside single quotes and never expanded, so two sides used different file names |
| The product reports every file as deleted | The fixture workspace was nested inside the project's own git tree. Keep test workspaces outside the repo |
| A golden fails on every run | An animated splash or a rotating tip. Compare a region and mask what rotates |
| A resumed conversation loses its newest step | The fake reused ids per response, so a replayed step collided with a new one. Real services never reuse ids |
| A PNG fails to decode | The inflate function expects raw deflate; PNG data is zlib-wrapped, so strip the two-byte header |
| A killed run leaves the product running on a remote machine | Killing the local SSH client does not kill what it started. Reap before each run and say loudly what could not be cleared |
| Tens of gigabytes of test cache and a hot laptop | Every run staged its own copy and nothing deleted old ones. Sweep after each run, on interrupt and after a crash |
| A container command silently does nothing | A misspelled subcommand resolved to a plugin that does not exist. Prove the runtime with a trivial command first |
| An emulated platform reports slow timings | Emulation is correct but not a timing reference. Keep speed budgets per platform and never compare across them |
| A check passes on an empty screen | Every count is zero when the panel under test was never opened. Assert the panel is open first |
| Coverage looked 30 capabilities better than it was | The matcher counted words in check titles. Count only what checks make the product do |

## Running many agents

These cost real sessions in a bug machine that ran hundreds of agents at once.

| Symptom | Cause |
|---|---|
| Every agent past number 256 sits at zero steps | Bun allows 256 open fetch requests per process (`BUN_CONFIG_MAX_HTTP_REQUESTS`), read once at startup. Setting it inside the process does nothing; set it in the launcher's environment |
| Reports read well, point at a real line, and nobody can trigger them | Hunters could file without reproducing. Require a reproduction in isolation, and have the reviewer run it again |
| A fix reviewer keeps failing good fixes | Its brief applied a product-code rule to tests. Read why a gate says no, fix the brief, and tell the running agents |
| Work vanished after a session restart | It lived only in agents' final messages. Keep every result in the record file |
| Two agents fixed the same record | Claims lived in a shared list. Claim with an atomic `mkdir` |
| A record shows up in two stages | A role copied the file instead of moving it. One copy, always; the board flags duplicates |
| A reworked record is never picked up again | The old claim still exists. Put the round in the claim name (`<id>-r2`) so every rework is a new claim |
| A repro passes for the hunter and fails for everyone else | It ran with the developer's real home, config or credentials. Fresh `HOME` and `TMPDIR`, no credential store |
| Runs change depending on which folder they start in | Bun loads `.env` and `bunfig.toml` from the working directory. Pass `--no-env-file` and an explicit config |
| Another agent's changes disappeared | Someone ran stash, reset, clean or checkout in a shared working tree. Nobody does; the lead stages explicit paths |
| A fix passes alone and fails in the full suite | The test waited on time or leaked a global, a temp dir or a process. Wait on events with a deadline, release in `finally` |
| The board says hundreds of agents are done and the tree is full of junk | Repro folders kept whole temporary homes. Ignore generated homes and caches in git and sweep after each cycle |
