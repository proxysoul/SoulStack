import { createHash } from 'node:crypto';
import { constants, closeSync, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmdirSync, statSync, writeFileSync, fsyncSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { readBoard, STAGES } from './board.mjs';

export const digest = text => createHash('sha256').update(text).digest('hex');
const field = (text, name) => text.match(new RegExp(`^- ${name}:[ \t]*(.*)$`, 'm'))?.[1]?.trim() ?? '';
const list = dir => existsSync(dir) ? readdirSync(dir) : [];
const within = (root, file) => { const rel = relative(root, file); return rel !== '..' && !rel.startsWith(`..${sep}`) && !rel.startsWith(sep); };
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function safe(root, file) {
  const full = resolve(root, file);
  if (!within(root, full)) fail(400, 'Path is outside the machine.');
  if (existsSync(full) && (!within(realpathSync(root), realpathSync(full)) || lstatSync(full).isSymbolicLink())) fail(400, 'Symbolic links are not machine files.');
  return full;
}
function directory(root, name, create = false) {
  let dir = root;
  for (const part of name.split('/')) {
    dir = safe(root, join(relative(root, dir), part));
    if (!existsSync(dir) && create) mkdirSync(dir);
    if (existsSync(dir) && !lstatSync(dir).isDirectory()) fail(400, 'Expected a machine folder.');
  }
  return dir;
}
export function sectionsOf(text) {
  return [...text.matchAll(/^## (.+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(m => ({ title: m[1].trim(), body: m[2].trim() }));
}
export function needsHuman(record) {
  if (['rejected', 'fixed', 'guarded'].includes(record.stage)) return false;
  const text = record.body.replace(/\r\n/g, '\n');
  const lastDecision = text.lastIndexOf('\n## Decision\n');
  const approved = lastDecision >= 0 && /^- decision: approve$/m.test(text.slice(lastDecision));
  const reviewAfterDecision = text.lastIndexOf('\n## Fix review\n') > lastDecision;
  return record.stage === 'found' || (record.status === 'fix-rejected' && (!approved || reviewAfterDecision)) || (['security', 'data-loss'].includes(record.severity) && !approved);
}
function readRecord(root, stage, name) {
  const path = `${stage}/${name}`;
  const full = safe(root, path);
  const body = readFileSync(full, 'utf8');
  const sections = sectionsOf(body);
  const record = { id: name.slice(0, -3), path, stage, status: field(body, 'status') || stage, title: body.match(/^# (.+)$/m)?.[1] ?? name, severity: field(body, 'severity'), area: field(body, 'area'), source: field(body, 'source'), cycle: field(body, 'cycle') || name.split('-h')[0], mtime: statSync(full).mtimeMs, version: digest(body), body, sections };
  record.needsHuman = needsHuman(record);
  const last = title => sections.filter(s => s.title === title).at(-1);
  record.life = [['found', null, record.source], ['reviewed', 'Verdict'], ['fixed', 'Fix'], ['fix reviewed', 'Fix review'], ['landed', 'Landed'], ['guarded', 'Guard']].map(([label, heading, source]) => {
    const section = last(heading);
    const done = label === 'found' || (label === 'guarded' ? stage === 'guarded' : Boolean(section));
    return { label, done, who: done ? source || field(section?.body ?? '', 'who') || 'Not recorded' : 'Not yet', outcome: label === 'fix reviewed' && section?.body.startsWith('FAIL') ? 'Failed' : null };
  });
  return record;
}
function json(root, file, fallback) {
  const full = safe(root, file);
  return existsSync(full) ? JSON.parse(readFileSync(full, 'utf8')) : fallback;
}
export function machineState(root) {
  if (!existsSync(root)) return { records: [], cycles: [], guards: [], antigens: { floor: {}, latest: {} }, board: readBoard(root), missing: true };
  const records = [];
  for (const stage of STAGES) {
    const dir = directory(root, stage);
    for (const name of list(dir).filter(n => n.endsWith('.md'))) records.push(readRecord(root, stage, name));
  }
  const cycleDir = directory(root, 'cycles');
  const cycles = list(cycleDir).filter(id => lstatSync(safe(root, `cycles/${id}`)).isDirectory()).map(id => {
    const plan = json(root, `cycles/${id}/plan.json`, {});
    return { id, plan, produced: Object.fromEntries(STAGES.map(stage => [stage, records.filter(r => r.cycle === id && r.stage === stage).map(r => r.id)])) };
  });
  directory(root, 'claims');
  for (const role of ['review', 'fix', 'fixrev']) {
    const dir = directory(root, `claims/${role}`);
    for (const name of list(dir)) safe(root, `claims/${role}/${name}`);
  }
  const registered = json(root, 'guards.json', []);
  const guards = Array.isArray(registered) ? registered : registered.guards ?? [];
  for (const record of records.filter(r => r.stage === 'guarded')) {
    if (!guards.some(g => g.record === record.id)) guards.push({ name: record.sections.filter(s => s.title === 'Guard').at(-1)?.body.match(/\bm-[\w-]+/)?.[0] ?? record.id, record: record.id, description: record.title, status: 'Registered', proof: record.sections.filter(s => s.title === 'Guard').at(-1)?.body ?? '' });
  }
  directory(root, 'antigens');
  return { records: records.sort((a, b) => b.mtime - a.mtime), cycles, guards, antigens: { floor: json(root, 'antigens/floor.json', {}), latest: json(root, 'antigens/latest.json', {}) }, board: readBoard(root) };
}
export function decide(root, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Expected a decision object.');
  const { path, decision, version } = input;
  if (!['approve', 'reject', 'already-fixed'].includes(decision)) fail(400, 'Choose approve, reject or already-fixed.');
  if (typeof path !== 'string' || !/^(found|ready|verified)\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.md$/.test(path)) fail(400, 'Choose a record inside an open machine stage.');
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const commit = typeof input.commit === 'string' ? input.commit.trim() : '';
  if (reason.length > 2000 || /[\r\n\x00-\x1f]/.test(reason)) fail(400, 'Use a single-line reason under 2,000 characters.');
  if (decision === 'reject' && !reason) fail(400, 'Rejection needs a reason.');
  if (decision === 'already-fixed' && !/^[a-f0-9]{7,64}$/i.test(commit)) fail(400, 'Already fixed needs a commit hash (7–64 hex characters).');
  const [stage, name] = path.split('/');
  const id = name.slice(0, -3);
  directory(root, stage);
  const source = safe(root, path);
  if (!existsSync(source)) fail(409, 'This record moved. Refresh before deciding.');
  directory(root, 'claims/decision', true);
  const lock = safe(root, `claims/decision/${id}`);
  try { mkdirSync(lock); } catch (error) { if (error.code === 'EEXIST') fail(409, 'Someone is already deciding this record.'); throw error; }
  let fd;
  try {
    const record = readRecord(root, stage, name);
    if (version !== record.version) fail(409, 'This record changed. Refresh before deciding.');
    if (!needsHuman(record)) fail(409, 'This record is not waiting for a human decision.');
    for (const s of STAGES) { directory(root, s); if (s !== stage && existsSync(safe(root, `${s}/${name}`))) fail(409, 'This record exists in more than one stage. Resolve the duplicate first.'); }
    const destinationStage = decision === 'reject' ? 'rejected' : decision === 'already-fixed' ? 'fixed' : stage === 'verified' ? 'verified' : 'ready';
    const status = decision === 'reject' ? 'rejected' : decision === 'already-fixed' ? 'fixed' : stage === 'verified' ? 'verified' : stage === 'ready' ? record.status : 'approved';
    directory(root, destinationStage, true);
    const destination = safe(root, `${destinationStage}/${name}`);
    if (!/^- status:.*$/m.test(record.body)) fail(409, 'Record has no status line.');
    const time = new Date().toISOString();
    let body = record.body.replace(/^- status:.*$/m, `- status: ${status}`);
    if (decision === 'approve' && (stage === 'found' || !record.sections.some(s => s.title === 'Verdict'))) body += '\n\n## Verdict\nAPPROVED: human approved the report.\n- who: human\n';
    body += `\n\n## Decision\n- decision: ${decision}\n- reason: ${reason || (decision === 'approve' ? 'Approved by the human.' : `Already fixed in ${commit}.`)}\n- who: human\n- time: ${time}\n`;
    if (decision === 'already-fixed') body += `- commit: ${commit}\n\n## Landed\nCommit ${commit}. Marked already fixed by the human.\n- who: human\n- time: ${time}\n`;
    fd = openSync(source, constants.O_WRONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.ino !== lstatSync(source).ino) fail(409, 'Record is not a unique regular file.');
    if (digest(readFileSync(source, 'utf8')) !== version) fail(409, 'Record changed while deciding.');
    try {
      writeFileSync(fd, body); fsyncSync(fd);
      if (destination !== source) renameSync(source, destination);
    } catch (error) { writeFileSync(source, record.body); throw error; }
    return { ok: true, path: `${destinationStage}/${name}`, version: digest(body) };
  } finally { if (fd !== undefined) closeSync(fd); rmdirSync(lock); }
}
