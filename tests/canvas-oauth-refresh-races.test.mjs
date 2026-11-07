import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvasOAuth} from '../server/canvas-oauth.js';
const base={baseUrl:'https://canvas.example.edu',clientId:'1234'};
test('concurrent token requests share one refresh',async()=>{
 let now=0,requests=0;
 const oauth=createCanvasOAuth({...base,clock:()=>now,fetchImpl:async(_url,opts)=>{
  requests++;
  if(opts.body.get('grant_type')==='authorization_code')return {ok:true,json:async()=>({access_token:'old',refresh_token:'refresh',expires_in:120})};
  await new Promise(resolve=>setTimeout(resolve,10));
  return {ok:true,json:async()=>({access_token:'new',refresh_token:'refresh2',expires_in:3600})};
 }});
 const state=new URL(oauth.start().url).searchParams.get('state');
 await oauth.complete({state,code:'code'});
 now=65000;
 const results=await Promise.all(Array.from({length:8},()=>oauth.getToken()));
 assert.deepEqual(results,Array(8).fill('new'));
 assert.equal(requests,2);
});
test('disconnect during token refresh cannot recreate credentials',async()=>{
 let now=0,release;
 const waiting=new Promise(resolve=>{release=resolve});
 const oauth=createCanvasOAuth({...base,clock:()=>now,fetchImpl:async(_url,opts)=>{
  if(opts.body.get('grant_type')==='authorization_code')return {ok:true,json:async()=>({access_token:'old',refresh_token:'refresh',expires_in:120})};
  await waiting;return {ok:true,json:async()=>({access_token:'new',refresh_token:'refresh2',expires_in:3600})};
 }});
 const state=new URL(oauth.start().url).searchParams.get('state');
 await oauth.complete({state,code:'code'});
 now=65000;
 const pending=oauth.getToken();
 oauth.disconnect();
 release();
 await assert.rejects(pending,/connection changed/);
 assert.equal(oauth.status().connected,false);
 assert.equal(await oauth.getToken(),null);
});
