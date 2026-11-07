import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasClient} from '../server/canvas-client.js';
const base='https://canvas.example.edu';
const reply=(data,{status=200,link='',retryAfter=''}={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...(link?{Link:link}:{}),...(retryAfter?{'Retry-After':retryAfter}:{})}});
test('follows Canvas Link pagination and preserves auth on each page',async()=>{
 const urls=[];
 const client=canvasClient({baseUrl:base,token:'secret',fetchImpl:async(url,opts)=>{
  urls.push(url);assert.equal(opts.headers.Authorization,'Bearer secret');
  if(url.endsWith('page=2'))return reply([{id:2}]);
  return reply([{id:1}],{link:'<'+base+'/api/v1/courses?page=2>; rel="next"'});
 }});
 assert.deepEqual(await client.list('/api/v1/courses'),[{id:1},{id:2}]);
 assert.equal(urls.length,2);
});
test('retries throttling and transient errors but not authentication errors',async()=>{
 let attempts=0;const sleeps=[];
 const client=canvasClient({baseUrl:base,token:'secret',sleep:async ms=>sleeps.push(ms),fetchImpl:async()=>{
  attempts++;return attempts<3?reply({},{status:attempts===1?429:503}):reply({ok:true});
 }});
 assert.deepEqual(await client.get('/api/v1/courses/1'),{ok:true});
 assert.equal(attempts,3);assert.deepEqual(sleeps,[200,400]);
 let unauthorized=0;
 const denied=canvasClient({baseUrl:base,token:'secret',fetchImpl:async()=>{unauthorized++;return reply({},{status:401})}});
 await assert.rejects(denied.get('/api/v1/courses'),/401/);assert.equal(unauthorized,1);
});
test('rejects off-origin pagination before leaking token',async()=>{
 let calls=0;
 const client=canvasClient({baseUrl:base,token:'secret',fetchImpl:async()=>{calls++;return reply([{id:1}],{link:'<https://evil.example/api/v1/courses>; rel="next"'})}});
 await assert.rejects(client.list('/api/v1/courses'),/configured origin/);assert.equal(calls,1);
 await assert.rejects(client.get('https://evil.example/api/v1/courses'),/configured origin/);assert.equal(calls,1);
});
test('detects pagination loops and malformed list responses',async()=>{
 const loop=canvasClient({baseUrl:base,token:'secret',fetchImpl:async()=>reply([],{link:'<'+base+'/api/v1/courses>; rel="next"'})});
 await assert.rejects(loop.list('/api/v1/courses'),/loop detected/);
 const bad=canvasClient({baseUrl:base,token:'secret',fetchImpl:async()=>reply({not:'an array'})});
 await assert.rejects(bad.list('/api/v1/courses'),/not an array/);
});
