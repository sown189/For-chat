import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasClient} from '../server/canvas-client.js';
import {canvasNavigate} from '../server/canvas-navigator.js';
test('authenticated Canvas transport and navigator work together across courses, modules and pages',async()=>{
 const requests=[];
 const fetchImpl=async(url,options)=>{
  const u=new URL(url);requests.push({url:u,authorization:options.headers.Authorization});
  const fixtures={
   '/api/v1/courses':[ {id:42,name:'Test Course',workflow_state:'available'} ],
   '/api/v1/courses/42/modules':[ {id:7,name:'Week 1',items_count:1} ],
   '/api/v1/courses/42/modules/7/items':[ {id:8,title:'Reading',type:'Page',page_url:'reading'} ],
   '/api/v1/courses/42/pages/reading':{title:'Reading',body:'<p>Study the material</p>'},
   '/api/v1/courses/42/assignments':[ {id:9,name:'Quiz',description:'<p>Practice</p>'} ]
  };
  const body=fixtures[u.pathname];
  return {ok:!!body,status:body?200:404,headers:{get:()=>null},json:async()=>body};
 };
 const client=canvasClient({baseUrl:'https://canvas.example.edu',token:'mock-secret',fetchImpl});
 const options={baseUrl:'https://canvas.example.edu'};
 const courses=await canvasNavigate(client,{view:'courses'},options);
 assert.equal(courses.items[0].id,'42');
 const modules=await canvasNavigate(client,{view:'modules',courseId:'42'},options);
 assert.equal(modules.items[0].id,'7');
 const items=await canvasNavigate(client,{view:'module-items',courseId:'42',moduleId:'7'},options);
 assert.equal(items.items[0].pageUrl,'reading');
 const page=await canvasNavigate(client,{view:'page',courseId:'42',pageUrl:'reading'},options);
 assert.equal(page.page.body,'Study the material');
 const assignments=await canvasNavigate(client,{view:'assignments',courseId:'42'},options);
 assert.equal(assignments.items[0].description,'Practice');
 assert.equal(requests.length,5);
 assert.ok(requests.every(r=>r.url.origin==='https://canvas.example.edu'&&r.authorization==='Bearer mock-secret'));
});
