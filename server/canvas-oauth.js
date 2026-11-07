import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const BASE='http://127.0.0.1:8787';
const WINDOW_MS=10*60*1000;
const tokenMaxMs=24*60*60*1000;
const safeBase=raw=>{const u=new URL(raw);if(u.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(u.hostname)&&u.protocol==='http:'))throw Error('Canvas OAuth requires HTTPS');if(u.username||u.password||u.search||u.hash)throw Error('Invalid Canvas origin');return u.origin};
const encode=b=>b.toString('base64url');
export function createCanvasOAuth({baseUrl,clientId,clientSecret,redirectUri=BASE+'/api/canvas/oauth/callback',fetchImpl=fetch,clock=()=>Date.now()}){
 const origin=safeBase(baseUrl);
 if(!/^\d+$/.test(String(clientId||'')))throw Error('Canvas OAuth client ID is required');
 const callback=new URL(redirectUri);
 if(callback.protocol!=='http:'||!['127.0.0.1','localhost'].includes(callback.hostname)||callback.pathname!=='/api/canvas/oauth/callback')throw Error('Canvas OAuth callback must be local');
 let pending=null,token=null;
 const start=()=>{
  const state=encode(randomBytes(32)),verifier=encode(randomBytes(48));
  pending={state,verifier,created:clock()};
  const u=new URL('/login/oauth2/auth',origin);
  u.searchParams.set('client_id',String(clientId));
  u.searchParams.set('response_type','code');
  u.searchParams.set('redirect_uri',callback.href);
  u.searchParams.set('state',state);
  u.searchParams.set('code_challenge',encode(createHash('sha256').update(verifier).digest()));
  u.searchParams.set('code_challenge_method','S256');
  return {url:u.href,expiresInSeconds:600};
 };
 const complete=async({state,code})=>{
  const p=pending;pending=null;
  if(!p||clock()-p.created>WINDOW_MS)throw Error('Canvas login expired; start again');
  const received=Buffer.from(String(state||''));
  const expected=Buffer.from(p.state);
  if(received.length!==expected.length||!timingSafeEqual(received,expected))throw Error('Canvas login state mismatch');
  if(typeof code!=='string'||!code||code.length>2048)throw Error('Missing Canvas authorization code');
  const body=new URLSearchParams({grant_type:'authorization_code',client_id:String(clientId),code,redirect_uri:callback.href,code_verifier:p.verifier});
  if(clientSecret)body.set('client_secret',clientSecret);
  const response=await fetchImpl(new URL('/login/oauth2/token',origin),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Canvas token exchange failed ('+response.status+')');
  const result=await response.json();
  if(typeof result.access_token!=='string'||!result.access_token)throw Error('Canvas did not return an access token');
  token={accessToken:result.access_token,refreshToken:typeof result.refresh_token==='string'?result.refresh_token:null,expiresAt:clock()+Math.min(Number(result.expires_in)||86400,86400)*1000};
  return {connected:true};
 };
 const getToken=async()=>{
  if(!token)return null;
  if(token.expiresAt>clock()+60000)return token.accessToken;
  if(!token.refreshToken){token=null;return null}
  const body=new URLSearchParams({grant_type:'refresh_token',client_id:String(clientId),refresh_token:token.refreshToken});
  if(clientSecret)body.set('client_secret',clientSecret);
  const response=await fetchImpl(new URL('/login/oauth2/token',origin),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok){token=null;throw Error('Canvas session expired; reconnect Canvas')}
  const data=await response.json();
  if(typeof data.access_token!=='string'||!data.access_token){token=null;throw Error('Canvas refresh failed')}
  token={accessToken:data.access_token,refreshToken:data.refresh_token||token.refreshToken,expiresAt:clock()+Math.min(Number(data.expires_in)||86400,86400)*1000};
  return token.accessToken;
 };
 return {origin,start,complete,getToken,disconnect:()=>{pending=null;token=null},status:()=>({connected:!!token,expiresAt:token?.expiresAt||null})};
}
