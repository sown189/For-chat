// Canvas API transport: pagination, bounded retries, and same-origin protection.
const RETRYABLE = new Set([429,502,503,504]);
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
export function canvasClient({baseUrl,token,fetchImpl=fetch,sleep=pause,maxPages=10}){
 if(!baseUrl||!token)throw Error('Canvas connection is not configured');
 const base=new URL(baseUrl);
 if(!['https:','http:'].includes(base.protocol))throw Error('Unsupported Canvas protocol');
 const request=async url=>{
  const target=new URL(url,base);
  if(target.origin!==base.origin)throw Error('Canvas request must stay on configured origin');
  for(let attempt=0;attempt<3;attempt++){
   const response=await fetchImpl(target.href,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
   if(response.ok)return response;
   if(RETRYABLE.has(response.status)&&attempt<2){
    const retryAfter=Number(response.headers.get('retry-after'));
    const wait=Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,3000):200*(2**attempt);
    await sleep(wait);
    continue;
   }
   throw Error('Canvas returned '+response.status);
  }
 };
 async function get(path){return (await request(path)).json()}
 async function list(path){
  const collected=[];
  let next=new URL(path,base).href;
  const seen=new Set();
  while(next){
   if(seen.has(next))throw Error('Canvas pagination loop detected');
   if(seen.size>=maxPages)throw Error('Canvas pagination limit exceeded');
   seen.add(next);
   const response=await request(next);
   const items=await response.json();
   if(!Array.isArray(items))throw Error('Canvas list response was not an array');
   collected.push(...items);
   const link=response.headers.get('link')||'';
   next=null;
   for(const part of link.split(',')){
    const match=part.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    if(match){next=new URL(match[1],base).href;break}
   }
   if(next&&new URL(next).origin!==base.origin)throw Error('Canvas pagination attempted to leave configured origin');
  }
  return collected;
 }
 return {get,list};
}
