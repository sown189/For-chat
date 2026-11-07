import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,BrainCircuit,Command,GraduationCap,Layers3,Monitor,Search,ShieldCheck,Sparkles,Target,X} from 'lucide-react';

const pages=[
 {id:'browser',label:'AI Browser',desc:'Your web and Canvas workspace',Icon:Monitor,keywords:'browser tabs home'},
 {id:'agent',label:'AI Agent',desc:'Ask questions and make study plans',Icon:BrainCircuit,keywords:'chat assistant tutor'},
 {id:'canvas',label:'Canvas',desc:'Courses, assignments, deadlines',Icon:GraduationCap,keywords:'school classes courses'},
 {id:'study',label:'Study Studio',desc:'Flashcards, quizzes and local study plans',Icon:BookOpen,keywords:'flashcards notes practice'},
 {id:'missions',label:'Missions',desc:'Your saved goals and tasks',Icon:Target,keywords:'task goals'},
 {id:'tabs',label:'Saved Tabs',desc:'Your coursework website shortcuts',Icon:Layers3,keywords:'websites'},
 {id:'setup',label:'Beta Setup',desc:'Connection and privacy checks',Icon:ShieldCheck,keywords:'settings privacy readiness'}
];

export default function QuickSwitch({onClose,onNavigate,onStudy,hasPage}){
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(0);
 const input=useRef(null);
 const previousFocus=useRef(null);
 const actions=useMemo(()=>{
  const extra=hasPage?[{id:'study-page',label:'Study current page',desc:'Create local study cards from the active page',Icon:Sparkles,keywords:'page flashcards notes'}]:[];
  const search=query.trim().toLowerCase();
  return [...extra,...pages].filter(a=>!search||[a.label,a.desc,a.keywords].join(' ').toLowerCase().includes(search));
 },[query,hasPage]);
 useEffect(()=>{previousFocus.current=document.activeElement;input.current?.focus();return()=>previousFocus.current?.focus?.()},[]);
 useEffect(()=>setSelected(0),[query]);
 const launch=action=>{if(action.id==='study-page')onStudy?.();else onNavigate(action.id);onClose()};
 const keydown=e=>{
  if(e.key==='Escape'){e.preventDefault();onClose()}
  if(e.key==='ArrowDown'){e.preventDefault();setSelected(s=>Math.min(actions.length-1,s+1))}
  if(e.key==='ArrowUp'){e.preventDefault();setSelected(s=>Math.max(0,s-1))}
  if(e.key==='Enter'&&actions[selected]){e.preventDefault();launch(actions[selected])}
 };
 return <div className="fx-command-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="fx-command-dialog" role="dialog" aria-modal="true" aria-label="Quick switch" onKeyDown={keydown}>
   <div className="fx-command-head"><span><Command size={17}/> FINESSERS / COMMAND CENTER</span><button aria-label="Close command menu" onClick={onClose}><X size={18}/></button></div>
   <label className="fx-command-search"><Search size={24}/><input ref={input} aria-label="Search commands" placeholder="Where are we going?" value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/><kbd>ESC</kbd></label>
   <div className="fx-command-results" role="listbox" aria-label="Commands">
    {actions.length?actions.map((action,i)=><button key={action.id} role="option" aria-selected={selected===i} className={selected===i?'selected':''} onMouseEnter={()=>setSelected(i)} onClick={()=>launch(action)}>
     <span className="fx-command-action-icon"><action.Icon size={20}/></span>
     <span className="fx-command-action-copy"><strong>{action.label}</strong><small>{action.desc}</small></span>
     <ArrowUpRight size={16}/>
    </button>):<div className="fx-command-empty">No matching moves. Try “browser”, “study”, or “Canvas”.</div>}
   </div>
   <footer><span><kbd>↑</kbd> <kbd>↓</kbd> NAVIGATE</span><span><kbd>↵</kbd> OPEN</span><span>DON'T STRESS IT. <em>FINESSE IT.</em></span></footer>
  </section>
 </div>;
}
