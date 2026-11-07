// Authenticated Canvas API navigation. The Canvas token remains on the local server.
// This does not transfer Canvas login cookies to the Playwright browser.
const numeric=value=>typeof value==='string'&&/^[0-9]{1,16}$/.test(value);
const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000);
export function safeCanvasLink(raw,baseUrl){
 if(!raw||!baseUrl)return null;
 try{const base=new URL(baseUrl),target=new URL(raw,base);if(base.protocol!=='https:'&&base.protocol!=='http:')return null;if(target.origin!==base.origin||target.username||target.password)return null;return target.href}catch{return null}
}
const summary=(a,baseUrl)=>({id:String(a.id),title:plain(a.name||'Untitled'),dueAt:a.due_at||null,points:a.points_possible??null,htmlUrl:safeCanvasLink(a.html_url,baseUrl),description:plain(a.description),submissionTypes:Array.isArray(a.submission_types)?a.submission_types:[]});
export async function canvasNavigate(client,{view,courseId,assignmentId}={},options={}){
 const baseUrl=options.baseUrl||null;
 if(!client)throw Error('Canvas API is not connected');
 if(view==='courses'){
  const rows=await client.list('/api/v1/courses?enrollment_state=active&per_page=100');
  return {view:'courses',items:(Array.isArray(rows)?rows:[]).filter(x=>x.id&&x.workflow_state!=='deleted').slice(0,100).map(x=>({id:String(x.id),title:plain(x.name||x.course_code||'Course'),code:plain(x.course_code),url:safeCanvasLink(x.html_url,baseUrl)}))};
 }
 if(!numeric(courseId))throw Error('A numeric course ID is required');
 if(view==='assignments'){
  const rows=await client.list('/api/v1/courses/'+courseId+'/assignments?per_page=100');
  return {view:'assignments',courseId,items:(Array.isArray(rows)?rows:[]).slice(0,150).map(a=>summary(a,baseUrl))};
 }
 if(view==='assignment'){
  if(!numeric(assignmentId))throw Error('A numeric assignment ID is required');
  const data=await client.get('/api/v1/courses/'+courseId+'/assignments/'+assignmentId);
  return {view:'assignment',courseId,assignment:summary(data,baseUrl)};
 }
 throw Error('Unsupported Canvas navigation view');
}
