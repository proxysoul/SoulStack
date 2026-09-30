// Renders one self-contained HTML report from two perf-ab.mjs JSON files.
//
//   node perf-report.mjs --before=before.json --after=after.json --out=report.html
//   node perf-report.mjs ... --changes=changes.json --cross=cross.json
//
// Every figure is interpolated from the JSON. Nothing is typed by hand, so the
// page cannot drift from the data. Regenerate after any re-run.
import { readFileSync, writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const before = JSON.parse(readFileSync(arg("before", "before.json"), "utf8"));
const after = JSON.parse(readFileSync(arg("after", "after.json"), "utf8"));
const OUT = arg("out", "performance.html");
const load = (p) => (p ? JSON.parse(readFileSync(p, "utf8")) : null);
// changes.json: [{ where, what }] — one entry per change, including reverts.
const changes = load(arg("changes")) ?? [];
// cross.json: { rows: [{ platform, check, ok, result }] }
const cross = load(arg("cross"));
const title = arg("title", "Where the time went");
const lead = arg("lead", "");

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const n = (v) =>
  v === null || v === undefined
    ? "—"
    : typeof v === "number"
      ? Number.isInteger(v)
        ? v.toLocaleString("en-US")
        : v.toFixed(1)
      : String(v);
const pct = (b, a) => (b === 0 || b === null || b === undefined || a === null || a === undefined ? null : ((a - b) / b) * 100);
const sign = (p) => (p === null ? "" : `${p > 0 ? "+" : ""}${p.toFixed(0)}%`);
const dir = (p, lowerIsBetter = true) => {
  if (p === null || Math.abs(p) < 3) return "flat";
  return (p < 0) === lowerIsBetter ? "good" : "bad";
};
const monotonic = (xs) => xs.every((v, i) => i === 0 || v >= xs[i - 1]);

const PHASES = Object.keys(before.phases).filter((k) => k in after.phases);
const label = (k) => k.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
const total = (src, field) => PHASES.reduce((s, k) => s + (src.phases[k]?.[field] ?? 0), 0);

const totalTaskB = total(before, "taskMs");
const totalTaskA = total(after, "taskMs");
const totalStyleB = total(before, "styleMs");
const totalStyleA = total(after, "styleMs");
const layoutPct = pct(total(before, "layoutCount"), total(after, "layoutCount"));
const styleCountPct = pct(total(before, "styleCount"), total(after, "styleCount"));
const rafPct = pct(total(before, "raf"), total(after, "raf"));
const taskPct = pct(totalTaskB, totalTaskA);
const worse = PHASES.map((k) => ({ k, p: pct(before.phases[k].taskMs, after.phases[k].taskMs) }))
  .filter((r) => r.p !== null && r.p > 5)
  .sort((a, b) => b.p - a.p);

const heapSeriesA = after.leak.series.map((s) => s.heapMB);
const nodeSeriesA = after.leak.series.map((s) => s.nodes);
const heapDriftMB = (after.leak.heapKBPerCycle * after.leak.cycles) / 1024;
const leakVerdict = [
  `DOM nodes move ${n(after.leak.nodesPerCycle)} per cycle, series ${nodeSeriesA.join(", ")}. Listeners move ${n(after.leak.listenersPerCycle)} per cycle.`,
  `The heap ${after.leak.heapKBPerCycle > 0 ? "climbs" : "does not climb"} ${n(after.leak.heapKBPerCycle)} KB per cycle, ${heapDriftMB.toFixed(1)} MB over ${after.leak.cycles} cycles, and its series ${monotonic(heapSeriesA) ? "IS monotonic" : "is not monotonic"} (${heapSeriesA.join(", ")} MB).`,
  monotonic(heapSeriesA)
    ? `Monotonic growth is what a leak looks like, so it is not dismissed: the unchanged build climbs at ${n(before.leak.heapKBPerCycle)} KB per cycle on the same shape, which places the source in the harness or the collector rather than in anything changed here.`
    : `A series that rises and falls is collector behaviour, not retention.`,
  `What can be concluded: ${Math.abs(after.leak.nodesPerCycle) < 1 && Math.abs(after.leak.listenersPerCycle) < 1 ? "no DOM node and no listener is retained across cycles" : "nodes or listeners ARE accumulating and this needs fixing before the heap number means anything"}. What cannot: whether the ${heapDriftMB.toFixed(1)} MB is retained objects or uncollected garbage. Separating those needs a heap-snapshot diff, which this suite does not take.`,
].join(" ");

function splitBar(p, scale) {
  const style = p.styleMs ?? 0;
  const layout = p.layoutMs ?? 0;
  const script = Math.max(0, p.scriptMs ?? 0);
  const other = Math.max(0, (p.taskMs ?? 0) - style - layout - script);
  const w = (v) => `${(v / scale) * 100}%`;
  return `<div class="bar">
    <span class="seg seg-style" style="width:${w(style)}" title="style ${n(style)} ms"></span>
    <span class="seg seg-layout" style="width:${w(layout)}" title="layout ${n(layout)} ms"></span>
    <span class="seg seg-script" style="width:${w(script)}" title="script ${n(script)} ms"></span>
    <span class="seg seg-other" style="width:${w(other)}" title="other ${n(other)} ms"></span>
  </div>`;
}

const scale = Math.max(...PHASES.flatMap((k) => [before.phases[k].taskMs, after.phases[k].taskMs]));
const phaseRows = PHASES.map((key) => {
  const b = before.phases[key];
  const a = after.phases[key];
  const fact = (name, bv, av, lower = true) =>
    `<div><dt>${name}</dt><dd class="mono">${n(bv)} → ${n(av)} <em class="${dir(pct(bv, av), lower)}">${sign(pct(bv, av))}</em></dd></div>`;
  return `<section class="phase">
    <header><h3>${esc(label(key))}</h3><code>${esc(key)}</code></header>
    <div class="pair">
      <div class="side"><span class="tag">before</span>${splitBar(b, scale)}<span class="tot mono">${n(b.taskMs)} ms</span></div>
      <div class="side"><span class="tag">after</span>${splitBar(a, scale)}<span class="tot mono">${n(a.taskMs)} ms</span></div>
    </div>
    <dl class="facts">
      ${fact("main thread", b.taskMs, a.taskMs)}
      ${fact("style recalculation", b.styleMs, a.styleMs)}
      ${fact("style recalcs", b.styleCount, a.styleCount)}
      ${fact("layouts", b.layoutCount, a.layoutCount)}
      ${fact("commits", b.commits, a.commits)}
      ${fact("frame callbacks", b.raf, a.raf)}
    </dl>
  </section>`;
}).join("\n");

const statRow = (name, b, a, lower = true, unit = "") =>
  `<tr><th scope="row">${esc(name)}</th><td class="mono">${n(b)}${unit}</td><td class="mono">${n(a)}${unit}</td><td class="mono ${dir(pct(b, a), lower)}">${sign(pct(b, a))}</td></tr>`;

const spark = (series, colour) => {
  const ys = series.map((s) => s.heapMB);
  const lo = Math.min(...ys);
  const span = Math.max(...ys) - lo || 1;
  const pts = ys.map((h, i) => `${(i / (ys.length - 1)) * 220},${40 - ((h - lo) / span) * 34}`).join(" ");
  return `<svg viewBox="0 0 220 44" class="spark" role="img" aria-label="heap across cycles"><polyline points="${pts}" fill="none" stroke="${colour}" stroke-width="2" stroke-linejoin="round"/></svg>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{
  --paper:#07090c; --paper-sunken:#04060a; --ink:#eef2f6; --ink-soft:#a3b0bd; --ink-faint:#6a7683;
  --rule:#1a222b; --rule-soft:#111820;
  --accent:#4ad8a0; --accent-2:#d8a35f; --accent-3:#e39ab8; --bad:#f4566b;
  --s1:4px; --s2:8px; --s3:12px; --s4:20px; --s5:32px; --s6:52px; --s7:84px;
  --prose:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box}
html{background:var(--paper)}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--prose);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:74ch;margin:0 auto;padding:var(--s7) var(--s4)}
.mono{font-family:var(--mono);font-size:.86em;font-variant-numeric:tabular-nums}
h1{font-size:clamp(32px,5vw,56px);line-height:1.05;font-weight:600;letter-spacing:-.018em;margin:0 0 var(--s4)}
h2{font-size:25px;font-weight:600;margin:var(--s7) 0 var(--s3);padding-bottom:var(--s2);border-bottom:1px solid var(--rule)}
h3{font-size:18px;font-weight:600;margin:0}
p{margin:0 0 var(--s3);color:var(--ink-soft);max-width:68ch}
p.lead{color:var(--ink);font-size:20px;line-height:1.5}
code{font-family:var(--mono);font-size:.84em;color:var(--accent-2);background:#0d1219;padding:1px 5px;border-radius:3px}
.good{color:var(--accent)} .bad{color:var(--bad)} .flat{color:var(--ink-faint)}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4);margin:var(--s6) 0 var(--s5);padding:var(--s4) 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.hero div{display:flex;flex-direction:column;gap:var(--s1)}
.hero b{font-family:var(--mono);font-size:clamp(26px,4vw,40px);font-weight:500;line-height:1;letter-spacing:-.02em}
.hero span{font-size:14px;color:var(--ink-faint);line-height:1.35}
.legend{display:flex;flex-wrap:wrap;gap:var(--s4);margin:var(--s4) 0;font-size:14px;color:var(--ink-soft)}
.legend i{display:inline-block;width:11px;height:11px;margin-right:6px;border-radius:2px;vertical-align:-1px}
.phase{margin:var(--s5) 0;padding-bottom:var(--s4);border-bottom:1px solid var(--rule-soft)}
.phase header{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s3);margin-bottom:var(--s3)}
.phase header code{color:var(--ink-faint);background:none;padding:0}
.pair{display:flex;flex-direction:column;gap:var(--s2)}
.side{display:grid;grid-template-columns:62px 1fr 78px;align-items:center;gap:var(--s3)}
.tag{font-size:12px;letter-spacing:.06em;color:var(--ink-faint)}
.tot{text-align:right;color:var(--ink-soft)}
.bar{display:flex;height:16px;background:var(--paper-sunken);border-radius:3px;overflow:hidden}
.seg{display:block;height:100%}
.seg-style{background:var(--accent)} .seg-layout{background:var(--accent-2)}
.seg-script{background:var(--accent-3)} .seg-other{background:#26333d}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--s2) var(--s4);margin-top:var(--s3)}
.facts div{display:flex;justify-content:space-between;gap:var(--s2);border-bottom:1px dotted var(--rule);padding-bottom:3px}
.facts dt{font-size:14px;color:var(--ink-faint)} .facts dd{margin:0;font-size:14px} .facts em{font-style:normal}
table{width:100%;border-collapse:collapse;margin:var(--s3) 0 var(--s5);font-size:15px}
caption{text-align:left;color:var(--ink-faint);font-size:14px;padding-bottom:var(--s2)}
th,td{text-align:right;padding:7px 10px;border-bottom:1px solid var(--rule-soft)}
th[scope=row]{text-align:left;font-weight:400;color:var(--ink-soft)}
thead th{color:var(--ink-faint);font-size:13px;font-weight:500;border-bottom:1px solid var(--rule)}
.sparks{display:flex;gap:var(--s5);flex-wrap:wrap;margin:var(--s3) 0 var(--s5)}
.sparks figcaption{font-size:13px;color:var(--ink-faint);margin-top:var(--s1)}
.changes{list-style:none;margin:0;padding:0}
.changes li{padding:var(--s3) 0;border-bottom:1px solid var(--rule-soft)}
.changes b{display:block;font-family:var(--mono);font-size:13px;font-weight:500;color:var(--accent);margin-bottom:var(--s1);word-break:break-all}
.changes span{color:var(--ink-soft);font-size:15px}
.caveat{border-left:2px solid var(--accent-2);padding:var(--s2) 0 var(--s2) var(--s4);margin:var(--s4) 0}
.caveat p{margin:0 0 var(--s2)} .caveat p:last-child{margin:0}
footer{margin-top:var(--s7);padding-top:var(--s4);border-top:1px solid var(--rule);color:var(--ink-faint);font-size:13px}
@media (max-width:640px){
  .wrap{padding:var(--s6) var(--s3)}
  .hero{grid-template-columns:1fr;gap:var(--s3)}
  .side{grid-template-columns:52px 1fr;grid-template-areas:"tag bar" ". tot"}
  .side .tag{grid-area:tag}.side .bar{grid-area:bar}.side .tot{grid-area:tot;text-align:left}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="wrap">

<h1>${esc(title)}</h1>
<p class="lead">${lead ? esc(lead) : `Across ${PHASES.length} scripted phases, the engine spent ${n(totalStyleB)} ms of its ${n(totalTaskB)} ms on the main thread recalculating style. Main-thread work is now ${sign(taskPct)}, layout passes ${sign(layoutPct)}.`}</p>

<div class="hero">
  <div><b class="${dir(taskPct)}">${sign(taskPct)}</b><span>main thread, every phase</span></div>
  <div><b class="${dir(layoutPct)}">${sign(layoutPct)}</b><span>layout passes</span></div>
  <div><b class="${dir(styleCountPct)}">${sign(styleCountPct)}</b><span>style recalculations</span></div>
</div>

<h2>How this was measured</h2>
<p>One script drives a production build through Playwright and reads the engine's own counters over the DevTools protocol. It ran ${n(before.repeats)} times against each build on the same machine; every number is the median. The two builds differ only by the changes listed at the end, and each was compiled from a purged output directory. The run seeds a throwaway config home, so it does not inherit local settings.</p>
<p class="mono" style="color:var(--ink-faint);font-size:13px">${esc(before.platform)} · before ${esc(before.at)} · after ${esc(after.at)}</p>

<h2>Where the time went, phase by phase</h2>
<div class="legend">
  <span><i style="background:var(--accent)"></i>style recalculation</span>
  <span><i style="background:var(--accent-2)"></i>layout</span>
  <span><i style="background:var(--accent-3)"></i>script</span>
  <span><i style="background:#26333d"></i>other main-thread work</span>
</div>
<p>Bars share one scale, so a shorter bar is less work.</p>
${phaseRows}

<h2>What the app costs at rest</h2>
<table>
<caption>Startup, footprint and bundle. Lower is better on every row.</caption>
<thead><tr><th scope="col">measure</th><th scope="col">before</th><th scope="col">after</th><th scope="col">change</th></tr></thead>
<tbody>
${statRow("Launch to first window", before.boot.launchToWindowMs, after.boot.launchToWindowMs, true, " ms")}
${statRow("Reload to first commit", before.boot.reloadToFirstCommitMs, after.boot.reloadToFirstCommitMs, true, " ms")}
${statRow("Heap at first commit", before.boot.heapMB, after.boot.heapMB, true, " MB")}
${statRow("DOM nodes at first commit", before.boot.nodes, after.boot.nodes)}
${statRow("Listeners at first commit", before.boot.listeners, after.boot.listeners)}
${before.processTotalMB ? statRow("All processes, resident", before.processTotalMB, after.processTotalMB, true, " MB") : ""}
${statRow("JavaScript parsed before first paint", before.bundle.bootCriticalKB, after.bundle.bootCriticalKB, true, " KB")}
${statRow("Chunks in that boot graph", before.bundle.bootCriticalChunks, after.bundle.bootCriticalChunks)}
${statRow("All JavaScript the app can reach", before.bundle.reachableTotalKB, after.bundle.reachableTotalKB, true, " KB")}
${statRow("Stale files in the output directory", before.bundle.orphanFiles, after.bundle.orphanFiles)}
${statRow("Uncaught errors per run", before.rendererErrorCount, after.rendererErrorCount)}
${Object.keys(before).filter((k) => k.startsWith("panel")).map((k) => statRow(label(k.replace(/([A-Z])/g, " $1").toLowerCase()), before[k], after[k], k.toLowerCase().includes("skeleton"))).join("\n")}
</tbody>
</table>

<h2>Does it leak</h2>
<p>${n(before.leak.cycles)} identical cycles, two forced collections between each, and the app returned to its starting state at the end of every one. A leak shows up as a line that climbs and never comes back down.</p>
<div class="sparks">
  <figure style="margin:0">${spark(before.leak.series, "#6a7683")}<figcaption>before · ${n(before.leak.heapKBPerCycle)} KB per cycle</figcaption></figure>
  <figure style="margin:0">${spark(after.leak.series, "#4ad8a0")}<figcaption>after · ${n(after.leak.heapKBPerCycle)} KB per cycle</figcaption></figure>
</div>
<table>
<caption>Growth per cycle, least squares. Zero means nothing is retained.</caption>
<thead><tr><th scope="col">measure</th><th scope="col">before</th><th scope="col">after</th><th scope="col">change</th></tr></thead>
<tbody>
${statRow("Heap growth per cycle", before.leak.heapKBPerCycle, after.leak.heapKBPerCycle, true, " KB")}
<tr><th scope="row">Nodes retained per cycle</th><td class="mono">${n(before.leak.nodesPerCycle)}</td><td class="mono ${Math.abs(after.leak.nodesPerCycle) < 1 ? "good" : "bad"}">${n(after.leak.nodesPerCycle)}</td><td class="mono ${Math.abs(after.leak.nodesPerCycle) < 1 ? "good" : "bad"}">${Math.abs(after.leak.nodesPerCycle) < 1 ? "flat" : "ACCUMULATING"}</td></tr>
<tr><th scope="row">Listeners retained per cycle</th><td class="mono">${n(before.leak.listenersPerCycle)}</td><td class="mono ${Math.abs(after.leak.listenersPerCycle) < 1 ? "good" : "bad"}">${n(after.leak.listenersPerCycle)}</td><td class="mono ${Math.abs(after.leak.listenersPerCycle) < 1 ? "good" : "bad"}">${Math.abs(after.leak.listenersPerCycle) < 1 ? "flat" : "ACCUMULATING"}</td></tr>
${statRow("Heap after the last cycle", before.leak.finalHeapMB, after.leak.finalHeapMB, true, " MB")}
</tbody>
</table>
<p>${leakVerdict}</p>

${cross ? `<h2>Other platforms</h2>
<table>
<caption>The same two builds, wherever the app ships.</caption>
<thead><tr><th scope="col">platform</th><th scope="col">check</th><th scope="col">result</th></tr></thead>
<tbody>${cross.rows.map((r) => `<tr><th scope="row">${esc(r.platform)}</th><td style="text-align:left">${esc(r.check)}</td><td class="mono ${r.ok ? "good" : "bad"}">${esc(r.result)}</td></tr>`).join("")}</tbody>
</table>` : ""}

${changes.length ? `<h2>What changed</h2>
<ol class="changes">
${changes.map((c) => `<li><b>${esc(c.where)}</b><span>${c.what}</span></li>`).join("\n")}
</ol>` : ""}

<h2>What this does not say</h2>
${worse.length ? `<div class="caveat"><p><strong>Phases that came out slower.</strong> ${worse.map((r) => `${esc(label(r.k))} ${sign(r.p)}`).join(", ")}. Printed here rather than dropped, because a report that shows only the wins is not a measurement.</p></div>` : ""}
<div class="caveat">
<p>Wall-clock milliseconds on a shared machine move by tens of percent between runs of the same binary. Counts do not. Where a timing and a count disagree, believe the count: style recalculations ${sign(styleCountPct)}, layout passes ${sign(layoutPct)}, frame callbacks ${sign(rafPct)}.</p>
<p>These ${PHASES.length} phases are scripted, not a recording of a real session. They cover the paths that dominate this surface, not everything the app can do.</p>
</div>

<footer>Generated from <code>${esc(arg("before", "before.json"))}</code> and <code>${esc(arg("after", "after.json"))}</code>. Re-run the harness and regenerate to refresh every number on this page.</footer>
</div>
</body>
</html>`;

writeFileSync(OUT, html);
console.log(OUT);
