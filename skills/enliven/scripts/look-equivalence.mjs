import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { addStyle, arg, cssArg, loadProfile, openApp, reach, removeStyle, sleep, writeJson } from "./harness.mjs";

const { profile, appDir } = await loadProfile();
const css = cssArg();
if (!css) throw new Error("--css=<file or rule text> is required: the change whose look you want to prove");
const after = arg("after");
const states = arg("states", Object.keys(profile.looks ?? {}).join(",") || "as-is").split(",");
const threshold = Number(arg("threshold", "8"));
const tolerance = Number(arg("tolerance", "0"));
const settleMs = Number(arg("settle", "700"));
const outDir = resolve(arg("out", "./perf/look"));

const FREEZE =
  "*, *::before, *::after { animation-play-state: paused !important; transition: none !important; caret-color: transparent !important; }";

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const data = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      colorType = body[9];
      if (body[8] !== 8 || body[12] !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`unsupported PNG: depth ${body[8]}, color type ${colorType}, interlace ${body[12]}`);
      }
    } else if (type === "IDAT") data.push(body);
    else if (type === "IEND") break;
    offset += length + 12;
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? rows[y * stride + x - channels] : 0;
      const up = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const corner = x >= channels && y > 0 ? rows[(y - 1) * stride + x - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const estimate = left + up - corner;
        const toLeft = Math.abs(estimate - left);
        const toUp = Math.abs(estimate - up);
        const toCorner = Math.abs(estimate - corner);
        predicted = toLeft <= toUp && toLeft <= toCorner ? left : toUp <= toCorner ? up : corner;
      }
      rows[y * stride + x] = (line[x] + predicted) & 255;
    }
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    rgba[pixel * 4] = rows[pixel * channels];
    rgba[pixel * 4 + 1] = rows[pixel * channels + 1];
    rgba[pixel * 4 + 2] = rows[pixel * channels + 2];
    rgba[pixel * 4 + 3] = channels === 4 ? rows[pixel * channels + 3] : 255;
  }
  return { width, height, rgba };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
}
function encodePng({ width, height, rgba }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function compare(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return { changed: a.width * a.height, box: null, mask: null, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const mask = Buffer.alloc(a.rgba.length);
  let changed = 0;
  let left = a.width;
  let top = a.height;
  let right = -1;
  let bottom = -1;
  for (let pixel = 0; pixel < a.width * a.height; pixel += 1) {
    const at = pixel * 4;
    const delta = Math.max(
      Math.abs(a.rgba[at] - b.rgba[at]),
      Math.abs(a.rgba[at + 1] - b.rgba[at + 1]),
      Math.abs(a.rgba[at + 2] - b.rgba[at + 2]),
    );
    const differs = delta > threshold;
    mask[at] = differs ? 255 : a.rgba[at] >> 2;
    mask[at + 1] = differs ? 40 : a.rgba[at + 1] >> 2;
    mask[at + 2] = differs ? 90 : a.rgba[at + 2] >> 2;
    mask[at + 3] = 255;
    if (!differs) continue;
    changed += 1;
    const x = pixel % a.width;
    const y = Math.floor(pixel / a.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  const box = changed ? `${right - left + 1}x${bottom - top + 1}@${left},${top}` : null;
  return { changed, box, mask: { width: a.width, height: a.height, rgba: mask } };
}

const shoot = async (page) =>
  decodePng(await page.screenshot({ animations: "disabled", caret: "hide", scale: "device" }));

const { context, close } = await openApp(profile, appDir);
const results = [];
try {
  await reach(profile, context, after);
  mkdirSync(outDir, { recursive: true });
  for (const state of states) {
    if (state !== "as-is") {
      const enter = profile.looks?.[state];
      if (!enter) throw new Error(`no look named ${state} in the profile; choices: ${Object.keys(profile.looks ?? {}).join(", ")}`);
      await enter(context);
    }
    await context.page.mouse.move(1, 1);
    await context.page.addStyleTag({ content: FREEZE });
    await sleep(settleMs);
    const base = await shoot(context.page);
    await addStyle(context.page, css);
    await sleep(settleMs);
    const probed = await shoot(context.page);
    await removeStyle(context.page);
    await sleep(settleMs);
    const again = await shoot(context.page);
    const effect = compare(base, probed);
    const floor = compare(base, again);
    const same = effect.changed <= floor.changed + tolerance;
    const row = { state, changedByCss: effect.changed, noiseFloor: floor.changed, box: effect.box, same, note: effect.note ?? null };
    if (!same) {
      writeFileSync(join(outDir, `${state}-before.png`), encodePng(base));
      writeFileSync(join(outDir, `${state}-with-css.png`), encodePng(probed));
      if (effect.mask) writeFileSync(join(outDir, `${state}-changed.png`), encodePng(effect.mask));
    }
    results.push(row);
    console.log(
      `${same ? "same " : "DIFF "} ${state}: ${effect.changed} px changed by the css${effect.box ? ` in ${effect.box}` : ""}, noise floor ${floor.changed} px`,
    );
  }
} finally {
  await close();
}
writeJson(join(outDir, "look.json"), {
  tool: "look-equivalence",
  version: 1,
  platform: `${process.platform}-${process.arch}`,
  after: after ?? null,
  threshold,
  tolerance,
  results,
});
const different = results.filter((row) => !row.same);
console.log(
  different.length
    ? `the css changes how ${different.map((row) => row.state).join(", ")} looks; see ${outDir}/*-changed.png`
    : `the css is invisible in ${results.length} state(s)`,
);
process.exitCode = different.length ? 1 : 0;
