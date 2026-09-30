// Copy this next to your app, fill it in, pass it as --profile=<path>.
// Everything app-specific lives here; perf-ab.mjs stays generic.
//
// Write it ONCE, before the first measurement, and do not touch it again while
// comparing builds. Editing the profile between the before and after run
// invalidates the comparison as surely as editing the app.

const md = (i) => `## Step ${i}\n\nBody text with \`code\` and a [link](https://example.com).\n\n- one\n- two\n`;

// One helper the phases and the leak cycle share, so the cycle can put the app
// back exactly where it started. This is what makes the leak numbers mean
// something: if the cycle adds content, the series measures accumulation.
const RESTORE = {
  type: "ready",
  tabId: "main",
  tabs: [
    {
      tabId: "main",
      records: Array.from({ length: 60 }, (_, i) => [
        { role: "user", text: `Question ${i}`, turnId: `h${i}` },
        { role: "assistant", text: md(i), turnId: `h${i}` },
      ]).flat(),
    },
  ],
};

export default {
  kind: "electron", // or "web"

  electron: {
    main: "out/main/index.cjs",
    rendererHtml: "out/renderer/index.html",
    // The env var your main process reads to pick the renderer URL. The
    // harness sets it with pathToFileURL, which is what makes Windows work.
    rendererUrlEnv: "APP_RENDERER_URL",
  },
  // web: { url: "http://localhost:5173" },

  env: { APP_E2E: "1", APP_LOCALE: "en" },
  userDataEnv: "APP_USER_DATA_DIR",

  // Written into a throwaway home before launch. HOME, USERPROFILE and
  // LOCALAPPDATA all point at it, so the run never reads your real settings
  // and never lands on a first-run screen. Paths are relative to that home;
  // give both the POSIX and the Windows location if your app differs by OS.
  configFiles: {
    ".myapp/config.json": { onboardingComplete: true, introSeen: true },
    "MyApp/config.json": { onboardingComplete: true, introSeen: true },
  },

  bundle: {
    entryHtml: "out/renderer/index.html",
    assetsDir: "out/renderer/assets",
    extraFiles: { mainKB: "out/main/index.cjs", preloadKB: "out/preload/index.cjs" },
  },

  domCensus: { turns: ".turn", buttons: "button", svgPaths: "svg path" },

  // Anything that must happen once before the phases start.
  async prepare({ page }) {
    await page.waitForSelector("#root > *");
  },

  // The phases are what people actually do. Idle is not filler: an app that
  // costs anything while nothing happens is burning battery for free.
  phases: {
    "restore-session": async ({ page, app }) => {
      await send(app, [RESTORE]);
      await page.waitForSelector(".conversation");
      await page.waitForFunction(() => document.querySelector(".conversation")?.textContent.includes("Step 59"));
    },
    "idle-5s": ({ sleep }) => sleep(5000),
    "stream-answer": async ({ page, app, sleep }) => {
      await send(app, [{ type: "turn-start", tabId: "main", id: "live" }]);
      const body = md(999).repeat(4);
      const step = Math.ceil(body.length / 260);
      for (let i = 0; i < body.length; i += step) {
        await send(app, [{ type: "text-delta", tabId: "main", id: "live", delta: body.slice(i, i + step) }]);
        await sleep(16);
      }
      await send(app, [{ type: "turn-done", tabId: "main", id: "live" }]);
      await page.waitForFunction(() => document.querySelector(".conversation")?.textContent.includes("Step 999"));
    },
    "scroll-transcript": async ({ page, sleep }) => {
      await page.locator(".conversation").first().hover().catch(() => {});
      for (let i = 0; i < 24; i++) {
        await page.mouse.wheel(0, i % 2 === 0 ? 600 : -600);
        await sleep(40);
      }
    },
    "pointer-sweep": async ({ page, sleep }) => {
      for (let i = 0; i < 60; i++) {
        await page.mouse.move(200 + (i % 20) * 12, 200 + ((i * 7) % 240));
        await sleep(12);
      }
    },
    "idle-after-5s": ({ sleep }) => sleep(5000),
  },

  // One leak cycle. Do the work, then put the app back: replay the identical
  // restore payload so every sample sees the same DOM.
  async cycle({ page, app, sleep }, index) {
    await send(app, [{ type: "turn-start", tabId: "main", id: `leak-${index}` }]);
    for (let i = 0; i < 12; i++) {
      await send(app, [{ type: "text-delta", tabId: "main", id: `leak-${index}`, delta: `chunk ${i} ` }]);
      await sleep(12);
    }
    await send(app, [{ type: "turn-done", tabId: "main", id: `leak-${index}` }]);
    await send(app, [RESTORE]);
    await page.waitForFunction(() => document.querySelector(".conversation")?.textContent.includes("Step 59"));
  },

  // Claims you want the report to make. Each one must be able to come out
  // badly: a counter that can only read zero proves nothing.
  async extraChecks({ page, sleep }) {
    let switches = 0;
    let withSkeleton = 0;
    for (const dest of ["changes", "tools", "settings"]) {
      const link = page.locator(`a[href*="/${dest}"]`).first();
      if (!(await link.isVisible().catch(() => false))) continue;
      await page.evaluate(() => {
        window.__perfProbe.skeletonSeen = 0;
        window.__perfProbe.watch?.disconnect();
        const watch = new MutationObserver(() => {
          if (document.querySelector(".loading-skeleton")) window.__perfProbe.skeletonSeen++;
        });
        watch.observe(document.documentElement, { childList: true, subtree: true });
        window.__perfProbe.watch = watch;
      });
      if (!(await link.click({ timeout: 6000 }).then(() => true).catch(() => false))) continue;
      const arrived = await page
        .waitForFunction((d) => document.querySelector(`[data-destination="${d}"]`) !== null, dest, { timeout: 6000 })
        .then(() => true)
        .catch(() => false);
      if (!arrived) continue;
      switches++;
      if (await page.evaluate(() => window.__perfProbe.skeletonSeen > 0)) withSkeleton++;
      await sleep(400);
    }
    return { panelSwitches: switches, panelSwitchesWithSkeleton: withSkeleton };
  },

  extraSummaryKeys: ["panelSwitches", "panelSwitchesWithSkeleton"],
};

// Electron only: push an event straight at the renderer, bypassing the real
// transport, so the measurement does not depend on a backend.
function send(app, events) {
  return app.evaluate(({ BrowserWindow }, batch) => {
    BrowserWindow.getAllWindows()[0].webContents.send("app:events", batch);
  }, events);
}
