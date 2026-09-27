import { randomBytes } from "node:crypto";
import { machineState, decide } from "./machine.mjs";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const root = process.cwd();
const args = process.argv.slice(2);
const exportAt = args.indexOf("--export");
const exportDir = exportAt >= 0 ? args[exportAt + 1] : null;
const configPath = args.find((a, i) => a.endsWith(".json") && (exportAt < 0 || i !== exportAt + 1)) ?? join(appDir, "immune.config.json");
const demo = args.includes("--demo") || Boolean(exportDir && !args.includes("--live-export"));
const config = JSON.parse(readFileSync(demo ? join(appDir, "demo/immune.config.json") : configPath, "utf8"));
if (demo) {
  for (const key of ["results", "findings", "explorations", "machine", "commits", "issues"]) if (config[key]) config[key] = resolve(appDir, "demo", config[key]);
  config.cells = config.cells.map(p => resolve(appDir, "demo", p));
}
const machineRoot = resolve(root, config.machine ?? "immune/machine");
const token = randomBytes(32).toString("hex");
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

const RECORD_ID = /\b[a-z0-9]+-h\d+-\d+\b/g;
const ISSUES_FILE = "immune/github/issues.json";

function linkCommits(list, records) {
  const known = new Set(records.map((record) => record.id));
  const landed = records.flatMap((record) =>
    record.sections
      .filter((section) => ["Landed", "Decision"].includes(section.title))
      .flatMap((section) => section.body.match(/\b[0-9a-f]{7,40}\b/g) ?? [])
      .map((hash) => [hash, record.id]),
  );
  return list.map((commit) => {
    const hash = String(commit.hash ?? "");
    const ids = new Set(String(`${commit.subject ?? ""}\n${commit.body ?? ""}`).match(RECORD_ID)?.filter((id) => known.has(id)) ?? []);
    for (const [prefix, id] of landed) if (hash.startsWith(prefix)) ids.add(id);
    return { hash, short: hash.slice(0, 7), author: String(commit.author ?? ""), at: String(commit.at ?? ""), subject: String(commit.subject ?? ""), records: [...ids] };
  });
}

function commits(records) {
  const days = Math.max(1, Number(config.commitDays ?? 1));
  if (config.commits) {
    const raw = readJson(at(config.commits));
    if (raw.error) return { days, list: [], error: "The commit list could not be read." };
    return { days, list: linkCommits(Array.isArray(raw) ? raw : raw.commits ?? [], records) };
  }
  const log = spawnSync("git", ["log", `--since=${days} days ago`, "--max-count=200", "--format=%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e"], { cwd: root, encoding: "utf8", timeout: 5000 });
  if (log.status !== 0) return { days, list: [], error: log.error ? "git is not available on this machine." : "This folder is not a git repository, so there are no commits to show." };
  const list = log.stdout
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, author, when, subject, body] = entry.split("\x1f");
      return { hash, author, at: when, subject, body };
    });
  return { days, list: linkCommits(list, records) };
}

function issues() {
  const file = at(config.issues ?? ISSUES_FILE);
  if (!existsSync(file)) return { list: [], missing: true };
  const raw = readJson(file);
  if (raw.error) return { list: [], error: "The issues snapshot could not be read." };
  const list = (Array.isArray(raw) ? raw : raw.issues ?? []).map((issue) => ({
    number: Number(issue.number) || 0,
    title: String(issue.title ?? ""),
    state: String(issue.state ?? "").toLowerCase(),
    url: /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/.test(String(issue.url ?? "")) ? String(issue.url) : "",
    labels: (Array.isArray(issue.labels) ? issue.labels : []).map((label) => String(typeof label === "string" ? label : label?.name ?? "")).filter(Boolean),
    at: String(issue.createdAt ?? issue.created_at ?? ""),
  }));
  return { list, fetchedAt: String(raw.fetchedAt ?? statSync(file).mtime.toISOString()) };
}

function state() {
  const latestFile = join(at(config.results), "latest.json");
  const machine = machineState(machineRoot);
  return {
    name: config.name,
    demo: Boolean(config.demo),
    token,
    machine,
    commits: commits(machine.records),
    issues: issues(),
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
  delete snapshot.token;
  snapshot.machine.board.root = demo ? "demo/machine" : config.machine ?? "immune/machine";
  snapshot.cells = snapshot.cells.map(cell => ({ ...cell, path: `cells/${cell.name}.md` }));
  snapshot.static = true;
  writeFileSync(join(out, "state.json"), JSON.stringify(snapshot));
  console.log(`${config.name} immune system exported to ${exportDir}`);
  process.exit(0);
}

const listeners = new Set();
function broadcast(event, data) {
  for (const res of listeners) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
let refreshTimer;
const changed = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => broadcast("changed", {}), 80);
};
for (const dir of new Set([machineRoot, config.results, config.findings, config.explorations, dirname(at(config.issues ?? ISSUES_FILE)), ...(config.cells ?? [])])) {
  if (!dir) continue;
  const target = at(dir);
  let parent = target;
  while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
  watch(parent, { recursive: true }, (_event, name) => {
    const path = resolve(parent, String(name ?? ""));
    if (!name || path === target || path.startsWith(`${target}${sep}`) || target.startsWith(`${path}${sep}`)) changed();
  }).on("error", error => console.error(`Could not watch ${target}:`, error));
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

const send = (res, code, value) => { res.writeHead(code, { "content-type": TYPES[".json"], "cache-control": "no-store" }); res.end(JSON.stringify(value)); };
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  const host = `127.0.0.1:${server.address().port}`;
  const alternate = `localhost:${server.address().port}`;
  if (![host, alternate].includes(req.headers.host)) return send(res, 403, { error: "Use the local console address." });
  const url = new URL(req.url ?? "/", `http://${host}`);
  if (req.method === "POST") {
    if ((req.headers.origin && ![`http://${host}`, `http://${alternate}`].includes(req.headers.origin)) || req.headers["sec-fetch-site"] === "cross-site" || req.headers["x-immune-token"] !== token) return send(res, 403, { error: "Open this console locally before making changes." });
  }
  try {
    if (url.pathname === "/api/decision") {
      if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
      if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Send application/json." });
      let body = "";
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 8192) return send(res, 413, { error: "Decision is too large." }); }
      let input;
      try { input = JSON.parse(body); } catch { return send(res, 400, { error: "Decision must be valid JSON." }); }
      const result = decide(machineRoot, input);
      changed();
      return send(res, 200, result);
    }
    if (url.pathname === "/api/state") {
      const snapshot = state();
      res.writeHead(200, { "content-type": TYPES[".json"], "cache-control": "no-store" });
      res.end(JSON.stringify(snapshot));
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
    if (!/^[a-zA-Z0-9_-]+\.(html|css|js|svg|png|webp|woff2)$/.test(file) || !["GET", "HEAD"].includes(req.method)) { res.writeHead(404); res.end("not found"); return; }
    const full = resolve(appDir, file);
    if (!full.startsWith(appDir) || !existsSync(full) || !statSync(full).isFile()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(full)] ?? "application/octet-stream" });
    res.end(readFileSync(full));
  } catch (error) { send(res, error.status ?? 500, { error: error.status ? error.message : "Could not read or update the machine. Check its files and server log." }); if (!error.status) console.error(error); }
});
server.requestTimeout = 15000;

server.listen(port, "127.0.0.1", () => {
  console.log(`${config.name} immune system: http://127.0.0.1:${server.address().port}`);
});
