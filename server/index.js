import * as operator from './operator.js';
import http from 'node:http';
import { URL } from 'node:url';
const port=Number(process.env.API_PORT||8787);
const canvasOrigin=process.env.CANVAS_BASE_URL;
const token=process.env.CANVAS_ACCESS_TOKEN;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'http://localhost:5173'});res.end(JSON.stringify(data))};
async function canvas(path){
 const response=await fetch(new URL(path,canvasOrigin),{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Canvas returned '+response.status);
 return response.json();
}
http.createServer(async(req,res)=>{
 if(!req.url.startsWith('/api/'))return json(res,404,{error:'Not found'});
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
   else if(req.url==='/api/operator/close' && req.method==='POST') result={closed:await operator.close(body.id)};
   else return json(res,404,{error:'Unknown operator endpoint'});
   return json(res,200,result);
  }catch(e){return json(res,400,{error:e.message});}
 }
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(req.url==='/api/health')return json(res,200,{configured:!!(canvasOrigin&&token)});
 if(req.url!=='/api/deadlines')return json(res,404,{error:'Not found'});
 if(!canvasOrigin||!token)return json(res,503,{error:'Set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN in your terminal first.'});
 try{
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
  json(res,200,{courses:active.length,assignments,partial:failures>0,failedCourses:failures,checkedAt:new Date().toISOString()});
 }catch(e){json(res,502,{error:'Could not load Canvas data: '+e.message})}
}).listen(port,'127.0.0.1',()=>console.log('Finessers Canvas connector listening on http://localhost:'+port));
