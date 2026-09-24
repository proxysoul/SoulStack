# [Project name]

<!--
AGENT: this file is a template. Fill it in yourself, then delete this comment.

1. Study the project with Empryo first. Wait for the Genome (Empryo's map of the code) to finish,
   then look at how the app starts, its packages, its scripts, its tests, its docs, the recent git
   history, and Empryo's memory for this project.
2. Replace every [bracket] with what is true here. Delete anything that does not apply.
3. Only write what the Genome cannot tell an agent. The Genome already knows every file, function,
   import and caller. Do not list files, folders or architecture here. Write the rules, the reasons,
   the traps and how the owner likes to work.
4. Use plain words. Short bullets, each one an instruction or a fact. No jargon, no history, no prose.
5. If the project has a user interface and no design system, build one with the `ensoul` skill
   and point the Design section at it.
6. Set up the commands for Empryo's `project` tool (see Commands) and prove each one runs.
7. Keep this file current. When a rule changes, change it here in the same commit.
-->

## How we work

- **Finish the job.** Carry every task through to the end: implement it fully, wire it in everywhere it belongs, and clean up after yourself. No half-done work, no "next steps" left for someone else, nothing left on the table.
- **Reproduce before fixing.** Show the bug happening first, then fix it, then show it is gone.
- **Prove it with before and after.** Measure the same thing, the same way, before and after the change (an A/B test), with real numbers from the real app. Never round a number in our favour. If it got worse, say so.
- **Prove it where people use it**: [the terminal app, the desktop app, the website, the API]. A passing unit test is not proof.
- **Show, don't tell.** Report with screenshots, charts and short lines, not paragraphs.
- **Ask for a second opinion** from [the advisor model] before risky changes to settings or structure.
- **Use memory.** Before starting, read what Empryo's memory holds for this project. After finishing, save what the code cannot show: why a decision was made, a bug that bit you and how to avoid it, and anything the owner asked for or rejected. Memory is for reasons and lessons; this file is for rules.

## Code rules

- Use [bun / pnpm / cargo / uv] for everything. Never [npm / npx / the tools not to use].
- No code comments. Good names and clear types explain the code. Never leave old code commented out; git keeps the history.
- Never hide an error. Every `catch` reports the problem, passes it on, or returns something the caller checks. Returning `null` and moving on is not allowed.
- Never switch off a check (`@ts-ignore`, `[lint]-disable`, `# noqa`). Fix what it complains about.
- Never force a type with a cast to make an error go away. Check the data where it enters the program instead.
- Never wait a fixed time (`sleep(300)`). Wait for the thing you need: the file, the event, the response.
- Anything that can fail, hang or time out uses [Effect / the project's error library]: a time limit, a clear fallback, and retries only for errors that go away on their own (never for "out of quota" or "not logged in").

## Tests

- No unit tests by default. Only write one for a small rule nothing else can check.
- Never write tests after the code just to copy what the code does.
- Prove features with end-to-end tests that drive the real app and leave a result you can check again later.
- If a piece must be tested on its own, first write down every way it could break, then write the code.

## [Areas with rules the code does not show]

- [One short section per area where agents keep getting it wrong: the one function everything must go through, the setting that must keep working for old users, the check that proves a change here.]

## Design

- [Where the design system lives. Read it before touching anything visual.] No design system yet? Build one with the `ensoul` skill ([skills/ensoul](https://github.com/proxysoul/SoulStack/tree/main/skills/ensoul)).
- A visual change is done only when you have looked at it: screenshots on a phone, a laptop and a wide screen, in dark and light.

## Structure rules

- [Which parts may use which: for example, the app may use the core, the core never uses the app.]
- [Where code that only runs on one platform or one app belongs.]

## Commands

Agents run checks through Empryo's `project` tool, so set the project up for it instead of listing shell lines here. `project` finds the tools on its own (package.json scripts, Cargo, Go, Python, Make, Gradle, Maven and more) and runs: `check` (types, lint and tests at once), `test` (one file with `file`), `build`, `lint`, `format`, `typecheck`, `run` (a named script) and `list` (the packages in a monorepo).

- Name the scripts the way `project` looks for them: `test`, `build`, `lint`, `format`, `typecheck`, `dev` or `start`. Add a missing script rather than writing a raw command here.
- Keep them fast: `test` must also run a single file.
- Prove they work: run `project list`, then `check`, `test` on one file, `build` and `format`.
- Below, write only what `project` cannot know:
  - [A check to run after a certain kind of change, and why.]
  - [Scripts that must never run directly, such as a slow full QA run.]
  - [Order: rebuild package X before app Y can check its types.]

## Where things are declared

- [How settings are changed: through which tool, never by editing which file by hand.]
- [Where a new command, page or request must be added, and what not to add.]
- [How text shown to users is written and translated.]
- [Styling: use the design tokens, never raw colours.]

## Commits

- A short title with a scope: `feat(scope): what changed`. The body is short one-line bullets with a scope: `- scope: what changed`. No prose.
- One topic per commit, and only when the owner asks.
- Other agents may be working in the same folder. Add files by name. Never `git add -A`, stash, reset or clean.
- If another tab's change ends up in your commit, that is fine: say so in the title and body, and tell that tab.
- Deploy, push or post only when asked.

## Traps

- [Things that cost a past agent time, in one line each.]
