import test from 'node:test';
import assert from 'node:assert/strict';
import {isUnsafeClickTarget,isSafeSearchEnter} from '../server/computer-safe-interaction.js';

test('read-only computer refuses dangerous buttons and links',()=>{
 for(const target of [
  {tag:'button',type:'submit',label:'Search'},
  {tag:'button',type:'',inForm:true,label:'Continue'},
  {tag:'a',href:'/courses/1/assignments/2/delete',label:'Details'},
  {tag:'a',href:'/logout',label:'Home'},
  {tag:'div',label:'Send message'}
 ])assert.equal(isUnsafeClickTarget(target),true,JSON.stringify(target));
 for(const target of [
  {tag:'button',type:'button',label:'Switch tab'},
  {tag:'a',href:'/courses/1/assignments/2',label:'View assignment'},
  {tag:'button',type:'',inForm:false,label:'Open navigation'}
 ])assert.equal(isUnsafeClickTarget(target),false,JSON.stringify(target));
});
test('Enter is restricted to explicitly identified GET search fields',()=>{
 assert.equal(isSafeSearchEnter({tag:'input',type:'search',formMethod:'get',label:'Search courses'}),true);
 assert.equal(isSafeSearchEnter({tag:'input',type:'text',formMethod:'GET',label:'Query'}),true);
 assert.equal(isSafeSearchEnter({tag:'input',type:'text',formMethod:'post',label:'Search'}),false);
 assert.equal(isSafeSearchEnter({tag:'textarea',type:'text',formMethod:'get',label:'Search'}),false);
 assert.equal(isSafeSearchEnter({tag:'input',type:'password',formMethod:'get',label:'Search'}),false);
 assert.equal(isSafeSearchEnter({tag:'input',type:'text',formMethod:'get',label:'Assignment answer'}),false);
});
