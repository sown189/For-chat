import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLocalRequest,localApiHeaders} from '../server/local-api-security.js';
test('allows JSON requests from the local Finessers UI',()=>{
 assert.equal(checkLocalRequest({method:'POST',headers:{origin:'http://localhost:5173','content-type':'application/json; charset=utf-8','sec-fetch-site':'same-site'}}),null);
 assert.equal(checkLocalRequest({method:'GET',headers:{origin:'http://127.0.0.1:5173'}}),null);
});
test('blocks cross-site requests, arbitrary origins and form submissions',()=>{
 for(const headers of [
 {origin:'https://evil.example','content-type':'application/json'},
 {'sec-fetch-site':'cross-site','content-type':'application/json'},
 {origin:'http://localhost:5173','content-type':'application/x-www-form-urlencoded'},
 {origin:'http://localhost:5173','content-type':'text/plain'},
 {origin:'http://localhost:5173'}
 ])assert.ok(checkLocalRequest({method:'POST',headers}));
});
test('adds defensive response headers',()=>{
 const headers=localApiHeaders();
 assert.equal(headers['Cache-Control'],'no-store');
 assert.equal(headers['X-Content-Type-Options'],'nosniff');
});
