import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (name, fallback) => {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const profilePath = arg("profile");
if (!profilePath) throw new Error("--profile=<path to profile module> is required");
const profile = (await import(pathToFileURL(resolve(profilePath)).href)).default;
const appDir = resolve(arg("app", profile.appDir ?? "."));
const phaseName = arg("phase");
if (!phaseName || !profile.phases?.[phaseName]) {
  throw new Error(`--phase=<name> is required; choices: ${Object.keys(profile.phases ?? {}).join(", ")}`);
}
const output = resolve(arg("out", `./perf/${phaseName}.cpuprofile`));
const interval = Number(arg("interval", "250"));
const settleMs = Number(arg("settle", "800"));
const userData = mkdtempSync(join(tmpdir(), "enliven-profile-user-"));
const configHome = mkdtempSync(join(tmpdir(), "enliven-profile-home-"));
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

for (const [relative, contents] of Object.entries(profile.configFiles ?? {})) {
  const target = join(configHome, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof contents === "string" ? contents : JSON.stringify(contents, null, 2));
}

const environment = {
  ...process.env,
  HOME: configHome,
  USERPROFILE: configHome,
  LOCALAPPDATA: configHome,
  ...(profile.env ?? {}),
  ...(profile.userDataEnv ? { [profile.userDataEnv]: userData } : {}),
};
let app;
let browser;
let page;
try {
  if (profile.kind === "electron") {
    const { _electron: electron } = await import("playwright-core");
    app = await electron.launch({
      args: [join(appDir, profile.electron.main)],
      cwd: appDir,
      timeout: 60_000,
      env: {
        ...environment,
        ...(profile.electron.rendererUrlEnv
          ? { [profile.electron.rendererUrlEnv]: pathToFileURL(join(appDir, profile.electron.rendererHtml)).href }
          : {}),
      },
    });
    page = await app.firstWindow();
  } else {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto(profile.web.url);
  }

  page.setDefaultTimeout(30_000);
  await page.waitForLoadState("domcontentloaded");
  const context = { page, app, sleep, userData };
  await profile.prepare?.(context);
  for (const [name, fn] of Object.entries(profile.phases)) {
    if (name === phaseName) break;
    await fn(context);
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval });
  await cdp.send("Profiler.start");
  const startedAt = performance.now();
  await profile.phases[phaseName](context);
  if (settleMs > 0) await sleep(settleMs);
  const { profile: cpuProfile } = await cdp.send("Profiler.stop");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(cpuProfile));
  console.log(JSON.stringify({ phase: phaseName, interval, durationMs: Math.round(performance.now() - startedAt), output }, null, 2));
  cdp.detach?.();
} finally {
  await app?.close().catch(() => { });
  await browser?.close().catch(() => { });
  rmSync(userData, { recursive: true, force: true });
  rmSync(configHome, { recursive: true, force: true });
}