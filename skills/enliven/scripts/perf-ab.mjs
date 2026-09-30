// Generic A/B performance harness for Electron and web apps.
//
//   node perf-ab.mjs --profile=./my-app.mjs --app=/path/to/build --label=before --out=./results
//
// Writes <out>/<label>.json. Run it once per build with the same profile, then
// feed both files to perf-report.mjs. See profile.example.mjs for the contract.
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const PROFILE = arg("profile");
if (!PROFILE) throw new Error("--profile=<path to profile module> is required");
const profile = (await import(pathToFileURL(resolve(PROFILE)).href)).default;
const APP = resolve(arg("app", profile.appDir ?? "."));
const LABEL = arg("label", "run");
const OUT = resolve(arg("out", mkdtempSync(join(tmpdir(), `perf-${LABEL}-`))));
const REPEATS = Number(arg("repeats", 3));
const CYCLES = Number(arg("cycles", 8));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (s.length === 0) return null;
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const slope = (ys) => {
  const n = ys.length;
  if (n < 3) return 0;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (ys[i] - my);
    den += (i - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
};

// Runs in the page before any app code. Counts React commits without React
// DevTools, long tasks, animation frames and uncaught errors.
function installProbe() {
  const probe = { commits: 0, longTasks: [], raf: 0, errors: [], skeletonSeen: 0 };
  window.__perfProbe = probe;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(r) {
      this.renderers.set(1, r);
      return 1;
    },
    onCommitFiberRoot() {
      probe.commits++;
    },
    onCommitFiberUnmount() {},
  };
  window.addEventListener("error", (e) => probe.errors.push(String(e.message)));
  window.addEventListener("unhandledrejection", (e) =>
    probe.errors.push(`unhandled: ${e.reason?.message ?? e.reason}`),
  );
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) probe.longTasks.push(Math.round(e.duration));
    }).observe({ entryTypes: ["longtask"] });
  } catch (error) {
    probe.errors.push(`longtask observer: ${String(error)}`);
  }
  const raw = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    probe.raf++;
    return raw(cb);
  };
}

// A hermetic config home, so the run never inherits the developer's settings
// and never stops on a first-run screen on a clean machine.
function seedConfigHome() {
  const home = mkdtempSync(join(tmpdir(), "perf-home-"));
  for (const [rel, contents] of Object.entries(profile.configFiles ?? {})) {
    const target = join(home, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, typeof contents === "string" ? contents : JSON.stringify(contents, null, 2));
  }
  return home;
}

const STATIC_IMPORT =
  /(?:^|[;\s}])(?:import|export)\s*(?:[^'"]*?from\s*)?["'](\.\/[^"']+\.(?:js|css|mjs))["']/g;
const ASSET_LITERAL = /["'](\.\/[^"']+\.(?:js|css|mjs))["']/g;

// Bundle size from the real module graph, never from `readdir` of the output
// directory: incremental builds leave stale hashed chunks behind.
export function bundleSizes(appDir, layout) {
  const out = {
    bootCriticalKB: 0,
    bootCriticalChunks: 0,
    reachableTotalKB: 0,
    reachableChunks: 0,
    orphanFiles: 0,
    orphanKB: 0,
    chunks: [],
  };
  try {
    const assets = join(appDir, layout.assetsDir);
    const html = readFileSync(join(appDir, layout.entryHtml), "utf8");
    const entry = /(?:src|href)="[^"]*?([^"/]+\.(?:js|mjs))"/.exec(html)?.[1];
    if (!entry) throw new Error(`no entry script found in ${layout.entryHtml}`);
    const entryCss = [...html.matchAll(/stylesheet[^>]*?([^"/]+\.css)"/g)].map((m) => m[1]);
    const size = new Map();
    for (const f of readdirSync(assets)) {
      if (!/\.(js|mjs|css)$/.test(f)) continue;
      size.set(f, statSync(join(assets, f)).size);
    }
    const statics = new Map();
    const lazies = new Map();
    for (const f of size.keys()) {
      if (f.endsWith(".css")) {
        statics.set(f, new Set());
        lazies.set(f, new Set());
        continue;
      }
      const src = readFileSync(join(assets, f), "utf8");
      const stat = new Set([...src.matchAll(STATIC_IMPORT)].map((m) => m[1].slice(2)));
      const lazy = new Set(
        [...src.matchAll(ASSET_LITERAL)].map((m) => m[1].slice(2)).filter((d) => !stat.has(d)),
      );
      statics.set(f, stat);
      lazies.set(f, lazy);
    }
    const walk = (seeds, edgeMaps) => {
      const seen = new Set();
      const stack = [...seeds];
      while (stack.length > 0) {
        const c = stack.pop();
        if (c === undefined || seen.has(c) || !size.has(c)) continue;
        seen.add(c);
        for (const m of edgeMaps) stack.push(...(m.get(c) ?? []));
      }
      return seen;
    };
    const boot = walk([entry, ...entryCss], [statics]);
    const reachable = walk([entry, ...entryCss], [statics, lazies]);
    const sum = (set) => [...set].reduce((a, f) => a + (size.get(f) ?? 0), 0);
    out.bootCriticalKB = Math.round(sum(boot) / 1024);
    out.bootCriticalChunks = boot.size;
    out.reachableTotalKB = Math.round(sum(reachable) / 1024);
    out.reachableChunks = reachable.size;
    const orphans = [...size.keys()].filter((f) => !reachable.has(f));
    out.orphanFiles = orphans.length;
    out.orphanKB = Math.round(orphans.reduce((a, f) => a + (size.get(f) ?? 0), 0) / 1024);
    out.chunks = [...boot]
      .map((f) => ({
        file: f.replace(/[-.][A-Za-z0-9_-]{8,}\./, "."),
        kb: Math.round((size.get(f) ?? 0) / 1024),
      }))
      .sort((a, b) => b.kb - a.kb)
      .slice(0, 20);
  } catch (error) {
    out.error = String(error);
  }
  for (const [key, rel] of Object.entries(layout.extraFiles ?? {})) {
    try {
      out[key] = Math.round(statSync(join(appDir, rel)).size / 1024);
    } catch (error) {
      out[key] = null;
      out.error = `${out.error ?? ""} ${String(error)}`.trim();
    }
  }
  return out;
}

async function launch(configHome, userData) {
  if (profile.kind === "electron") {
    const { _electron: electron } = await import("playwright-core");
    const app = await electron.launch({
      args: [join(APP, profile.electron.main)],
      cwd: APP,
      timeout: 60_000,
      env: {
        ...process.env,
        HOME: configHome,
        USERPROFILE: configHome,
        LOCALAPPDATA: configHome,
        ...(profile.env ?? {}),
        ...(profile.electron.rendererUrlEnv
          ? {
              [profile.electron.rendererUrlEnv]: pathToFileURL(
                join(APP, profile.electron.rendererHtml),
              ).href,
            }
          : {}),
        ...(profile.userDataEnv ? { [profile.userDataEnv]: userData } : {}),
      },
    });
    return { app, page: await app.firstWindow(), close: () => app.close() };
  }
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(profile.web.url);
  return { app: null, page, close: () => browser.close() };
}

async function runOnce(runIndex) {
  const userData = mkdtempSync(join(tmpdir(), "perf-user-"));
  const configHome = seedConfigHome();
  const launchedAt = Date.now();
  const { app, page, close } = await launch(configHome, userData);
  const run = { phases: {}, boot: {}, leak: {}, dom: {}, errors: [] };
  try {
    run.boot.launchToWindowMs = Date.now() - launchedAt;
    page.setDefaultTimeout(30_000);
    await page.waitForLoadState("domcontentloaded");
    await page.addInitScript(installProbe);
    const reloadAt = Date.now();
    await page.reload();
    await page.waitForFunction(() => window.__perfProbe?.commits > 0, null, { timeout: 45_000 });
    run.boot.reloadToFirstCommitMs = Date.now() - reloadAt;

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("HeapProfiler.enable");
    const metrics = async () => {
      const { metrics: m } = await cdp.send("Performance.getMetrics");
      const o = Object.fromEntries(m.map((x) => [x.name, x.value]));
      return {
        taskMs: o.TaskDuration * 1000,
        scriptMs: o.ScriptDuration * 1000,
        layoutMs: o.LayoutDuration * 1000,
        styleMs: o.RecalcStyleDuration * 1000,
        layoutCount: o.LayoutCount,
        styleCount: o.RecalcStyleCount,
        nodes: o.Nodes,
        listeners: o.JSEventListeners,
        heapBytes: o.JSHeapUsedSize,
      };
    };
    {
      const m = await metrics();
      run.boot.heapMB = +(m.heapBytes / 1048576).toFixed(1);
      run.boot.nodes = m.nodes;
      run.boot.listeners = m.listeners;
    }

    const readProbe = () =>
      page.evaluate(() => {
        const p = window.__perfProbe;
        const out = {
          commits: p.commits,
          raf: p.raf,
          longTasks: p.longTasks.length,
          longMs: p.longTasks.reduce((a, b) => a + b, 0),
          errors: p.errors.slice(),
        };
        p.commits = 0;
        p.raf = 0;
        p.longTasks = [];
        p.errors = [];
        return out;
      });
    const settled = async () => {
      await cdp.send("HeapProfiler.collectGarbage");
      await sleep(400);
      await cdp.send("HeapProfiler.collectGarbage");
      await sleep(250);
      return metrics();
    };
    const phase = async (label, fn) => {
      const m0 = await metrics();
      await readProbe();
      const t0 = Date.now();
      await fn();
      const m1 = await metrics();
      const p = await readProbe();
      run.phases[label] = {
        wallMs: Date.now() - t0,
        taskMs: Math.round(m1.taskMs - m0.taskMs),
        scriptMs: Math.round(m1.scriptMs - m0.scriptMs),
        layoutMs: Math.round(m1.layoutMs - m0.layoutMs),
        styleMs: Math.round(m1.styleMs - m0.styleMs),
        layoutCount: m1.layoutCount - m0.layoutCount,
        styleCount: m1.styleCount - m0.styleCount,
        commits: p.commits,
        raf: p.raf,
        longTasks: p.longTasks,
        longMs: p.longMs,
        nodes: m1.nodes,
        listeners: m1.listeners,
        heapMB: +(m1.heapBytes / 1048576).toFixed(1),
      };
      run.errors.push(...p.errors);
    };

    const ctx = { page, app, sleep, userData, phase };
    await profile.prepare?.(ctx);
    for (const [label, fn] of Object.entries(profile.phases)) await phase(label, () => fn(ctx));

    const base = await settled();
    const samples = [];
    for (let c = 0; c < CYCLES; c++) {
      await profile.cycle(ctx, c);
      // The cycle must leave the app where it started. If node counts drift,
      // the series measures accumulation and the heap number is meaningless.
      samples.push(await settled());
    }
    run.leak = {
      cycles: CYCLES,
      heapKBPerCycle: +(slope(samples.map((s) => s.heapBytes)) / 1024).toFixed(1),
      nodesPerCycle: +slope(samples.map((s) => s.nodes)).toFixed(2),
      listenersPerCycle: +slope(samples.map((s) => s.listeners)).toFixed(2),
      baseHeapMB: +(base.heapBytes / 1048576).toFixed(1),
      finalHeapMB: +(samples.at(-1).heapBytes / 1048576).toFixed(1),
      baseNodes: base.nodes,
      finalNodes: samples.at(-1).nodes,
      baseListeners: base.listeners,
      finalListeners: samples.at(-1).listeners,
      series: samples.map((s) => ({
        heapMB: +(s.heapBytes / 1048576).toFixed(1),
        nodes: s.nodes,
        listeners: s.listeners,
      })),
    };

    run.dom = await page.evaluate((selectors) => {
      const counts = Object.fromEntries(
        Object.entries(selectors).map(([k, sel]) => [k, document.querySelectorAll(sel).length]),
      );
      return {
        ...counts,
        totalElements: document.getElementsByTagName("*").length,
        animations: document.getAnimations().length,
        cssRules: [...document.styleSheets].reduce((a, s) => {
          try {
            return a + s.cssRules.length;
          } catch (error) {
            void error;
            return a;
          }
        }, 0),
      };
    }, profile.domCensus ?? {});

    Object.assign(run, (await profile.extraChecks?.(ctx)) ?? {});

    if (app) {
      run.processes = await app.evaluate(({ app: a }) =>
        a.getAppMetrics().map((p) => ({
          type: p.type,
          privateMB: Math.round((p.memory?.workingSetSize ?? 0) / 1024),
        })),
      );
      run.processTotalMB = run.processes.reduce((a, p) => a + p.privateMB, 0);
    }
    if (runIndex === 0) await page.screenshot({ path: join(OUT, `${LABEL}-final.png`) });
  } finally {
    await close().catch(() => {});
    rmSync(userData, { recursive: true, force: true });
    rmSync(configHome, { recursive: true, force: true });
  }
  return run;
}

mkdirSync(OUT, { recursive: true });
const runs = [];
for (let i = 0; i < REPEATS; i++) {
  process.stdout.write(`[${LABEL}] run ${i + 1}/${REPEATS}\n`);
  runs.push(await runOnce(i));
}

const numericKeys = [
  "taskMs", "scriptMs", "layoutMs", "styleMs", "layoutCount", "styleCount",
  "commits", "raf", "longTasks", "longMs", "nodes", "listeners", "heapMB",
];
const summary = {
  label: LABEL,
  app: isAbsolute(APP) ? APP : resolve(APP),
  profile: PROFILE,
  platform: `${process.platform}-${process.arch}`,
  at: new Date().toISOString(),
  repeats: REPEATS,
  bundle: bundleSizes(APP, profile.bundle),
  boot: Object.fromEntries(
    Object.keys(runs[0].boot).map((k) => [k, median(runs.map((r) => r.boot[k]))]),
  ),
  phases: Object.fromEntries(
    Object.keys(runs[0].phases).map((name) => [
      name,
      Object.fromEntries(numericKeys.map((k) => [k, median(runs.map((r) => r.phases[name][k]))])),
    ]),
  ),
  leak: {
    cycles: CYCLES,
    ...Object.fromEntries(
      ["heapKBPerCycle", "nodesPerCycle", "listenersPerCycle", "baseHeapMB", "finalHeapMB",
       "baseNodes", "finalNodes", "baseListeners", "finalListeners"]
        .map((k) => [k, median(runs.map((r) => r.leak[k]))]),
    ),
    series: runs[0].leak.series,
  },
  dom: Object.fromEntries(
    Object.keys(runs[0].dom).map((k) => [k, median(runs.map((r) => r.dom[k]))]),
  ),
  processTotalMB: median(runs.map((r) => r.processTotalMB)),
  rendererErrors: [...new Set(runs.flatMap((r) => r.errors))],
  rendererErrorCount: median(runs.map((r) => r.errors.length)),
  runs,
};
for (const key of profile.extraSummaryKeys ?? []) {
  summary[key] = median(runs.map((r) => r[key] ?? 0));
}

writeFileSync(join(OUT, `${LABEL}.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, runs: undefined }, null, 2));
console.log(`\nwrote ${join(OUT, `${LABEL}.json`)}`);
