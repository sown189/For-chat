import React,{useEffect,useState} from 'react';
import {ShieldCheck,RefreshCw,CheckCircle2,AlertTriangle,LockKeyhole} from 'lucide-react';
export default function BetaReadiness({openCanvas,openBrowser}){
 const [report,setReport]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const check=async()=>{
  setBusy(true);setError('');
  try{
   const [health,canvas,ai]=await Promise.all([
    fetch('/api/health').then(r=>r.json()),
    fetch('/api/canvas/oauth/status').then(r=>r.json()),
    fetch('/api/agent/health').then(r=>r.json())
   ]);
   setReport({health,canvas,ai});
  }catch(e){setError('Local Finessers server unavailable: '+e.message)}
  finally{setBusy(false)}
 };
 useEffect(()=>{check()},[]);
 const items=report?[
  {title:'Local beta backend',ready:report.health.mode==='local-beta',detail:'Runs on your machine, not a public production server'},
  {title:'Canvas account connection',ready:!!(report.canvas.connected||report.canvas.legacyTokenConfigured),detail:'OAuth or server-side API token required for your deadlines'},
  {title:'AI provider',ready:!!report.ai.modelConfigured,detail:'Ollama or an OpenAI API key is needed for AI responses'},
  {title:'Public user authentication',ready:!!report.health.authentication,detail:'Not implemented: do not publicly deploy or collect student accounts'},
  {title:'Production readiness',ready:!!report.health.publicReady,detail:'Blocked until multi-user isolation, security review, and real integrations are verified'}
 ]:[];
 return <section className="fx-tool-surface fx-beta-readiness" aria-label="Private beta setup">
  <span className="fx-section-label">FINESSERS / LOCAL BETA</span><h2><ShieldCheck size={24}/> GET READY TO TEST</h2>
  <p>This checklist checks real local capabilities. It does not create an account, publish your site, or imply the app is safe for public student signups.</p>
  <div className="fx-inline-form"><button onClick={check} disabled={busy}><RefreshCw size={15}/>{busy?'CHECKING…':'RECHECK SETUP'}</button><button onClick={openCanvas}>CONNECT CANVAS</button><button onClick={openBrowser}>TEST AI BROWSER</button></div>
  {error&&<p role="alert">{error}</p>}
  <div className="fx-beta-checks">{items.map(item=><article key={item.title}><span>{item.ready?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><small>{item.ready?'READY':'NOT READY'}</small></article>)}</div>
  <div className="fx-beta-privacy"><LockKeyhole size={19}/><div><strong>PRIVATE LOCAL TEST ONLY</strong><p>Keep your backend on loopback. Never paste Canvas tokens or passwords into an AI prompt. Only explicitly approved text is shared with an AI provider. Avoid real student data in demonstrations unless you have consent. Finessers cannot yet provide production-grade multi-user accounts.</p></div></div>
 </section>;
}
