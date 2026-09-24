---
name: ensoul
description: Build a product's design system and redesign its website (or any product UI) from scratch into a distinctive, alive, theme-aware site that is grounded in what the product really is. The agent first studies the codebase and the owner's way of talking to find the product's concept and vibe, then plans a design system of connected variants (palette, logos, screenshots) on one spacing scale, builds every page with parallel sub-agents, captures real product imagery, verifies by looking at screenshots at phone, laptop and ultra-wide widths in every theme and mode, and finishes by writing a design_system/ folder so the next agent can continue without context. Use when the user asks to redesign, rebuild or "bring to life" a product website, landing page or docs site, or asks for a design system handoff.
---

# Ensoul

Gives a product's website a soul. Turns "redesign our website, make it alive" into a shipped site and a design system another agent can continue from. It is distilled from the Empryo website redesign: every rule below fixes a mistake first drafts make. Follow them up front and skip whole rounds of feedback.

Do not start with the page. Start with the product. A site that could belong to any other product has failed, however polished it is.

## Phase 1: Understand the project (no design work yet)

Read the code until you can explain the product to a stranger in two sentences. Use the repository's own map and search tools instead of guessing.

1. **What the product is and does.** Read the README, the agent instructions file (`AGENTS.md`, `CLAUDE.md` or equivalent), the entry points and the main packages. Name its core concepts and what it calls them in code.
2. **The apps people install.** Desktop app, terminal app, CLI, API, extension, mobile? Each app that users install is something the site has to show for real.
3. **Its visual language.** Find the theme and token files (colour palettes, dark and light variants, fonts, icons, logo, mascot, any animation assets). The site's themes should be the product's themes, so a visitor sees the same world they will install.
4. **The existing site.** List every route, page, content file, docs source, OG or social image, sitemap, feed and deploy configuration. Write the page inventory down now. No page may be forgotten or left in the old style.
5. **Evidence you can use.** Benchmarks, release notes, changelogs, sponsor lists, testimonials, download counts, stars. Record where each number comes from. Never invent one.
6. **How it builds, checks and deploys.** Package manager, typecheck, lint, test and build commands, the deploy tool, and any repo rules (comments, casts, commit style, shared working tree).
7. **What the owner already said.** Search project memory, previous sessions, issues and docs for design feedback and preferences.
8. **The owner's vibe.** Read how the user talks: their words, energy, references, the names they chose for things, the jokes, what excites them and what annoys them. Deduce the theme and concept from that as much as from the code. A user who says "make it alive", "organism", "brush strokes" is asking for a different site than one who says "clean", "fast", "no nonsense". Pay attention; the brief is often in the tone, not the words.

Write a one-page brief before any design: the product in two sentences, its one core idea, the vibe in three words with the phrases you took it from, who visits the site and what they must do there, the themes and modes, the apps to show, the page inventory, and the evidence available. If the user is present, show them the core idea in one line and continue unless they object.

## Phase 2: Find the idea and plan the design

- **One idea, made literally true.** Find the metaphor that is already in the product (for Empryo: the codebase is a living organism, so the background is a procedural painting drawn live, stroke by stroke: "No video. No images. Every frame is JavaScript painting brush strokes"). The site is that idea, alive. It should be understandable without a PhD.
- **One art direction per theme.** Each product theme becomes a world of the site with its own scenery and feel (one theme is a brush painting, another is deep space, and so on). Stay minimal: no gimmicky shapes, no asteroids, no decoration for its own sake. Every theme in both dark and light mode must look intentional. Colours come from tokens only.
- **Tokens first.** Palette per theme and mode, a type scale, a spacing scale, and one clearance token for the space under the top bar. Generate CSS from the product's theme source where possible so the two never drift.
- **Start small.** First builds always come out too big. Pick type and spacing about 30% smaller than instinct: calm and breathable, one idea per section, never bloated and never cramped.
- **A design system with variants, everything connected.** Each variant (theme × mode) owns its palette, its scenery, its logo and mascot rendering, its product screenshots, its terminal and app themes and its OG images. Switching variant switches all of them together. Nothing is a one-off: a logo, screenshot or chart that exists in one variant exists in every variant.
- **One spacing scale, used everywhere.** Padding, gaps, radii, container widths and section rhythm come from a small set of tokens. No hand-picked pixel values, no per-component exceptions. The same kind of thing is always the same size and the same distance from its neighbours on every page. Consistency here is what makes a site feel crafted.
- **Composition on purpose.** Decide per section whether it is centred or asymmetric and why: centre what is a single statement, use asymmetry (words on one side, product on the other) to create movement and use the full width. Align to a grid; optical centring for icons and marks.
- **Plan every page** from the inventory: its job, its sections, the evidence and imagery it shows, its OG image.
- Review the plan against the brief. Anything that would fit any other product gets replaced by something that comes from this one.

## Phase 3: Build

- **Deploy what exists first** if the user asks for it, and commit pending site work before rebuilding.
- **Parallel sub-agents, one area each**: global chrome (top bar, theme picker, footer), the living background, landing, download, docs, benchmarks, product imagery. Each brief names the files the worker owns, the files it must not touch, the data to use, how to verify and what to report. Sub-agents usually cannot see images: they save screenshots and measurements, and you look at them.
- Something truly new, not a restyle of the old site. Install the packages the idea needs.

Rules that hold on every page:

1. **The background never competes with the foreground.** Movement at the edges, quiet behind text, lower intensity on reading pages. If text is hard to read, the background loses.
2. **The product comes first.** Real screenshots of the real app on the landing and download pages, in the visitor's current theme and mode. People want to see what they are downloading.
3. **Visuals plus a little text.** Convey with an image, a diagram, a chart or a real screenshot, then add one short line. Group related things together instead of listing them. Plain words, sentence case, no hype, no walls of prose.
4. **Charts a stranger reads in five seconds.** Real units, logos next to every name, "shorter is better" where it applies, no log scales, no unlabelled dots, no floating reference lines. Show where the product lost. Never round in its favour. Put a source under every chart.
5. **Motion answers the visitor or draws the eye once.** Interactions get clear visual cues (hover, press, open, done) so the visitor feels the page respond, but never so many that it overstimulates. One planned moment of motion per view. A pause-motion control always visible in the top bar. Everything pauses offscreen and under reduced motion. No cursor-chasing elements scattered over the page.
6. **Mobile is reshaped, not squeezed.** Re-lay each section for a phone: stack, reorder and regroup so content does not pile up in one place, while keeping the same feel, the same variant and the same key visuals. Change the layout, not the identity.
7. **Theme switch and picker feel like the brand.** An organic transition from the click point, no blur. The picker opens in one step with a dim overlay only.
8. **Testimonials are genuine.** Only real, attributed, verbatim quotes with the author's picture. They can move gently but must stay easy to read.
9. **Layout discipline.** Nothing sticks out of its card or column at any width. Labels never run into values. Buttons stay on one line. Generous space under the floating top bar, set by the clearance token, growing on ultra-wide screens.
10. **No placeholders ship** ("coming soon", "round 4, in preparation").
11. **Sponsors and supported platforms sit near the hero**, not buried at the bottom. Show supporters with their pictures and never with amounts.
12. **Performance is a feature.** Use the framework's compiler and modern practice, run heavy drawing in a worker, lazy-load chrome and art, split big data files. Measure page weight, load, idle and scroll cost before and after every change that adds weight, against the production build.
13. **Every page has an OG image**, ideally one per theme and mode.

## Phase 4: Real product imagery

- Build the app from current source and capture it on a real, populated project. Never show the owner's private sessions, chats or windows: hide every other app and refuse any frame with a foreign window in it.
- Use the owner's real configuration (terminal config and font, default model, settings). Let background work such as indexing finish before capturing. Capture one app at a time.
- One set per theme and mode, for every app. Switch the terminal and the app to the matching theme, including light modes, and check light-mode contrast (for example, user messages must not turn white on white).
- Backgrounds must blend with the site: capture with a transparent window, or on a green screen and key it out, instead of pasting frames on a solid colour.
- Several real views per app (chat with a diff, plan, file tree, graph) that play like a GIF. Close panels between views so nothing looks cramped.
- Captions say what a frame shows, never how it was made.

## Phase 5: Verify by looking

Nothing is done until you have seen it.

- Screenshot every page at 390, 1440 and 3440 wide, in at least two themes, dark and light, plus the loudest and the faintest theme. Wait for hydration and scroll-revealed sections before each shot.
- Check consistency: the same component has the same padding, gap and size on every page and in every variant; measure a few with the browser instead of trusting the eye.
- Run automated checks for sideways overflow, content spilling out of its box, overlapping text and content crowding the top bar. They must report nothing.
- Typecheck, lint, test and build. Measure performance against the numbers you recorded before.
- Report honestly: what changed, what you verified and what is not done.

## Phase 6: Ship and hand off

- Commit by topic: a short scoped conventional subject and a body of short scoped one-liner bullets. Stage explicit paths only; other agents may share the working tree. If another tab's change sweeps into a commit, say so in the subject and body and tell that tab. Deploy, push or post only when asked.
- Write `design_system/` so the next agent needs no prior context:
  - `README.md`: the idea, the rules in short, a reading order, a toolkit table and where everything lives in the code
  - `identity.md`: the idea, brand pieces, personality, and a log of the owner's feedback round by round
  - `preferences.md`: everything the owner asked for or rejected, how they like to work, and superseded preferences so nobody brings them back
  - `worlds-and-color.md`, `type-layout-scale.md`, `motion-and-scenery.md`, `components.md`
  - `product-imagery.md`, `data-and-benchmarks.md` (where every number comes from), `words.md`
  - `workflow.md` (run, check, measure, deploy, commit, work with agents), `screenshots.md` (exactly how to take and review them), `open-items.md`
  - `tools/` with every script the work needs: batch screenshots, layout and overflow checks, contact sheets, performance probes, capture tooling, plus the owner's relevant config files. Nothing confidential.
- Link the folder from the repo's agent instructions file, with the few rules every agent must follow.
- Every later round of feedback goes into `preferences.md` and the round log in the same change.

## Working with the owner

- Make the call and keep going. Ask only when truly blocked, and then ask one clear question.
- The owner judges by looking: show screenshots and preview links.
- When they say pause or stop, stop the running processes at once and say exactly what was stopped.
- When feedback swings (first "too big, too busy", then "toned down too much"), keep what they liked and move back only the part they named. [reference/feedback-rounds.md](reference/feedback-rounds.md) lists the usual first-draft mistakes and the rule that fixes each.
