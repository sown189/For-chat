import CanvasConnection from './CanvasConnection.jsx';
import React,{useEffect,useState} from 'react';
async function fetchView(location,signal){
 const q=new URLSearchParams(location);
 const response=await fetch('/api/canvas/navigate?'+q,{signal});
 const body=await response.json();
 if(!response.ok)throw Error(body.error||'Canvas navigation failed');
 return body;
}
const date=value=>value?new Date(value).toLocaleString():'No due date';
export default function CanvasBrowser({onPageContentChange}){
 const [location,setLocation]=useState({view:'courses'});
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 const [section,setSection]=useState('assignments');
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError('');setData(null);
  fetchView(location,controller.signal).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[location,revision]);
 useEffect(()=>{
  if(data?.view==='assignment'&&data.assignment){
   onPageContentChange?.({kind:'canvas-assignment',title:String(data.assignment.title||'Canvas assignment'),content:String(data.assignment.description||'No instructions were provided.').slice(0,12000),sourceUrl:data.assignment.htmlUrl||null});
  }else if(data?.view==='page'&&data.page){
   onPageContentChange?.({kind:'canvas-page',title:String(data.page.title||'Canvas page'),content:String(data.page.body||'').slice(0,12000),sourceUrl:data.page.htmlUrl||null});
  }else onPageContentChange?.(null);
 },[data,onPageContentChange]);
 const navigate=(view,extra={})=>setLocation({view,...extra});
 const courseId=location.courseId;
 const sectionView=(next)=>{setSection(next);navigate(next,{courseId})};
 const cards=(items,handler,subtitle)=><div className="fx-canvas-items">{items.map((item,i)=><button key={item.id||item.pageUrl||i} onClick={()=>handler(item)}><strong>{item.title}</strong><span>{subtitle(item)}</span></button>)}{!items.length&&<p>No items were returned for this section.</p>}</div>;
 return <section className="fx-canvas-browser" aria-label="Authenticated Canvas navigator">
  <CanvasConnection onConnected={()=>setRevision(x=>x+1)}/>
  <div className="fx-canvas-browser-head"><div><strong>CANVAS · AUTHENTICATED API</strong><p>Read connected courses, modules, pages and assignment instructions. Your Canvas credentials remain on the local backend.</p></div><button onClick={()=>setRevision(x=>x+1)}>REFRESH</button></div>
  <div className="fx-canvas-breadcrumb"><button onClick={()=>navigate('courses')}>COURSES</button>{courseId&&<><span> / </span><button onClick={()=>navigate(section,{courseId})}>COURSE {courseId}</button></>}{location.moduleId&&<><span> / </span><button onClick={()=>navigate('module-items',{courseId,moduleId:location.moduleId})}>MODULE</button></>}{location.view==='page'||location.view==='assignment'?<span> / DETAILS</span>:null}</div>
  {courseId&&<div className="fx-inline-form" role="group" aria-label="Course sections">{['assignments','modules','pages'].map(view=><button key={view} aria-pressed={section===view} onClick={()=>sectionView(view)}>{view.toUpperCase()}</button>)}</div>}
  {loading&&<p role="status">Loading Canvas…</p>}
  {error&&<p role="alert">{error}. Check your Canvas connection and try again.</p>}
  {data?.view==='courses'&&cards(data.items,item=>{setSection('assignments');navigate('assignments',{courseId:item.id})},item=>item.code||'VIEW COURSE')}
  {data?.view==='assignments'&&cards(data.items,item=>navigate('assignment',{courseId,assignmentId:item.id}),item=>'DUE '+date(item.dueAt))}
  {data?.view==='modules'&&cards(data.items,item=>navigate('module-items',{courseId,moduleId:item.id}),item=>(item.itemsCount??'?')+' ITEMS')}
  {data?.view==='module-items'&&cards(data.items,item=>{if(item.type==='Assignment'&&item.assignmentId)navigate('assignment',{courseId,assignmentId:item.assignmentId});else if(item.type==='Page'&&item.pageUrl)navigate('page',{courseId,pageUrl:item.pageUrl});else if(item.htmlUrl)window.open(item.htmlUrl,'_blank','noopener,noreferrer');else setError('This module item type is not available in the read-only navigator.')},item=>item.type||'ITEM')}
  {data?.view==='pages'&&cards(data.items,item=>navigate('page',{courseId,pageUrl:item.pageUrl}),()=> 'READ PAGE')}
  {data?.view==='assignment'&&<article className="fx-canvas-detail"><h3>{data.assignment.title}</h3><p>Due: {date(data.assignment.dueAt)}</p><p>Points: {data.assignment.points??'Not specified'}</p><h4>INSTRUCTIONS</h4><p className="fx-canvas-description">{data.assignment.description||'No instructions provided.'}</p>{data.assignment.htmlUrl&&<a href={data.assignment.htmlUrl} target="_blank" rel="noopener noreferrer">OPEN ORIGINAL ASSIGNMENT ↗</a>}</article>}
  {data?.view==='page'&&<article className="fx-canvas-detail"><h3>{data.page.title}</h3><p className="fx-canvas-description">{data.page.body||'This page has no text content.'}</p>{data.page.htmlUrl&&<a href={data.page.htmlUrl} target="_blank" rel="noopener noreferrer">OPEN ORIGINAL PAGE ↗</a>}</article>}
 </section>;
}
