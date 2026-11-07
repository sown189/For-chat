import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademicAgent} from '../server/academic-agent.js';
test('academic agent approval is single-use and event history stays bounded',{timeout:10000},async()=>{
 const agent=createAcademicAgent({
  loadAssignments:async()=>[{id:'1-2',course:'Test',title:'Essay',dueAt:new Date(Date.now()+86400000).toISOString(),url:'https://canvas.example/courses/1/assignments/2'}],
  readAssignment:async()=>({id:2,name:'Essay',description:'<p>Compare two viewpoints.</p>',html_url:'https://canvas.example/courses/1/assignments/2'}),
  reason:async()=> 'Compare the viewpoints.',
  openSource:async()=>({url:'https://canvas.example/courses/1/assignments/2',title:'Essay',text:'Compare two viewpoints.'})
 });
 const session=await agent.run('Help me study');
 assert.equal(session.state,'awaiting-approval');
 const result=await agent.approve(session.id,true);
 assert.equal(result.state,'completed');
 await assert.rejects(()=>agent.approve(session.id,true),/No pending browser action/);
 assert.equal(agent.status(session.id).state,'completed');
 assert.ok(result.events.length<=40);
});
