import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

async function freePort() {
  const server=net.createServer();
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
async function waitForServer(url,child) {
  for(let i=0;i<60;i++) {
    if(child.exitCode!==null)throw Error('API process exited early: '+child.exitCode);
    try { const response=await fetch(url); if(response.ok)return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error('API did not become ready');
}
test('Round 3: current backend starts and exposes working API routes',async t=>{
  const port=await freePort();
  const child=spawn(process.execPath,['server/index.js'],{
    cwd:process.cwd(),env:{...process.env,API_PORT:String(port),CANVAS_BASE_URL:'',CANVAS_ACCESS_TOKEN:''},stdio:'pipe'
  });
  let logs='';
  child.stderr.on('data',data=>{logs+=data.toString()});
  t.after(async()=>{
    if(child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve))}
  });
  const base='http://127.0.0.1:'+port;
  await waitForServer(base+'/api/agent/health',child).catch(e=>{throw Error(e.message+' '+logs)});
  const health=await (await fetch(base+'/api/agent/health')).json();
  assert.equal(health.ready,true);
  const diagnostics=await (await fetch(base+'/api/agent/diagnostics')).json();
  assert.equal(diagnostics.backend,'online');
  assert.equal(diagnostics.computerRoute,true);
  const missing=await fetch(base+'/api/agent/does-not-exist');
  assert.equal(missing.status,404);
  const badProvider=await fetch(base+'/api/agent/provider',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'invalid'})
  });
  assert.equal(badProvider.status,400);
  const setLocal=await fetch(base+'/api/agent/provider',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'ollama'})
  });
  assert.equal(setLocal.status,200);
  assert.equal((await setLocal.json()).provider,'ollama');
  const invalidComputer=await fetch(base+'/api/computer/status',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'not-a-session'})
  });
  assert.equal(invalidComputer.status,400);
  assert.match((await invalidComputer.json()).error,/Session not found/);
  const canvas=await fetch(base+'/api/deadlines');
  assert.equal(canvas.status,503);
});
