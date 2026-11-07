import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import {checkUrl} from './operator.js';

const jobs=new Map();
const W=1280,H=800;
const MAX_JOBS=3;
const JOB_TTL_MS=20*60*1000;
const MAX_ACTIONS=40;
const READ_ONLY_METHODS=new Set(['GET','HEAD']);
function assertReadOnlyRequest(url,method){safeUrl(url);if(!READ_ONLY_METHODS.has(String(method).toUpperCase()))throw Error('Write requests are blocked in read-only beta');return true;}
async function pruneJobs(){const now=Date.now();await Promise.all([...jobs].filter(([,job])=>now-job.createdAt>JOB_TTL_MS).map(async([id,job])=>{jobs.delete(id);job.state='stopped';await job.browser.close().catch(()=>{})}));}
const ollamaUrl=process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434';
const visionModel=process.env.OLLAMA_VISION_MODEL||'qwen2.5vl:7b';
const safeUrl=checkUrl;
const snapshot=async job=>'data:image/png;base64,'+(await job.page.screenshot({type:'png'})).toString('base64');
const view=job=>({id:job.id,state:job.state,screen:job.screen,steps:job.steps.slice(-25),pending:job.pending?{action:job.pending.action}:null,summary:job.summary,error:job.error});
async function callLocal(job){
 const image=(await job.page.screenshot({type:'jpeg',quality:75})).toString('base64');
 const instructions='You operate a browser based on a screenshot. Goal: '+job.task+'. Recent actions: '+JSON.stringify(job.steps.slice(-8))+'. Return ONLY one JSON object with keys type, x, y, text, scroll_y, keys, summary. type must be click, double_click, scroll, type, keypress, screenshot, or done. Coordinates are pixels on a 1280x800 screen. For type done include a concise summary. Do not submit forms, purchase, send messages or change settings. If login or CAPTCHA is required, choose done and explain.';
 const r=await fetch(ollamaUrl+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:visionModel,stream:false,format:'json',messages:[{role:'user',content:instructions,images:[image]}]}),signal:AbortSignal.timeout(120000)});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Ollama vision request failed. Install the vision model with: ollama pull '+visionModel);
 let a;try{a=JSON.parse(d.message?.content||'')}catch{throw Error('Local vision model returned invalid JSON')}
 if(a.type==='done'){job.state='completed';job.summary=String(a.summary||'Task complete');job.screen=await snapshot(job);return view(job)}
 if(!['click','double_click','scroll','type','keypress','screenshot'].includes(a.type))throw Error('Local vision model proposed unsupported action: '+a.type);
 job.pending={action:a,callId:null,checks:[]};job.state='awaiting-approval';job.screen=await snapshot(job);return view(job);
}
async function callOpenAI(job,input,previous_response_id){
 const body={model:'computer-use-preview',tools:[{type:'computer_use_preview',display_width:W,display_height:H,environment:'browser'}],input,truncation:'auto'};
 if(previous_response_id)body.previous_response_id=previous_response_id;
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+job.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
 const d=await r.json();if(!r.ok)throw Error(d.error?.message||'OpenAI computer-use request failed');return d;
}
function validateComputerAction(a){
 if(!a||typeof a!=='object'||!['click','double_click','scroll','type','keypress','move','drag','screenshot'].includes(a.type))throw Error('Unsupported computer action');
 if(['click','double_click','move'].includes(a.type)){
  if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.x<0||a.y<0||a.x>=W||a.y>=H)throw Error('Computer action coordinates outside the browser');
 }
 if(a.type==='click'&&!['left',undefined].includes(a.button))throw Error('Only left clicks are supported');
 if(a.type==='scroll'&&(!Number.isFinite(Number(a.scroll_y||0))||Math.abs(Number(a.scroll_y||0))>1500||!Number.isFinite(Number(a.scroll_x||0))||Math.abs(Number(a.scroll_x||0))>1500))throw Error('Scroll amount exceeds safe limit');
 if(a.type==='type'&&(typeof a.text!=='string'||a.text.length>3000))throw Error('Invalid typed text');
 if(a.type==='keypress'){
  if(!Array.isArray(a.keys)||a.keys.length<1||a.keys.length>4||a.keys.some(k=>typeof k!=='string'||!(/^(?:ARROWUP|ARROWDOWN|ARROWLEFT|ARROWRIGHT|TAB|ESC|ESCAPE|BACKSPACE|DELETE|HOME|END|PAGEUP|PAGEDOWN|CTRL|META|SHIFT|ALT|[A-Z0-9])$/i).test(k)))throw Error('Unsupported keyboard shortcut');
  if(a.keys.some(k=>/^(ENTER|RETURN)$/i.test(k)))throw Error('Enter key is blocked in read-only beta');
 }
 if(a.type==='drag'){
  if(!Array.isArray(a.path)||a.path.length<2||a.path.length>30||a.path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>=W||p.y>=H))throw Error('Invalid drag path');
 }
 return a;
}
async function execute(job,a){
 validateComputerAction(a);
 if(job.steps.length>=MAX_ACTIONS)throw Error('Maximum approved actions reached; start a new task');
 const p=job.page;switch(a.type){
 case 'click':await p.mouse.click(a.x,a.y,{button:a.button||'left'});break;
 case 'double_click':await p.mouse.dblclick(a.x,a.y);break;
 case 'scroll':await p.mouse.wheel(a.scroll_x||0,a.scroll_y||0);break;
 case 'type':await p.keyboard.type(String(a.text||'').slice(0,3000));break;
 case 'keypress':for(const k of a.keys||[])await p.keyboard.press(k==='META'?'Meta':k==='CTRL'?'Control':k);break;
 case 'move':await p.mouse.move(a.x,a.y);break;
 case 'drag':if(!Array.isArray(a.path)||!a.path.length)throw Error('Invalid drag');await p.mouse.move(a.path[0].x,a.path[0].y);await p.mouse.down();for(const q of a.path.slice(1))await p.mouse.move(q.x,q.y);await p.mouse.up();break;
 case 'screenshot':break;
 default:throw Error('Unsupported computer action: '+a.type);
 }
 const url=p.url();if(url!=='about:blank')safeUrl(url);
 await p.waitForTimeout(400);
}
async function advance(job,reply){
 if(job.state==='stopped')return view(job);
 try{
  job.state='running';
  if(job.mode==='local')return await callLocal(job);
  const d=await callOpenAI(job,reply,job.responseId);
  job.responseId=d.id;
  const action=d.output?.find(x=>x.type==='computer_call');
  if(!action){job.state='completed';job.summary=d.output_text||d.output?.filter(x=>x.type==='message').flatMap(x=>x.content||[]).map(x=>x.text||'').join('\n')||'Task finished';job.screen=await snapshot(job);return view(job)}
  job.screen=await snapshot(job);
  job.pending={callId:action.call_id,action:action.action,checks:action.pending_safety_checks||[]};
  job.state='awaiting-approval';
  return view(job);
 }catch(e){job.state='error';job.error=e.message;return view(job)}
}
async function start(task,key,mode='openai'){
 if(typeof task!=='string'||!task.trim()||task.length>2000)throw Error('Enter a task under 2000 characters');
 if(mode!=='local'&&!key)throw Error('Connect an OpenAI API key in AI Settings first');
 await pruneJobs();
 if(jobs.size>=MAX_JOBS)throw Error('Close an existing computer session first');
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:W,height:H},acceptDownloads:false});
  await context.route('**/*',async route=>{try{assertReadOnlyRequest(route.request().url(),route.request().method());await route.continue()}catch{await route.abort()}});
  const page=await context.newPage();
  page.on('popup',popup=>popup.close().catch(()=>{}));
  await page.goto('https://www.google.com/',{waitUntil:'domcontentloaded',timeout:20000});
  const job={id:randomUUID(),key,mode,task,browser,page,createdAt:Date.now(),stepping:false,state:'running',screen:null,steps:[],pending:null,responseId:null,summary:null,error:null};
  jobs.set(job.id,job);job.screen=await snapshot(job);
  return advance(job,[{role:'user',content:'Use the browser to accomplish this request: '+task+'. You may navigate to public websites. Do not purchase, submit forms, send messages, change account settings, or perform irreversible actions without explicit user confirmation. If a website requires login, ask the user to take over rather than requesting passwords.'}]);
 }catch(e){await browser.close();throw e}
}
async function step(id,approve){
 await pruneJobs();
 const job=jobs.get(id);if(!job)throw Error('Session not found');
 if(job.stepping)throw Error('An action is already in progress');
 if(job.state!=='awaiting-approval'||!job.pending)throw Error('No pending action');
 if(!approve){
  job.state='stopped';job.pending=null;
  const result=view(job);
  jobs.delete(id);
  await job.browser.close().catch(()=>{});
  return result;
 }
 job.stepping=true;
 const pending=job.pending;job.pending=null;
 try{
  await execute(job,pending.action);job.steps.push({label:pending.action.type,detail:pending.action.text?.slice(0,80)||''});
  job.screen=await snapshot(job);
  if(job.mode==='local')return advance(job,null);
  return advance(job,[{type:'computer_call_output',call_id:pending.callId,output:{type:'computer_screenshot',image_url:job.screen},acknowledged_safety_checks:pending.checks.map(x=>({id:x.id,code:x.code,message:x.message}))}]);
 }catch(e){job.state='error';job.error=e.message;return view(job)}finally{job.stepping=false}
}
async function status(id){await pruneJobs();const job=jobs.get(id);if(!job)throw Error('Session not found');job.screen=await snapshot(job);return view(job)}
async function stop(id){await pruneJobs();const job=jobs.get(id);if(!job)return {id,state:'stopped'};job.state='stopped';job.pending=null;jobs.delete(id);await job.browser.close().catch(()=>{});return {id,state:'stopped'}}
export {start,step,status,stop,assertReadOnlyRequest,validateComputerAction};
