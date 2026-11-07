import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvasOAuth} from '../server/canvas-oauth.js';
const config={baseUrl:'https://canvas.example.edu',clientId:'1234'};
test('Canvas OAuth generates state-bound PKCE authorization URL and exchanges code',async()=>{
 let received;
 const oauth=createCanvasOAuth({...config,fetchImpl:async(url,options)=>{received={url:String(url),options};return {ok:true,json:async()=>({access_token:'secret-token',refresh_token:'refresh-token',expires_in:3600})}}});
 const start=oauth.start();const u=new URL(start.url);
 assert.equal(u.origin,'https://canvas.example.edu');
 assert.equal(u.searchParams.get('code_challenge_method'),'S256');
 assert.ok(u.searchParams.get('state'));
 assert.ok(u.searchParams.get('code_challenge'));
 assert.equal(oauth.status().connected,false);
 await oauth.complete({state:u.searchParams.get('state'),code:'test-code'});
 assert.equal(oauth.status().connected,true);
 assert.equal(await oauth.getToken(),'secret-token');
 assert.equal(received.url,'https://canvas.example.edu/login/oauth2/token');
 assert.equal(received.options.body.get('code_verifier')?.length>30,true);
 assert.equal(received.options.body.get('code'),'test-code');
 oauth.disconnect();assert.equal(await oauth.getToken(),null);
});
test('OAuth callback rejects wrong state and cannot reuse the authorization code',async()=>{
 const oauth=createCanvasOAuth({...config,fetchImpl:async()=>{throw Error('must not exchange')}});
 const state=new URL(oauth.start().url).searchParams.get('state');
 await assert.rejects(()=>oauth.complete({state:'wrong',code:'test-code'}),/state mismatch/);
 await assert.rejects(()=>oauth.complete({state,code:'test-code'}),/expired/);
});
test('OAuth rejects insecure remote Canvas and nonlocal callback URLs',()=>{
 assert.throws(()=>createCanvasOAuth({...config,baseUrl:'http://canvas.example.edu'}),/HTTPS/);
 assert.throws(()=>createCanvasOAuth({...config,redirectUri:'https://attacker.example/callback'}),/callback must be local/);
});
test('OAuth refreshes an expired token without exposing refresh token to browser',async()=>{
 let now=0;let count=0;
 const oauth=createCanvasOAuth({...config,clock:()=>now,fetchImpl:async(_url,options)=>{count++;return {ok:true,json:async()=>count===1?{access_token:'first',refresh_token:'refresh',expires_in:120}:{access_token:'second',refresh_token:'refresh2',expires_in:3600}}}});
 const state=new URL(oauth.start().url).searchParams.get('state');
 await oauth.complete({state,code:'code'});
 now=65000;
 assert.equal(await oauth.getToken(),'second');
 assert.equal(count,2);
 assert.equal(oauth.status().accessToken,undefined);
});
