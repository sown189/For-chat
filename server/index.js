import {buildCourseMission} from './course-mission.js';
import * as operator from './operator.js';
import * as computer from './computer.js';
import http from 'node:http';
import { URL } from 'node:url';
const port=Number(process.env.API_PORT||8787);
let openaiKey='';
let provider='openai';
const ollamaUrl=process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434';
const ollamaModel=process.env.OLLAMA_MODEL||'qwen3:4b';
const canvasOrigin=process.env.CANVAS_BASE_URL;
const token=process.env.CANVAS_ACCESS_TOKEN;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'http://localhost:5173'});res.end(JSON.stringify(data))};
async function canvas(path){
 const response=await fetch(new URL(path,canvasOrigin),{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Canvas returned '+response.status);
 return response.json();
}
async function loadCanvasDeadlines(){
  const courses=await canvas('/api/v1/courses?enrollment_state=active&per_page=100');
  const active=Array.isArray(courses)?courses.filter(c=>c.id&&c.workflow_state!=='deleted'): [];
  const results=await Promise.allSettled(active.slice(0,30).map(async course=>{
   const assignments=await canvas('/api/v1/courses/'+encodeURIComponent(course.id)+'/assignments?bucket=upcoming&per_page=100');
   return (Array.isArray(assignments)?assignments:[]).filter(a=>a.due_at).map(a=>({
    id:String(course.id)+'-'+String(a.id),course:course.name||course.course_code||'Course',
    title:a.name||'Untitled assignment',dueAt:a.due_at,url:a.html_url||null,
    points:a.points_possible??null
   }));
  }));
  const assignments=results.flatMap(r=>r.status==='fulfilled'?r.value:[]).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt));
  const failures=results.filter(r=>r.status==='rejected').length;
  return {courses:active.length,assignments,partial:failures>0,failedCourses:failures,checkedAt:new Date().toISOString()};
 
}
http.createServer(async(req,res)=>{
 if(!req.url.startsWith('/api/'))return json(res,404,{error:'Not found'});
 if(req.url.startsWith('/api/computer/')) {
  try{
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000)throw Error('Request too large')}
   const body=JSON.parse(raw||'{}');
   let result;
   if(req.url==='/api/computer/start'&&req.method==='POST')result=await computer.start(body.task,openaiKey,body.mode==='local'?'local':'openai');
   else if(req.url==='/api/computer/step'&&req.method==='POST')result=await computer.step(body.id,body.approve===true);
   else if(req.url==='/api/computer/status'&&req.method==='POST')result=await computer.status(body.id);
   else if(req.url==='/api/computer/stop'&&req.method==='POST')result=await computer.stop(body.id);
   else return json(res,404,{error:'Unknown computer endpoint'});
   return json(res,200,result);
  }catch(e){return json(res,400,{error:e.message})}
 }
 if(req.url.startsWith('/api/operator/')) {
  try {
   const body = await new Promise((resolve,reject)=>{
    if(req.method==='GET') return resolve({});
    let raw='';
    req.on('data',chunk=>{raw+=chunk;if(raw.length>10000){reject(Error('Request too large'));req.destroy();}});
    req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch{reject(Error('Invalid JSON'));}});
    req.on('error',reject);
   });
   let result;
   if(req.url==='/api/operator/start' && req.method==='POST') result=await operator.createSession(body.url);
   else if(req.url==='/api/operator/observe' && req.method==='POST') result=await operator.observe(body.id);
   else if(req.url==='/api/operator/act' && req.method==='POST') result=await operator.act(body.id,body.action);
   else if(req.url==='/api/operator/screenshot' && req.method==='POST') result=await operator.screenshot(body.id);
   else if(req.url==='/api/operator/close' && req.method==='POST') result={closed:await operator.close(body.id)};
   else return json(res,404,{error:'Unknown operator endpoint'});
   return json(res,200,result);
  }catch(e){return json(res,400,{error:e.message});}
 }
 if(req.url.startsWith('/api/agent/')) {
  try {
   const chunks=[];for await(const chunk of req){chunks.push(chunk);if(Buffer.concat(chunks).length>100000)throw Error('Request too large')}
   const body=JSON.parse(Buffer.concat(chunks).toString()||'{}');
   if(req.url==='/api/agent/health')return json(res,200,{ready:true,provider,modelConfigured:provider==='ollama'||!!openaiKey,computerConfigured:!!openaiKey,ollamaModel});
   if(req.url==='/api/agent/diagnostics')return json(res,200,{backend:'online',provider,openaiConnected:!!openaiKey,computerRoute:true,ollamaModel,version:'2026-11-06'});
   if(req.url==='/api/agent/provider'&&req.method==='POST'){
    if(!['openai','ollama'].includes(body.provider))return json(res,400,{error:'Choose OpenAI or Ollama'});
    provider=body.provider;return json(res,200,{provider,modelConfigured:provider==='ollama'||!!openaiKey});
   }
   if(req.url==='/api/agent/provider-key'&&req.method==='DELETE'){openaiKey='';return json(res,200,{ok:true})}
   if(req.url==='/api/agent/provider-key'&&req.method==='POST'){
    if(body.provider!=='openai'||typeof body.key!=='string'||!body.key.startsWith('sk-'))return json(res,400,{error:'Enter a valid OpenAI API key'});
    const check=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+body.key},signal:AbortSignal.timeout(15000)});
    if(!check.ok)return json(res,400,{error:'OpenAI rejected this key ('+check.status+'). Check your API access and billing.'});
    openaiKey=body.key;return json(res,200,{ok:true,modelConfigured:true});
   }
   if(req.url==='/api/agent/plan'&&req.method==='POST'){
    if(provider==='openai'&&!openaiKey)return json(res,400,{error:'Connect your OpenAI API key in AI settings first.'});
    const messages=[{role:'system',content:'You are Finessers, a clear and helpful student study assistant. Do not claim to control the browser.'},...(Array.isArray(body.history)?body.history.slice(-12).filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,6000)})):[]),{role:'user',content:String(body.task||'').slice(0,6000)}];
    const response=await fetch(provider==='ollama'?ollamaUrl+'/api/chat':'https://api.openai.com/v1/chat/completions',{method:'POST',headers:provider==='ollama'?{'Content-Type':'application/json'}:{Authorization:'Bearer '+openaiKey,'Content-Type':'application/json'},body:JSON.stringify(provider==='ollama'?{model:ollamaModel,messages,stream:false}:{model:'gpt-4.1-mini',messages}),signal:AbortSignal.timeout(90000)});
    const data=await response.json();
    if(!response.ok)return json(res,502,{error:data.error?.message||'OpenAI request failed'});
    return json(res,200,{plan:provider==='ollama'?(data.message?.content||'No response received'):(data.choices?.[0]?.message?.content||'No response received')});
   }
   return json(res,404,{error:'Unsupported AI route: '+req.url+'. Use Workspace → AI Operator for computer use.'});
  }catch(e){return json(res,500,{error:e.message})}
 }
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(req.url==='/api/health')return json(res,200,{configured:!!(canvasOrigin&&token)});
 if(req.url!=='/api/deadlines'&&req.url!=='/api/course-mission')return json(res,404,{error:'Not found'});
 if(!canvasOrigin||!token)return json(res,503,{error:'Set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN in your terminal first.'});
 try{
  const data=await loadCanvasDeadlines();
  if(req.url==='/api/course-mission')return json(res,200,{...buildCourseMission(data.assignments),canvas:{courses:data.courses,partial:data.partial,failedCourses:data.failedCourses,checkedAt:data.checkedAt}});
  return json(res,200,data);
 }catch(e){return json(res,502,{error:'Could not load Canvas data: '+e.message})}
}).listen(port,'127.0.0.1',()=>console.log('Finessers Canvas connector listening on http://localhost:'+port));
