import React,{useEffect,useState} from 'react';
async function call(path,method='GET'){const r=await fetch('/api/canvas/oauth/'+path,{method,headers:method==='POST'?{'Content-Type':'application/json'}:{}});const d=await r.json();if(!r.ok)throw Error(d.error||'Canvas connection failed');return d}
export default function CanvasConnection({onConnected}){
 const [status,setStatus]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const refresh=async()=>{try{setStatus(await call('status'));setError('')}catch(e){setError(e.message)}};
 useEffect(()=>{refresh()},[]);
 const connect=async()=>{setBusy(true);try{const data=await call('start','POST');const opened=window.open(data.url,'_blank','noopener,noreferrer');if(!opened)setError('Pop-up blocked. Allow pop-ups for Finessers and try again.');else setError('Finish login in the new Canvas tab, then select Check Connection.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 const check=async()=>{setBusy(true);try{const next=await call('status');setStatus(next);if(next.connected){setError('');onConnected?.()}else setError('Canvas is not connected yet. Complete login in the Canvas tab.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 const disconnect=async()=>{setBusy(true);try{setStatus(await call('disconnect','POST'));setError('Canvas OAuth connection disconnected.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="fx-canvas-connection"><strong>CANVAS CONNECTION</strong><p>{status?.connected?'OAuth connected':status?.legacyTokenConfigured?'Connected using local API token':status?.available?'Canvas OAuth ready — sign in with your school Canvas account':'Canvas OAuth not configured on your local backend'}</p><div className="fx-inline-form">{status?.available&&!status?.connected&&<button disabled={busy} onClick={connect}>CONNECT CANVAS</button>}{status?.available&&<button disabled={busy} onClick={check}>CHECK CONNECTION</button>}{status?.connected&&<button disabled={busy} onClick={disconnect}>DISCONNECT OAUTH</button>}<button disabled={busy} onClick={refresh}>REFRESH STATUS</button></div>{error&&<p role="status">{error}</p>}</div>;
}
