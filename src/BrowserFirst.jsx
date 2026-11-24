import React,{useState,useEffect,useRef} from 'react';
import './browser-first.css';
const activeStates=['queued','running','starting'];
export default function BrowserFirst({onHome,onCanvas}){
 const [url,setUrl]=useState('https://example.com');
 const [task,setTask]=useState('study_material_summary');
 const [job,setJob]=useState(null);
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const pending=useRef(false);
 const running=activeStates.includes(job?.status);
 async function call(action,id){const r=await fetch('/api/browser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,url,mode:task})});const d=await r.json();if(!r.ok)throw Error(d.error||'Browser unavailable');return d;}
 useEffect(()=>{fetch('/api/browser').then(r=>r.json()).then(d=>setReady(d.configured===true)).catch(()=>setReady(false))},[]);
 useEffect(()=>{if(!job?.id||!running)return;let closed=false;const timer=setInterval(async()=>{if(pending.current)return;pending.current=true;try{const d=await call('status',job.id);if(!closed){setJob({...d,id:job.id});setError('')}}catch(e){if(!closed)setError(e.message)}finally{pending.current=false}},2500);return()=>{closed=true;clearInterval(timer)}},[job?.id,running]);
 async function start(e){e.preventDefault();setBusy(true);setError('');setJob({status:'starting'});try{setJob(await call('start'))}catch(e){setJob(null);setError(e.message)}finally{setBusy(false)}}
 async function stop(){setBusy(true);try{const d=await call('cancel',job.id);setJob({...d,id:job.id})}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <main className="fb"><header><button type="button" className="fb-brand" onClick={onHome}>FINESSERS<span>.</span></button><nav className="fb-nav"><button type="button" onClick={onCanvas}>Canvas ↗</button></nav><small>BROWSER USE / PRIVATE BETA</small></header><section className="fb-intro"><div className="fb-graffiti" aria-hidden="true">F/ ✳</div><p className="fb-kicker">YOUR AI BROWSER</p><h1>What should we<br/><em>finesse?</em></h1><p>Open a page. Pick a task. Get a result.</p></section><form onSubmit={start} className="fb-panel"><label>Website<input type="url" value={url} onChange={e=>setUrl(e.target.value)} required disabled={running||busy}/></label><label>Task<select value={task} onChange={e=>setTask(e.target.value)} disabled={running||busy}><option value="study_material_summary">Read and summarize the page</option><option value="assignment_brief">Extract instructions and deadlines</option></select></label><div className="fb-actions"><button disabled={!ready||running||busy}>START BROWSER →</button>{running&&job?.id&&<button className="fb-stop" type="button" disabled={busy} onClick={stop}>STOP</button>}</div>{!ready&&<p role="status">Connecting to the private cloud browser. If unavailable, refresh after the worker deployment completes.</p>}<small>Private read-only test · example.com only · no account logins or submissions.</small></form><section className="fb-panel fb-output" aria-live="polite"><div className="fb-status"><strong>Browser activity</strong><span>{job?.status||'IDLE'}</span></div>{error&&<p role="alert">{error}</p>}{job?.result?<pre>{typeof job.result==='string'?job.result:JSON.stringify(job.result,null,2)}</pre>:<p>{running?'Browser task in progress…':'Results will appear here.'}</p>}<small>Live screenshots and manual takeover are not connected yet.</small></section></main>
}
