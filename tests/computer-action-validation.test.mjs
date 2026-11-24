import test from 'node:test';
import assert from 'node:assert/strict';
import {validateComputerAction} from '../server/computer.js';
test('computer action validator accepts bounded read-only interactions',()=>{
 assert.equal(validateComputerAction({type:'click',x:400,y:250}).type,'click');
 assert.equal(validateComputerAction({type:'scroll',scroll_y:500}).type,'scroll');
 assert.equal(validateComputerAction({type:'keypress',keys:['ARROWDOWN']}).type,'keypress');
 assert.equal(validateComputerAction({type:'keypress',keys:['ENTER']}).type,'keypress');
});
test('computer action validator blocks offscreen clicks, oversized scrolls and unsupported keyboard shortcuts',()=>{
 for(const action of [
  {type:'click',x:-1,y:0},
  {type:'click',x:1280,y:200},
  {type:'double_click',x:100,y:Infinity},
  {type:'scroll',scroll_y:50000},
  {type:'type',text:'a'.repeat(3001)},
  {type:'keypress',keys:['F13']},
  {type:'keypress',keys:['CMD','P']},
  {type:'drag',path:[{x:0,y:0},{x:9000,y:10}]},
  {type:'click',x:100,y:100,button:'right'}
 ])assert.throws(()=>validateComputerAction(action),undefined,JSON.stringify(action).slice(0,100));
});

test('read-only keyboard safety blocks shortcuts that can mutate or export student data',()=>{
 for(const keys of [['CTRL','S'],['META','P'],['CTRL','ENTER'],['CTRL','A'],['ALT','F4'],['META','C']])
  assert.throws(()=>validateComputerAction({type:'keypress',keys}),/not permitted|Unsupported keyboard/);
 for(const keys of [['CTRL','L'],['META','R'],['CTRL','F'],['SHIFT','TAB']])
  assert.equal(validateComputerAction({type:'keypress',keys}).type,'keypress');
});
