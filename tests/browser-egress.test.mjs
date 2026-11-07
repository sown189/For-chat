import test from 'node:test';
import assert from 'node:assert/strict';
import {checkUrl,verifyPublicUrl,isNonPublicAddress} from '../server/operator.js';
import {canvasClient} from '../server/canvas-client.js';

test('read-only browser blocks private and reserved IPv4 addresses',async()=>{
 for(const address of ['127.0.0.1','10.2.3.4','169.254.169.254','172.16.1.2','192.168.1.1','100.64.0.1','192.0.2.20','203.0.113.5']){
  assert.equal(isNonPublicAddress(address),true,address);
  await assert.rejects(verifyPublicUrl('http://'+address+'/'),/blocked/,address);
 }
 assert.equal(isNonPublicAddress('1.1.1.1'),false);
 assert.equal(await verifyPublicUrl('https://1.1.1.1/'),'https://1.1.1.1/');
});

test('browser rejects private IPv6 and URL-embedded credentials',async()=>{
 for(const address of ['::1','fc00::1','fe80::1','2001:db8::1','::ffff:127.0.0.1'])assert.equal(isNonPublicAddress(address),true,address);
 assert.throws(()=>checkUrl('https://user:pass@example.com/'),/Credentials/);
 assert.throws(()=>checkUrl('file:///etc/passwd'),/HTTP/);
});

test('Canvas bearer tokens require encrypted transport except loopback',async()=>{
 assert.throws(()=>canvasClient({baseUrl:'http://canvas.example.edu',token:'secret'}),/HTTPS/);
 assert.ok(canvasClient({baseUrl:'https://canvas.example.edu',token:'secret'}));
 assert.ok(canvasClient({baseUrl:'http://127.0.0.1:8000',token:'secret'}));
 assert.throws(()=>canvasClient({baseUrl:'https://name:pass@canvas.example.edu',token:'secret'}),/Invalid Canvas API origin/);
});
