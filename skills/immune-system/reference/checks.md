# Writing checks

## Shape

```ts
{
  id: "sessions/save-and-resume",          // family/name, stable forever
  title: "a resumed session carries its history back",
  capability: "sessions",
  doors: ["headless"],                     // most preferred first
  platforms: ["macos", "linux", "windows"],
  tier: "core",                            // smoke | core | deep
  equivalent: true,                        // the cheapest door proves the others
  needs: { fake: true },                   // fake | display | git | net | cleanMachine | quiet
  guards: "the whole persistence path: a resume that quietly starts empty looks like a working run",
  knownIssue: undefined,                   // { ref, note, doors? } while a bug is open
  async probe(ctx) {
    const run = await ctx.cli(["--json", "hello"], { fake: [says("hi")] });
    ctx.check("exits 0", run.code === 0, `exit ${run.code}`);
    ctx.check("history saved", (await ctx.readFile(".app/session.json"))?.includes("hello"), "");
  },
}
```

What `ctx` offers: one method per door (`cli`, `tui`, `desktop`, `web`, `api`), workspace file
access, paths outside the workspace (state, logs), `golden(name, text)`, `goldenImage(name, png)`,
`measure(name, value, { unit, budget })`, `evidence(name, body)`, `check(label, ok, detail)`,
`note`, `skip(reason)`.

## Tiers

- **smoke**: seconds, no fake dependency, every platform. It starts, it answers, it exits right.
- **core**: every load-bearing capability on every platform it must hold.
- **deep**: stress, chaos, long sessions, upgrades, clean machines.

## Assert on evidence

- The bytes on disk, the exact exit code, the request the product sent, the region of the screen
  after the moment under test.
- A tool's or step's real output often only shows up in a **later** request. Search the whole
  captured conversation, never a fixed request index: how many requests a turn makes is not stable.
- Take a screen capture **after** the moment under test and assert on it, not on every frame since
  boot: the input box echoes what the check typed, so "the command was quoted back" passes on the
  echo.

## Hostile cases worth a check

- **Inputs**: empty, enormous, unicode, right-to-left, emoji, control characters, CRLF, paths with
  spaces and unicode, symlinks, read-only files.
- **Dependencies**: returns nothing, returns garbage, calls something that does not exist, rate
  limits mid-task, times out, disconnects halfway through a stream.
- **Environments**: no credentials, corrupt config, empty directory, not a git repo, no network,
  a different locale, a small terminal.
- **Timing**: interrupt mid-stream then continue, resume while another process holds the lock, kill
  -9 mid-write then restart, two windows at once.
- **Symmetry**: the same action through every door. Every difference is a bug or an undocumented
  decision.
- **States a screen forgets**: empty, loading, error, one item, a thousand items.

## Known bugs and healing

Mark an open bug with `knownIssue: { ref, note }` (and `doors` when only some doors are affected).
It reports `known` instead of failing. When it passes, the run reports `healed`: confirm the fix,
then remove the marker in the same change.

## When a check is red

Exactly one of these is true, and the report says which:

1. **Real bug**: reproduced by hand outside the harness. Write it up, then make or keep the check.
2. **Check bug**: the product is right, the assertion was wrong. Say why, fix the check.
3. **Environment**: target unreachable, nothing staged, image missing. Report it as a coverage
   hole, not a product failure.
4. **Known**: still matches its note.
5. **Healed**: verify and remove the marker.
