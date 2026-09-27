import { mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const now = Date.now();
const write = (path, body, age = 0) => { const file = join(root, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, body); const time = new Date(now - age * 60000); utimesSync(file, time, time); };
const json = (path, data) => write(path, JSON.stringify(data, null, 2) + '\n');
const rows = [
 ['found','found','security','A shared notebook stays readable after access is removed','sharing','permissions'],
 ['found','found','data-loss','Restoring an old page drops its attached sketch','history','restore'],
 ['found','found','crash','An empty search closes the reading window','search','empty-input'],
 ['found','found','wrong-behavior','Pinned notes disappear when a notebook is renamed','notebooks','rename'],
 ['found','found','ux','The save indicator never settles after reconnecting','sync','reconnect'],
 ['ready','fix-rejected','wrong-behavior','Recurring reminders fire twice after a timezone change','reminders','timezone'],
 ['ready','approved','security','An invitation can be redeemed after its expiry','sharing','expiry'],
 ['ready','approved','data-loss','Importing a notebook replaces notes with matching names','import','collision'],
 ['ready','approved','hang','Large sketches block switching between pages','canvas','large-input'],
 ['ready','fixed-unverified','wrong-behavior','Archived notebooks appear in quick search','search','archive'],
 ['ready','fixed-unverified','leak','Closing the editor leaves its sync subscription open','editor','cleanup'],
 ['verified','verified','wrong-behavior','Weekly summaries use the wrong first day of the week','summary','locale'],
 ['verified','verified','ux','Keyboard focus skips the page title after creating a note','editor','focus'],
 ['fixed','fixed','crash','A missing cover image stops notebook export','export','missing-file'],
 ['fixed','fixed','wrong-behavior','A moved page keeps its previous notebook breadcrumb','notebooks','move'],
 ['fixed','fixed','ux','Read-only notes still show an enabled save button','editor','readonly'],
 ['guarded','guarded','wrong-behavior','A retry creates two copies of an uploaded sketch','sync','retry'],
 ['guarded','guarded','data-loss','An interrupted export replaces the last good archive','export','atomic-write'],
 ['guarded','guarded','security','A guest can edit a notebook through the share link','sharing','guest-write'],
 ['rejected','rejected','ux','An archived page is absent from the default notebook list','notebooks','intent'],
];
const ids = rows.map((_, i) => `${i < 10 ? 'c01' : 'c02'}-h${String(i % 10 + 1).padStart(2,'0')}-1`);
for (const [i, [stage,status,severity,title,area,lens]] of rows.entries()) {
 const cycle = i < 10 ? 'c01' : 'c02'; const id = ids[i]; const reviewed = stage !== 'found'; const fixed = ['fixed-unverified','fix-rejected','verified','fixed','guarded'].includes(status);
 let body = `# ${title}\n- status: ${status}\n- area: ${area}\n- file: lantern/${area}/actions.js:42\n- severity: ${severity}\n- kind: bug\n- lens: ${lens}\n- platform: all\n- door: web\n- source: hunter ${i % 10 + 1}, scout model\n- cycle: ${cycle}\n\n## Bug\n${title}. This affects people using Lantern, a fictional shared notebook.\n\n## Trigger\n1. Open the isolated Lantern notebook fixture.\n2. Exercise the **${lens.replaceAll('-',' ')}** case in ${area}.\n3. Read the resulting page and saved notebook.\n\n## Evidence\n> The visible result and the saved notebook disagree.\n\nThe fixture records the before and after values, not just the exit code.\n\n## Reproduction\n\`\`\`sh\nlantern check ${area} --case ${lens} --isolated\n# exit 1: expected invariant did not hold\n\`\`\`\n\n## Guard idea\nCheck the ${lens.replaceAll('-',' ')} boundary before accepting the change.\n`;
 if(reviewed) body += `\n## Verdict\n${stage === 'rejected' ? 'REJECTED: archived pages are deliberately hidden by this filter.' : 'APPROVED: reproduced independently through the web front door.'}\n- who: reviewer, second model\n\n## Reproduction (review)\nAn independent clean fixture produced the same result.\n\n## Fix plan\nMake the ${area} boundary preserve its invariant and prove the old case fails.\n`;
 if(fixed) body += `\n## Fix\nValidate the ${lens.replaceAll('-',' ')} case at the ${area} boundary.\n- who: fixer, repair model\n\n## Proof\nBefore: fixture exits 1. After: fixture exits 0 and the saved notebook matches the visible result.\n\n## Guard\n\`m-${lens}\` rejects the original bad fixture; the good fixture passes. Product matches: 0.\n- who: memory cell\n`;
 if(['fix-rejected','verified','fixed','guarded'].includes(status)) body += `\n## Fix review\n${status === 'fix-rejected' ? 'FAIL: the repeated action still creates a second reminder at lantern/reminders/actions.js:51.' : 'PASS: reran both fixtures and verified the saved notebook.'}\n- who: fix reviewer, independent model\n`;
 if(['fixed','guarded'].includes(stage)) body += `\n## Landed\nCommit ${String(i + 1).padStart(7,'a')}, guard ${stage === 'guarded' ? `m-${lens} registered` : 'awaiting registration'}.\n- who: lead\n`;
 write(`machine/${stage}/${id}.md`, body, 45 + i * 12);
}
for(const cycle of ['c01','c02']) json(`machine/cycles/${cycle}/plan.json`, { cycle, title: cycle === 'c01' ? 'Sharing and recovery' : 'A quieter notebook', started: new Date(now - (cycle === 'c01' ? 86400000 : 43200000)).toISOString(), hunters: rows.slice(cycle === 'c01' ? 0 : 10,cycle === 'c01' ? 10 : 20).map((r,i) => ({ id: `${cycle}-h${String(i+1).padStart(2,'0')}`, area: r[4], lens: r[5], files: [`lantern/${r[4]}/actions.js`], source: `hunter ${i+1}, scout model` })) });
for(const [role,id] of [['review',ids[3]],['fix',ids[8]],['fixrev',`${ids[9]}-1`]]) { write(`machine/claims/${role}/${id}/.keep`, 'Demo claim.\n'); const date = new Date(now-15*60000); utimesSync(join(root,`machine/claims/${role}/${id}`),date,date); }
json('machine/guards.json', rows.flatMap((r,i) => r[0] === 'guarded' ? [{ name:`m-${r[5]}`, record:ids[i], description:r[3], status:'Registered', proof:'Bad fixture: caught. Good fixture: passed. Product matches: 0.' }] : []));
json('machine/antigens/floor.json', { 'Empty catches':9, 'Unawaited saves':6, 'Fixed sleeps':4, 'Unchecked inputs':8 });
json('machine/antigens/latest.json', { 'Empty catches':6, 'Unawaited saves':3, 'Fixed sleeps':4, 'Unchecked inputs':9 });
json('immune.config.json', { name:'Lantern', demo:true, machine:'machine', results:'results', findings:'findings', explorations:'explorations', commits:'commits.json', issues:'github/issues.json', cells:['cells'], commands:{}, keepRuns:50 });
const fixes = { 'missing-file':'export notebooks whose cover image is missing', move:'update the breadcrumb when a page moves', readonly:'disable save on read-only notes', retry:'make sketch upload retries idempotent', 'atomic-write':'write export archives atomically', 'guest-write':'keep share links read-only for guests' };
const landed = rows.flatMap((r,i) => ['fixed','guarded'].includes(r[0]) ? [{ i, area:r[4], lens:r[5] }] : []);
json('commits.json', [
 { hash:'d0c5a1e'.padEnd(40,'0'), author:'lead', at:new Date(now-9*60000).toISOString(), subject:'docs(machine): explain claims in the lead brief' },
 ...landed.reverse().map(({ i, area, lens }, n) => ({ hash:String(i+1).padStart(7,'a').padEnd(40,'0'), author:'lead', at:new Date(now-(n+1)*37*60000).toISOString(), subject:`fix(${area}): ${fixes[lens]}` })),
 { hash:'c02c1e5'.padEnd(40,'0'), author:'lead', at:new Date(now-5*3600000).toISOString(), subject:'chore(machine): open hunt cycle c02' },
]);
json('github/issues.json', { fetchedAt:new Date(now-20*60000).toISOString(), issues:[
 [53,'OPEN','A keyboard shortcut for a new page',['enhancement'],2],
 [52,'CLOSED','Search shows archived notebooks',['bug'],5],
 [50,'OPEN','Reminders fire twice after travelling',['bug'],9],
 [48,'OPEN','Dark mode for the sketch canvas',['enhancement'],14],
 [47,'CLOSED','A share link lets guests type into notes',['bug','security'],20],
 [45,'OPEN','Export a single page instead of the whole notebook',['enhancement'],26],
 [44,'OPEN','Pinned notes vanish after renaming a notebook',['bug'],31],
 [41,'CLOSED','Export stops when a notebook has no cover',['bug'],40],
].map(([number,state,title,labels,days]) => ({ number, state, title, url:'', labels:labels.map(name => ({ name })), createdAt:new Date(now-days*86400000).toISOString() })) });
for(let i=0;i<4;i++) {
 const run = { id:`patrol-${i+1}`, commit:`de00${i}ab`, finished:new Date(now-i*3600000).toISOString(), results:[
 {check:'Notebook round trip',family:'storage',platform:'linux',door:'cli',target:'local fixture',status:'pass',detail:'Saved notebook matches the input'},
 {check:'Notebook round trip',family:'storage',platform:'macos',door:'web',target:'browser',status:'pass',detail:'Reload preserves all pages'},
 {check:'Permission boundary',family:'security',platform:'linux',door:'api',target:'isolated service',status:'fail',detail:'Expired invitation was accepted'},
 {check:'Installer smoke',family:'setup',platform:'windows',door:'installer',target:'unavailable host',status:'hole',detail:'Windows host not exercised'},
 {check:'Export recovery',family:'recovery',platform:'macos',door:'cli',target:'local fixture',status:'pass',detail:'Interrupted export keeps the last archive'},
 {check:'Sketch upload',family:'sync',platform:'linux',door:'web',target:'browser',status:'known',detail:'Tracked in the current cycle'},
 ]}; json(`results/patrol-${i+1}.json`,run); if(i===0) json('results/latest.json',run);
}
for(const [name,description] of [['tcell-hunter','Reproduces failures through Lantern’s real front doors.'],['negative-selection','Tries to disprove each report independently.'],['memory-cell','Keeps a permanent check for each confirmed bug.']]) write(`cells/${name}.md`,`---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n\n## This project\nRun the Lantern isolated fixture and verify the saved notebook.\n`);
write('findings/expired-invitation.md','# Expired invitations are still accepted\n\nThe permission patrol reproduced an expired invitation being redeemed.\n\n- Expected: reject the invitation.\n- Observed: the guest joins the notebook.\n\nThe machine record is waiting for a human.\n');
write('explorations/offline-notebooks.md','# A notebook without a connection\n\n**Hypotheses:** edits survive reconnecting; sketch uploads stay unique.\n\nThe page edits held. A repeated sketch upload was reproduced and has a permanent guard.\n\nWindows remains a coverage hole, not a passing result.\n');
console.log(`Generated ${rows.length} fictional records, two cycles, commits, issues and patrol fixtures.`);
