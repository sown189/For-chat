import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCanvasSource} from '../server/canvas-source.js';
const base='https://canvas.fau.edu';
test('allows only a verified assignment on the configured Canvas origin',()=>{
 assert.equal(validateCanvasSource('https://canvas.fau.edu/courses/123/assignments/456',base),'https://canvas.fau.edu/courses/123/assignments/456');
});
test('rejects other origins, credential URLs, redirects and non-assignment pages',()=>{
 for(const url of [
 'https://canvas.fau.edu.evil.test/courses/123/assignments/456',
 'https://evil.test/courses/123/assignments/456',
 'http://canvas.fau.edu/courses/123/assignments/456',
 'https://canvas.fau.edu/login',
 'https://canvas.fau.edu/courses/123/assignments/456?next=https://evil.test',
 'https://user:pass@canvas.fau.edu/courses/123/assignments/456',
 'https://canvas.fau.edu/courses/123/assignments/456#unsafe'
 ])assert.throws(()=>validateCanvasSource(url,base),undefined,url);
});
