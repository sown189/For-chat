// Authenticated Canvas API navigation. The Canvas token remains on the local server.
// This does not transfer Canvas login cookies to the Playwright browser.
const numeric=value=>typeof value==='string'&&/^[0-9]{1,16}$/.test(value);
const plain=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000);
export function safeCanvasLink(raw,baseUrl){
 if(!raw||!baseUrl)return null;
 try{const base=new URL(baseUrl),target=new URL(raw,base);if(base.protocol!=='https:'&&base.protocol!=='http:')return null;if(target.origin!==base.origin||target.username||target.password)return null;return target.href}catch{return null}
}
const summary=(a,baseUrl)=>({id:String(a.id),title:plain(a.name||'Untitled'),dueAt:a.due_at||null,points:a.points_possible??null,htmlUrl:safeCanvasLink(a.html_url,baseUrl),description:plain(a.description),submissionTypes:Array.isArray(a.submission_types)?a.submission_types:[]});
export async function canvasNavigate(client,{view,courseId,assignmentId,moduleId,pageUrl}={},options={}){
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
 if(view==='modules'){
  const rows=await client.list('/api/v1/courses/'+courseId+'/modules?per_page=100');
  return {view:'modules',courseId,items:(Array.isArray(rows)?rows:[]).slice(0,100).map(m=>({id:String(m.id),title:plain(m.name||'Module'),position:m.position??null,itemsCount:m.items_count??null,state:m.state||null}))};
 }
 if(view==='module-items'){
  if(!numeric(moduleId))throw Error('A numeric module ID is required');
  const rows=await client.list('/api/v1/courses/'+courseId+'/modules/'+moduleId+'/items?per_page=100');
  return {view:'module-items',courseId,moduleId,items:(Array.isArray(rows)?rows:[]).slice(0,150).map(item=>({id:String(item.id),title:plain(item.title||'Untitled'),type:plain(item.type||''),pageUrl:item.type==='Page'?String(item.page_url||''):null,assignmentId:item.type==='Assignment'&&numeric(String(item.content_id))?String(item.content_id):null,htmlUrl:safeCanvasLink(item.html_url,baseUrl),externalUrl:item.type==='ExternalUrl'?safeCanvasLink(item.external_url,baseUrl):null}))};
 }
 if(view==='pages'){
  const rows=await client.list('/api/v1/courses/'+courseId+'/pages?per_page=100');
  return {view:'pages',courseId,items:(Array.isArray(rows)?rows:[]).slice(0,150).map(p=>({title:plain(p.title||'Page'),pageUrl:String(p.url||'').slice(0,250),htmlUrl:safeCanvasLink(p.html_url,baseUrl)}))};
 }
 if(view==='page'){
  if(typeof pageUrl!=='string'||!pageUrl||pageUrl.length>250||!/^[-a-zA-Z0-9_%]+$/.test(pageUrl))throw Error('Invalid Canvas page identifier');
  const page=await client.get('/api/v1/courses/'+courseId+'/pages/'+encodeURIComponent(pageUrl));
  return {view:'page',courseId,page:{title:plain(page.title||'Page'),body:plain(page.body),htmlUrl:safeCanvasLink(page.html_url,baseUrl)}};
 }
 if(view==='assignment'){
  if(!numeric(assignmentId))throw Error('A numeric assignment ID is required');
  const data=await client.get('/api/v1/courses/'+courseId+'/assignments/'+assignmentId);
  return {view:'assignment',courseId,assignment:summary(data,baseUrl)};
 }
 throw Error('Unsupported Canvas navigation view');
}
