import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { demoServer } from './proof-support.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const shots = resolve(process.argv[2] || join(tmpdir(), 'soulstack-immune-shots'));
mkdirSync(shots,{recursive:true});
const quick = process.argv.includes('--quick');
const server = await demoServer();
let browser;
const report = { screenshots:[], layouts:[], browserErrors:[], checks:[] };
try {
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',error => report.browserErrors.push(error.message));
  await page.goto(server.url); await page.locator('[data-panel="overview"] h1').waitFor(); await page.evaluate(() => document.fonts.ready);
  const state = await page.request.get(`${server.url}/api/state`).then(r=>r.json());
  const guarded = state.machine.records.find(r=>r.stage === 'guarded');
  const views = ['overview','triage','records',`record/${guarded.id}`,'machine/cycles','machine/guards','machine/antigens','machine/board','health','runs','cells','findings','explorations'];
  async function view(path) {
    await page.evaluate(path => { location.hash = path; },path);
    await page.waitForFunction(path => { const key=path.split('/')[0]; const el=document.querySelector(`[data-panel="${key}"]`); return el && !el.hidden && el.textContent.trim().length > 0; },path);
    if(path === 'runs') await page.locator('[data-panel="runs"] [data-run]').first().click();
    if(['findings','explorations'].includes(path)) await page.locator(`[data-panel="${path}"] details summary`).first().click();
    await page.evaluate(() => { scrollTo(0,0); });
  }
  async function geometry(label) {
    const result = await page.evaluate(() => {
      const visible = el => { const r=el.getBoundingClientRect(); return r.width>0 && r.height>0 && getComputedStyle(el).visibility!=='hidden'; };
      const label = el => `${el.tagName.toLowerCase()}.${String(el.className).slice(0,45)}:${el.textContent.trim().slice(0,50)}`;
      const overlaps=[];
      for(const selector of ['.top','.tabs','.world-controls','.record-row','.stats','.life','.stage-counts','.antigen-row','.section-head','.actions','.keys']) {
        for(const parent of document.querySelectorAll(selector)) {
          if(!visible(parent)) continue;
          const children=[...parent.children].filter(visible);
          for(let i=0;i<children.length;i++) for(let j=i+1;j<children.length;j++) {
            const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect();
            if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1) overlaps.push([label(children[i]),label(children[j])]);
          }
        }
      }
      const spill = [...document.querySelectorAll('.card,.stat,.record-row,.life li,.top,.world-controls,.record-head,.antigen-row')].filter(visible).flatMap(el => [...el.children].filter(visible).filter(child => { const a=el.getBoundingClientRect(),b=child.getBoundingClientRect(); return b.left<a.left-1 || b.right>a.right+1; }).map(child=>[label(el),label(child)]));
      const top=document.querySelector('.top').getBoundingClientRect(), main=document.querySelector('main').getBoundingClientRect();
      return { width:innerWidth, documentWidth:document.documentElement.scrollWidth, overlaps, spill, topClear:main.top>=top.bottom };
    });
    report.layouts.push({label,...result});
    assert.ok(result.documentWidth <= result.width,`${label}: document overflow ${result.documentWidth}/${result.width}`);
    assert.deepEqual(result.overlaps,[],`${label}: overlapping siblings`);
    assert.deepEqual(result.spill,[],`${label}: content outside its card`);
    assert.equal(result.topClear,true,`${label}: content crowds the top bar`);
  }
  const worlds=quick ? ['undertow'] : ['undertow','water','coffee','crimson','empryo','soul'];
  for(const world of worlds) for(const mode of ['dark','light']) for(const width of quick ? [390,1440] : [390,1440,...(world === 'undertow' ? [3440] : [])]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`${server.url}/?world=${world}&mode=${mode}&motion=still`); await page.locator('[data-panel="overview"] h1').waitFor(); await page.evaluate(() => document.fonts.ready);
    for(const path of views) {
      await view(path); const label=`${world}-${mode}-${width}-${path.replaceAll('/','-')}`;
      await geometry(label);
      await page.screenshot({path:join(shots,`${label}.png`),fullPage:true,animations:'disabled'}); report.screenshots.push(`${label}.png`);
    }
  }
  report.checks.push('Every populated view, all requested widths/modes, no DOM overflow/overlap/card spill.');
  await page.setViewportSize({width:1440,height:1000}); await page.goto(`${server.url}/#triage`); await page.locator('[data-panel="triage"] article h1').waitFor();
  const title = () => page.locator('[data-panel="triage"] article h1').innerText();
  const first=await title(); await page.keyboard.press('j'); await page.waitForFunction(first => document.querySelector('[data-panel="triage"] article h1').textContent !== first,first); await page.keyboard.press('k'); await page.waitForFunction(first=>document.querySelector('[data-panel="triage"] article h1').textContent===first,first);
  await page.keyboard.press('?'); await page.locator('[data-keys][open]').waitFor(); await page.screenshot({path:join(shots,'keyboard-help.png')}); await page.keyboard.press('Escape');
  for(const [key,decision,extra] of [['r','reject','Already covered by a notebook fixture.'],['x','already-fixed','abc1234'],['a','approve',null]]) {
    const before = await page.request.get(`${server.url}/api/state`).then(r=>r.json());
    const recordTitle=await title(); const record=before.machine.records.find(r=>r.title===recordTitle);
    await page.keyboard.press(key);
    if(extra) {
      await page.locator('[data-decision][open]').waitFor(); await page.locator('#decision-value').fill(extra);
      const value=await page.locator('#decision-value').inputValue(); await page.keyboard.press('a'); assert.equal(await page.locator('#decision-value').inputValue(),`${value}a`); await page.locator('#decision-value').fill(extra);
      await page.screenshot({path:join(shots,`decision-${decision}.png`)});
      await page.getByRole('button',{name:'Save decision',exact:true}).click();
    }
    await page.waitForFunction(() => document.querySelector('[data-notice]').textContent.startsWith('Decision saved:'));
    const recordFiles=['found','ready','rejected','verified','fixed','guarded'].flatMap(stage => readdirSync(join(server.temp,'machine',stage)).filter(n=>n===`${record.id}.md`).map(n=>join(stage,n)));
    assert.equal(recordFiles.length,1); const body=readFileSync(join(server.temp,'machine',recordFiles[0]),'utf8'); assert.ok(body.includes(`- decision: ${decision}`)); assert.ok(body.includes('- who: human'));
    await page.evaluate(()=>{document.querySelector('[data-notice]').textContent='';});
    report.checks.push(`${key.toUpperCase()} ${decision}: human decision appended, status changed, exactly one file (${recordFiles[0]}).`);
  }
  report.checks.push('J/K navigate, ? opens help, Escape closes, decision keys do not fire while typing.');
  await page.getByRole('link',{name:'Overview',exact:true}).first().click(); await page.locator('[data-panel="overview"] h1').waitFor();
  const beforeLiveCount = Number(await page.locator('[data-count]').innerText());
  const target = join(server.temp,'machine/found/live-browser-proof.md');
  writeFileSync(target,'# A live file change arrives in the browser\n- status: found\n- severity: ux\n- source: browser proof\n\n## Bug\nLive refresh probe.\n');
  await page.waitForFunction(count=>Number(document.querySelector('[data-count]').textContent) === count+1,beforeLiveCount);
  report.checks.push('Recursive machine edit refreshes the browser without a reload.');
  await page.locator('[data-world-picker]').selectOption('water'); assert.equal(await page.locator('html').getAttribute('data-world'),'water');
  const previous=await page.locator('html').getAttribute('data-theme'); await page.locator('[data-mode]').click(); assert.notEqual(await page.locator('html').getAttribute('data-theme'),previous);
  report.checks.push('World picker and day/night buttons update the real page.');
  const staticRoot=resolve(server.app,'../../../site/public/immunity');
  const staticServer=createServer((req,res)=>{try { const name=new URL(req.url,'http://localhost').pathname.slice(1); if(!/^[a-zA-Z0-9_.-]*$/.test(name)) { res.writeHead(404).end(); return; } const file=join(staticRoot,name || 'index.html'); const content=readFileSync(file); res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.woff2')?'font/woff2':'text/html'); res.end(content); } catch {res.writeHead(404).end();} });
  await new Promise(resolve=>staticServer.listen(0,'127.0.0.1',resolve));
  try {
    await page.goto(`http://127.0.0.1:${staticServer.address().port}/#overview`); await page.locator('[data-panel="overview"] h1').waitFor();
    for(const path of views) { await view(path); await geometry(`static-${path}`); }
    await view('triage'); assert.equal(await page.locator('[data-decide="approve"]').isDisabled(),true); const before=await title(); await page.keyboard.press('a'); assert.equal(await title(),before);
    report.checks.push('Static export: all 13 views render; decisions are disabled and keyboard writes do nothing.');
  } finally { await new Promise(resolve=>staticServer.close(resolve)); }
  assert.deepEqual(report.browserErrors,[]);
  console.log(JSON.stringify({screenshots:report.screenshots.length,layouts:report.layouts.length,checks:report.checks,errors:report.browserErrors},null,2));
} finally {
  writeFileSync(join(shots,'proof.json'),JSON.stringify(report,null,2));
  await browser?.close(); await server.stop();
}
