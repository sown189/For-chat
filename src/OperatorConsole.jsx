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
 async function call(path,payload){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/operator/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Operator request failed');
   if(path==='close')setSession(null);else setSession(result);
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
 return <section className="panel" style={{marginTop:24}}>
  <h3>OPERATOR 2.0 / BROWSER CONTROLS</h3>
  <p>Experimental local browser session. Read page content, navigate and test individual actions. AI-selected actions are not connected yet. Do not use for passwords or sensitive information.</p>
  <form onSubmit={e=>{e.preventDefault();call('start',{url})}} style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>
   <input aria-label="Browser URL" type="url" value={url} onChange={e=>setUrl(e.target.value)} required style={{flex:1,minWidth:220}}/>
   <button disabled={busy||!!session}>OPEN BROWSER</button>
  </form>
  {session&&<>
   <p><strong>{session.title}</strong> — <a href={session.url} target="_blank" rel="noreferrer">{session.url}</a></p>
   <form onSubmit={submitAction} style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>
    <select aria-label="Browser action" value={action} onChange={e=>setAction(e.target.value)}>{['click','fill','select','scroll','navigate'].map(a=><option key={a}>{a}</option>)}</select>
    {['click','fill','select'].includes(action)&&<input aria-label="Control index" type="number" min="0" max="99" value={index} onChange={e=>setIndex(e.target.value)} style={{width:90}}/>}
    {action!=='click'&&<input aria-label="Action value" placeholder={action==='navigate'?'https://...':action==='scroll'?'Scroll pixels':'Value'} value={value} onChange={e=>setValue(e.target.value)} style={{flex:1,minWidth:160}}/>}
    <button disabled={busy}>RUN ACTION</button>
   </form>
   <button type="button" disabled={busy} onClick={()=>call('observe',{id:session.id})}>REFRESH PAGE</button>{' '}
   <button type="button" disabled={busy} onClick={()=>call('close',{id:session.id})}>CLOSE SESSION</button>
   <h4 style={{marginTop:18}}>PAGE CONTROLS</h4>
   <div style={{maxHeight:210,overflow:'auto'}}>{session.controls?.map(c=><button type="button" key={c.index} onClick={()=>setIndex(String(c.index))} style={{display:'block',margin:'5px 0',textAlign:'left',maxWidth:'100%'}}>#{c.index} {c.tag} — {c.label||'(unlabeled)'}</button>)}</div>
   <h4>PAGE TEXT</h4><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:250,overflow:'auto'}}>{session.text}</pre>
  </>}
  {error&&<p role="alert" style={{color:'#ff7777'}}>{error}</p>}
  {busy&&<p role="status">Working...</p>}
  {log.length>0&&<details><summary>Activity log</summary>{log.map((entry,i)=><p key={i}>{entry}</p>)}</details>}
 </section>
}
