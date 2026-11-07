import test from 'node:test';
import assert from 'node:assert/strict';
import {checkUrl} from '../server/operator.js';
test('operator blocks private targets and non-web schemes',()=>{
 for(const url of ['http://127.0.0.1:8787','http://localhost','http://10.0.0.1','http://192.168.1.1','http://172.16.0.1','http://169.254.169.254','http://[::1]','file:///etc/passwd','javascript:alert(1)','http://user:pass@example.com','http://server.internal']){
  assert.throws(()=>checkUrl(url),undefined,url);
 }
});
test('operator permits public HTTPS Canvas URLs',()=>{
 assert.equal(checkUrl('https://canvas.example.edu/courses/123/assignments/456'),'https://canvas.example.edu/courses/123/assignments/456');
});
