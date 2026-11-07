// Run: npm run doctor. Never prints secrets or requests credentials.
import {chromium} from 'playwright';
const base=process.env.CANVAS_BASE_URL;
const token=process.env.CANVAS_ACCESS_TOKEN;
const checks=[];
function add(name,ok,detail){checks.push({name,ok,detail});}
add('Canvas configuration',!!(base&&token),base&&token?'Configured server-side':'Set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN locally');
if(base&&token){
 try{
  const url=new URL('/api/v1/users/self/profile',base);
  if(!['https:','http:'].includes(url.protocol))throw Error('Unsupported URL protocol');
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
  add('Live Canvas API',response.ok,response.ok?'Authenticated read-only profile request succeeded':'HTTP '+response.status);
 }catch(e){add('Live Canvas API',false,String(e.message||e))}
}
try{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 await page.goto('data:text/html,<title>Finessers browser check</title><h1>Ready</h1>');
 const ready=await page.title()==='Finessers browser check';
 add('Chromium browser',ready,ready?'Playwright browser launched successfully':'Browser observation failed');
 await browser.close();
}catch(e){add('Chromium browser',false,'Playwright Chromium unavailable: '+String(e.message||e).slice(0,150))}
const hasOpenAI=!!process.env.OPENAI_API_KEY;
if(hasOpenAI)add('OpenAI configuration',true,'Key found in environment (not validated)');
else{
 try{
  const response=await fetch((process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434')+'/api/tags',{signal:AbortSignal.timeout(3000)});
  add('Local Ollama model server',response.ok,response.ok?'Ollama reachable':'Ollama HTTP '+response.status);
 }catch{add('AI model',false,'Connect OpenAI in the app or start local Ollama')}
}
add('Public deployment',false,'Blocked until user authentication, tenant isolation, persistence, and live-account testing are complete');
for(const c of checks)console.log((c.ok?'PASS':'BLOCK')+'  '+c.name+' — '+c.detail);
const required=checks.filter(c=>c.name!=='Public deployment');
console.log('\nLocal beta prerequisites: '+required.filter(c=>c.ok).length+'/'+required.length);
if(required.some(c=>!c.ok))process.exitCode=1;
