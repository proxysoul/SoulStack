# Website redesign

The ensoul brief as one message, for agents without skill support. Replace every [BRACKET] before sending.

```text
Redesign my website fully and freely. Make it unique, alive and made for [PRODUCT: one line on what it is and who it's for]. Before designing anything, study the codebase until you can explain the product in two sentences: its core concepts, the apps people install, its themes and tokens, every page of the current site, and the real numbers you can use. Don't reuse templates or earlier layouts, and don't settle for a static, classic site. Install any package you need, and run parallel sub-agents, each owning one area, with a precise brief. Sub-agents can't see images, so they save screenshots and measurements, and you review those yourself before reporting.

Direction
- Deduce the theme and concept from how I talk and my vibe as much as from the code. Name the vibe in three words and the phrases you took it from.
- The site expresses the product's core idea, made literally true.
- A design system with variants: each theme and mode owns its palette, scenery, logo rendering, screenshots and OG images, and switching variant switches all of them together.
- One spacing scale for padding, gaps, radii and widths, used everywhere with no one-off values. Centre single statements, use asymmetry for movement, align to a grid.
- Every product theme ([THEMES], dark and light) is a theme of the site with its own art direction, kept minimal: no gimmicky shapes. Colours come from tokens only.
- One brand mark or mascot, used sparingly. No cursor-chasing elements.

Get these right from the start
1. Scale: calm and roomy. Start about 30% smaller than your instinct.
2. The background never competes with the text: movement at the edges, quiet behind text.
3. Performance: framework compiler, lazy-load anything heavy, pause offscreen, measure before and after.
4. Product first: real screenshots of the real app in every theme and mode on the landing and download pages, several frames per app that play like a GIF, backgrounds that blend with the site (transparent or green-screen keyed).
5. Visuals plus a little text: an image, diagram or chart, then one short line. Group related things. Sentence case, no hype.
6. Charts a stranger reads in five seconds: real units, logos, no log scales, sources under each. Show where we lost.
7. Clear visual cues on interactions without overstimulating. Mobile is reshaped (stacked, regrouped, nothing piled in one place) while keeping the same feel. One planned moment of motion per view, a pause button always in the top bar, reduced motion respected.
8. Theme switch and picker: brand-shaped transition, no blur, picker opens in one step.
9. Only real, attributed, verbatim testimonials with pictures.
10. Nothing sticks out of its card, labels never touch values, buttons never wrap, generous space under the top bar on every screen size. No placeholders.
11. Sponsors and platforms near the hero. An OG image for every page.

Verify
- Screenshot every page at 390, 1440 and 3440 wide, in two themes, dark and light. Automated checks for overflow, overlap and top-bar collisions report nothing. Typecheck, lint, test and build pass.
- One-line scoped conventional commits with a bullet body. Stage explicit paths.

Hand off
Write a design_system/ folder so the next agent needs no prior context: idea, feedback log, my preferences (including rejected and superseded ones), themes and tokens, type and layout, motion, components, imagery workflow, data sources, copy rules, workflow and a screenshot guide, plus every script it needs. Link it from the repo's agent instructions file.
```
