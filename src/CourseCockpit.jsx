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
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);
 const approved=useMemo(()=>items.filter(x=>x.approved).sort((a,b)=>a.due.localeCompare(b.due)),[items]);
 const upcoming=approved.filter(x=>!x.done&&x.due>=new Date().toISOString().slice(0,10)).slice(0,8);
 const importText=e=>{e.preventDefault();const found=extractDeadlines(source).map((x,i)=>({...x,id:Date.now()+'-'+i,course:course.trim()||'My course'}));setItems(prev=>[...prev,...found]);setNotice(found.length+' potential deadlines found. Review each one against your syllabus before approving.');};
 const change=(id,patch)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
 return <section className="panel" aria-label="Course cockpit">
  <h3><ClipboardList size={22}/> COURSE COCKPIT <small>READ-ONLY MVP</small></h3>
  <p>Paste a syllabus or assignment list. Finessers detects dated lines and lets you verify each one before it enters your study plan. Everything stays in this browser.</p>
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
  {!upcoming.length&&<p>Approve upcoming deadlines to build your plan. Completed or past deadlines are excluded.</p>}
  {upcoming.map(x=>{const days=Math.ceil((new Date(x.due+'T12:00:00')-new Date())/86400000);return <article className="note-card" key={x.id}>
   <strong>{x.title}</strong><p>{x.course} · Due {x.due} · {Math.max(0,days)} day(s) remaining</p>
   <p>Suggested study sequence: review source material → write down what you remember → practice questions → check mistakes before the deadline.</p>
   <button onClick={()=>change(x.id,{done:true})}>MARK COMPLETE</button>
  </article>})}
  <p><small>Dates are extracted heuristically, not verified automatically. Check all entries against the original course source. No school website is accessed and no assignments are submitted.</small></p>
 </section>;
}
