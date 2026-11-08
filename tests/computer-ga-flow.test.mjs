import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPUTER_MODEL,MAX_BATCH_ACTIONS,buildComputerRequest,parseComputerCall,computerCallOutput,browserBarrier,redactedHistoryDetail,authorizeHumanResume} from '../server/computer-agent-flow.js';
import {validateProposedAction} from '../server/computer-policy.js';

test('GA computer protocol uses the current tool rather than the retired preview',()=>{
 const first=buildComputerRequest([{role:'user',content:'Find a public course catalog'}]);
 assert.equal(COMPUTER_MODEL,'gpt-6.1-sol');
 assert.deepEqual(first.tools,[{type:'computer'}]);
 assert.ok(!JSON.stringify(first).includes('computer-use-preview'));
 const next=buildComputerRequest([{type:'computer_call_output',call_id:'call_1'}],'resp_1');
 assert.equal(next.previous_response_id,'resp_1');
});
test('multiple computer actions are individually checked before execution',()=>{
 const call=parseComputerCall({output:[{type:'computer_call',call_id:'call_1',actions:[{type:'click',button:'left',x:200,y:250},{type:'wait'},{type:'screenshot'}]}]});
 assert.equal(call.actions.length,3);
 call.actions.forEach(validateComputerAction);
 assert.equal(parseComputerCall({output:[{type:'message'}]}),null);
 for(const actions of [[],Array.from({length:MAX_BATCH_ACTIONS+1},()=>({type:'screenshot'}))])
  assert.throws(()=>parseComputerCall({output:[{type:'computer_call',call_id:'x',actions}]}),/invalid action batch/);
 assert.throws(()=>parseComputerCall({output:[{type:'computer_call',call_id:'',actions:[{type:'screenshot'}]}]}),/call ID/);
});
test('computer screenshots return the GA tool call ID and consent acknowledgment',()=>{
 const output=computerCallOutput('call_2','data:image/jpeg;base64,YQ==',[{id:'safe_1',code:'sensitive',message:'Review before proceeding'}]);
 assert.equal(output.type,'computer_call_output');
 assert.equal(output.call_id,'call_2');
 assert.equal(output.output.detail,'original');
 assert.deepEqual(output.acknowledged_safety_checks.map(x=>x.id),['safe_1']);
});
test('login and human-verification gates stop navigation while ordinary public pages continue',()=>{
 assert.equal(browserBarrier({url:'https://example.edu/courses/123'}),null);
 assert.equal(browserBarrier({url:'https://university.edu/login'}).code,'login-required');
 assert.equal(browserBarrier({url:'https://university.edu/courses',hasPasswordInput:true}).code,'login-required');
 assert.equal(browserBarrier({url:'https://site.com/',title:'Verify you are human'}).code,'human-verification');
});
test('typing content is not copied into action history and excessive waits are blocked',()=>{
 assert.equal(redactedHistoryDetail({type:'type',text:'sensitive school answer'}),'[text hidden]');
 assert.equal(validateProposedAction({type:'wait'}).type,'wait');
 assert.throws(()=>validateProposedAction({type:'wait',ms:10000}),/Wait action/);
});

test('human login takeover only resumes at the configured Canvas origin',()=>{
 assert.equal(authorizeHumanResume('https://fau.instructure.com/courses/123','https://fau.instructure.com'),true);
 assert.throws(()=>authorizeHumanResume('https://other.school.edu/courses/123','https://fau.instructure.com'),/return to the Canvas page/);
 assert.throws(()=>authorizeHumanResume('https://fau.instructure.com/courses/123',null),/CANVAS_BASE_URL/);
 assert.throws(()=>authorizeHumanResume('https://fau.instructure.com/login','https://fau.instructure.com',browserBarrier({url:'https://fau.instructure.com/login'})),/Complete the login/);
});
