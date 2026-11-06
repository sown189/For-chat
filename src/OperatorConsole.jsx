import React,{useState} from 'react';

export default function OperatorConsole(){
 const [url,setUrl]=useState('https://example.com');
 const [session,setSession]=useState(null);
 const [action,setAction]=useState('click');
 const [index,setIndex]=useState('0');
 const [value,setValue]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [log,setLog]=useState([]);
 const [preview,setPreview]=useState('');
 async function call(path,payload){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/operator/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Operator request failed');
   if(path==='close'){setSession(null);setPreview('')}else if(path==='screenshot')setPreview(result.image);else {setSession(old=>({...old,...result,id:result.id||old?.id}));setPreview('')}
   setLog(old=>[...old,(path==='start'?'Opened ':path==='act'?'Action completed on ':'Session closed: ')+(result.title||result.url||'browser')].slice(-12));
  }catch(e){setError(e.message)}
  finally{setBusy(false)}
 }
 const submitAction=e=>{
  e.preventDefault();
  if(!session)return;
  const selected={type:action};
  if(action==='navigate')selected.url=value;
  else if(action==='scroll')selected.amount=Number(value||500);
  else {selected.index=Number(index);if(action==='fill'||action==='select')selected.value=value}
  if((action==='fill'||action==='select')&&!window.confirm('Allow this browser field change?'))return;
  call('act',{id:session.id,action:selected});
 };
 return <section className="panel operator2">
  <div className="operator2-head"><span className="operator2-kicker">FINESSERS / BROWSER LAB</span><h3>YOUR BROWSER. <em>YOUR CONTROL.</em></h3><span className="operator2-state">{session?"● CONNECTED":"○ READY"}</span></div>
  <p className="operator2-intro">Open a website, explore its interactive elements, and control each step. This is a supervised browser lab, not yet an autonomous AI agent.</p>
  <div className="operator2-step"><b>01</b><span>OPEN A WEBSITE</span></div><form className="operator2-address" onSubmit={e=>{e.preventDefault();call('start',{url})}}>
   <input aria-label="Browser URL" type="url" value={url} onChange={e=>setUrl(e.target.value)} required />
   <button disabled={busy||!!session}>{busy?"CONNECTING...":"OPEN BROWSER"}</button>
  </form>
  {!session&&<div className="operator2-empty"><strong>READY WHEN YOU ARE.</strong><p>Enter a public website above to start exploring.</p></div>}{session&&<>
   <div className="operator2-page"><span>● LIVE PAGE</span><strong>{session.title}</strong><a href={session.url} target="_blank" rel="noreferrer">{session.url}</a></div><div className="operator2-step"><b>02</b><span>CHOOSE YOUR NEXT ACTION</span></div>
   <form className="operator2-actions" onSubmit={submitAction}>
    <select aria-label="Browser action" value={action} onChange={e=>setAction(e.target.value)}>{['click','fill','select','scroll','navigate'].map(a=><option key={a}>{a}</option>)}</select>
    {['click','fill','select'].includes(action)&&<input aria-label="Control index" type="number" min="0" max="99" value={index} onChange={e=>setIndex(e.target.value)} />}
    {action!=='click'&&<input aria-label="Action value" placeholder={action==='navigate'?'https://...':action==='scroll'?'Scroll pixels':'Value'} value={value} onChange={e=>setValue(e.target.value)} />}
    <button disabled={busy}>{busy?"WORKING...":"RUN ACTION"}</button>
   </form>
   <button type="button" disabled={busy} onClick={()=>call('observe',{id:session.id})}>REFRESH PAGE</button>{' '}
   <button type="button" disabled={busy} onClick={()=>call('close',{id:session.id})}>CLOSE SESSION</button>
   <h4>PAGE ELEMENTS <small>SELECT ONE TO USE IT</small></h4>
   <div className="operator2-elements">{session.controls?.map(c=><button type="button" key={c.index} onClick={()=>setIndex(String(c.index))} className={String(c.index)===index?"chosen":""}>#{c.index} {c.tag} — {c.label||'(unlabeled)'}</button>)}</div>
   <h4>PAGE TEXT</h4><pre className="operator2-text">{session.text}</pre>
  </>}
  {error&&<p className="operator2-error" role="alert">{error}</p>}
  {busy&&<p role="status">Working...</p>}
  {log.length>0&&<details><summary>Activity log</summary>{log.map((entry,i)=><p key={i}>{entry}</p>)}</details>}
 </section>
}
