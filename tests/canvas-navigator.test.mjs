import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasNavigate} from '../server/canvas-navigator.js';
const calls=[];
const client={
 list:async path=>{calls.push(path);if(path.includes('/assignments'))return [{id:7,name:'Essay <b>instructions</b>',description:'<p>Read chapter 2</p>',due_at:'2026-11-12T18:00:00Z'}];return [{id:42,name:'Criminal Justice',course_code:'CCJ 2002',workflow_state:'available'}]},
 get:async path=>{calls.push(path);return {id:7,name:'Essay',description:'<p>Read the rubric</p>',points_possible:20}}
};
test('Canvas API browser lists courses and assignment details using server-side credentials',async()=>{
 const courses=await canvasNavigate(client,{view:'courses'});
 assert.equal(courses.items[0].title,'Criminal Justice');
 const assignments=await canvasNavigate(client,{view:'assignments',courseId:'42'});
 assert.equal(assignments.items[0].description,'Read chapter 2');
 const detail=await canvasNavigate(client,{view:'assignment',courseId:'42',assignmentId:'7'});
 assert.equal(detail.assignment.points,20);
 assert.equal(detail.assignment.description,'Read the rubric');
 assert.ok(calls.every(p=>p.startsWith('/api/v1/')));
});
test('Canvas API browser rejects arbitrary paths and malformed identifiers',async()=>{
 for(const args of [{view:'assignments',courseId:'../../admin'},{view:'assignment',courseId:'42',assignmentId:'7/../../'},{view:'unknown',courseId:'42'}])await assert.rejects(()=>canvasNavigate(client,args));
 await assert.rejects(()=>canvasNavigate(null,{view:'courses'}),/not connected/);
});
