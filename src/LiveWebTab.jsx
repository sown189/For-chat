import React,{useEffect,useRef,useState} from 'react';
async function api(path,body){const r=await fetch('/api/operator/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Browser request failed');return data}
export default function LiveWebTab({url}){
 const [session,setSession]=useState(null);
 const [image,setImage]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [address,setAddress]=useState(url);
 const [controlsOpen,setControlsOpen]=useState(false);
 const currentId=useRef(null);
 const mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;if(currentId.current)api('close',{id:currentId.current}).catch(()=>{})},[]);
 const open=async()=>{setBusy(true);setError('');try{if(currentId.current){await api('close',{id:currentId.current}).catch(()=>{});currentId.current=null;setSession(null);setImage('')}const data=await api('start',{url});if(!mounted.current){await api('close',{id:data.id}).catch(()=>{});return}currentId.current=data.id;setSession(data);const shot=await api('screenshot',{id:data.id});if(mounted.current)setImage(shot.image)}catch(e){if(mounted.current)setError(e.message)}finally{if(mounted.current)setBusy(false)}};
 const refresh=async()=>{if(!session)return;setBusy(true);try{const data=await api('observe',{id:session.id});if(mounted.current)setSession(data);const shot=await api('screenshot',{id:session.id});if(mounted.current)setImage(shot.image)}catch(e){setError(e.message)}finally{setBusy(false)}};
 const perform=async action=>{
  if(!currentId.current)return;
  setBusy(true);setError('');
  try{
   const data=await api('act',{id:currentId.current,action});
   if(mounted.current){setSession(data);setAddress(data.url)}
   const shot=await api('screenshot',{id:currentId.current});
   if(mounted.current)setImage(shot.image);
  }catch(e){if(mounted.current)setError(e.message)}
  finally{if(mounted.current)setBusy(false)}
 };
 const stop=async()=>{if(!currentId.current)return;const id=currentId.current;currentId.current=null;setSession(null);setImage('');try{await api('close',{id})}catch(e){setError(e.message)}};
 const go=e=>{e.preventDefault();try{const parsed=new URL(address);if(!['http:','https:'].includes(parsed.protocol))throw Error();perform({type:'navigate',url:parsed.href})}catch{setError('Enter a valid HTTP(S) address')}};
 return <section className="fx-live-web"><p>Live read-only browser preview. This runs in a separate temporary Playwright session; it does not share your Chrome login or Canvas credentials.</p><div className="fx-inline-form"><button onClick={open} disabled={busy}>{session?'RESTART BROWSER':'START LIVE BROWSER'}</button><button onClick={refresh} disabled={busy||!session}>REFRESH SCREEN</button><button onClick={stop} disabled={busy||!session}>STOP SESSION</button></div>{error&&<p role="alert">{error}</p>}{session&&<><form onSubmit={go} className="fx-inline-form"><input aria-label="Navigate browser to URL" value={address} onChange={e=>setAddress(e.target.value)}/><button disabled={busy} type="submit">GO</button></form><div className="fx-inline-form"><button disabled={busy} onClick={()=>perform({type:'scroll',amount:-600})}>SCROLL UP</button><button disabled={busy} onClick={()=>perform({type:'scroll',amount:600})}>SCROLL DOWN</button><button onClick={()=>setControlsOpen(x=>!x)}>{controlsOpen?'HIDE LINKS':'SHOW PAGE LINKS'}</button></div>{controlsOpen&&<div className="fx-canvas-items">{(session.controls||[]).filter(c=>c.tag==='a').map(c=><button key={c.index} disabled={busy} onClick={()=>perform({type:'click',index:c.index})}>{c.label||'Link '+c.index}</button>)}</div>}<strong>{session.title}</strong><p>{session.url}</p>{image&&<img alt={'Live browser screenshot of '+session.title} src={image} style={{width:'100%',height:'auto',border:'1px solid #46523f',borderRadius:10}}/>}<details><summary>READ PAGE TEXT</summary><pre style={{whiteSpace:'pre-wrap',maxHeight:300,overflow:'auto'}}>{session.text}</pre></details></>}</section>;
}
