const worker='https://browser-worker-preview-c7cff3b1.up.railway.app';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const token=req.headers['x-vercel-oidc-token'];
 if(process.env.VERCEL_ENV!=='preview'||typeof token!=='string')return res.status(503).json({configured:false,error:'Protected cloud preview unavailable'});
 if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 let action='health',id,url,mode;
 if(req.method==='POST'){
  if(req.headers['sec-fetch-site']!=='same-origin'||req.headers.origin!=='https://'+req.headers.host)return res.status(403).json({error:'Open Finessers directly to start a task'});
  let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({error:'Invalid request'})}}
  ({action,id,url,mode}=body||{});
  if(!['start','status','cancel'].includes(action))return res.status(400).json({error:'Invalid action'});
  if(action==='start'){
   if(!['assignment_brief','study_material_summary'].includes(mode))return res.status(400).json({error:'Choose one of the two read-only tasks'});
   let parsed;try{parsed=new URL(String(url).trim())}catch{return res.status(400).json({error:'Test URL must be https://example.com/'})}
   if(parsed.origin!=='https://example.com'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)return res.status(400).json({error:'Only the fixed test page https://example.com/ is supported'});
   url='https://example.com/';
  }
  if(action!=='start'&&(typeof id!=='string'||!/^[A-Za-z0-9_-]{20,64}$/.test(id)))return res.status(400).json({error:'Invalid job ID'});
 }
 try{
  const target=worker+(action==='health'?'/health':'/jobs'+(action==='start'?'':'/'+id));
  const r=await fetch(target,{method:action==='start'?'POST':action==='cancel'?'DELETE':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:action==='start'?JSON.stringify({url,mode}):undefined,signal:AbortSignal.timeout(15000),redirect:'error'});
  const data=await r.json();
  if(action==='health')return res.status(200).json({configured:r.ok&&data.ready===true,workerStatus:r.status});
  if(!r.ok)return res.status(r.status).json({error:typeof data.detail==='string'?data.detail:'Browser request failed'});
  return res.status(200).json(data);
 }catch{return res.status(502).json({configured:false,error:'Cloud browser worker unavailable'})}
}
