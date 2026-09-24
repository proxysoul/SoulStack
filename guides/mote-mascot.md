# Mascot guide

How to draw a mascot that stays calm, shown with the one we made for Empryo. Mote stays Empryo's; use the method to make your own.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/mote/mote-dark.gif">
    <img src="../assets/mote/mote-light.gif" width="160" alt="Mote looking around and reacting">
  </picture>
</p>

Mote is Empryo's mascot: a single-celled organism with an uneven membrane, six short cilia and one berry-coloured eye. Empryo treats code like a living thing, so its mascot is the smallest living thing there is. It watches your pointer and reacts when you click.

## The idea in one rule

The body never moves. Only the eye does. Every frame is the same drawing of the membrane and cilia; the eye looks around or changes expression. That is what makes a sprite mascot feel calm instead of jittery.

## The two sheets

Each look is two 3 × 3 sheets, nine frames each.

| Sheet | Frames |
| --- | --- |
| Directions | The eye looks up-left, up, up-right, left, forward, right, down-left, down, down-right |
| Reactions | Blink, love, sparkle, surprised, starstruck, bashful, sleepy, dizzy, delighted |

The page shows one frame at a time by moving the sheet behind a small window, so there is no animation library and no per-frame script.

## How it was made

1. **Start from a working pipeline.** We used the open-source [page-mascot](https://github.com/nilbuild/page-mascot) skill (MIT, by Kamran Ahmed): it turns a character description into two aligned sheets and a React component.
2. **Describe the character, not a style.** The prompt names what never changes (membrane shape, six cilia, one eye, the palette) and what may change (only the eye). The logo was attached as the reference image.
3. **Draw on a green screen.** Each sheet is generated on flat bright green (`#00FF00`) with wide gaps between frames and nothing touching a cell edge. The green is keyed out afterwards to give real transparency.
4. **Build the sheets.** The skill's build step cuts the grid, keys the green and writes the two sheets.
5. **Align every frame.** Generated frames drift a few pixels. A small script measures the membrane in every frame and scales and shifts it to one width and one baseline. Body overlap across all 18 frames went from 0.89 to 0.97.
6. **Check it by eye.** Put the left-looking and right-looking frames side by side: in the skill's own tests, one character in fifty-two came back mirrored.

## One mascot, many looks

The same organism was redrawn in five more styles with the same prompt and only the art direction swapped, then keyed, built and aligned to the exact same box, so a style swap never changes its size or position. The desktop app picks one at random per launch.

<p align="center">
  <img src="../assets/mote/renderings.png" width="720" alt="Colour, ink, sketch, risograph, paper and pixel renderings">
</p>

On the website, Mote also wears each colour theme: a colony cell, a star creature, a coffee bean with steam, a koi fry, a blood cell and a lantern jellyfish.

## Where it lives in the brand

- **The logo mark** is Mote's silhouette.
- **The wordmark's last "o"** is Mote's eye. It has to read as a letter: same stroke weight, a little taller than the other letters. At first it read as "Empry" plus a dot.
- **In the apps** Mote moves into the tab you're working in and shows what the agent is doing.
- **Motion rules:** it follows the pointer only where that helps, never chases the cursor around the page, and stays still for people who turn motion off.

## Using Mote

Mote and the Empryo name and logo belong to Empryo. The images here are previews to show the method; they are not licensed for reuse. Draw your own character with the steps above.

## Do it for your own product

Use [page-mascot](https://github.com/nilbuild/page-mascot) with the `ensoul` skill: `ensoul` finds the concept and the vibe, page-mascot draws and builds the character. Keep the body fixed, key a green screen, align every frame, and check the left and right frames by eye.
