import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasNavigate} from '../server/canvas-navigator.js';
const paths=[];
const client={
 list:async path=>{paths.push(path);
  if(path.endsWith('/modules?per_page=100'))return [{id:8,name:'Week One',items_count:2}];
  if(path.includes('/modules/8/items'))return [{id:10,type:'Page',title:'Reading',page_url:'chapter-1'},{id:11,type:'Assignment',title:'Quiz',content_id:55}];
  if(path.endsWith('/pages?per_page=100'))return [{title:'Course policy',url:'course-policy',html_url:'https://canvas.example.edu/courses/4/pages/course-policy'}];
  return [];
 },
 get:async path=>{paths.push(path);return {title:'Chapter One',body:'<p>Study these concepts</p>',html_url:'https://canvas.example.edu/courses/4/pages/chapter-1'}}
};
const options={baseUrl:'https://canvas.example.edu'};
test('Canvas course navigator reads modules and page content via approved API paths',async()=>{
 const modules=await canvasNavigate(client,{view:'modules',courseId:'4'},options);
 assert.equal(modules.items[0].itemsCount,2);
 const items=await canvasNavigate(client,{view:'module-items',courseId:'4',moduleId:'8'},options);
 assert.equal(items.items[0].pageUrl,'chapter-1');
 assert.equal(items.items[1].assignmentId,'55');
 const pages=await canvasNavigate(client,{view:'pages',courseId:'4'},options);
 assert.equal(pages.items[0].pageUrl,'course-policy');
 const page=await canvasNavigate(client,{view:'page',courseId:'4',pageUrl:'chapter-1'},options);
 assert.equal(page.page.body,'Study these concepts');
 assert.ok(paths.every(p=>p.startsWith('/api/v1/courses/4/')));
});
test('Canvas navigator rejects malformed module and page identifiers',async()=>{
 for(const query of [
  {view:'module-items',courseId:'4',moduleId:'../8'},
  {view:'page',courseId:'4',pageUrl:'../../users/self'},
  {view:'page',courseId:'4',pageUrl:'https://evil.example'},
  {view:'page',courseId:'bad',pageUrl:'chapter-1'}
 ])await assert.rejects(()=>canvasNavigate(client,query,options));
});
test('Canvas module external URLs are not blindly exposed',async()=>{
 const result=await canvasNavigate({list:async()=>[{id:1,title:'Outside',type:'ExternalUrl',external_url:'https://malicious.example/'}]},{view:'module-items',courseId:'4',moduleId:'8'},options);
 assert.equal(result.items[0].externalUrl,null);
});
