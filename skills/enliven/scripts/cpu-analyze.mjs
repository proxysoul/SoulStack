import { readFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const positional = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const arg = (name, fallback) => {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const file = arg("file", positional[0]);
if (!file) throw new Error("usage: node cpu-analyze.mjs <file.cpuprofile> [--mode=summary]");
const mode = arg("mode", "summary");
const top = Number(arg("top", "25"));
const root = arg("root", "") ? resolve(arg("root", "")) : "";
const raw = JSON.parse(readFileSync(resolve(file), "utf8"));
const profile = raw.nodes ? raw : raw.profile;
if (!profile?.nodes || !profile.samples || !profile.timeDeltas) throw new Error("not a Chrome CPU profile");
const nodes = profile.nodes;
const byId = new Map(nodes.map((node) => [node.id, node]));
const parent = new Map();
for (const node of nodes) for (const child of node.children ?? []) parent.set(child, node.id);

const shortUrl = (input) => {
  if (!input) return "(native)";
  let url = String(input).replaceAll("\\", "/").replace(/[?#].*$/, "");
  try {
    if (url.startsWith("file://")) url = decodeURIComponent(new URL(url).pathname);
  } catch { }
  const nodeModules = url.indexOf("/node_modules/");
  if (nodeModules >= 0) return `nm/${url.slice(nodeModules + 14)}`;
  if (root && (url === root || url.startsWith(`${root}/`))) return `./${relative(root, url)}`;
  const marker = url.match(/\/(?:src|app|apps|packages|lib|components|dist|build)\//);
  if (marker?.index !== undefined) return url.slice(marker.index + 1);
  if (/^[a-z]+:\/\//i.test(url)) {
    try {
      return new URL(url).pathname.replace(/^\//, "");
    } catch { }
  }
  if (url.startsWith("/")) return `…/${url.split("/").slice(-3).join("/")}`;
  return url;
};
const frameLabel = (node) => {
  const frame = node?.callFrame;
  if (!frame) return "?";
  const name = frame.functionName || "(anon)";
  const line = Number.isFinite(frame.lineNumber) && frame.lineNumber >= 0 ? `:${frame.lineNumber + 1}` : "";
  return `${name} ${shortUrl(frame.url)}${line}`;
};
const stackOf = (id) => {
  const stack = [];
  const seen = new Set();
  for (let current = id; current !== undefined && !seen.has(current); current = parent.get(current)) {
    seen.add(current);
    if (!byId.has(current)) break;
    stack.push(current);
  }
  return stack;
};
const idle = (node) =>
  !node || ["(idle)", "(program)", "(root)", "(garbage collector)"].includes(node.callFrame.functionName);
let elapsedMs = 0;
const rows = profile.samples.map((id, index) => {
  const ms = (profile.timeDeltas[index] ?? 0) / 1000;
  const row = { id, atMs: elapsedMs, ms, node: byId.get(id), stack: stackOf(id) };
  elapsedMs += ms;
  return row;
});
const mapAdd = (map, key, value) => map.set(key, (map.get(key) ?? 0) + value);
const sorted = (map) => [...map].sort((a, b) => b[1] - a[1]).slice(0, top);
const printMap = (heading, map, unit = "ms") => {
  console.log(`-- ${heading}`);
  for (const [key, value] of sorted(map)) console.log(`${value.toFixed(1).padStart(8)} ${unit}  ${key}`);
};
const windowRows = () => {
  let selected = rows;
  const anchor = arg("anchor", "");
  if (anchor) {
    const index = rows.findIndex((row) => row.stack.some((id) => byId.get(id)?.callFrame.functionName === anchor));
    if (index < 0) throw new Error(`anchor ${anchor} never sampled`);
    const before = Number(arg("before", "50"));
    const after = Number(arg("after", "400"));
    const point = rows[index].atMs;
    selected = rows.filter((row) => row.atMs >= point - before && row.atMs <= point + after);
  } else if (arg("window", "")) {
    const end = rows.at(-1)?.atMs ?? 0;
    const skip = Number(arg("skip", "0")) * 1000;
    const duration = Number(arg("window", "0")) * 1000;
    selected = rows.filter((row) => row.atMs >= end - skip - duration && row.atMs <= end - skip);
  }
  return selected;
};
const selfAndInclusive = (selected) => {
  const self = new Map();
  const inclusive = new Map();
  let busyMs = 0;
  for (const row of selected) {
    if (idle(row.node)) continue;
    busyMs += row.ms;
    mapAdd(self, frameLabel(row.node), row.ms);
    const seen = new Set();
    for (const id of row.stack) {
      const key = frameLabel(byId.get(id));
      if (seen.has(key)) continue;
      seen.add(key);
      mapAdd(inclusive, key, row.ms);
    }
  }
  return { self, inclusive, busyMs };
};
const appFrame = (node) => {
  const url = String(node?.callFrame?.url ?? "");
  return Boolean(url) && !url.includes("/node_modules/") && !url.startsWith("internal:");
};

if (mode === "summary" || mode === "window" || mode === "anchor") {
  const selected = windowRows();
  const { self, inclusive, busyMs } = selfAndInclusive(selected);
  const duration = selected.length ? selected.at(-1).atMs - selected[0].atMs + selected.at(-1).ms : 0;
  const windowLabel = arg("anchor", "") ? `around ${arg("anchor", "")}` : arg("window", "") ? `${arg("window", "")}s window` : "full profile";
  console.log(`profile ${basename(file)} · ${windowLabel} · ${duration.toFixed(0)} ms sampled · ${busyMs.toFixed(0)} ms busy`);
  printMap("self", self);
  printMap("inclusive", inclusive);
  const packages = new Map();
  for (const [label, value] of self) mapAdd(packages, label.split(" ").slice(1).join(" ").split("/").slice(0, 2).join("/"), value);
  printMap("self by path", packages);
} else if (mode === "who") {
  const target = arg("target", positional[1]);
  if (!target) throw new Error("--target=<function name> is required for --mode=who");
  const depth = Number(arg("depth", "4"));
  const chains = new Map();
  let total = 0;
  for (const row of rows) {
    const at = row.stack.findIndex((id) => byId.get(id)?.callFrame.functionName === target);
    if (at < 0) continue;
    total += row.ms;
    const chain = row.stack.slice(at + 1, at + 1 + depth).map((id) => frameLabel(byId.get(id)));
    mapAdd(chains, chain.join(" < ") || "(root)", row.ms);
  }
  console.log(`${target}: ${total.toFixed(1)} ms inclusive`);
  printMap("callers", chains);
} else if (mode === "children") {
  const target = arg("target", positional[1]);
  if (!target) throw new Error("--target=<function name> is required for --mode=children");
  const depth = Number(arg("depth", "1"));
  const children = new Map();
  let total = 0;
  for (const row of rows) {
    const at = row.stack.findIndex((id) => byId.get(id)?.callFrame.functionName === target);
    if (at < 0) continue;
    total += row.ms;
    const child = row.stack[at - depth];
    mapAdd(children, child === undefined ? "(self)" : frameLabel(byId.get(child)), row.ms);
  }
  console.log(`${target}: ${total.toFixed(1)} ms`);
  printMap("children", children);
} else if (mode === "modules") {
  const needle = arg("needle", positional[1] ?? "");
  const matcher = needle ? new RegExp(needle) : null;
  const byModule = new Map();
  let matched = 0;
  for (const row of rows) {
    const leaf = row.node;
    if (matcher && !matcher.test(`${leaf?.callFrame?.functionName} ${leaf?.callFrame?.url}`)) continue;
    matched += row.ms;
    const owner = row.stack.find((id) => appFrame(byId.get(id)) && (arg("functions", "0") === "1" || byId.get(id)?.callFrame.functionName === "(module)"));
    mapAdd(byModule, owner === undefined ? "(no app module)" : frameLabel(byId.get(owner)), row.ms);
  }
  console.log(`samples matching ${needle ? `/${needle}/` : "all leaves"}: ${matched.toFixed(1)} ms`);
  printMap("nearest app module", byModule);
} else if (mode === "longtasks") {
  const minimum = Number(arg("min-ms", "120"));
  const gap = Number(arg("gap-ms", "4"));
  let start = 0;
  const spans = [];
  for (let index = 1; index <= rows.length; index++) {
    const gapMs = index < rows.length ? rows[index].atMs - rows[index - 1].atMs : Number.POSITIVE_INFINITY;
    if (gapMs <= gap) continue;
    const first = rows[start];
    const last = rows[index - 1];
    const duration = last ? last.atMs - first.atMs + last.ms : 0;
    if (duration >= minimum) spans.push([start, index - 1]);
    start = index;
  }
  if (!spans.length) console.log("no sampled spans met the threshold");
  for (const [from, to] of spans) {
    const selected = rows.slice(from, to + 1);
    const { self, inclusive, busyMs } = selfAndInclusive(selected);
    console.log(`@${selected[0].atMs.toFixed(0)}ms long task ${busyMs.toFixed(0)}ms (${selected.length} samples)`);
    console.log(`  self ${sorted(self).slice(0, 6).map(([key, value]) => `${value.toFixed(0)}ms ${key}`).join(" | ")}`);
    console.log(`  app  ${sorted(new Map([...inclusive].filter(([key]) => !key.includes("nm/") && !key.startsWith("(root)")))).slice(0, 6).map(([key, value]) => `${value.toFixed(0)}ms ${key}`).join(" | ")}`);
  }
} else {
  throw new Error(`unknown mode ${mode}; use summary, window, anchor, who, children, modules, or longtasks`);
}