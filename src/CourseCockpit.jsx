import React,{useMemo,useState,useEffect} from 'react';
import {CalendarDays,CheckCircle2,ClipboardList} from 'lucide-react';

const KEY='finessers-course-cockpit-v1';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const datePattern=/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/gi;
const parseDate=(text,year)=>{
 const value=text.trim();
 const date=new Date(/\b\d{4}\b/.test(value)?value:value+' '+year);
 if(Number.isNaN(date.getTime()))return null;
 const iso=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 return iso;
};
export function extractDeadlines(source,year=new Date().getFullYear()){
 return source.split(/\r?\n/).slice(0,500).flatMap((line,index)=>{
  const matches=[...line.matchAll(datePattern)];
  return matches.slice(0,1).flatMap(match=>{
   const due=parseDate(match[0],year);
   const title=line.replace(match[0],'').replace(/^\s*[-:|–—,]+|[-:|–—,]+\s*$/g,'').trim();
   if(!due||title.length<3)return [];
   return [{id:'line-'+index,due,title:title.slice(0,180),source:'Line '+(index+1)+': '+line.slice(0,240),approved:false,done:false}];
  });
 });
}
export default function CourseCockpit(){
 const [course,setCourse]=useState('');
 const [source,setSource]=useState('');
 const [items,setItems]=useState(load);
 const [notice,setNotice]=useState('');
 const [syncing,setSyncing]=useState(false);
 const [canvasStatus,setCanvasStatus]=useState('');
 const [mission,setMission]=useState(null);
 const [missionBusy,setMissionBusy]=useState(false);
 const [assignmentGuide,setAssignmentGuide]=useState(null);
 const [guideBusy,setGuideBusy]=useState(false);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);
 const approved=useMemo(()=>items.filter(x=>x.approved).sort((a,b)=>a.due.localeCompare(b.due)),[items]);
 const upcoming=approved.filter(x=>!x.done&&x.due>=new Date().toISOString().slice(0,10)).slice(0,8);
 const nextWeek=upcoming.filter(x=>(new Date(x.due+'T12:00:00')-new Date())/86400000<=7);
 const importText=e=>{e.preventDefault();const found=extractDeadlines(source).map((x,i)=>({...x,id:Date.now()+'-'+i,course:course.trim()||'My course'}));setItems(prev=>[...prev,...found]);setNotice(found.length+' potential deadlines found. Review each one against your syllabus before approving.');};
 const investigateAssignment=async(id)=>{
  const [courseId,assignmentId]=String(id).split('-');
  if(!courseId||!assignmentId){setCanvasStatus('Cannot identify Canvas assignment.');return}
  setGuideBusy(true);setCanvasStatus('');setAssignmentGuide(null);
  try{
   const response=await fetch('/api/course-context?courseId='+encodeURIComponent(courseId)+'&assignmentId='+encodeURIComponent(assignmentId));
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Could not read assignment');
   setAssignmentGuide(data.guide);
  }catch(e){setCanvasStatus('Assignment investigation failed: '+e.message)}
  finally{setGuideBusy(false)}
 };
 const runMission=async()=>{
  setMissionBusy(true);setCanvasStatus('');
  try{
   const response=await fetch('/api/course-mission');
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Mission unavailable');
   setMission(data);
  }catch(e){setCanvasStatus('Mission unavailable: '+e.message)}
  finally{setMissionBusy(false)}
 };
 const syncCanvas=async()=>{
  setSyncing(true);setCanvasStatus('');
  try{
   const response=await fetch('http://127.0.0.1:8787/api/deadlines');
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Canvas connection failed');
   const valid=(Array.isArray(data.assignments)?data.assignments:[]).filter(a=>a&&a.id&&a.dueAt&&a.title);
   setItems(prev=>{
    const existing=new Set(prev.map(x=>x.canvasId).filter(Boolean));
    const incoming=valid.filter(a=>!existing.has(String(a.id))).map(a=>{
     const date=new Date(a.dueAt);
     if(Number.isNaN(date.getTime()))return null;
     return {id:'canvas-'+String(a.id),canvasId:String(a.id),due:date.toISOString().slice(0,10),title:String(a.title).slice(0,180),course:String(a.course||'Canvas course'),source:'Canvas assignment'+(a.url?' · '+a.url:''),approved:false,done:false};
    }).filter(Boolean);
    return [...prev,...incoming];
   });
   setCanvasStatus('Canvas returned '+valid.length+' dated assignments. Review imported deadlines below; existing imports are not duplicated.'+(data.partial?' Some courses failed to load.':''));
  }catch(e){setCanvasStatus('Canvas sync unavailable: '+e.message)}
  finally{setSyncing(false)}
 };
 const change=(id,patch)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
 return <section className="panel" aria-label="Course cockpit">
  <h3><ClipboardList size={22}/> COURSE COCKPIT <small>READ-ONLY MVP</small></h3>
  <p>Paste a syllabus or assignment list. Finessers detects dated lines and lets you verify each one before it enters your study plan. Everything stays in this browser.</p>
  <div className="note-card">
   <strong>CONNECT CANVAS ASSIGNMENTS</strong>
   <p>Import upcoming assignment titles and due dates from your configured Canvas account. Nothing is submitted or modified in Canvas. Review every imported deadline before approving it.</p>
   <button type="button" onClick={runMission} disabled={missionBusy}>{missionBusy?'INVESTIGATING…':'FIND WHAT I NEED TO DO THIS WEEK'}</button>
   <button type="button" onClick={syncCanvas} disabled={syncing}>{syncing?'SYNCING…':'IMPORT FROM CANVAS'}</button>
   {mission&&<div className="note-card" aria-label="Course mission">
    <h4>YOUR COURSE MISSION</h4>
    <p>{mission.totalUpcoming} upcoming dated assignments · {mission.dueThisWeek} due within seven days</p>
    <p><strong>Next move:</strong> {mission.nextAction}</p>
    {mission.tasks.slice(0,8).map(t=><article key={t.id}>
     <strong>{t.title}</strong><p>{t.course} · {t.daysUntilDue} days remaining · {t.priority} priority</p>
     <p>{t.studyActions.join(' → ')}</p>
     <button type="button" disabled={guideBusy} onClick={()=>investigateAssignment(t.id)}>INVESTIGATE REQUIREMENTS</button>
     {t.url&&<a href={t.url} target="_blank" rel="noopener noreferrer">OPEN ASSIGNMENT SOURCE</a>}
    </article>)}
    {assignmentGuide&&<div className="note-card" aria-label="Source-grounded assignment guide">
     <h4>ASSIGNMENT BRIEF: {assignmentGuide.title}</h4>
     {assignmentGuide.requirements.length?assignmentGuide.requirements.map((requirement,i)=><p key={i}>{i+1}. {requirement}</p>):<p>No assignment description was returned.</p>}
     <p><strong>Next action:</strong> {assignmentGuide.nextAction}</p>
     {assignmentGuide.sourceUrl&&<a href={assignmentGuide.sourceUrl} target="_blank" rel="noopener noreferrer">VERIFY IN CANVAS</a>}
     <p><small>{assignmentGuide.limitations}</small></p>
    </div>}
    <p><small>{mission.limitations}</small></p>
    {mission.canvas?.partial&&<p role="status">Some Canvas courses could not be read; this mission is incomplete.</p>}
   </div>}
   {canvasStatus&&<p role="status">{canvasStatus}</p>}
   <p><small>Requires the local Finessers backend with CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN configured. Credentials stay on the backend.</small></p>
  </div>
  <form className="stacked" onSubmit={importText}>
   <label htmlFor="cockpit-course">COURSE</label>
   <input id="cockpit-course" value={course} onChange={e=>setCourse(e.target.value)} placeholder="e.g. Introduction to Criminal Justice" required/>
   <label htmlFor="cockpit-source">SYLLABUS / ASSIGNMENT TEXT</label>
   <textarea id="cockpit-source" rows={7} value={source} onChange={e=>setSource(e.target.value)} placeholder={'Quiz 1 — November 18, 2026\nResearch paper — December 4, 2026'} required/>
   <button type="submit">FIND POTENTIAL DEADLINES</button>
  </form>
  {notice&&<p role="status">{notice}</p>}
  <h3><CheckCircle2 size={20}/> VERIFY DEADLINES <small>{items.filter(x=>!x.approved).length} TO REVIEW</small></h3>
  {items.filter(x=>!x.approved).map(x=><article className="note-card" key={x.id}>
   <label>Assignment <input aria-label="Assignment title" value={x.title} onChange={e=>change(x.id,{title:e.target.value})}/></label>
   <label>Due date <input aria-label="Due date" type="date" value={x.due} onChange={e=>change(x.id,{due:e.target.value})}/></label>
   <p><strong>{x.course}</strong> · {x.source}</p>
   <button onClick={()=>change(x.id,{approved:true})} disabled={!x.title.trim()||!x.due}>APPROVE</button>
   <button className="remove" onClick={()=>setItems(prev=>prev.filter(y=>y.id!==x.id))}>DISCARD</button>
  </article>)}
  <h3><CalendarDays size={20}/> YOUR STUDY PLAN <small>{approved.length} VERIFIED</small></h3>
  {nextWeek.length>0&&<p role="status">{nextWeek.length} approved assignment(s) due within seven days. Prioritize the earliest deadlines first.</p>}
  {!upcoming.length&&<p>Approve upcoming deadlines to build your plan. Completed or past deadlines are excluded.</p>}
  {upcoming.map(x=>{const days=Math.ceil((new Date(x.due+'T12:00:00')-new Date())/86400000);return <article className="note-card" key={x.id}>
   <strong>{x.title}</strong><p>{x.course} · Due {x.due} · {Math.max(0,days)} day(s) remaining</p>
   <p>Suggested study sequence: review source material → recall from memory → answer practice questions → correct mistakes. {days<=1?'Due soon: prioritize review and submission preparation.':days<=3?'Split preparation across today and tomorrow.':'Start with a short review session today and revisit before the due date.'}</p>
   <button onClick={()=>change(x.id,{done:true})}>MARK COMPLETE</button>
  </article>})}
  <p><small>Pasted dates are extracted heuristically. Canvas imports read assignment metadata only when configured. Check all entries against the original course source. No assignments are submitted.</small></p>
 </section>;
}
