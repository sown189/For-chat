import test from 'node:test';
import assert from 'node:assert/strict';
import {createAcademicAgent} from '../server/academic-agent.js';
const due=new Date(Date.now()+86400000).toISOString();
const assignments=[{id:'12-34',title:'Court case brief',course:'Law',dueAt:due,url:'https://canvas.example/assignments/34'}];
test('unified agent plans, observes, reasons and waits for browser approval',async()=>{
 const calls=[];
 const agent=createAcademicAgent({
  loadAssignments:async()=>{calls.push('load');return assignments},
  readAssignment:async()=>{calls.push('read');return {id:34,name:'Court case brief',description:'Explain the majority opinion and identify the legal issue.',html_url:'https://canvas.example/assignments/34'}},
  reason:async({sources})=>{calls.push('reason');assert.match(sources[0].requirements.join(' '),/majority opinion/);return 'Practice explaining the majority opinion.'},
  openSource:async url=>{calls.push('browse');return {title:'Case brief',url,text:'Assignment details'}}
 });
 const session=await agent.run('Help me prepare');
 assert.equal(session.state,'awaiting-approval');
 assert.deepEqual(calls,['load','read','reason']);
 assert.match(session.answer,/Practice/);
 const finished=await agent.approve(session.id,true);
 assert.equal(finished.state,'completed');
 assert.deepEqual(calls,['load','read','reason','browse','reason']);
 assert.ok(finished.events.some(e=>e.type==='browser-observe'));
});
test('declined browser action never navigates',async()=>{
 let opened=false;
 const agent=createAcademicAgent({loadAssignments:async()=>assignments,readAssignment:async()=>({id:34,name:'Case',description:'Explain the relevant legal issue.',html_url:'https://canvas.example/a'}),reason:async()=> 'Review the legal issue.',openSource:async()=>{opened=true}});
 const session=await agent.run('Study');
 const result=await agent.approve(session.id,false);
 assert.equal(result.state,'completed');assert.equal(opened,false);
});
test('model errors are reported without claiming completion',async()=>{
 const agent=createAcademicAgent({loadAssignments:async()=>assignments,readAssignment:async()=>({id:34,name:'Case',description:'Explain the legal issue.'}),reason:async()=>{throw Error('Model unavailable')}});
 const session=await agent.run('Study');
 assert.equal(session.state,'error');
 assert.match(session.error,/Model unavailable/);
});
test('browser errors recover and retain tutoring response',async()=>{
 const agent=createAcademicAgent({loadAssignments:async()=>assignments,readAssignment:async()=>({id:34,name:'Case',description:'Explain the legal issue.',html_url:'https://canvas.example/a'}),reason:async()=> 'Study the issue.',openSource:async()=>{throw Error('Login required')}});
 const session=await agent.run('Study');
 const result=await agent.approve(session.id,true);
 assert.equal(result.state,'completed');assert.match(result.error,/Login required/);assert.equal(result.answer,'Study the issue.');
});

test('concurrent approval attempts cannot execute the same browser action twice',async()=>{
 let calls=0;
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const agent=createAcademicAgent({loadAssignments:async()=>assignments,readAssignment:async()=>({id:34,name:'Case',description:'Explain the issue.',html_url:'https://canvas.example/a'}),reason:async()=> 'Review the issue.',openSource:async()=>{calls++;await gate;return {url:'https://canvas.example/a',title:'Case',text:'More details'}}});
 const session=await agent.run('Study');
 const first=agent.approve(session.id,true);
 await assert.rejects(agent.approve(session.id,true),/No pending browser action/);
 release();
 await first;
 assert.equal(calls,1);
});
