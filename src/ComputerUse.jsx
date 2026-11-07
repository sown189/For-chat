import React,{useState,useEffect} from 'react';
import {Play,Square,Check,X,Monitor,LockKeyhole} from 'lucide-react';
export default function ComputerUse(){
 const [task,setTask]=useState('');
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
 useEffect(()=>{fetch('/api/agent/health').then(async r=>{if(!r.ok)throw Error('Backend unavailable');const d=await r.json();setServerReady(true);setConnected(!!d.modelConfigured)}).catch(()=>setServerReady(false))},[]);
 const connect=async(e)=>{e.preventDefault();setKeyBusy(true);setKeyMessage('');try{
  const r=await fetch('/api/agent/provider-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'openai',key:key.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Key rejected');
  setConnected(true);setKey('');setKeyMessage('API key connected for this server session.');
 }catch(e){setKeyMessage(e.message)}finally{setKeyBusy(false)}};
 const disconnect=async()=>{await fetch('/api/agent/provider-key',{method:'DELETE'});setConnected(false);setKeyMessage('Key disconnected.')};

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
 const stop=async()=>{if(job?.id)await request('stop',{id:job.id});setJob(null)};
 return <section className="computer-use">
  <header className="computer-use-heading"><div><span className="computer-use-kicker">FINESSERS / COMPUTER USE</span><h2>TELL IT. <em>WATCH IT.</em></h2><p>Describe what you want done. An AI model navigates a separate read-only browser while you watch and approve each action. Form submissions and other write requests are blocked in this beta.</p></div><span className="computer-use-status">{busy?'WORKING':job?.state?.toUpperCase()||'READY'}</span></header>

  <div className="computer-use-diagnostics"><button type="button" onClick={checkDiagnostics}>CHECK SYSTEM</button>{diagnostics&&<p role="status">{diagnostics.error||('Backend: '+diagnostics.backend+' · Computer route: '+(diagnostics.computerRoute?'available':'missing')+' · OpenAI key: '+(diagnostics.openaiConnected?'connected':'not connected')+' · Version: '+diagnostics.version)}</p>}</div>
  {mode==='openai'&&<details className="computer-use-key" open={!connected}><summary><LockKeyhole size={16}/> OPENAI CONNECTION — {serverReady===false?'SERVER OFFLINE':connected?'CONNECTED':'SETUP REQUIRED'}</summary>
  <p>{serverReady===false?'Start the Finessers backend with npm run start:all.':connected?'Your key is stored in local backend memory until restart.':'Create a key at platform.openai.com/api-keys. API usage is billed separately from ChatGPT.'}</p>
  {!connected?<form onSubmit={connect}><input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="OpenAI API key" required/><button type="submit" disabled={keyBusy||!key.trim()}>{keyBusy?'CHECKING...':'CONNECT KEY'}</button></form>:<button type="button" onClick={disconnect}>DISCONNECT KEY</button>}
  {keyMessage&&<p role="status">{keyMessage}</p>}
  </details>}
  <div className="computer-use-modes"><label><input type="radio" name="computer-mode" checked={mode==='local'} onChange={()=>setMode('local')}/> LOCAL AI (OLLAMA · EXPERIMENTAL)</label><label><input type="radio" name="computer-mode" checked={mode==='openai'} onChange={()=>setMode('openai')}/> OPENAI API</label></div>
  {mode==='local'&&<p className="computer-use-local-help">No API key required. Install Ollama, then run <code>ollama pull qwen2.5vl:7b</code>. This experimental local vision agent may make mistakes; approve each action carefully.</p>}
  <form className="computer-use-form" onSubmit={e=>{e.preventDefault();if(task.trim())request('start',{task:task.trim(),mode})}}>
   <label htmlFor="computer-task">WHAT SHOULD FINESSERS DO?</label>
   <textarea id="computer-task" rows={3} value={task} onChange={e=>setTask(e.target.value)} placeholder="Find my university's academic calendar and tell me the next important deadlines..." maxLength={2000} required disabled={busy||!!job?.id}/>
   <div className="computer-use-actions"><span><LockKeyhole size={14}/> {mode==='local'?'Local Ollama vision model':connected?'OpenAI connected':'Connect your OpenAI key above'}</span>{!job?.id?<button type="submit" disabled={busy||!task.trim()||(mode==='openai'&&!connected)}><Play size={16}/> {busy?'STARTING...':'START COMPUTER USE'}</button>:<button type="button" className="computer-use-stop" onClick={stop} disabled={busy}><Square size={15}/> STOP SESSION</button>}</div>
  </form>
  <div className="computer-use-view"><div className="computer-use-view-top"><span><Monitor size={16}/> AI BROWSER SCREEN</span>{job?.id&&<button type="button" onClick={()=>request('status',{id:job.id})} disabled={busy}>REFRESH SCREEN</button>}</div>{job?.screen?<img src={job.screen} alt="Live screenshot of the AI-controlled browser"/>:<div className="computer-use-placeholder"><Monitor size={40}/><strong>YOUR AI COMPUTER IS READY</strong><p>Start a task to see the browser screen here.</p></div>}</div>
  {job?.state==='awaiting-approval'&&<div className="computer-use-approval" role="status"><strong>APPROVE NEXT COMPUTER ACTION</strong><p>The AI wants to <b>{job.pending?.action?.type}</b>{job.pending?.action?.text?' — '+job.pending.action.text:''}. Check the screenshot before approving. Only approve actions you understand. Write requests are blocked, but some websites can change data through links.</p><div><button disabled={busy} onClick={()=>request('step',{id:job.id,approve:true})}><Check size={16}/> APPROVE & CONTINUE</button><button disabled={busy} className="computer-use-stop" onClick={()=>request('step',{id:job.id,approve:false})}><X size={16}/> DECLINE</button></div></div>}
  {job?.id&&['completed','error','stopped'].includes(job.state)&&<button type="button" onClick={stop}>NEW TASK</button>}
  {job?.summary&&<p className="computer-use-result">{job.summary}</p>}
  {(error||job?.error)&&<p className="computer-use-error" role="alert">{error||job.error}</p>}
  {job?.steps?.length>0&&<details className="computer-use-history"><summary>COMPLETED ACTIONS ({job.steps.length})</summary>{job.steps.map((s,i)=><p key={i}>{i+1}. {s.label} {s.detail}</p>)}</details>}
 </section>
}
