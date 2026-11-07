import test from 'node:test';
import assert from 'node:assert/strict';
import {investigateCourseMission} from '../server/course-investigation.js';
const now=new Date('2026-11-07T12:00:00Z');
test('investigates five prioritized assignments without writes',async()=>{
 const items=Array.from({length:7},(_,i)=>({id:'4-'+(i+1),title:'Task '+(i+1),course:'Law',dueAt:new Date(now.getTime()+(i+1)*86400000).toISOString()}));
 const calls=[];
 const result=await investigateCourseMission(items,async(course,id)=>{calls.push(course+'/'+id);return {id,name:'Task '+id,description:'Read the case and explain the court holding.'}},{now});
 assert.equal(result.investigations.length,5);
 assert.equal(result.reviewed,5);
 assert.deepEqual(calls,['4/1','4/2','4/3','4/4','4/5']);
 assert.equal(result.mode,'read-only');
});
test('individual Canvas failures do not stop other investigations',async()=>{
 const items=[{id:'1-1',title:'A',course:'A',dueAt:'2026-11-08T12:00:00Z'},{id:'1-2',title:'B',course:'A',dueAt:'2026-11-09T12:00:00Z'}];
 const result=await investigateCourseMission(items,async(_,id)=>{if(id==='1')throw Error('Permission denied');return {id,name:'B',description:'Describe the assigned topic.'}},{now});
 assert.equal(result.unavailable,1);
 assert.equal(result.reviewed,1);
 assert.match(result.investigations[0].error,/Permission denied/);
});
