import test from 'node:test';
import assert from 'node:assert/strict';
import {assertReadOnlyRequest} from '../server/computer.js';
test('computer-use beta blocks write methods, private addresses and unsafe schemes',()=>{
 assert.equal(assertReadOnlyRequest('https://canvas.example.edu/courses/1','GET'),true);
 assert.equal(assertReadOnlyRequest('https://canvas.example.edu/courses/1','HEAD'),true);
 for(const method of ['POST','PUT','PATCH','DELETE'])assert.throws(()=>assertReadOnlyRequest('https://canvas.example.edu/submit',method),/Write requests are blocked/);
 for(const url of ['http://127.0.0.1:8787/api/health','http://169.254.169.254/latest/meta-data/','file:///etc/passwd'])assert.throws(()=>assertReadOnlyRequest(url,'GET'));
});
