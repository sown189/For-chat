import React,{useEffect,useState} from 'react';
const STORE='finessers.missions.v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}};
export default function Missions(){
 const [missions,setMissions]=useState(read);
 const [name,setName]=useState('');
 useEffect(()=>{localStorage.setItem(STORE,JSON.stringify(missions))},[missions]);
 const add=e=>{e.preventDefault();const title=name.trim();if(!title)return;setMissions(m=>[{id:crypto.randomUUID(),title,status:'planned',created:new Date().toISOString(),steps:[]},...m]);setName('')};
 const update=(id,status)=>setMissions(m=>m.map(x=>x.id===id?{...x,status}:x));
 return <section className="fx-tool-surface fx-missions"><h2>YOUR MISSIONS</h2><p>Keep track of multi-step goals. Missions are stored on this device; they do not run in the background.</p><form onSubmit={add} className="fx-inline-form"><input aria-label="New mission" value={name} maxLength={180} onChange={e=>setName(e.target.value)} placeholder="e.g. Review everything due this week"/><button className="fx-neon" type="submit">CREATE MISSION</button></form>{missions.length===0?<p>No missions yet. Create your first study goal.</p>:<div className="fx-mission-list">{missions.map(m=><article key={m.id}><strong>{m.title}</strong><small>{m.status.toUpperCase()} · {new Date(m.created).toLocaleDateString()}</small><div><button onClick={()=>update(m.id,'in-progress')}>START</button><button onClick={()=>update(m.id,'completed')}>COMPLETE</button><button onClick={()=>setMissions(a=>a.filter(x=>x.id!==m.id))}>DELETE</button></div></article>)}</div>}</section>
}
