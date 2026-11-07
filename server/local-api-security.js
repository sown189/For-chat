// Local development API protection. Not a substitute for user authentication on a public server.
const allowedOrigins=new Set(['http://localhost:5173','http://127.0.0.1:5173']);
export function checkLocalRequest({method='GET',headers={}}){
 const origin=headers.origin;
 const fetchSite=headers['sec-fetch-site'];
 if(fetchSite==='cross-site')return 'Cross-site API requests are blocked';
 if(origin&&!allowedOrigins.has(origin))return 'Untrusted browser origin';
 if(!['GET','HEAD','OPTIONS'].includes(method.toUpperCase())){
  const type=String(headers['content-type']||'').split(';')[0].trim().toLowerCase();
  if(type!=='application/json')return 'JSON content type required';
 }
 return null;
}
export function localApiHeaders(){
 return {'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
}
