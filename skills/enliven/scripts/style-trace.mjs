// Blink style-invalidation trace: names the CSS rule behind each recalculation.
//
//   node style-trace.mjs --profile=./my-app.mjs --app=/path/to/build --phase=stream-answer
//
// Run this on whichever phase came out worst in perf-ab.mjs. It answers "which
// selector", which a flame graph does not. The output is a ranked list; the
// rows at the top with an ancestor node name (#root, .app) are the expensive
// ones, because an invalidation scheduled there re-styles the whole subtree.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const profile = (await import(pathToFileURL(resolve(arg("profile"))).href)).default;
const APP = resolve(arg("app", profile.appDir ?? "."));
const PHASE = arg("phase", Object.keys(profile.phases)[0]);
const OUT = arg("out", join(tmpdir(), `style-trace-${Date.now()}.json`));

const CATEGORIES = [
  "blink.style",
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.invalidationTracking",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { _electron: electron } = await import("playwright-core");
const userData = mkdtempSync(join(tmpdir(), "style-user-"));
const app = await electron.launch({
  args: [join(APP, profile.electron.main)],
  cwd: APP,
  timeout: 60_000,
  env: {
    ...process.env,
    ...(profile.env ?? {}),
    ...(profile.userDataEnv ? { [profile.userDataEnv]: userData } : {}),
    ...(profile.electron.rendererUrlEnv
      ? { [profile.electron.rendererUrlEnv]: pathToFileURL(join(APP, profile.electron.rendererHtml)).href }
      : {}),
  },
});
try {
  const page = await app.firstWindow();
  page.setDefaultTimeout(30_000);
  await page.waitForLoadState("domcontentloaded");
  const ctx = { page, app, sleep, userData };
  await profile.prepare?.(ctx);
  // Everything before the measured phase runs untraced, so the trace holds
  // only the interaction under investigation.
  for (const [name, fn] of Object.entries(profile.phases)) {
    if (name === PHASE) break;
    await fn(ctx);
  }

  const cdp = await page.context().newCDPSession(page);
  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", {
    traceConfig: { includedCategories: CATEGORIES, recordMode: "recordContinuously" },
    transferMode: "ReportEvents",
  });
  await profile.phases[PHASE](ctx);
  await sleep(800);
  await cdp.send("Tracing.end");
  await done;
  writeFileSync(OUT, JSON.stringify({ traceEvents: events }));

  const recalc = events.filter((e) => e.name === "UpdateLayoutTree" || e.name === "RecalculateStyles");
  const ms = recalc.reduce((a, e) => a + (e.dur ?? 0) / 1000, 0);
  const elements = recalc.reduce((a, e) => a + (e.args?.elementCount ?? e.args?.data?.elementCount ?? 0), 0);
  console.log(
    `phase ${PHASE}: ${recalc.length} style recalcs, ${ms.toFixed(0)} ms, ${elements} elements ` +
      `(${(elements / Math.max(1, recalc.length)).toFixed(0)} per recalc)`,
  );
  const layouts = events.filter((e) => e.name === "Layout");
  console.log(`layouts: ${layouts.length}, ${layouts.reduce((a, e) => a + (e.dur ?? 0) / 1000, 0).toFixed(0)} ms`);

  const agg = (name, keyOf) => {
    const m = new Map();
    for (const e of events) {
      if (e.name !== name) continue;
      const k = keyOf(e.args?.data ?? {});
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([k, c]) => `  ${String(c).padStart(6)}x ${k}`)
      .join("\n");
  };
  const node = (d) => `<${d.nodeName ?? "?"}>`.slice(0, 120);
  console.log("\nWhat scheduled an invalidation, and on which node:");
  console.log(agg("ScheduleStyleInvalidationTracking", (d) => `${d.reason ?? "?"} ${d.changedClass ?? d.changedAttribute ?? d.changedId ?? ""} ${node(d)}`));
  console.log("\nWhy each element was recalculated:");
  console.log(agg("StyleRecalcInvalidationTracking", (d) => `${d.reason ?? "?"} ${d.extraData ?? ""} ${node(d)}`));
  console.log("\nWhich selector part matched:");
  console.log(agg("StyleInvalidatorInvalidationTracking", (d) => `${d.reason ?? "?"} ${(d.selectorPart ?? "").slice(0, 60)} ${node(d)}`));
  console.log(`\nRead these top-down. A reason of "has" on a high ancestor (#root, .app, the
app shell) means a descendant :has() is re-styling the whole subtree on every
DOM mutation underneath it. Replace it with an attribute the component sets,
or a sibling :has(~ .x), which the engine can bound.

trace: ${OUT}`);
} finally {
  await app.close().catch(() => {});
}
