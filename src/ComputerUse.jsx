import React,{useState} from 'react';
import {Play,Square,Check,X,Monitor,LockKeyhole} from 'lucide-react';
export default function ComputerUse(){
 const [task,setTask]=useState('');
 const [job,setJob]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const request=async(path,body)=>{
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/computer/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Computer request failed');
   setJob(d);return d;
  }catch(e){setError(e.message);return null}finally{setBusy(false)}
 };
 const stop=async()=>{if(job?.id)await request('stop',{id:job.id});setJob(null)};
 return <section className="computer-use">
  <header className="computer-use-heading"><div><span className="computer-use-kicker">FINESSERS / COMPUTER USE</span><h2>TELL IT. <em>WATCH IT.</em></h2><p>Describe what you want done. OpenAI controls a separate browser while you watch and approve each action.</p></div><span className="computer-use-status">{busy?'WORKING':job?.state?.toUpperCase()||'READY'}</span></header>
  <form className="computer-use-form" onSubmit={e=>{e.preventDefault();if(task.trim())request('start',{task:task.trim()})}}>
   <label htmlFor="computer-task">WHAT SHOULD FINESSERS DO?</label>
   <textarea id="computer-task" rows={3} value={task} onChange={e=>setTask(e.target.value)} placeholder="Find my university's academic calendar and tell me the next important deadlines..." maxLength={2000} required disabled={busy||!!job?.id}/>
   <div className="computer-use-actions"><span><LockKeyhole size={14}/> OpenAI API key required</span>{!job?.id?<button type="submit" disabled={busy||!task.trim()}><Play size={16}/> {busy?'STARTING...':'START COMPUTER USE'}</button>:<button type="button" className="computer-use-stop" onClick={stop} disabled={busy}><Square size={15}/> STOP SESSION</button>}</div>
  </form>
  <div className="computer-use-view"><div className="computer-use-view-top"><span><Monitor size={16}/> AI BROWSER SCREEN</span>{job?.id&&<button type="button" onClick={()=>request('status',{id:job.id})} disabled={busy}>REFRESH SCREEN</button>}</div>{job?.screen?<img src={job.screen} alt="Live screenshot of the AI-controlled browser"/>:<div className="computer-use-placeholder"><Monitor size={40}/><strong>YOUR AI COMPUTER IS READY</strong><p>Start a task to see the browser screen here.</p></div>}</div>
  {job?.state==='awaiting-approval'&&<div className="computer-use-approval" role="status"><strong>APPROVE NEXT COMPUTER ACTION</strong><p>The AI wants to <b>{job.pending?.action?.type}</b>{job.pending?.action?.text?' — '+job.pending.action.text:''}. Check the screenshot before approving. Never approve an unintended purchase, message, or submission.</p><div><button disabled={busy} onClick={()=>request('step',{id:job.id,approve:true})}><Check size={16}/> APPROVE & CONTINUE</button><button disabled={busy} className="computer-use-stop" onClick={()=>request('step',{id:job.id,approve:false})}><X size={16}/> DECLINE</button></div></div>}
  {job?.summary&&<p className="computer-use-result">{job.summary}</p>}
  {(error||job?.error)&&<p className="computer-use-error" role="alert">{error||job.error}</p>}
  {job?.steps?.length>0&&<details className="computer-use-history"><summary>COMPLETED ACTIONS ({job.steps.length})</summary>{job.steps.map((s,i)=><p key={i}>{i+1}. {s.label} {s.detail}</p>)}</details>}
 </section>
}
