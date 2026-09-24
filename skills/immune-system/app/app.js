const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let state = null;
let openRun = null;

function ago(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

function tally(run) {
  const r = run?.results ?? [];
  const n = (s) => r.filter((x) => x.status === s).length;
  return { pass: n("pass"), fail: n("fail"), hole: n("hole") + n("skip"), known: n("known"), healed: n("healed"), total: r.length };
}

function verdictOf(run) {
  if (!run) return { tone: "hole", text: "No run yet" };
  const t = tally(run);
  if (t.fail) return { tone: "fail", text: `${t.fail} red` };
  if (t.hole) return { tone: "hole", text: "Healthy, with coverage holes" };
  return { tone: "pass", text: "Healthy" };
}

function grid(run) {
  const results = run?.results ?? [];
  if (!results.length) return `<p class="empty">Nothing has run yet.</p>`;
  const platforms = [...new Set(results.map((r) => r.platform))];
  const checks = [...new Set(results.map((r) => r.check))];
  const cell = (rs) =>
    rs.length
      ? `<td>${rs.map((r) => `<span class="pill ${esc(r.status)}" title="${esc(r.detail)}">${esc(r.status)}</span>`).join(" ")}<small>${rs.map((r) => esc(r.target)).join(", ")}</small></td>`
      : `<td><span class="pill">·</span></td>`;
  return `<table><thead><tr><th>Check</th>${platforms.map((p) => `<th>${esc(p)}</th>`).join("")}</tr></thead><tbody>${checks
    .map((c) => `<tr><th>${esc(c)}</th>${platforms.map((p) => cell(results.filter((r) => r.check === c && r.platform === p))).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function listOf(rows, empty, fmt) {
  return rows.length ? `<div class="card"><ul>${rows.map(fmt).join("")}</ul></div>` : `<p class="empty">${empty}</p>`;
}

function renderHealth() {
  const run = state.latest;
  const v = verdictOf(run);
  const t = tally(run);
  const history = state.runs.slice(0, 30).reverse();
  $('[data-panel="health"]').innerHTML = `
    <div class="hero">
      <div><h1>${esc(state.name)} immune system</h1><div class="verdict"><span class="pulse ${v.tone}"></span><b>${esc(v.text)}</b></div></div>
      <div class="meta">${run ? `commit <code>${esc(run.commit)}</code>${run.dirty ? ` + ${esc(run.dirty)} uncommitted` : ""}<br />${esc(ago(run.finished))}` : "no results yet"}</div>
    </div>
    <div class="stats">
      <div class="stat pass"><b>${t.pass}</b><small>passing</small></div>
      <div class="stat fail"><b>${t.fail}</b><small>red</small></div>
      <div class="stat hole"><b>${t.hole}</b><small>coverage holes</small></div>
      <div class="stat"><b>${state.cells.filter((c) => c.grown).length}/${state.cells.length}</b><small>cells grown</small></div>
      <div class="stat"><b>${state.findings.length}</b><small>open findings</small></div>
      <div class="stat"><div class="bars" aria-label="Last runs">${history.map((r) => { const x = verdictOf(r); return `<i class="${x.tone}" style="height:${30 + Math.min(70, tally(r).total * 6)}%" title="${esc(r.finished)}: ${esc(x.text)}"></i>`; }).join("")}</div><small>last ${history.length} runs</small></div>
    </div>
    <div class="card">${grid(run)}</div>
    <h2>Red</h2>
    ${listOf((run?.results ?? []).filter((r) => r.status === "fail"), "Nothing red.", (r) => `<li><b>${esc(r.check)}</b> on ${esc(r.platform)} (${esc(r.target)}): ${esc(r.detail)}</li>`)}
    <h2>Coverage holes</h2>
    ${listOf((run?.results ?? []).filter((r) => r.status === "hole" || r.status === "skip"), "None.", (r) => `<li><b>${esc(r.platform)}</b>: ${esc(r.detail)}</li>`)}`;
}

function renderRuns() {
  $('[data-panel="runs"]').innerHTML = `<h1>Runs</h1><h2>${state.runs.length} kept</h2><ol class="timeline">${state.runs
    .map((r) => {
      const v = verdictOf(r);
      const t = tally(r);
      const open = openRun === r.id;
      return `<li><button class="run" data-run="${esc(r.id)}" aria-expanded="${open}"><span class="pill ${v.tone}">${esc(v.text)}</span><span>commit <code>${esc(r.commit)}</code> · ${t.pass} pass · ${t.fail} red · ${t.hole} holes</span><small>${esc(ago(r.finished))}</small></button>${open ? `<div class="card">${grid(r)}</div>` : ""}</li>`;
    })
    .join("")}</ol>`;
  for (const b of document.querySelectorAll("[data-run]")) {
    b.addEventListener("click", () => {
      openRun = openRun === b.dataset.run ? null : b.dataset.run;
      renderRuns();
    });
  }
}

function renderCells() {
  $('[data-panel="cells"]').innerHTML = `<h1>Immune cells</h1><h2>${state.cells.filter((c) => c.grown).length} grown for ${esc(state.name)}, ${state.cells.filter((c) => !c.grown).length} stem cells</h2><div class="grid">${state.cells
    .map((c) => `<div class="card cell"><span class="tag ${c.grown ? "grown" : ""}">${c.grown ? "grown" : "stem cell"}</span><b>${esc(c.name)}</b><p>${esc(c.description.split(". ")[0])}.</p></div>`)
    .join("")}</div>`;
}

function renderNotes(kind, title, empty) {
  const rows = state[kind];
  $(`[data-panel="${kind}"]`).innerHTML = `<h1>${title}</h1>${rows.length ? rows.map((n) => `<details class="card note"><summary>${esc(n.title)} <small>${esc(ago(new Date(n.mtime).toISOString()))}</small></summary><pre>${esc(n.body)}</pre></details>`).join("") : `<p class="empty">${empty}</p>`}`;
}

function renderActions() {
  $("[data-actions]").innerHTML = state.commands.map((c) => `<button class="btn" data-cmd="${esc(c)}">Run ${esc(c)}</button>`).join("");
  for (const b of document.querySelectorAll("[data-cmd]")) {
    b.addEventListener("click", async () => {
      $("[data-log]").hidden = false;
      $("[data-log-title]").textContent = `Running ${b.dataset.cmd}…`;
      $("[data-log-body]").textContent = "";
      const res = await fetch(`/api/run?command=${encodeURIComponent(b.dataset.cmd)}`, { method: "POST" });
      if (!res.ok) $("[data-log-body]").textContent = (await res.json()).error;
    });
  }
}

let live = true;

async function load() {
  const res = live ? await fetch("api/state").catch(() => null) : null;
  if (res?.ok && (res.headers.get("content-type") ?? "").includes("json")) {
    state = await res.json();
  } else {
    live = false;
    state = await (await fetch("state.json")).json();
  }
  document.title = `${state.name} immune system · ${verdictOf(state.latest).text}`;
  $("[data-name]").textContent = `${state.name} immune system`;
  if (state.static) $("[data-actions]").innerHTML = `<span class="snapshot">Snapshot of the last run</span>`;
  if (!state.static) renderActions();
  renderHealth();
  renderRuns();
  renderCells();
  renderNotes("findings", "Findings", "No open findings.");
  renderNotes("explorations", "Explorations", "No explorations yet.");
}

for (const t of document.querySelectorAll("[data-view]")) {
  t.addEventListener("click", () => {
    for (const o of document.querySelectorAll("[data-view]")) o.setAttribute("aria-selected", String(o === t));
    for (const p of document.querySelectorAll("[data-panel]")) p.hidden = p.dataset.panel !== t.dataset.view;
  });
}
$("[data-log-close]").addEventListener("click", () => {
  $("[data-log]").hidden = true;
});

function listen() {
  const events = new EventSource("api/events");
  events.addEventListener("changed", () => load());
  events.addEventListener("log", (e) => {
    const body = $("[data-log-body]");
    body.textContent += `${JSON.parse(e.data).line}\n`;
    body.scrollTop = body.scrollHeight;
  });
  events.addEventListener("run", (e) => {
    const d = JSON.parse(e.data);
    for (const b of document.querySelectorAll("[data-cmd]")) b.disabled = d.state === "started";
    if (d.state === "finished") {
      $("[data-log-title]").textContent = `${d.name} finished (exit ${d.code}, ${Math.round(d.ms / 1000)}s)`;
      load();
    }
  });
}

load().then(() => {
  if (live) listen();
  else document.body.classList.add("is-static");
});
