import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const positional = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const arg = (name, fallback) => {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const file = arg("file", positional[0]);
if (!file) throw new Error("usage: node trace-analyze.mjs <trace.json> [--mode=invalidation]");
const mode = arg("mode", "invalidation");
const limit = Number(arg("limit", "25"));
const raw = JSON.parse(readFileSync(resolve(file), "utf8"));
const events = Array.isArray(raw) ? raw : raw.traceEvents;
if (!Array.isArray(events)) throw new Error("not a Chrome trace");
const value = (event) => event.args?.data ?? event.args?.beginData ?? event.args ?? {};
const node = (data) => {
  const tag = data.nodeName ?? data.tagName ?? "?";
  const id = data.id ? `#${data.id}` : "";
  const classes = data.className ? `.${String(data.className).trim().replace(/\s+/g, ".")}` : "";
  return `<${String(tag).toLowerCase()}${id}${classes}>`;
};
const aggregate = (name, getKey) => {
  const counts = new Map();
  for (const event of events) {
    if (event.name !== name) continue;
    const key = getKey(value(event));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit);
};
const duration = (names) => events.filter((event) => names.has(event.name)).reduce((sum, event) => sum + (event.dur ?? 0), 0) / 1000;
const count = (names) => events.filter((event) => names.has(event.name)).length;
console.log(`trace ${basename(file)} · ${events.length.toLocaleString()} events`);
console.log(`style recalcs ${count(new Set(["UpdateLayoutTree", "RecalculateStyles"]))} · ${duration(new Set(["UpdateLayoutTree", "RecalculateStyles"])).toFixed(1)} ms`);
console.log(`layouts ${count(new Set(["Layout"]))} · ${duration(new Set(["Layout"])).toFixed(1)} ms`);

if (mode === "selectors") {
  const bySelector = new Map();
  for (const event of events) {
    if (event.name !== "SelectorStats") continue;
    const timings = value(event).selector_stats?.selector_timings ?? [];
    for (const timing of timings) {
      const current = bySelector.get(timing.selector) ?? { us: 0, attempts: 0, matches: 0, rejects: 0 };
      current.us += timing["elapsed (us)"] ?? 0;
      current.attempts += timing.match_attempts ?? 0;
      current.matches += timing.match_count ?? 0;
      current.rejects += timing.fast_reject_count ?? 0;
      bySelector.set(timing.selector, current);
    }
  }
  const total = [...bySelector.values()].reduce((sum, item) => sum + item.us, 0);
  console.log(`selector matching ${(total / 1000).toFixed(1)} ms over ${bySelector.size} selectors`);
  for (const [selector, item] of [...bySelector].sort((a, b) => b[1].us - a[1].us).slice(0, limit)) {
    console.log(`${(item.us / 1000).toFixed(1).padStart(8)} ms · attempts ${String(item.attempts).padStart(8)} · matches ${String(item.matches).padStart(7)} · rejects ${String(item.rejects).padStart(8)} · ${selector.slice(0, 180)}`);
  }
} else if (mode === "invalidation") {
  for (const [name, title, key] of [
    ["ScheduleStyleInvalidationTracking", "scheduled invalidations", (data) => `${data.reason ?? "?"} ${data.changedClass ?? data.changedAttribute ?? data.changedId ?? ""} ${node(data)}`],
    ["StyleRecalcInvalidationTracking", "recalculated elements", (data) => `${data.reason ?? "?"} ${data.extraData ?? ""} ${node(data)}`],
    ["StyleInvalidatorInvalidationTracking", "matched selector parts", (data) => `${data.reason ?? "?"} ${String(data.selectorPart ?? "").slice(0, 80)} ${node(data)}`],
  ]) {
    console.log(`\n${title}`);
    for (const [keyValue, total] of aggregate(name, key)) console.log(`${String(total).padStart(8)}x ${keyValue}`);
  }
} else if (mode === "longtasks") {
  const minimum = Number(arg("min-ms", "50"));
  const tasks = events.filter((event) => ["RunTask", "Task", "FunctionCall", "EvaluateScript"].includes(event.name) && (event.dur ?? 0) / 1000 >= minimum);
  console.log(`long tasks >= ${minimum} ms: ${tasks.length}`);
  for (const event of tasks.sort((a, b) => (b.dur ?? 0) - (a.dur ?? 0)).slice(0, limit)) {
    const data = value(event);
    console.log(`${((event.dur ?? 0) / 1000).toFixed(1).padStart(8)} ms · ${event.name} · ${data.url ?? data.scriptName ?? data.functionName ?? ""}`);
  }
} else {
  throw new Error(`unknown mode ${mode}; use invalidation, selectors, or longtasks`);
}
console.log(`\ntrace: ${resolve(file)}`);