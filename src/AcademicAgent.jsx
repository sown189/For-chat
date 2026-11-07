import React,{useState} from 'react';
export default function AcademicAgent(){
 const [goal,setGoal]=useState('Find my most urgent Canvas assignment, explain what I need to learn, and help me prepare.');
 const [session,setSession]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function call(action,body){
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/academic-agent/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||'Agent request failed');
   setSession(data);
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <section className="note-card" aria-label="Finessers academic agent">
  <h2>FINESSERS AGENT</h2>
  <p>One task. Canvas investigation, AI tutoring, and supervised browser observation. No assignments are submitted or edited.</p>
  <form onSubmit={e=>{e.preventDefault();call('run',{goal})}}>
   <label htmlFor="academic-goal">WHAT DO YOU NEED DONE?</label>
   <textarea id="academic-goal" rows={3} maxLength={2000} value={goal} onChange={e=>setGoal(e.target.value)} required/>
   <button type="submit" disabled={busy||!goal.trim()}>{busy?'WORKING…':'RUN ACADEMIC AGENT'}</button>
  </form>
  {error&&<p role="alert">{error}</p>}
  {session&&<div aria-live="polite">
   <h3>SESSION: {session.state?.toUpperCase()}</h3>
   {session.answer&&<p style={{whiteSpace:'pre-wrap'}}>{session.answer}</p>}
   {session.error&&<p role="alert">{session.error}</p>}
   {session.report?.investigations?.map(item=><article key={item.task.id}>
    <strong>{item.task.course}: {item.task.title}</strong>
    <p>{item.guide?.requirements?.join(' ')||item.error||'Description unavailable'}</p>
    {item.guide?.sourceUrl&&<a href={item.guide.sourceUrl} target="_blank" rel="noopener noreferrer">VIEW CANVAS SOURCE</a>}
   </article>)}
   {session.state==='awaiting-approval'&&<div>
    <p><strong>Approval required:</strong> Open {session.pending?.title} in a separate read-only browser? The agent will observe the page, not submit anything.</p>
    <button type="button" disabled={busy} onClick={()=>call('approve',{id:session.id,approved:true})}>APPROVE BROWSER OBSERVATION</button>
    <button type="button" disabled={busy} onClick={()=>call('approve',{id:session.id,approved:false})}>DECLINE</button>
   </div>}
   <details><summary>AGENT ACTION LOG</summary>{session.events?.map((e,i)=><p key={i}>{e.type}: {e.detail}</p>)}</details>
  </div>}
 </section>;
}
