import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
const listen=s=>new Promise(resolve=>s.listen(0,'127.0.0.1',()=>resolve(s.address().port)));
const close=s=>new Promise(resolve=>s.close(resolve));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('full HTTP agent connects Canvas investigation to tutor reasoning (simulated providers)',{timeout:30000},async()=>{
 const due=new Date(Date.now()+86400000).toISOString();
 const canvas=http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  if(req.headers.authorization!=='Bearer test-token'){res.writeHead(401);return res.end('{}')}
  if(req.url.startsWith('/api/v1/courses?'))return res.end(JSON.stringify([{id:2,name:'World Geography'}]));
  if(req.url.startsWith('/api/v1/courses/2/assignments?'))return res.end(JSON.stringify([{id:3,name:'Regional geography quiz',due_at:due,html_url:'https://canvas.example/courses/2/assignments/3'}]));
  if(req.url==='/api/v1/courses/2/assignments/3')return res.end(JSON.stringify({id:3,name:'Regional geography quiz',description:'<p>Compare population distribution in two regions and explain migration patterns.</p>',html_url:'https://canvas.example/courses/2/assignments/3'}));
  res.writeHead(404);res.end('{}');
 });
 let tutorInput='';
 const model=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  tutorInput=raw;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:{content:'Study population distribution, then practice explaining migration patterns.'}}));
 });
 const canvasPort=await listen(canvas),modelPort=await listen(model);
 const probe=http.createServer((_,res)=>res.end(''));const port=await listen(probe);await close(probe);
 const child=spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,API_PORT:String(port),CANVAS_BASE_URL:'http://127.0.0.1:'+canvasPort,CANVAS_ACCESS_TOKEN:'test-token',OLLAMA_BASE_URL:'http://127.0.0.1:'+modelPort},stdio:'ignore'});
 try{
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:'+port+'/api/health')).ok){ready=true;break}}catch{}await delay(100)}
  assert.equal(ready,true);
  const api='http://127.0.0.1:'+port;
  const post=async(path,body)=>{const r=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json()};
  const verification=await (await fetch(api+'/api/canvas/verify')).json();
  assert.equal(verification.connected,true);
  assert.equal(verification.courses,1);
  assert.equal(verification.upcomingAssignments,1);
  await post('/api/agent/provider',{provider:'ollama'});
  const session=await post('/api/academic-agent/run',{goal:'Help me prepare for my upcoming geography quiz'});
  assert.equal(session.state,'awaiting-approval');
  assert.equal(session.report.reviewed,1);
  assert.match(session.answer,/migration patterns/);
  assert.match(tutorInput,/population distribution/);
  const declined=await post('/api/academic-agent/approve',{id:session.id,approved:false});
  assert.equal(declined.state,'completed');
  assert.ok(declined.events.some(e=>e.type==='declined'));
 }finally{child.kill('SIGTERM');await close(canvas);await close(model)}
});
