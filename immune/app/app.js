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
  if (run.error || !Array.isArray(run.results)) return { tone: "fail", text: "Run could not be read" };
  const t = tally(run);
  if (!t.total) return { tone: "hole", text: "No checks ran" };
  if (t.fail) return { tone: "fail", text: `${t.fail} red` };
  if (t.hole) return { tone: "hole", text: "Healthy, with coverage holes" };
  return { tone: "pass", text: "Healthy" };
}

function grid(run) {
  const results = run?.results ?? [];
  if (!results.length) return `<p class="empty">Nothing has run yet.</p>`;
  const where = (r) => `${r.platform}, ${r.door ?? r.frontDoor ?? "front door not recorded"}`;
  const platforms = [...new Set(results.map(where))];
  const checks = [...new Set(results.map((r) => r.check))];
  const cell = (rs) =>
    rs.length
      ? `<td>${rs.map((r) => `<span class="pill ${esc(r.status)}" title="${esc(r.detail)}">${esc(r.status)}</span>`).join(" ")}<small>${rs.map((r) => esc(r.target)).join(", ")}</small></td>`
      : `<td><span class="meta">Not run</span></td>`;
  return `<div class="table-wrap"><table><thead><tr><th>Check</th>${platforms.map((p) => `<th>${esc(p)}</th>`).join("")}</tr></thead><tbody>${checks
    .map((c) => `<tr><th>${esc(c)}<small>${esc(results.find(r => r.check === c)?.family ?? "Family not recorded")}</small></th>${platforms.map((p) => cell(results.filter((r) => r.check === c && where(r) === p))).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
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
      <div><h1>Health</h1><div class="verdict"><span class="pulse ${v.tone}"></span><b>${esc(v.text)}</b></div></div>
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
      return `<li><button class="run" data-run="${esc(r.id)}" aria-expanded="${open}"><span class="pill ${v.tone}">${esc(v.text)}</span><span>commit <code>${esc(r.commit)}</code>, ${t.pass} pass, ${t.fail} red, ${t.hole} holes</span><small>${esc(ago(r.finished))}</small></button>${open ? `<div class="card">${grid(r)}</div>` : ""}</li>`;
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
  $(`[data-panel="${kind}"]`).innerHTML = `<h1>${title}</h1>${rows.length ? rows.map((n) => `<details class="card note"><summary>${esc(n.title)} <small>${esc(ago(new Date(n.mtime).toISOString()))}</small></summary><div class="markdown">${markdown(n.body)}</div></details>`).join("") : `<p class="empty">${empty}</p>`}`;
}

function renderActions() {
  $("[data-actions]").innerHTML = state.commands.map((c) => `<button class="btn" data-cmd="${esc(c)}">Run ${esc(c)}</button>`).join("");
  for (const b of document.querySelectorAll("[data-cmd]")) {
    b.addEventListener("click", async () => {
      $("[data-log]").hidden = false;
      $("[data-log-title]").textContent = `Running ${b.dataset.cmd}…`;
      $("[data-log-body]").textContent = "";
      const res = await fetch(`/api/run?command=${encodeURIComponent(b.dataset.cmd)}`, { method: "POST", headers: { "x-immune-token": state.token } });
      if (!res.ok) $("[data-log-body]").textContent = (await res.json()).error;
    });
  }
}

const stages = ['found', 'ready', 'rejected', 'verified', 'fixed', 'guarded'];
const stageLabel = { found: 'New report', ready: 'Being fixed', rejected: 'Rejected', verified: 'Ready to land', fixed: 'Landed', guarded: 'Guarded' };
const statusLabel = { 'fixed-unverified': 'Fix needs review', 'fix-rejected': 'Fix review failed', approved: 'Approved' };
const overviewViews = ['overview', 'health', 'runs', 'cells', 'findings', 'explorations'];
const machineTabs = [['cycles', 'Cycles'], ['commits', 'Commits'], ['guards', 'Guards'], ['antigens', 'Antigen census'], ['issues', 'GitHub issues'], ['board', 'Board']];
const flow = [['found', 'New reports', 'Waiting for review'], ['ready', 'Being fixed', 'Approved, fix in progress'], ['verified', 'Ready to land', 'The fix passed its review'], ['fixed', 'Landed', 'Committed'], ['guarded', 'Guarded', 'A lint rule keeps it out']];
let live = true;
let busy = false;
let pendingDecision = null;
let loadSequence = 0;
const records = () => state?.machine.records ?? [];
const queue = () => records().filter(r => r.needsHuman).sort((a, b) => Number(['security', 'data-loss'].includes(b.severity)) - Number(['security', 'data-loss'].includes(a.severity)) || a.mtime - b.mtime);
const route = () => { try { return decodeURIComponent(location.hash.slice(1)).split('/'); } catch { return ['overview']; } };
const go = path => { if (location.hash.slice(1) === path) render(); else location.hash = path; };
const currentRecord = () => queue().find(r => r.id === route()[1]) ?? queue()[0];
const humanSeverity = value => String(value || 'Unspecified').replaceAll('-', ' ');
const badge = r => `<span class="pill ${esc(r.severity)}">${esc(humanSeverity(r.severity))}</span>`;
const stageName = r => statusLabel[r.status] || stageLabel[r.stage] || r.stage;
const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);
const changedAt = r => `<time datetime="${new Date(r.mtime).toISOString()}" title="${esc(new Date(r.mtime).toLocaleString())}">${esc(ago(new Date(r.mtime).toISOString()))}</time>`;
const empty = text => `<p class="empty">${esc(text)}</p>`;
function note(text) { $('[data-notice]').textContent = text; $('[data-notice]').hidden = !text; }
function inline(text) {
  return esc(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
function markdown(text) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  let html = '', paragraph = [], list = null, code = null;
  const flush = () => { if (paragraph.length) { html += `<p>${inline(paragraph.join(' '))}</p>`; paragraph = []; } if (list) { html += `</${list}>`; list = null; } };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^```/.test(line)) { flush(); if (code !== null) { html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; code = null; } else code = []; continue; }
    if (code !== null) { code.push(line); continue; }
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}:?\s*\|[| :\-]*$/.test(lines[index + 1] ?? '')) {
      flush();
      const cells = row => row.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
      html += `<div class="table-wrap"><table><thead><tr>${cells(line).map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>`;
      index += 2;
      for (; index < lines.length && lines[index].includes('|') && lines[index].trim(); index++) html += `<tr>${cells(lines[index]).map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`;
      index--;
      html += '</tbody></table></div>';
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
    if (!line.trim()) { flush(); continue; }
    if (heading) { flush(); const h = Math.min(heading[1].length + 1, 6); html += `<h${h}>${inline(heading[2])}</h${h}>`; }
    else if (bullet) { const type = /^\s*\d/.test(line) ? 'ol' : 'ul'; if (list !== type) { flush(); html += `<${type}>`; list = type; } html += `<li>${inline(bullet[1])}</li>`; }
    else if (line.startsWith('>')) { flush(); html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`; }
    else { if (list) flush(); paragraph.push(line); }
  }
  flush(); if (code !== null) html += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
  return html;
}
function recordRow(r, compact = false) {
  return `<a class="record-row${compact ? ' compact' : ''}" href="#record/${encodeURIComponent(r.id)}"><span class="title">${esc(r.title)}</span>${badge(r)}${compact ? '' : `<span class="stage">${esc(stageName(r))}</span>${changedAt(r)}`}</a>`;
}
function renderOverview() {
  const all = records(), waiting = queue(), landed = all.filter(r => ['fixed', 'guarded'].includes(r.stage)).sort((a, b) => b.mtime - a.mtime), guarded = all.filter(r => r.stage === 'guarded');
  const urgent = waiting.filter(r => ['security', 'data-loss'].includes(r.severity));
  const rejected = all.filter(r => r.stage === 'rejected').length;
  const summary = `${landed.length} fixed. ${guarded.length} guarded against coming back.${urgent.length ? ` ${urgent.length} of the waiting ${urgent.length === 1 ? 'record is' : 'records are'} security or data loss.` : ''}`;
  const steps = flow.map(([stage, label, detail]) => {
    const n = all.filter(r => r.stage === stage).length;
    return `<li class="flow-step${n ? ' has' : ''}${stage === 'guarded' ? ' goal' : ''}"><a href="#records"><b>${n}</b><span>${label}</span><small>${detail}</small></a></li>`;
  }).join('');
  $('[data-panel="overview"]').innerHTML = `<div class="hero"><div class="hero-copy"><h1>${waiting.length ? `${waiting.length} ${waiting.length === 1 ? 'record is' : 'records are'} waiting for your decision` : 'Nothing is waiting for you'}</h1><p>${summary}</p></div><a class="btn" href="#${waiting.length ? 'triage' : 'records'}">${waiting.length ? 'Start triage' : 'Browse records'}</a></div>
    <ol class="flow" aria-label="Where every record is">${steps}</ol>${rejected ? `<p class="flow-note">${rejected} ${rejected === 1 ? 'report was' : 'reports were'} thrown out on review.</p>` : ''}
    <div class="columns"><section><div class="section-head"><h2>Needs a human</h2>${waiting.length ? `<a href="#triage">See all ${waiting.length}</a>` : ''}</div>${waiting.length ? `<div class="record-list">${waiting.slice(0, 5).map(r => recordRow(r, true)).join('')}</div>` : empty('The machine can keep going without you.')}</section><section><div class="section-head"><h2>Recently landed</h2><a href="#machine/commits">See the commits</a></div>${landed.length ? `<div class="record-list">${landed.slice(0, 5).map(r => recordRow(r, true)).join('')}</div>` : empty('No fixes have landed yet.')}<div class="section-head"><h2>Patrol</h2><a href="#health">Check health</a></div><p>${esc(verdictOf(state.latest).text)}, ${state.runs.length} kept runs, ${state.cells.filter(c => c.grown).length} grown cells.</p></section></div>`;
}
function recordContent(r) {
  return `<header class="record-head"><div class="record-meta">${badge(r)}<span>${esc(stageName(r))}</span><span>${esc(r.id)}</span></div><h1>${esc(r.title)}</h1><p>${esc(r.area || 'Area not recorded')}, changed ${esc(ago(new Date(r.mtime).toISOString()))}</p></header>
  <ol class="life" aria-label="Record life">${r.life.map(step => `<li class="${step.done ? 'done' : ''}"><span>${titleCase(step.label)}</span><small class="${step.outcome ? 'failed' : ''}">${esc(step.outcome || step.who)}</small>${step.outcome ? `<small>${esc(step.who)}</small>` : ''}</li>`).join('')}</ol>
  <div class="record-body markdown">${r.sections.map(s => `<section><h2>${esc(s.title)}</h2>${markdown(s.body)}</section>`).join('') || markdown(r.body)}</div>`;
}
function renderTriage() {
  const waiting = queue(), r = currentRecord();
  const panel = $('[data-panel="triage"]');
  if (!r) { panel.innerHTML = `<div class="hero"><div><h1>Nothing is waiting for you</h1><p>New reports and flagged records will appear here.</p></div><a class="btn" href="#records">Browse records</a></div>`; return; }
  const index = waiting.indexOf(r);
  panel.innerHTML = `<div class="hero"><div><h1>Triage</h1><p>One record. One human decision.</p></div><span class="meta">${index + 1} of ${waiting.length} waiting</span></div>
    ${state.static ? '<p class="notice">Read-only demo. Decisions are available in the local app; this snapshot never changes a file.</p>' : ''}
    <div class="triage-layout"><nav class="queue" aria-label="Waiting records"><p>Needs a human</p>${waiting.map(x => `<a href="#triage/${encodeURIComponent(x.id)}" ${x.id === r.id ? 'aria-current="true"' : ''}><span>${esc(x.title)}</span>${badge(x)}</a>`).join('')}</nav><article><div class="actions decision-actions"><button class="btn" data-decide="approve" ${state.static || busy ? 'disabled' : ''}><kbd>A</kbd> Approve</button><button data-decide="reject" ${state.static || busy ? 'disabled' : ''}><kbd>R</kbd> Reject</button><button data-decide="already-fixed" ${state.static || busy ? 'disabled' : ''}><kbd>X</kbd> Already fixed</button><span class="actions next"><button data-step="-1" aria-label="Previous record" ${index === 0 ? 'disabled' : ''}><kbd>K</kbd> Previous</button><button data-step="1" aria-label="Next record" ${index === waiting.length - 1 ? 'disabled' : ''}><kbd>J</kbd> Next</button></span></div>${recordContent(r)}</article></div>`;
}
function renderRecords() {
  const all = records();
  const groups = [['New reports', r => r.stage === 'found'], ['Failed fix reviews', r => r.needsHuman && r.status === 'fix-rejected'], ['Security and data loss', r => r.needsHuman], ['Being fixed', r => r.stage === 'ready'], ['Ready to land', r => r.stage === 'verified'], ['Landed', r => r.stage === 'fixed'], ['Guarded', r => r.stage === 'guarded'], ['Rejected', r => r.stage === 'rejected']];
  const used = new Set();
  $('[data-panel="records"]').innerHTML = `<div class="hero"><div><h1>Records</h1><p>What needs a human first. Everything else follows the work.</p></div><span class="meta">${all.length} records</span></div>${groups.map(([title, test]) => { const rows = all.filter(r => !used.has(r.path) && test(r)); rows.forEach(r => used.add(r.path)); return rows.length ? `<section><div class="section-head"><h2>${title}</h2><span class="meta">${rows.length}</span></div><div class="record-list">${rows.map(r => recordRow(r)).join('')}</div></section>` : ''; }).join('') || empty('No machine records yet.')}`;
}
function renderRecord() {
  const r = records().find(x => x.id === route()[1]);
  $('[data-panel="record"]').innerHTML = `<a class="back" href="#records"><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>All records</a>${r ? `<article>${r.needsHuman ? `<div class="section-head"><span class="meta">Waiting for a human decision</span><a href="#triage/${encodeURIComponent(r.id)}">Open in triage</a></div>` : ''}${recordContent(r)}</article>` : empty('This record is no longer in the machine.')}`;
}
function recordLinks(ids) { return ids.map(id => `<a href="#record/${encodeURIComponent(id)}">${esc(id)}</a>`).join(''); }
function renderMachine() {
  const tab = machineTabs.some(([key]) => key === route()[1]) ? route()[1] : 'cycles';
  const label = Object.fromEntries(machineTabs)[tab];
  const data = state.machine;
  const titleOf = id => data.records.find(r => r.id === id)?.title ?? id;
  let content = '', meta = '';
  if (tab === 'cycles') {
    meta = `${data.cycles.length} ${data.cycles.length === 1 ? 'cycle' : 'cycles'}`;
    content = data.cycles.map((cycle, i) => {
      const plan = cycle.plan, hunters = Array.isArray(plan.hunters) ? plan.hunters : Object.values(plan.hunters ?? {});
      const lenses = [...new Set(hunters.map(h => h.lens).filter(Boolean))];
      return `<details class="card cycle" ${i === data.cycles.length - 1 ? 'open' : ''}><summary><strong><code class="cycle-id">${esc(cycle.id)}</code>${esc(plan.title || plan.name || 'Hunting cycle')}</strong><span class="meta">${hunters.length} hunters, ${lenses.length} lenses</span></summary><div class="stage-counts">${stages.map(s => `<div><b>${cycle.produced[s].length}</b><span>${stageLabel[s]}</span></div>`).join('')}</div>${lenses.length ? `<div class="lens-list" aria-label="Lenses">${lenses.map(lens => `<span class="pill">${esc(lens)}</span>`).join('')}</div>` : '<p>No lenses recorded.</p>'}<h2>Hunters and lenses</h2><div class="table-wrap"><table><thead><tr><th>Hunter</th><th>Area</th><th>Lens</th></tr></thead><tbody>${hunters.map(h => `<tr><td>${esc(h.id || h.prefix || h.hunter || 'Unspecified')}</td><td>${esc(h.area || (h.files ?? []).join(', '))}</td><td>${esc(h.lens || 'Unspecified')}</td></tr>`).join('')}</tbody></table></div><h2>What this cycle produced</h2>${stages.map(s => cycle.produced[s].length ? `<h3>${stageLabel[s]}</h3><div class="cycle-links">${recordLinks(cycle.produced[s])}</div>` : '').join('')}</details>`;
    }).join('') || empty('No cycle plans yet. Add cycles/<id>/plan.json to the machine.');
  }
  if (tab === 'commits') {
    const log = state.commits ?? { days: 1, list: [] };
    const span = log.days === 1 ? 'the last day' : `the last ${log.days} days`;
    meta = `${log.list.length} in ${span}`;
    const row = commit => `<article class="commit-row"><code class="hash" title="${esc(commit.hash)}">${esc(commit.short)}</code><div class="commit-main"><p class="commit-subject">${esc(commit.subject)}</p><p class="meta">${esc(commit.author)}${commit.at ? `, <time datetime="${esc(commit.at)}">${esc(ago(commit.at))}</time>` : ''}</p></div><div class="commit-records">${commit.records.length ? commit.records.map(id => `<a href="#record/${encodeURIComponent(id)}">${esc(titleOf(id))}</a>`).join('') : '<span class="meta">No record</span>'}</div></article>`;
    content = `${log.error ? `<p class="notice">${esc(log.error)}</p>` : ''}${log.list.length ? `<div class="commit-list">${log.list.map(row).join('')}</div>` : log.error ? '' : empty(`No commits in ${span}.`)}`;
  }
  if (tab === 'guards') {
    meta = `${data.guards.length} ${data.guards.length === 1 ? 'guard' : 'guards'}`;
    content = `<div class="guard-list">${data.guards.map(g => `<article class="card"><div class="section-head"><h2><code>${esc(g.name)}</code></h2><span class="pill pass">${esc(g.status || 'Recorded')}</span></div><p>${esc(g.description || '')}</p><div class="markdown">${markdown(g.proof || 'No proof recorded.')}</div>${g.record ? `<a href="#record/${encodeURIComponent(g.record)}">Read the record</a>` : ''}</article>`).join('') || empty('No guards recorded yet.')}</div>`;
  }
  if (tab === 'antigens') {
    const { floor, latest } = data.antigens;
    const names = [...new Set([...Object.keys(floor), ...Object.keys(latest)])];
    content = names.length ? `<div class="card"><div class="antigen-row"><span>Pattern</span><span>Floor</span><span>Latest</span><span>Change</span></div>${names.map(name => { const before = floor[name], after = latest[name], known = Number.isFinite(before) && Number.isFinite(after), delta = known ? after - before : null; return `<div class="antigen-row"><span>${esc(name)}</span><span>${Number.isFinite(before) ? before : '—'}</span><span>${Number.isFinite(after) ? after : '—'}</span><span class="${delta > 0 ? 'bad' : delta < 0 ? 'good' : ''}">${known ? `${delta > 0 ? '+' : ''}${delta}` : 'Unknown'}</span></div>`; }).join('')}</div><p class="meta">Lower is better. A rise above the committed floor fails the census. Missing counts are unknown, never zero.</p>` : empty('No census yet. Add antigens/floor.json and antigens/latest.json.');
  }
  if (tab === 'issues') {
    const snapshot = state.issues ?? { list: [], missing: true };
    const open = snapshot.list.filter(issue => issue.state === 'open'), closed = snapshot.list.filter(issue => issue.state !== 'open');
    meta = snapshot.missing ? '' : `${open.length} open, ${closed.length} closed`;
    const row = issue => `<article class="issue-row"><span class="issue-number">#${issue.number}</span><div class="issue-main">${issue.url ? `<a href="${esc(issue.url)}" target="_blank" rel="noopener noreferrer">${esc(issue.title)}</a>` : `<span>${esc(issue.title)}</span>`}${issue.labels.length ? `<div class="issue-labels">${issue.labels.map(name => `<span class="pill${/security/i.test(name) ? ' security' : ''}">${esc(name)}</span>`).join('')}</div>` : ''}</div>${issue.at ? `<time datetime="${esc(issue.at)}">${esc(ago(issue.at))}</time>` : '<span></span>'}</article>`;
    const groups = [['Open', open], ['Closed', closed]].map(([title, rows]) => rows.length ? `<section><div class="section-head"><h2>${title}</h2><span class="meta">${rows.length}</span></div><div class="issue-list">${rows.map(row).join('')}</div></section>` : '').join('');
    if (snapshot.missing) content = `<div class="empty"><p>No issues snapshot yet. The console never calls GitHub itself. Save a snapshot with the GitHub CLI and it shows up here.</p><pre><code>gh issue list --state all --limit 200 --json number,title,state,url,labels,createdAt &gt; immune/github/issues.json</code></pre></div>`;
    else content = `${snapshot.error ? `<p class="notice">${esc(snapshot.error)}</p>` : ''}${groups || (snapshot.error ? '' : empty('The snapshot has no issues.'))}${snapshot.fetchedAt ? `<p class="meta">Snapshot saved ${esc(ago(snapshot.fetchedAt))}. The machine only reads it and never writes to GitHub.</p>` : ''}`;
  }
  if (tab === 'board') {
    const board = data.board;
    content = `<div class="stage-counts">${stages.map(s => `<div><b>${board.stages[s]}</b><span>${stageLabel[s]}</span></div>`).join('')}</div><h2>Claimable work</h2><p>Files must be settled for two minutes and unclaimed.</p><div class="board-grid">${[['review', 'Review reports'], ['fix', 'Fix records'], ['fixReview', 'Review fixes']].map(([key, title]) => `<section class="card"><h2>${title} <span class="count">${board.claimable[key].length}</span></h2><ul>${board.claimable[key].map(id => `<li>${recordLinks([id])}</li>`).join('') || '<li>Nothing claimable.</li>'}</ul></section>`).join('')}</div><h2>Statuses</h2><div class="cycle-links">${Object.entries(board.statuses).map(([key, n]) => `<span class="pill">${esc(statusLabel[key] || stageLabel[key] || key)} <b>${n}</b></span>`).join('') || 'No records.'}</div><div class="columns"><section><h2>Duplicates <span class="count">${board.duplicates.length}</span></h2>${board.duplicates.length ? `<div class="card bad">${board.duplicates.map(esc).join('<br>')}</div>` : empty('Every record has one home.')}</section><section><h2>Stale claims <span class="count">${board.staleClaims.length}</span></h2>${board.staleClaims.length ? `<div class="card">${board.staleClaims.map(key => `<p><code>${esc(key)}</code></p>`).join('')}</div>` : empty('No claim has stalled for ten minutes.')}</section></div><p class="meta">The same board logic powers this page and machine/board.mjs.</p>`;
  }
  const descriptions = { cycles: 'Each hunt, its lenses and what made it through.', commits: 'What landed, and the records each commit closed.', guards: 'Fixed once. Remembered by a permanent check.', antigens: 'Known bad patterns, measured against the committed floor.', issues: 'What people filed on GitHub, next to what the machine found.', board: 'Counts, claimable work and anything that stopped moving.' };
  $('[data-panel="machine"]').innerHTML = `<div class="hero"><div><h1>${label}</h1><p>${descriptions[tab]}</p></div>${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</div>${data.missing ? '<p class="notice">No machine folder yet. Patrol views are still available.</p>' : ''}${content}`;
}
function render() {
  if (!state) return;
  const [first] = route();
  const view = ['overview', 'triage', 'records', 'record', 'machine', ...overviewViews].includes(first) ? first : 'overview';
  const primary = overviewViews.includes(view) ? 'overview' : view === 'record' ? 'records' : view;
  for (const link of document.querySelectorAll('.tabs a')) { const active = link.hash.slice(1).split('/')[0] === primary; if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); }
  for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== view;
  const sub = overviewViews.includes(view) ? overviewViews.map(s => [s, titleCase(s)]) : view === 'machine' ? machineTabs.map(([s, name]) => [`machine/${s}`, name]) : [];
  $('[data-subnav]').innerHTML = sub.map(([path, label]) => `<a href="#${path}" ${(view === path || route().join('/') === path || (view === 'machine' && !route()[1] && path === 'machine/cycles')) ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  $('[data-count]').textContent = queue().length;
  $('[data-name]').textContent = `${state.name} / Immune system`;
  const banner = $('[data-demo]');
  banner.hidden = !state.demo;
  banner.innerHTML = state.demo ? `<b>Sample project</b><p>${esc(state.name)} and its bugs are made up. This is the console the immune-system skill builds, running on demo data${state.static ? ', read only' : ''}.</p><a class="btn" href="https://github.com/proxysoul/SoulStack/tree/main/skills/immune-system" target="_blank" rel="noopener noreferrer">Get the skill</a>` : '';
  document.title = `${titleCase(view)} · ${state.name} immunity`;
  const renders = { overview: renderOverview, triage: renderTriage, records: renderRecords, record: renderRecord, machine: renderMachine, health: renderHealth, runs: renderRuns, cells: renderCells, findings: () => renderNotes('findings', 'Findings', 'No open findings.'), explorations: () => renderNotes('explorations', 'Explorations', 'No explorations yet.') };
  renders[view]();
  $('[data-actions]').hidden = !['health', 'runs'].includes(view);
  if (!state.static) renderActions(); else $('[data-actions]').innerHTML = '<span class="meta">Read-only snapshot. Run checks from the local app.</span>';
}
async function load() {
  const sequence = ++loadSequence;
  const response = live ? await fetch('api/state').catch(() => null) : null;
  let data;
  if (response?.ok && (response.headers.get('content-type') ?? '').includes('json')) data = await response.json();
  else if (state && live) { note('Could not refresh the machine. Keeping the last view; decisions may need a refresh.'); return; }
  else {
    const snapshot = await fetch('state.json');
    if (!snapshot.ok) throw new Error('Could not load the machine or a static snapshot.');
    data = await snapshot.json(); live = false;
  }
  if (sequence !== loadSequence) return;
  state = data; render();
  if (!live || state.static) setConnection('Snapshot', false);
}
function setConnection(text, isLive) { const el = $('[data-connection]'); el.dataset.live = String(isLive); el.querySelector('span').textContent = text; }
function listen() {
  const events = new EventSource('api/events');
  events.addEventListener('hello', () => setConnection('Live', true));
  events.addEventListener('open', () => { setConnection('Live', true); load().catch(error => note(error.message)); });
  events.addEventListener('error', () => setConnection('Reconnecting', false));
  events.addEventListener('changed', () => load().catch(error => note(error.message)));
  events.addEventListener('log', e => { const body = $('[data-log-body]'); body.textContent += `${JSON.parse(e.data).line}\n`; body.scrollTop = body.scrollHeight; });
  events.addEventListener('run', e => { const d = JSON.parse(e.data); for (const b of document.querySelectorAll('[data-cmd]')) b.disabled = d.state === 'started'; if (d.state === 'finished') { $('[data-log-title]').textContent = `${d.name} finished (exit ${d.code}, ${Math.round(d.ms / 1000)}s)`; load().catch(error => note(error.message)); } });
}
function step(amount) {
  const waiting = queue(), index = waiting.indexOf(currentRecord());
  const next = waiting[Math.max(0, Math.min(waiting.length - 1, index + amount))];
  if (next) go(`triage/${next.id}`);
}
async function submitDecision(record, decision, extra = {}) {
  if (state.static || busy) return;
  busy = true;
  for (const button of document.querySelectorAll('[data-decide], [data-decision-form] button[type="submit"]')) button.disabled = true;
  const waiting = queue(), index = waiting.findIndex(r => r.id === record.id);
  try {
    const response = await fetch('api/decision', { method: 'POST', headers: { 'content-type': 'application/json', 'x-immune-token': state.token }, body: JSON.stringify({ path: record.path, version: record.version, decision, ...extra }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Decision could not be saved.');
    $('[data-decision]').close(); pendingDecision = null;
    await load();
    const next = queue()[Math.min(index, queue().length - 1)];
    go(next ? `triage/${next.id}` : 'triage');
    note(`Decision saved: ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'already fixed'}. The record is in ${result.path}.`);
  } catch (error) {
    if ($('[data-decision]').open) $('[data-decision-error]').textContent = error.message;
    else note(error.message);
  } finally { busy = false; render(); $('[data-decision-form] button[type="submit"]').disabled = false; }
}
function chooseDecision(decision) {
  const record = currentRecord();
  if (!record || state.static || busy || route()[0] !== 'triage') return;
  if (decision === 'approve') { submitDecision(record, decision); return; }
  pendingDecision = { record, decision };
  $('[data-decision-form]').reset(); $('[data-decision-error]').textContent = '';
  $('#decision-title').textContent = decision === 'reject' ? 'Reject this record' : 'Already fixed';
  $('[data-decision-record]').textContent = record.title;
  $('[data-decision-label]').textContent = decision === 'reject' ? 'Why should this record be rejected?' : 'Which commit fixed it?';
  $('#decision-value').maxLength = decision === 'reject' ? 2000 : 64;
  $('#decision-value').pattern = decision === 'reject' ? '.*\\S.*' : '[a-fA-F0-9]{7,64}';
  $('[data-decision]').showModal(); $('#decision-value').focus();
}
$('[data-decision-form]').addEventListener('submit', event => {
  event.preventDefault(); if (!pendingDecision) return;
  const { record, decision } = pendingDecision;
  submitDecision(record, decision, { [decision === 'reject' ? 'reason' : 'commit']: $('#decision-value').value.trim() });
});
$('[data-cancel]').addEventListener('click', () => $('[data-decision]').close());
$('[data-log-close]').addEventListener('click', () => { $('[data-log]').hidden = true; });
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.decide) chooseDecision(button.dataset.decide);
  if (button.dataset.step) step(Number(button.dataset.step));
  if (button.hasAttribute('data-help')) $('[data-keys]').showModal();
});
document.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || (event.target.isContentEditable || event.target.closest('input,textarea,select')) || document.querySelector('dialog[open]')) return;
  if (event.key === '?') { event.preventDefault(); $('[data-keys]').showModal(); return; }
  if (route()[0] !== 'triage' || !state) return;
  const key = event.key.toLowerCase();
  if (['a', 'r', 'x', 'j', 'k'].includes(key)) event.preventDefault();
  if (key === 'j' || key === 'k') step(key === 'j' ? 1 : -1);
  else if ({ a: 'approve', r: 'reject', x: 'already-fixed' }[key]) chooseDecision({ a: 'approve', r: 'reject', x: 'already-fixed' }[key]);
});
function updateWorldControls() {
  const root = document.documentElement;
  $('[data-world-picker]').value = root.dataset.world;
  $('[data-mode]').textContent = root.dataset.theme === 'dark' ? 'Day' : 'Night';
  $('[data-mode]').setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to day' : 'Switch to night');
  $('button[data-motion]').textContent = root.dataset.motion === 'still' ? 'Play' : 'Pause';
  $('button[data-motion]').setAttribute('aria-label', root.dataset.motion === 'still' ? 'Resume motion' : 'Pause motion');
}
function saveWorld() { const root = document.documentElement; try { localStorage.setItem('soulstack-world', JSON.stringify({ world: root.dataset.world, mode: root.dataset.theme, motion: root.dataset.motion })); } catch { note('Theme changed for this visit; browser storage is unavailable.'); } updateWorldControls(); }
function changeWorld(change, event) {
  const root = document.documentElement;
  const update = () => { change(); saveWorld(); };
  if (!document.startViewTransition || root.dataset.motion === 'still' || matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return; }
  const rect = event.currentTarget.getBoundingClientRect();
  root.style.setProperty('--switch-x', `${rect.left + rect.width / 2}px`);
  root.style.setProperty('--switch-y', `${rect.top + rect.height / 2}px`);
  document.startViewTransition(update);
}
$('[data-world-picker]').addEventListener('change', e => { const value = e.target.value; changeWorld(() => { document.documentElement.dataset.world = value; }, e); });
$('[data-mode]').addEventListener('click', event => changeWorld(() => { const root = document.documentElement; root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; }, event));
$('button[data-motion]').addEventListener('click', () => { const root = document.documentElement; root.dataset.motion = root.dataset.motion === 'still' ? 'on' : 'still'; saveWorld(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
updateWorldControls();
load().then(() => { if (live && !state.static) listen(); }).catch(error => note(error.message));
