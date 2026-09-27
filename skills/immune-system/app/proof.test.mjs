import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { demoServer } from './proof-support.mjs';

test('Local HTTP front door: decisions, file safety, board, live events and static export', {timeout:60000}, async t => {
  const server = await demoServer();
  const {url,temp,app} = server;
  try {
    const state = () => fetch(`${url}/api/state`).then(r => r.json());
    const initial = await state();
    const request = (body,headers = {}) => fetch(`${url}/api/decision`,{method:'POST',headers:{'content-type':'application/json','x-immune-token':initial.token,...headers},body:JSON.stringify(body)});
    const machine = join(temp,'machine');
    const input = (record,decision,extra = {}) => ({path:record.path,version:record.version,decision,...extra});
    const found = initial.machine.records.filter(r => r.stage === 'found');
    await t.test('All stages and old views have populated data; board agrees with CLI',async () => {
      assert.equal(initial.machine.records.length,20);
      assert.equal(initial.machine.cycles.length,2);
      for (const key of ['runs','cells','findings','explorations']) assert.ok(initial[key].length);
      const cli = JSON.parse(execFileSync(process.versions.bun ? "node" : process.execPath,[join(app,'../machine/board.mjs'),machine,'--json'],{encoding:'utf8',timeout:10000}));
      assert.deepEqual(initial.machine.board,cli);
      assert.ok(initial.machine.records.find(r => r.stage === 'guarded').life.every(s => s.done));
      assert.equal(initial.commits.list.length,8);
      assert.deepEqual(initial.commits.list.find(c => c.short === 'aaaaa19').records,['c02-h09-1']);
      assert.deepEqual(initial.commits.list.find(c => c.short === 'd0c5a1e').records,[]);
      assert.equal(initial.issues.list.length,8);
      assert.equal(initial.issues.list.filter(i => i.state === 'open').length,5);
      assert.ok(initial.issues.list.every(i => i.url === '' && Array.isArray(i.labels)));
    });
    await t.test('Reject invalid decisions, traversal, foreign origins, stale files and injected sections',async () => {
      for (const body of [null,[],{},input(found[0],'delete'),input(found[0],'approve',{path:'../outside.md'}),input(found[0],'approve',{path:'/tmp/outside.md'}),input(found[0],'approve',{path:'found/../../outside.md'}),input(found[0],'reject',{reason:'  '}),input(found[0],'reject',{reason:'no\n\n## Decision\n- decision: approve'}),input(found[0],'already-fixed',{commit:'main'})]) assert.equal((await request(body)).status,400);
      assert.equal((await request(input(found[0],'approve'),{origin:'https://evil.example'})).status,403);
      assert.equal((await request(input(found[0],'approve'),{'x-immune-token':''})).status,403);
      assert.equal((await request(input(found[0],'approve',{version:'old'}))).status,409);
      assert.equal((await request(input(found[0],'reject',{reason:'x'.repeat(9000)}))).status,413);
      assert.equal((await fetch(`${url}/api/decision`)).status,405);
      assert.equal((await fetch(`${url}/server.mjs`)).status,404);
      assert.equal((await fetch(`${url}/immune.config.json`)).status,404);
      const malformed = await fetch(`${url}/api/decision`,{method:'POST',headers:{'content-type':'application/json','x-immune-token':initial.token},body:'{'}); assert.equal(malformed.status,400);
    });
    await t.test('Refuse symlinks, hard links and duplicate records without touching evidence',async () => {
      const outside = join(temp,'outside.md'); writeFileSync(outside,'private evidence');
      const escape = join(machine,'found','escape.md'); symlinkSync(outside,escape);
      assert.equal((await request({path:'found/escape.md',version:'anything',decision:'approve'})).status,400); rmSync(escape);
      const source = join(machine,found[0].path); const duplicate = join(machine,'ready',`${found[0].id}.md`); cpSync(source,duplicate);
      assert.equal((await request(input(found[0],'approve'))).status,409); rmSync(duplicate);
      const hardlink = join(temp,'hardlink.md'); linkSync(source,hardlink);
      assert.equal((await request(input(found[0],'approve'))).status,409); rmSync(hardlink);
      assert.equal(readFileSync(outside,'utf8'),'private evidence');
      const folder = join(machine,'rejected'); const backup = join(temp,'old-rejected'); cpSync(folder,backup,{recursive:true}); rmSync(folder,{recursive:true}); symlinkSync(temp,folder);
      assert.equal((await request(input(found[0],'reject',{reason:'No longer current'}))).status,400); rmSync(folder); cpSync(backup,folder,{recursive:true});
    });
    await t.test('Approve, reject and already fixed append decisions and leave exactly one copy',async () => {
      for(const [i,decision,destination,extra] of [[0,'approve','ready',{}],[1,'reject','rejected',{reason:'Intentional behaviour in the fixture.'}],[2,'already-fixed','fixed',{commit:'abc1234'}]]) {
        const r = found[i], before = readFileSync(join(machine,r.path),'utf8');
        const response = await request(input(r,decision,extra)); assert.equal(response.status,200,await response.text());
        const files = ['found','ready','rejected','verified','fixed','guarded'].flatMap(stage => existsSync(join(machine,stage,`${r.id}.md`)) ? [stage] : []);
        assert.deepEqual(files,[destination]);
        const body = readFileSync(join(machine,destination,`${r.id}.md`),'utf8');
        assert.match(body,new RegExp(`## Decision\n- decision: ${decision}`)); assert.match(body,new RegExp(`^- status: ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'fixed'}$`,'m')); assert.match(body,/- who: human/); assert.match(body,/- time: \d{4}-/);
        assert.ok(body.includes(before.slice(before.indexOf('\n## Bug'))));
        assert.equal((await request(input(r,decision,extra))).status,409);
      }
      assert.equal((await state()).machine.records.length,20);
    });
    await t.test('Approval of a failed fix keeps rework claimable without repeating triage',async () => {
      const r = (await state()).machine.records.find(r => r.status === 'fix-rejected');
      assert.equal((await request(input(r,'approve'))).status,200);
      const date = new Date(Date.now()-180000); utimesSync(join(machine,r.path),date,date);
      const updated = await state(); const record = updated.machine.records.find(x => x.id === r.id);
      assert.equal(record.status,'fix-rejected'); assert.equal(record.needsHuman,false); assert.ok(updated.machine.board.claimable.fix.includes(r.id));
      writeFileSync(join(machine,r.path),readFileSync(join(machine,r.path),'utf8')+'\r\n## Fix review\r\nFAIL: another defect was reproduced.\r\n- who: independent reviewer\r\n');
      assert.equal((await state()).machine.records.find(x => x.id === r.id).needsHuman,true);
    });
    await t.test('Recursive machine changes emit the existing SSE changed event',async () => {
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(),5000);
      try {
        const response = await fetch(`${url}/api/events`,{signal:controller.signal}); const reader = response.body.getReader(); await reader.read();
        const nested = join(machine,'cycles','live-proof'); mkdirSync(nested); writeFileSync(join(nested,'plan.json'),'{"hunters":[]}');
        let text = ''; while(!text.includes('event: changed')) { const chunk = await reader.read(); text += new TextDecoder().decode(chunk.value); }
        assert.match(text,/event: changed/); assert.equal((await state()).machine.cycles.length,3); reader.cancel();
      } finally { clearTimeout(timeout); controller.abort(); }
    });
    await t.test('Static export includes every data source, has no write token or private paths',() => {
      const out = join(temp,'export'); execFileSync(process.versions.bun ? "node" : process.execPath,[join(app,'server.mjs'),'--export',out],{timeout:10000});
      const text = readFileSync(join(out,'state.json'),'utf8'), exported = JSON.parse(text);
      assert.equal(exported.static,true); assert.equal(exported.commits.list.length,8); assert.equal(exported.issues.list.length,8); assert.equal(exported.demo,true); assert.equal(exported.token,undefined); assert.deepEqual(exported.commands,[]); assert.equal(exported.machine.records.length,20); assert.ok(!text.includes('/Users/'));
      for(const name of ['index.html','app.js','app.css','theme.css','world.js','worlds.css','recursive.woff2']) assert.ok(readdirSync(out).includes(name));
    });
  } finally { await server.stop(); }
});
