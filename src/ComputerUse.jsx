import React,{useState,useEffect} from 'react';
import './computer-use-v3.css';
import {Play,Square,Check,X,Monitor,LockKeyhole} from 'lucide-react';
export default function ComputerUse({seed}){
 const [task,setTask]=useState('');
 const [startUrl,setStartUrl]=useState('https://www.google.com/');
 const [humanLogin,setHumanLogin]=useState(false);
 useEffect(()=>{if(seed?.version&&seed.task)setTask(seed.task)},[seed?.version]);
 const [mode,setMode]=useState('local');
 const [job,setJob]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [key,setKey]=useState('');
 const [connected,setConnected]=useState(false);
 const [keyBusy,setKeyBusy]=useState(false);
 const [keyMessage,setKeyMessage]=useState('');
 const [serverReady,setServerReady]=useState(null);
 const [diagnostics,setDiagnostics]=useState(null);
 useEffect(()=>{fetch('/api/agent/health').then(async r=>{if(!r.ok)throw Error('Backend unavailable');const d=await r.json();setServerReady(true);setConnected(!!d.openaiConnected);if(d.openaiConnected)setMode('openai')}).catch(()=>setServerReady(false))},[]);
 const connect=async(e)=>{e.preventDefault();setKeyBusy(true);setKeyMessage('');try{
  const r=await fetch('/api/agent/provider-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'openai',key:key.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Key rejected');
  setConnected(true);setKey('');setKeyMessage('API key connected for this server session.');
 }catch(e){setKeyMessage(e.message)}finally{setKeyBusy(false)}};
 const disconnect=async()=>{try{const r=await fetch('/api/agent/provider-key',{method:'DELETE'});if(!r.ok)throw Error('Could not disconnect key');setConnected(false);setJob(null);setKeyMessage('Key disconnected. Active OpenAI computer sessions were closed.')}catch(e){setKeyMessage(e.message)}};

 const request=async(path,body)=>{
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/computer/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Computer request failed');
   setJob(d);return d;
  }catch(e){setError(e.message);return null}finally{setBusy(false)}
 };
 useEffect(()=>{if(!job?.id||!['running','awaiting-approval'].includes(job.state)||busy)return;
 const timer=setInterval(async()=>{try{const r=await fetch('/api/computer/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id})});if(r.ok){const d=await r.json();setJob(prev=>prev?.id===d.id?d:prev)}}catch{}},2500);
 return()=>clearInterval(timer)},[job?.id,job?.state,busy]);
 const checkDiagnostics=async()=>{try{const r=await fetch('/api/agent/diagnostics');const d=await r.json();if(!r.ok)throw Error(d.error||'Backend error');setDiagnostics(d)}catch(e){setDiagnostics({error:e.message})}};
 const stop=async()=>{if(!job?.id)return;const result=await request('stop',{id:job.id});if(result)setJob(null)};
 return <section className="computer-use" aria-label="Finessers AI computer">
 <header className="computer-use-heading"><div><span className="computer-use-kicker">FINESSERS / AI COMPUTER</span><h2>WHAT SHOULD I <em>HANDLE?</em></h2><p>Describe the task. Watch Finessers work. Step in only when it needs your approval.</p></div><span className="computer-use-status">{busy?'WORKING':job?.state==='awaiting-approval'?'NEEDS APPROVAL':job?.state==='human-control'?'YOUR TURN':job?.state?.toUpperCase()||'READY'}</span></header>
 <form className="computer-use-form" onSubmit={e=>{e.preventDefault();if(task.trim())request('start',{task:task.trim(),mode,startUrl:startUrl.trim(),humanLogin})}}>
 <label htmlFor="computer-task">YOUR TASK</label>
 <textarea id="computer-task" rows={4} value={task} onChange={e=>setTask(e.target.value)} placeholder="Go through Canvas and find everything due this week…" maxLength={2000} required disabled={busy||!!job?.id}/>
 <div className="computer-use-actions"><span><LockKeyhole size={14}/> Supervised browsing · You approve actions</span>{!job?.id?<button type="submit" disabled={busy||!task.trim()||(mode==='openai'&&!connected)}><Play size={16}/>{busy?'STARTING…':'START TASK'}</button>:<button type="button" className="computer-use-stop" onClick={stop} disabled={busy}><Square size={15}/> STOP</button>}</div>
 </form>
 <details className="computer-use-settings"><summary>Connection & advanced settings</summary>
 <p>Choose your AI engine and starting website. These settings are optional once configured.</p>
 <div className="computer-use-modes"><label><input type="radio" name="computer-mode" checked={mode==='local'} onChange={()=>setMode('local')} disabled={!!job?.id}/> Local AI (experimental)</label><label><input type="radio" name="computer-mode" checked={mode==='openai'} onChange={()=>setMode('openai')} disabled={!!job?.id}/> OpenAI API</label></div>
 {mode==='local'&&<p className="computer-use-local-help">Local mode requires Ollama and qwen2.5vl:7b. It may be unreliable.</p>}
 {mode==='openai'&&<div className="computer-use-key"><p>{serverReady===false?'Backend offline. Start npm run start:all.':connected?'OpenAI connected for this local server session.':'Connect an OpenAI API key. API billing is separate from ChatGPT.'}</p>{!connected?<form onSubmit={connect}><input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="OpenAI API key" required/><button type="submit" disabled={keyBusy||!key.trim()}>{keyBusy?'CHECKING…':'CONNECT'}</button></form>:<button type="button" onClick={disconnect}>Disconnect key</button>}{keyMessage&&<p role="status">{keyMessage}</p>}</div>}
 <label htmlFor="computer-start-url">Starting website</label><input id="computer-start-url" type="url" value={startUrl} onChange={e=>setStartUrl(e.target.value)} required maxLength={2000} disabled={busy||!!job?.id}/>
 <label className="computer-use-login-switch"><input type="checkbox" checked={humanLogin} onChange={e=>setHumanLogin(e.target.checked)} disabled={busy||!!job?.id}/> Let me sign in to Canvas in a separate browser window</label>
 {humanLogin&&<p>Requires CANVAS_BASE_URL and a starting URL on that Canvas domain. Login is handled directly by you, not the AI.</p>}
 <button type="button" onClick={checkDiagnostics}>Check system</button>{diagnostics&&<p role="status">{diagnostics.error||('Backend: '+diagnostics.backend+' · OpenAI: '+(diagnostics.openaiConnected?'connected':'not connected'))}</p>}
 </details>
 {job?.state==='human-control'&&<section className="computer-use-handoff" role="status"><strong>Sign in to continue</strong><p>Complete login in the separate Chromium window, then return here. Finessers does not observe your password during login.</p><button type="button" onClick={()=>request('resume',{id:job.id})} disabled={busy}>I'M SIGNED IN · CONTINUE</button></section>}
 <div className="computer-use-view"><div className="computer-use-view-top"><span><Monitor size={16}/> LIVE AI BROWSER</span>{job?.currentTitle&&<span>{job.currentTitle}</span>}</div>{job?.screen?<img src={job.screen} alt="Current screenshot of AI-controlled browser"/>:<div className="computer-use-placeholder"><Monitor size={40}/><strong>{job?.id?'Preparing browser…':'Your AI browser appears here'}</strong><p>Enter a task above to get started.</p></div>}</div>
 {job?.state==='awaiting-approval'&&<section className="computer-use-approval" role="status"><strong>Finessers needs your approval</strong><p>Next action: <b>{job.pending?.action?.type||'browser action'}</b>{job.pending?.action?.text?' — '+job.pending.action.text:''}. Review the screen before continuing.</p>{job.pending?.checks?.length>0&&<p>Additional safety checks apply.</p>}<div><button type="button" disabled={busy} onClick={()=>request('step',{id:job.id,approve:true})}><Check size={16}/> ALLOW & CONTINUE</button><button type="button" disabled={busy} className="computer-use-stop" onClick={()=>request('step',{id:job.id,approve:false})}><X size={16}/> DECLINE</button></div><details><summary>View proposed action details</summary><pre>{JSON.stringify(job.pending?.action||{},null,2)}</pre></details></section>}
 {job?.barrier&&<p className="computer-use-barrier" role="alert">{job.barrier.message}</p>}
 {job?.state==='error'&&job.recoverable&&<button type="button" className="computer-use-retry" onClick={()=>request('retry',{id:job.id})} disabled={busy}>RETRY</button>}
 {job?.summary&&<p className="computer-use-result">{job.summary}</p>}
 {(error||job?.error)&&<p className="computer-use-error" role="alert">{error||job.error}</p>}
 {job?.id&&['completed','error','stopped','blocked'].includes(job.state)&&<button type="button" onClick={stop}>NEW TASK</button>}
 {job?.id&&<details className="computer-use-history"><summary>Activity history · {job.steps?.length||0} steps</summary><p>{job.remainingActions??Math.max(0,40-(job.steps?.length||0))} actions remaining</p>{job.steps?.map((step,index)=><p key={index}>{index+1}. {step.label} {step.detail}</p>)}</details>}
 <p className="computer-use-local-help">Beta: actions require approval. Submitting assignments, purchases, and other write actions are blocked.</p>
 </section>;
}
