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
