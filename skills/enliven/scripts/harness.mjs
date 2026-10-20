import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const arg = (name, fallback) => {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

export const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

export async function loadProfile() {
  const profilePath = arg("profile");
  if (!profilePath) throw new Error("--profile=<path to profile module> is required");
  const profile = (await import(pathToFileURL(resolve(profilePath)).href)).default;
  return { profile, appDir: resolve(arg("app", profile.appDir ?? ".")) };
}

export function cssArg() {
  const value = arg("css");
  if (!value) return null;
  return existsSync(value) ? readFileSync(value, "utf8") : value;
}

async function playwright(appDir) {
  for (const base of [appDir, process.cwd()]) {
    try {
      const path = createRequire(join(base, "package.json")).resolve("playwright-core");
      return await import(pathToFileURL(path).href);
    } catch (error) {
      if (error?.code !== "MODULE_NOT_FOUND") throw error;
    }
  }
  return import("playwright-core");
}

export async function openApp(profile, appDir) {
  const userData = mkdtempSync(join(tmpdir(), "enliven-user-"));
  const configHome = mkdtempSync(join(tmpdir(), "enliven-home-"));
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
    APPDATA: configHome,
    ...(profile.env ?? {}),
    ...(profile.userDataEnv ? { [profile.userDataEnv]: userData } : {}),
  };
  const driver = await playwright(appDir);
  let app = null;
  let browser = null;
  let page;
  if (profile.kind === "electron") {
    app = await driver._electron.launch({
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
    browser = await driver.chromium.launch();
    page = await browser.newPage({ viewport: profile.web?.viewport ?? { width: 1440, height: 900 } });
    await page.goto(profile.web.url);
  }
  page.setDefaultTimeout(30_000);
  await page.waitForLoadState("domcontentloaded");
  const context = { page, app, browser, sleep, userData };
  const close = async () => {
    await app?.close().catch((error) => console.warn(`close: ${error.message}`));
    await browser?.close().catch((error) => console.warn(`close: ${error.message}`));
    rmSync(userData, { recursive: true, force: true });
    rmSync(configHome, { recursive: true, force: true });
  };
  return { context, close };
}

export async function reach(profile, context, after) {
  if (after && !profile.phases?.[after]) {
    throw new Error(`--after=${after} is not a phase; choices: ${Object.keys(profile.phases ?? {}).join(", ")}`);
  }
  await profile.prepare?.(context);
  if (!after) return;
  for (const [name, run] of Object.entries(profile.phases)) {
    await run(context);
    if (name === after) return;
  }
}

export async function addStyle(page, css) {
  await page.evaluate((text) => {
    const style = document.createElement("style");
    style.dataset.enliven = "probe";
    style.textContent = text;
    document.head.append(style);
  }, css);
}

export async function removeStyle(page) {
  await page.evaluate(() => {
    for (const style of document.querySelectorAll("style[data-enliven=probe]")) style.remove();
  });
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}
