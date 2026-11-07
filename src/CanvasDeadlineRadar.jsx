import React,{useEffect,useState} from 'react';
import {CalendarClock,RefreshCw,ExternalLink,BookOpen,AlertTriangle} from 'lucide-react';
const fmt=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'Unscheduled':d.toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})};
export default function CanvasDeadlineRadar({onStudy}){
 const [report,setReport]=useState(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [guideLoading,setGuideLoading]=useState('');
 const refresh=async(signal)=>{
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/course-mission',{signal});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||'Canvas deadlines are unavailable');
   setReport(data);
  }catch(e){if(e.name!=='AbortError'){setReport(null);setError(e.message)}}
  finally{if(!signal?.aborted)setBusy(false)}
 };
 useEffect(()=>{const controller=new AbortController();refresh(controller.signal);return()=>controller.abort()},[]);
 const study=async task=>{
  setGuideLoading(task.id);
  try{
   const [courseId,assignmentId]=String(task.id).split('-');
   if(!/^\d+$/.test(courseId)||!/^\d+$/.test(assignmentId))throw Error('Cannot read this assignment');
   const r=await fetch('/api/course-context?courseId='+encodeURIComponent(courseId)+'&assignmentId='+encodeURIComponent(assignmentId));
   const data=await r.json();
   if(!r.ok)throw Error(data.error||'Cannot read instructions');
   const details=(data.context?.description||data.context?.text||data.guide?.requirements?.join('\n')||'').slice(0,12000);
   onStudy?.({title:task.title,content:details||task.title+'\n'+task.studyActions.join('\n'),sourceUrl:task.url||null,kind:'canvas-assignment'});
  }catch(e){setError(e.message)}
  finally{setGuideLoading('')}
 };
 return <section className="fx-radar" aria-label="Canvas deadlines radar">
  <div className="fx-radar-heading"><div><span className="fx-section-label">AUTO SYNC / CANVAS</span><h2><CalendarClock size={20}/> DUE NEXT</h2></div><button onClick={()=>refresh()} disabled={busy}><RefreshCw size={14}/> {busy?'SYNCING…':'REFRESH'}</button></div>
  {busy&&!report&&<p role="status">Looking for upcoming Canvas work…</p>}
  {error&&<p role="status">Canvas deadlines unavailable: {error}. Connect Canvas in the tab below, then refresh.</p>}
  {report&&<><p>{report.totalUpcoming} upcoming dated assignments · {report.dueThisWeek} due this week {report.canvas?.partial?'· Some courses could not be read':''}</p>
   <div className="fx-radar-list">{(report.tasks||[]).slice(0,5).map(task=><article key={task.id}><div><small>{task.course} · {fmt(task.dueAt)}</small><strong>{task.title}</strong><span className={'fx-radar-priority '+task.priority}>{task.priority?.toUpperCase()}</span></div><div className="fx-radar-controls"><button onClick={()=>study(task)} disabled={!!guideLoading}><BookOpen size={14}/>{guideLoading===task.id?'READING…':'STUDY'}</button>{task.url&&<a href={task.url} target="_blank" rel="noopener noreferrer" aria-label={'Verify '+task.title+' in Canvas'}><ExternalLink size={16}/></a>}</div></article>)}</div>
   {!report.tasks?.length&&<p>No upcoming dated assignments were returned. Check undated Canvas work directly.</p>}
   {report.canvas?.partial&&<p role="status"><AlertTriangle size={14}/> Partial sync: some Canvas courses were unavailable.</p>}
   <small>Read-only · Based on Canvas dates, not confirmation of submission or grading.</small>
  </>}
 </section>;
}
