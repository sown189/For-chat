const upstream='https://finessers-upstream-ui-preview.up.railway.app';
const origin='https://finessers-beta-git-finessers-native-browser-ui-jabe2.vercel.app';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const token=req.headers['x-vercel-oidc-token'];
 if(process.env.VERCEL_ENV!=='preview'||typeof token!=='string')return res.status(503).json({error:'Private preview unavailable'});
 if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(req.method==='POST'&&(req.headers.origin!=='https://'+req.headers.host||req.headers['sec-fetch-site']!=='same-origin'))return res.status(403).json({error:'Open Finessers directly'});
 try{
 const r=await fetch(upstream+(req.method==='POST'?'/issue':'/health'),{method:req.method,headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000),redirect:'error'});
 const d=await r.json();
 if(!r.ok)return res.status(r.status).json({error:'Native browser service unavailable'});
 if(req.method==='POST')return res.json({ticket:d.ticket,launch:upstream+'/launch'});
 return res.json({configured:d.ready===true});
 }catch{return res.status(502).json({error:'Browser service not ready'})}
}
