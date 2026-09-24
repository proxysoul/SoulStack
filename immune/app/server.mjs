import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const root = process.cwd();
const args = process.argv.slice(2);
const exportAt = args.indexOf("--export");
const exportDir = exportAt >= 0 ? args[exportAt + 1] : null;
const configPath = args.find((a, i) => a.endsWith(".json") && i !== exportAt + 1) ?? join(appDir, "immune.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const at = (p) => resolve(root, p);
const port = Number(process.env.IMMUNE_PORT ?? config.port ?? 4177);

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };

function frontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  const meta = {};
  for (const line of text.slice(4, end).split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return meta;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return { error: String(error), file };
  }
}

function runs() {
  const dir = at(config.results);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "latest.json")
    .sort()
    .reverse()
    .slice(0, config.keepRuns ?? 50)
    .map((f) => ({ id: f.replace(/\.json$/, ""), ...readJson(join(dir, f)) }));
}

function cells() {
  const seen = new Map();
  for (const [i, dir] of (config.cells ?? []).entries()) {
    const full = at(dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).filter((x) => x.endsWith(".md"))) {
      const name = f.replace(/\.md$/, "");
      if (seen.has(name)) continue;
      const text = readFileSync(join(full, f), "utf8");
      const meta = frontmatter(text);
      const stem = i > 0 || /\[[^\]]+\]/.test(text.split("## This project")[1] ?? "[x]");
      seen.set(name, { name, description: meta.description ?? "", grown: !stem, path: join(dir, f) });
    }
  }
  return [...seen.values()];
}

function notes(dir) {
  const full = dir ? at(dir) : "";
  if (!full || !existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => !f.startsWith("."))
    .map((f) => {
      const p = join(full, f);
      const body = statSync(p).isFile() ? readFileSync(p, "utf8") : "";
      return { name: f, title: body.match(/^#\s+(.+)$/m)?.[1] ?? f, body: body.slice(0, 4000), mtime: statSync(p).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function state() {
  const latestFile = join(at(config.results), "latest.json");
  return {
    name: config.name,
    commands: Object.keys(config.commands ?? {}),
    latest: existsSync(latestFile) ? readJson(latestFile) : null,
    runs: runs(),
    cells: cells(),
    findings: notes(config.findings),
    explorations: notes(config.explorations),
  };
}

if (exportDir) {
  const out = resolve(root, exportDir);
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(appDir)) {
    if (/\.(html|css|js|svg|png|webp|woff2)$/.test(f)) copyFileSync(join(appDir, f), join(out, f));
  }
  const snapshot = state();
  snapshot.commands = [];
  snapshot.static = true;
  writeFileSync(join(out, "state.json"), JSON.stringify(snapshot));
  console.log(`${config.name} immune system exported to ${exportDir}`);
  process.exit(0);
}

const listeners = new Set();
function broadcast(event, data) {
  for (const res of listeners) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
for (const dir of [config.results, config.findings, config.explorations, ...(config.cells ?? [])]) {
  if (dir && existsSync(at(dir))) watch(at(dir), () => broadcast("changed", {}));
}

let running = null;
function startRun(name) {
  const command = config.commands?.[name];
  if (!command) return { error: `unknown command: ${name}` };
  if (running) return { error: `already running: ${running.name}` };
  const child = spawn(command, { cwd: root, shell: true, env: { ...process.env, NO_COLOR: "1" } });
  running = { name, child, started: Date.now() };
  broadcast("run", { name, state: "started" });
  const line = (chunk) => {
    for (const l of String(chunk).split(/\r?\n/)) if (l) broadcast("log", { name, line: l });
  };
  child.stdout.on("data", line);
  child.stderr.on("data", line);
  child.on("close", (code) => {
    broadcast("run", { name, state: "finished", code, ms: Date.now() - running.started });
    running = null;
  });
  return { ok: true };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (url.pathname === "/api/state") {
    res.writeHead(200, { "content-type": TYPES[".json"] });
    res.end(JSON.stringify(state()));
    return;
  }
  if (url.pathname === "/api/events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    res.write(`event: hello\ndata: ${JSON.stringify({ running: running?.name ?? null })}\n\n`);
    listeners.add(res);
    req.on("close", () => listeners.delete(res));
    return;
  }
  if (url.pathname === "/api/run" && req.method === "POST") {
    const out = startRun(url.searchParams.get("command") ?? "");
    res.writeHead(out.error ? 409 : 202, { "content-type": TYPES[".json"] });
    res.end(JSON.stringify(out));
    return;
  }
  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const full = resolve(appDir, file);
  if (!full.startsWith(appDir) || !existsSync(full) || !statSync(full).isFile()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(full)] ?? "application/octet-stream" });
  res.end(readFileSync(full));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`${config.name} immune system: http://127.0.0.1:${port}`);
});
