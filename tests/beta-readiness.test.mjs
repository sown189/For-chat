import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import http from 'node:http';
const listen=s=>new Promise(resolve=>s.listen(0,'127.0.0.1',()=>resolve(s.address().port)));
const close=s=>new Promise(resolve=>s.close(resolve));
test('production API refuses to start without authentication and tenant isolation',{timeout:10000},async()=>{
 const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',FINESSERS_ALLOW_LOCAL_BETA:'false'},stdio:['ignore','pipe','pipe']});
 let output='';
 child.stderr.on('data',chunk=>output+=chunk);
 const exit=await new Promise(resolve=>child.once('exit',resolve));
 assert.notEqual(exit,0);
 assert.match(output,/Public deployment blocked/);
});
test('local health identifies beta-only mode and prevents cross-origin calls',{timeout:15000},async()=>{
 const probe=http.createServer((_,res)=>res.end(''));const port=await listen(probe);await close(probe);
 const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'development',API_PORT:String(port),CANVAS_BASE_URL:'',CANVAS_ACCESS_TOKEN:''},stdio:'ignore'});
 const url='http://127.0.0.1:'+port;
 try{
  let response;
  for(let i=0;i<80;i++){try{response=await fetch(url+'/api/health');if(response.ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  assert.equal(response?.status,200);
  const data=await response.json();
  assert.equal(data.mode,'local-beta');assert.equal(data.publicReady,false);assert.equal(data.authentication,false);
  const denied=await fetch(url+'/api/agent/provider',{method:'POST',headers:{Origin:'https://malicious.example','Content-Type':'application/json'},body:JSON.stringify({provider:'ollama'})});
  assert.equal(denied.status,403);
  const invalid=await fetch(url+'/api/agent/provider',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
  assert.equal(invalid.status,403);
 }finally{child.kill('SIGTERM')}
});
