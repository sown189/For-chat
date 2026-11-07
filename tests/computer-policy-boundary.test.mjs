import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeAction,authorizeReadOnlyRequest,validateProposedAction} from '../server/computer-policy.js';
test('AI proposals never execute without explicit approval',()=>{
 const proposal={type:'click',x:100,y:200};
 assert.throws(()=>authorizeAction(proposal,{approved:false,steps:0}),/explicit student approval/);
 assert.throws(()=>authorizeAction(proposal,{approved:undefined,steps:0}),/explicit student approval/);
 const authorized=authorizeAction(proposal,{approved:true,steps:0});
 assert.deepEqual(authorized,proposal);
 assert.notEqual(authorized,proposal);
});
test('action budget is enforced at the policy boundary',()=>{
 const proposal={type:'screenshot'};
 assert.doesNotThrow(()=>authorizeAction(proposal,{approved:true,steps:39}));
 assert.throws(()=>authorizeAction(proposal,{approved:true,steps:40}),/Maximum approved actions/);
 assert.throws(()=>authorizeAction(proposal,{approved:true,steps:-1}),/Maximum approved actions/);
});
test('untrusted action and network inputs are denied',()=>{
 assert.throws(()=>validateProposedAction({type:'click',x:Infinity,y:20}));
 assert.throws(()=>authorizeReadOnlyRequest('https://canvas.example.edu/submit','POST'),/Write requests/);
 assert.throws(()=>authorizeReadOnlyRequest('http://127.0.0.1:8787','GET'));
});
