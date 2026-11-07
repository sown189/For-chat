import React,{useEffect,useState} from 'react';
const fetchView=async(view,courseId,assignmentId,signal)=>{
 const q=new URLSearchParams({view});
 if(courseId)q.set('courseId',courseId);
 if(assignmentId)q.set('assignmentId',assignmentId);
 const response=await fetch('/api/canvas/navigate?'+q,{signal});
 const body=await response.json();
 if(!response.ok)throw Error(body.error||'Canvas navigation failed');
 return body;
};
export default function CanvasBrowser(){
 const [location,setLocation]=useState({view:'courses'});
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError('');setData(null);
  fetchView(location.view,location.courseId,location.assignmentId,controller.signal).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[location,revision]);
 const navigate=(view,courseId,assignmentId)=>setLocation({view,courseId,assignmentId});
 return <section className="fx-canvas-browser" aria-label="Authenticated Canvas navigator"><div className="fx-canvas-browser-head"><div><strong>CANVAS · AUTHENTICATED API</strong><p>Browse your connected Canvas courses and assignment instructions without sharing your Canvas password with the AI browser.</p></div><button onClick={()=>setRevision(x=>x+1)}>REFRESH</button></div><div className="fx-canvas-breadcrumb"><button onClick={()=>navigate('courses')}>COURSES</button>{location.courseId&&<><span> / </span><button onClick={()=>navigate('assignments',location.courseId)}>ASSIGNMENTS</button></>}{location.assignmentId&&<span> / DETAILS</span>}</div>{loading&&<p role="status">Loading live Canvas information…</p>}{error&&<p role="alert">{error} — Check CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN on your local backend.</p>}{data?.view==='courses'&&<div className="fx-canvas-items">{data.items.map(course=><button key={course.id} onClick={()=>navigate('assignments',course.id)}><strong>{course.title}</strong><span>{course.code||'VIEW ASSIGNMENTS'} →</span></button>)}{!data.items.length&&<p>No active courses were returned by Canvas.</p>}</div>}{data?.view==='assignments'&&<div className="fx-canvas-items">{data.items.map(item=><button key={item.id} onClick={()=>navigate('assignment',data.courseId,item.id)}><strong>{item.title}</strong><span>{item.dueAt?'DUE '+new Date(item.dueAt).toLocaleString():'NO DUE DATE'} →</span></button>)}{!data.items.length&&<p>No assignments returned for this course.</p>}</div>}{data?.view==='assignment'&&<article className="fx-canvas-detail"><h3>{data.assignment.title}</h3><p>{data.assignment.dueAt?'Due '+new Date(data.assignment.dueAt).toLocaleString():'No due date listed'}</p><p>Points: {data.assignment.points??'Not specified'}</p><h4>INSTRUCTIONS</h4><p className="fx-canvas-description">{data.assignment.description||'No instructions provided.'}</p>{data.assignment.htmlUrl&&<a href={data.assignment.htmlUrl} target="_blank" rel="noopener noreferrer">OPEN ORIGINAL ASSIGNMENT ↗</a>}</article>}</section>;
}
