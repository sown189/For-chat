import { timingSafeEqual } from 'node:crypto';
function equal(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const {BROWSER_WORKER_URL:base,FINNESERS_WORKER_TOKEN:token,FINESSERS_PREVIEW_PASS:pass}=process.env;
 const configured=Boolean(base&&token&&pass&&pass.length>=24);
 if(req.method==='GET')return res.status(200).json({configured});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!configured)return res.status(503).json({error:'Cloud browser is not configured'});
 if(!equal(req.headers.authorization,'Bearer '+pass))return res.status(401).json({error:'Preview access denied'});
 let body=req.body;
 if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({error:'Invalid request'})}}
 const {action,id,url,mode}=body||{};
 if(!['start','status','cancel'].includes(action))return res.status(400).json({error:'Invalid action'});
 if(action==='start'&&(url!=='https://example.com'&&url!=='https://example.com/'||!['assignment_brief','study_material_summary'].includes(mode)))return res.status(400).json({error:'Only example.com and the two read-only presets are enabled in this test'});
 if(action!=='start'&&(typeof id!=='string'||!/^[A-Za-z0-9_-]{20,64}$/.test(id)))return res.status(400).json({error:'Invalid job ID'});
 try{
  const target=new URL('/jobs'+(action==='start'?'':'/'+id),base);
  if(target.protocol!=='https:')throw Error('Invalid worker URL');
  const r=await fetch(target,{method:action==='start'?'POST':action==='cancel'?'DELETE':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:action==='start'?JSON.stringify({url,mode}):undefined,signal:AbortSignal.timeout(10000),redirect:'error'});
  const data=await r.json();
  if(!r.ok)return res.status(r.status).json({error:typeof data.detail==='string'?data.detail:'Browser request failed'});
  return res.status(200).json(data);
 }catch{return res.status(502).json({error:'Cloud browser worker unavailable'})}
}
