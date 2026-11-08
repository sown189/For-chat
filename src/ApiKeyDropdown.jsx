import React,{useEffect,useState} from 'react';
import {ChevronDown,KeyRound,CheckCircle2} from 'lucide-react';
export default function ApiKeyDropdown(){
 const [open,setOpen]=useState(false),[key,setKey]=useState(''),[connected,setConnected]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{fetch('/api/agent/health').then(r=>r.json()).then(d=>setConnected(!!d.openaiConnected)).catch(()=>{})},[]);
 const save=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
  const r=await fetch('/api/agent/provider-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'openai',key:key.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Could not connect API key');
  setKey('');setConnected(true);setMessage('OpenAI connected for this local session.');
 }catch(e){setMessage(e.message)}finally{setBusy(false)}};
 const disconnect=async()=>{setBusy(true);setMessage('');try{const r=await fetch('/api/agent/provider-key',{method:'DELETE'});if(!r.ok)throw Error('Disconnect failed');setConnected(false);setKey('');setMessage('Key disconnected.')}catch(e){setMessage(e.message)}finally{setBusy(false)}};
 return <div className="fx-api-dropdown"><button type="button" className="fx-api-trigger" aria-expanded={open} aria-controls="fx-api-panel" onClick={()=>setOpen(v=>!v)}>{connected?<CheckCircle2 size={16}/>:<KeyRound size={16}/>} AI Key <ChevronDown size={14}/></button>{open&&<div id="fx-api-panel" className="fx-api-panel"><strong>Connect OpenAI</strong><p>{connected?'Your OpenAI API key is connected.':'Enter your OpenAI API key to use cloud AI features.'}</p>{!connected?<form onSubmit={save}><label htmlFor="fx-openai-key">API key</label><input id="fx-openai-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-..." required/><button type="submit" disabled={busy||!key.trim()}>{busy?'Connecting…':'Connect key'}</button></form>:<button type="button" onClick={disconnect} disabled={busy}>Disconnect key</button>}<small>Stored in local backend memory only. API usage is billed separately from ChatGPT.</small>{message&&<p role="status">{message}</p>}</div>}</div>;
}
