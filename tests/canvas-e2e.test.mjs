import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
const close=server=>new Promise(resolve=>server.close(resolve));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Canvas API -> upcoming assignment -> requirements -> study guidance (mock account)',{timeout:30000},async()=>{
 const deadline=new Date(Date.now()+2*86400000).toISOString();
 const observed=[];
 const canvas=http.createServer((req,res)=>{
  observed.push({url:req.url,auth:req.headers.authorization});
  res.setHeader('Content-Type','application/json');
  if(req.headers.authorization!=='Bearer local-e2e-token'){res.writeHead(401);res.end('{}');return}
  if(req.url.startsWith('/api/v1/courses?'))return res.end(JSON.stringify([{id:12,name:'Criminal Justice',workflow_state:'available'}]));
  if(req.url.startsWith('/api/v1/courses/12/assignments?'))return res.end(JSON.stringify([{id:34,name:'Case brief',due_at:deadline,html_url:'https://canvas.example/courses/12/assignments/34'}]));
  if(req.url==='/api/v1/courses/12/assignments/34')return res.end(JSON.stringify({id:34,name:'Case brief',description:'<p>Read the assigned court opinion and explain the majority holding.</p><p>Identify the legal issue and cite two supporting passages.</p>',html_url:'https://canvas.example/courses/12/assignments/34'}));
  res.writeHead(404);res.end('{}');
 });
 const canvasPort=await listen(canvas);
 const probe=http.createServer((_,res)=>res.end(''));const apiPort=await listen(probe);await close(probe);
 const child=spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,API_PORT:String(apiPort),CANVAS_BASE_URL:'http://127.0.0.1:'+canvasPort,CANVAS_ACCESS_TOKEN:'local-e2e-token'},stdio:'ignore'});
 try{
  let ready=false;
  for(let i=0;i<60;i++){if(child.exitCode!==null)break;try{const r=await fetch('http://127.0.0.1:'+apiPort+'/api/health');if(r.ok){ready=true;break}}catch{}await wait(150)}
  assert.equal(ready,true,'Finessers API started');
  const response=await fetch('http://127.0.0.1:'+apiPort+'/api/course-investigation');
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.mission.totalUpcoming,1);
  assert.equal(result.investigations.length,1);
  assert.equal(result.reviewed,1);
  const guide=result.investigations[0].guide;
  assert.match(guide.requirements.join(' '),/majority holding/);
  assert.match(guide.requirements.join(' '),/two supporting passages/);
  assert.match(guide.nextAction,/Review these assignment requirements/);
  assert.equal(guide.sourceUrl,'https://canvas.example/courses/12/assignments/34');
  assert.equal(result.mode,'read-only');
  assert.equal(observed.length,3);
  assert.ok(observed.every(x=>x.auth==='Bearer local-e2e-token'));
 }finally{child.kill('SIGTERM');await close(canvas)}
});
