import http from 'node:http';
import { chromium } from 'playwright';
let browser;
let page;
const respond=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const readBody=async req=>{let body='';for await(const part of req){body+=part;if(body.length>20000)throw Error('Request too large');}return JSON.parse(body)};
http.createServer(async(req,res)=>{
 if(req.url==='/api/agent/health')return respond(res,200,{ready:true,modelConfigured:!!process.env.OPENROUTER_API_KEY});
 if(req.url==='/api/agent/open'&&req.method==='POST'){
  try{const {url}=await readBody(req);const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))return respond(res,400,{error:'Only web addresses are supported.'});browser??=await chromium.launch({headless:false});page??=await browser.newPage();await page.goto(parsed.href,{waitUntil:'domcontentloaded',timeout:20000});return respond(res,200,{url:page.url(),title:await page.title()});}catch(e){return respond(res,500,{error:e.message})}
 }
 if(req.url==='/api/agent/plan'&&req.method==='POST'){
  try{
   const {task}=await readBody(req);
   if(typeof task!=='string'||!task.trim()||task.length>3000)return respond(res,400,{error:'Enter a task under 3000 characters.'});
   if(!process.env.OPENROUTER_API_KEY)return respond(res,503,{error:'AI is not configured. Set OPENROUTER_API_KEY in Terminal before launching Finessers.'});
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
   try{
    const result=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{'Authorization':'Bearer '+process.env.OPENROUTER_API_KEY,'Content-Type':'application/json','HTTP-Referer':'http://localhost:5173','X-Title':'Finessers Local'},body:JSON.stringify({model:process.env.OPENROUTER_MODEL||'openai/gpt-4o-mini',messages:[{role:'system',content:'You are Finessers, a concise student productivity assistant. Given a task, propose a practical plan in 3-6 steps. Do not claim to have browsed, clicked, logged in, or completed actions. State clearly what requires user approval. Never request passwords.'},{role:'user',content:task}],max_tokens:650})});
    const data=await result.json();if(!result.ok)return respond(res,502,{error:data?.error?.message||'AI provider rejected request'});
    return respond(res,200,{plan:data.choices?.[0]?.message?.content||'No response returned.'});
   }finally{clearTimeout(timeout)}
  }catch(e){return respond(res,500,{error:e.name==='AbortError'?'AI request timed out.':e.message||'Request failed'})}
 }
 return respond(res,404,{error:'Agent route not implemented'});
}).listen(8787,'127.0.0.1',()=>console.log('Finessers local API ready at http://127.0.0.1:8787'));
