import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function demoServer() {
  const app = fileURLToPath(new URL('.', import.meta.url));
  const temp = mkdtempSync(join(tmpdir(), 'soulstack-immune-proof-'));
  cpSync(join(app,'demo'),temp,{recursive:true,preserveTimestamps:true});
  const config = JSON.parse(readFileSync(join(temp,'immune.config.json'),'utf8'));
  for (const key of ['results','findings','explorations','machine','commits','issues']) if (config[key]) config[key] = join(temp,config[key]);
  config.cells = config.cells.map(path => join(temp,path));
  const configPath = join(temp,'immune.config.json');
  writeFileSync(configPath,JSON.stringify(config));
  const child = spawn(process.versions.bun ? "node" : process.execPath,[join(app,'server.mjs'),configPath],{env:{...process.env,IMMUNE_PORT:'0'},stdio:['ignore','pipe','pipe']});
  let output = '';
  child.stderr.on('data',chunk => { output += chunk; });
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const done = new Promise(resolve => child.once('exit',resolve)); child.kill(); await done;
    }
    rmSync(temp,{recursive:true,force:true});
  };
  try {
    const url = await new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error(`Server timeout: ${output}`)),10000);
      child.stdout.on('data',chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if(match) { clearTimeout(timer); resolve(match[0]); } });
      child.once('exit',code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${output}`)); });
    });
    return { url, temp, app, child, stop };
  } catch(error) { await stop(); throw error; }
}
