import { resolve } from "node:path";
import { addStyle, arg, cssArg, loadProfile, median, openApp, reach, sleep, writeJson } from "./harness.mjs";

const { profile, appDir } = await loadProfile();
const after = arg("after");
const windowMs = Number(arg("window", "5000"));
const repeats = Number(arg("repeats", "3"));
const settleMs = Number(arg("settle", "2000"));
const layerTop = Number(arg("layers", "12"));
const focus = arg("focus", "front");
const label = arg("label", "frames");
const output = resolve(arg("out", `./perf/${label}.json`));
const css = cssArg();
const seconds = windowMs / 1000;

async function processCpu(context) {
  if (context.app) {
    const rows = await context.app.evaluate(({ app }) =>
      app.getAppMetrics().map((metric) => ({
        key: metric.name ? `${metric.type}:${metric.name}` : metric.type,
        pid: metric.pid,
        seconds: metric.cpu.cumulativeCPUUsage ?? null,
        percent: metric.cpu.percentCPUUsage,
        wake: metric.cpu.idleWakeupsPerSecond,
      })),
    );
    return rows;
  }
  const session = await context.browser.newBrowserCDPSession();
  const { processInfo } = await session.send("SystemInfo.getProcessInfo");
  await session.detach();
  return processInfo.map((info) => ({ key: info.type, pid: info.id, seconds: info.cpuTime, percent: null, wake: null }));
}

function cpuDelta(before, afterRows) {
  const start = new Map(before.map((row) => [row.pid, row]));
  const perProcess = {};
  let wake = 0;
  let wakeKnown = false;
  for (const row of afterRows) {
    const first = start.get(row.pid);
    const ms =
      first && row.seconds !== null && first.seconds !== null
        ? ((row.seconds - first.seconds) * 1000) / seconds
        : (row.percent ?? 0) * 10;
    perProcess[row.key] = Math.round((perProcess[row.key] ?? 0) + ms);
    if (row.wake !== null && row.wake !== undefined) {
      wake += row.wake;
      wakeKnown = true;
    }
  }
  const totalCpuMsPerS = Object.values(perProcess).reduce((sum, ms) => sum + ms, 0);
  return { totalCpuMsPerS, perProcess, wakePerS: wakeKnown ? Math.round(wake) : null };
}

async function rendererCounters(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const value = Object.fromEntries(metrics.map((metric) => [metric.name, metric.value]));
  return { taskMs: value.TaskDuration * 1000, recalcs: value.RecalcStyleCount, layouts: value.LayoutCount };
}

function installCensus() {
  const where = () =>
    (new Error().stack ?? "")
      .split("\n")
      .slice(3, 6)
      .map((line) => line.trim().replace(/^at /, "").replace(/\(?(?:file|https?):\/\/[^)]*\/([^/)]+)\)?/, "$1"))
      .join(" < ");
  const counts = new Map();
  const bump = (key) => counts.set(key, (counts.get(key) ?? 0) + 1);
  const census = { counts, raf: 0 };
  window.__enlivenCensus = census;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    census.raf += 1;
    bump(`raf  ${where()}`);
    return raf(callback);
  };
  const timeout = window.setTimeout.bind(window);
  window.setTimeout = (callback, ms, ...rest) => {
    bump(`timeout(${ms ?? 0})  ${where()}`);
    return timeout(callback, ms, ...rest);
  };
  const interval = window.setInterval.bind(window);
  window.setInterval = (callback, ms, ...rest) => {
    const key = `interval(${ms ?? 0})  ${where()}`;
    return interval(
      (...args) => {
        bump(key);
        return typeof callback === "function" ? callback(...args) : undefined;
      },
      ms,
      ...rest,
    );
  };
}

async function countFrames(cdp) {
  let drawn = 0;
  let begun = 0;
  const onData = (event) => {
    for (const entry of event.value) {
      if (entry.name === "DrawFrame") drawn += 1;
      else if (entry.name === "BeginFrame") begun += 1;
    }
  };
  cdp.on("Tracing.dataCollected", onData);
  const complete = new Promise((done) => cdp.once("Tracing.tracingComplete", done));
  await cdp.send("Tracing.start", {
    traceConfig: { includedCategories: ["disabled-by-default-devtools.timeline.frame"], recordMode: "recordContinuously" },
    transferMode: "ReportEvents",
  });
  await sleep(windowMs);
  await cdp.send("Tracing.end");
  await complete;
  cdp.off("Tracing.dataCollected", onData);
  return { framesPerS: +(drawn / seconds).toFixed(1), beginFramesPerS: +(begun / seconds).toFixed(1) };
}

async function layerCensus(cdp, page) {
  let layers = [];
  const changed = new Promise((done) => {
    cdp.on("LayerTree.layerTreeDidChange", (event) => {
      if (event.layers?.length) {
        layers = event.layers;
        done();
      }
    });
  });
  await cdp.send("LayerTree.enable");
  await page.evaluate(() => document.body.style.setProperty("--enliven-layer-poke", String(Math.random())));
  await Promise.race([changed, sleep(4000)]);
  const drawing = layers.filter((layer) => layer.drawsContent);
  const sized = drawing
    .map((layer) => ({ layer, bytes: Math.round(layer.width * layer.height * 4) }))
    .sort((a, b) => b.bytes - a.bytes);
  const top = [];
  for (const { layer, bytes } of sized.slice(0, layerTop)) {
    const reasons = await cdp
      .send("LayerTree.compositingReasons", { layerId: layer.layerId })
      .then((reply) => reply.compositingReasonIds ?? reply.compositingReasons ?? [])
      .catch((error) => [`unknown: ${error.message}`]);
    top.push({ size: `${Math.round(layer.width)}x${Math.round(layer.height)}`, estimatedMB: +(bytes / 1048576).toFixed(1), paints: layer.paintCount, reasons });
  }
  await cdp.send("LayerTree.disable");
  return {
    layers: layers.length,
    drawing: drawing.length,
    estimatedMB: +(sized.reduce((sum, row) => sum + row.bytes, 0) / 1048576).toFixed(1),
    top,
  };
}

async function runOnce(index) {
  const { context, close } = await openApp(profile, appDir);
  try {
    await reach(profile, context, after);
    if (css) await addStyle(context.page, css);
    let focusNote = "front";
    if (focus === "behind") {
      if (profile.focus) {
        await profile.focus(context, false);
        focusNote = "behind";
      } else {
        focusNote = "behind requested, but the profile has no focus hook: Playwright keeps reporting the page focused, so this run measured the focused window";
      }
    }
    await context.page.mouse.move(1, 1);
    await sleep(settleMs);
    const cdp = await context.page.context().newCDPSession(context.page);
    await cdp.send("Performance.enable");
    await context.page.evaluate(installCensus);
    const cpuStart = await processCpu(context);
    const mainStart = await rendererCounters(cdp);
    await sleep(windowMs);
    const mainEnd = await rendererCounters(cdp);
    const cpuEnd = await processCpu(context);
    const census = await context.page.evaluate(() => {
      const state = window.__enlivenCensus;
      return {
        raf: state.raf,
        callers: [...state.counts].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([where, count]) => ({ count, where })),
      };
    });
    const frames = await countFrames(cdp);
    const layers = layerTop > 0 ? await layerCensus(cdp, context.page) : null;
    await cdp.detach();
    const run = {
      index,
      focus: focusNote,
      ...cpuDelta(cpuStart, cpuEnd),
      ...frames,
      mainTaskMsPerS: Math.round((mainEnd.taskMs - mainStart.taskMs) / seconds),
      recalcsPerS: +((mainEnd.recalcs - mainStart.recalcs) / seconds).toFixed(1),
      layoutsPerS: +((mainEnd.layouts - mainStart.layouts) / seconds).toFixed(1),
      rafPerS: +(census.raf / seconds).toFixed(1),
      callers: census.callers,
      layers,
    };
    console.log(
      `run ${index}: total ${run.totalCpuMsPerS} ms/s  fps ${run.framesPerS}  begin ${run.beginFramesPerS}/s  wake ${run.wakePerS ?? "n/a"}/s  main ${run.mainTaskMsPerS} ms/s  style ${run.recalcsPerS}/s  rAF ${run.rafPerS}/s  ${Object.entries(run.perProcess)
        .map(([key, ms]) => `${key} ${ms}`)
        .join("  ")}`,
    );
    return run;
  } finally {
    await close();
  }
}

const runs = [];
for (let index = 0; index < repeats; index += 1) runs.push(await runOnce(index));
const keys = [...new Set(runs.flatMap((run) => Object.keys(run.perProcess)))];
const summary = {
  totalCpuMsPerS: median(runs.map((run) => run.totalCpuMsPerS)),
  perProcess: Object.fromEntries(keys.map((key) => [key, median(runs.map((run) => run.perProcess[key] ?? 0))])),
  wakePerS: runs.some((run) => run.wakePerS === null) ? null : median(runs.map((run) => run.wakePerS)),
  framesPerS: median(runs.map((run) => run.framesPerS)),
  beginFramesPerS: median(runs.map((run) => run.beginFramesPerS)),
  mainTaskMsPerS: median(runs.map((run) => run.mainTaskMsPerS)),
  recalcsPerS: median(runs.map((run) => run.recalcsPerS)),
  layoutsPerS: median(runs.map((run) => run.layoutsPerS)),
  rafPerS: median(runs.map((run) => run.rafPerS)),
  compositedLayers: median(runs.map((run) => run.layers?.drawing ?? 0)),
  layerMB: median(runs.map((run) => run.layers?.estimatedMB ?? 0)),
};
writeJson(output, {
  tool: "frame-probe",
  version: 1,
  platform: `${process.platform}-${process.arch}`,
  label,
  after: after ?? null,
  css: css !== null,
  focus,
  windowMs,
  repeats,
  summary,
  runs,
});
console.log(
  `median: total ${summary.totalCpuMsPerS} ms/s, ${summary.framesPerS} drawn fps, ${summary.beginFramesPerS} BeginFrames/s, wake ${summary.wakePerS ?? "n/a"}/s, main ${summary.mainTaskMsPerS} ms/s, ${summary.compositedLayers} layers (~${summary.layerMB} MB) -> ${output}`,
);
