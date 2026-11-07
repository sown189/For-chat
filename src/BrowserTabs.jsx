import LiveWebTab from './LiveWebTab.jsx';
import CanvasBrowser from './CanvasBrowser.jsx';
import React,{useEffect,useState} from 'react';
const KEY='finessers.tabs.v1';
const defaults=[{id:'canvas',title:'Canvas Live',url:'finessers://canvas'}];
function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'null');if(!Array.isArray(a))return defaults;const valid=a.slice(0,12).filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&typeof t.url==='string'&&(t.id==='canvas'||/^https?:\/\//i.test(t.url))).map(t=>({id:t.id.slice(0,80),title:t.title.slice(0,100),url:t.url}));return valid.length?valid:defaults}catch{return defaults}}
function safe(raw){try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();return u.toString()}catch{throw Error('Enter a valid http(s) website address')}}
export default function BrowserTabs(){
 const [tabs,setTabs]=useState(()=>{const items=load();return items.some(t=>t.id==='canvas')?items:[defaults[0],...items]});
 const [active,setActive]=useState(tabs[0].id);
 const [url,setUrl]=useState('');
 const [error,setError]=useState('');
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(tabs)),[tabs]);
 const current=tabs.find(t=>t.id===active)||tabs[0];
 const add=()=>{if(tabs.length>=12){setError('Maximum 12 tabs. Close one before opening another.');return}setError('');const t={id:crypto.randomUUID(),title:'New tab',url:'https://canvas.instructure.com/'};setTabs(a=>[...a,t]);setActive(t.id)};
 const navigate=e=>{e.preventDefault();try{const next=safe(url);setTabs(a=>a.map(t=>t.id===active?{...t,url:next,title:new URL(next).hostname}:t));setError('');setUrl('')}catch(e){setError(e.message)}};
 const close=id=>{if(id==='canvas'||tabs.length===1)return;const next=tabs.filter(t=>t.id!==id);setTabs(next);if(active===id)setActive(next[0].id)};
 return <section className="fx-tool-surface fx-tabs"><h2>BROWSER TABS</h2><p>Save your coursework website shortcuts. The Canvas Live tab uses your server-side Canvas API connection. Other tabs can launch isolated, read-only browser previews; they do not inherit your Chrome login.</p><div className="fx-tab-strip" role="tablist">{tabs.map(t=><div key={t.id}><button role="tab" aria-selected={t.id===active} onClick={()=>setActive(t.id)}>{t.title}</button>{t.id!=='canvas'&&<button aria-label={'Close '+t.title} onClick={()=>close(t.id)}>×</button>}</div>)}<button onClick={add}>+ NEW TAB</button></div>{current?.id!=='canvas'&&<form onSubmit={navigate} className="fx-inline-form"><input aria-label="Website address" placeholder={current?.url} value={url} onChange={e=>setUrl(e.target.value)}/><button type="submit" className="fx-neon">SAVE ADDRESS</button></form>}{error&&<p role="alert">{error}</p>}{current?.id==='canvas'?<CanvasBrowser/>:<div className="fx-tab-preview"><strong>{current?.title}</strong><p>{current?.url}</p><a href={current?.url} target="_blank" rel="noopener noreferrer">OPEN WEBSITE IN NEW TAB ↗</a><LiveWebTab key={current?.id+'-'+current?.url} url={current?.url}/></div>}</section>
}
