import test from 'node:test';
import assert from 'node:assert/strict';
import {safeCanvasLink,canvasNavigate} from '../server/canvas-navigator.js';
const base='https://canvas.example.edu';
test('Canvas links are limited to the configured campus origin',()=>{
 assert.equal(safeCanvasLink('/courses/1/assignments/2',base),base+'/courses/1/assignments/2');
 for(const input of ['javascript:alert(1)','https://evil.example/steal','//evil.example/','https://canvas.example.edu.evil.example/','https://user:password@canvas.example.edu/courses/1'])assert.equal(safeCanvasLink(input,base),null,input);
});
test('untrusted assignment hyperlinks cannot escape the campus origin',async()=>{
 const client={get:async()=>({id:3,name:'Homework',html_url:'https://evil.example/redirect',description:'<p>Read this</p>'})};
 const result=await canvasNavigate(client,{view:'assignment',courseId:'1',assignmentId:'3'},{baseUrl:base});
 assert.equal(result.assignment.htmlUrl,null);
 assert.equal(result.assignment.description,'Read this');
});
