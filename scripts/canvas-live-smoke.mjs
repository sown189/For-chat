// Read-only Canvas integration smoke test. Requires CANVAS_BASE_URL and
// CANVAS_ACCESS_TOKEN; never prints tokens, assignment text, or student names.
import {canvasClient} from '../server/canvas-client.js';
import {canvasNavigate} from '../server/canvas-navigator.js';
const baseUrl=process.env.CANVAS_BASE_URL;
const token=process.env.CANVAS_ACCESS_TOKEN;
if(!baseUrl||!token){
 console.error('BLOCK Canvas integration: set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN in your local environment.');
 process.exitCode=2;
}else{
 try{
  const origin=new URL(baseUrl);
  if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw Error('HTTPS Canvas origin required');
  const client=canvasClient({baseUrl:origin.origin,token,maxPages:3});
  const profile=await client.get('/api/v1/users/self/profile');
  if(!profile||!profile.id)throw Error('Profile endpoint returned no student ID');
  console.log('PASS Authenticated Canvas profile (identity withheld)');
  const courses=await canvasNavigate(client,{view:'courses'},{baseUrl:origin.origin});
  if(!Array.isArray(courses.items))throw Error('Course list invalid');
  console.log('PASS Canvas courses: '+courses.items.length+' returned');
  if(courses.items.length){
   const courseId=courses.items[0].id;
   for(const view of ['assignments','modules','pages']){
    try{
     const result=await canvasNavigate(client,{view,courseId},{baseUrl:origin.origin});
     console.log('PASS Canvas '+view+': '+result.items.length+' returned');
    }catch(e){console.error('BLOCK Canvas '+view+': '+String(e.message||e).slice(0,150));process.exitCode=1}
   }
  }else console.log('SKIP Course detail tests: account has no active courses');
  console.log('NOTE Canvas website session not tested: API authentication does not grant Playwright browser cookies.');
 }catch(e){console.error('BLOCK Canvas integration: '+String(e.message||e).slice(0,160));process.exitCode=1}
}
