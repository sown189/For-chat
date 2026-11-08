import React,{useEffect,useState} from 'react';
import {ArrowRight,ArrowLeft,BookOpen,CheckCircle2,X,Sparkles,ShieldCheck} from 'lucide-react';
import './tutorial.css';
export const steps=[
 {id:'setup',title:'CHECK YOUR CONNECTIONS',subtitle:'START HERE',body:'Open Beta Setup to see what is configured. Canvas and AI features require separate local connections; a green-looking interface does not mean your accounts are connected.',tip:'Never paste Canvas tokens or passwords into chat.'},
 {id:'browser',title:'EXPLORE THE AI BROWSER',subtitle:'YOUR COMMAND CENTER',body:'Use the browser workspace for website previews, Canvas deadlines and the copilot. Previews do not automatically inherit your school login.',tip:'Choose a tab and inspect the page before sharing its content.'},
 {id:'canvas',title:'CONNECT CANVAS',subtitle:'COURSE INTELLIGENCE',body:'After configuring your local Canvas connection, open Canvas to browse courses, assignments and deadlines. Verify real account access before relying on the results.',tip:'Canvas access is read-only in this beta.'},
 {id:'agent',title:'ASK THE AI COPILOT',subtitle:'STUDY SMARTER',body:'Ask for explanations, outlines and study plans. The AI requires a configured model. Check its answers against your course instructions.',tip:'AI responses can be wrong; review before using.'},
 {id:'study',title:'MAKE STUDY MATERIALS',subtitle:'TURN CONTEXT INTO PRACTICE',body:'Use Study to turn approved page or assignment context into flashcards, outlines and a study plan. Share content only when you choose to.',tip:'Do not share private student data unnecessarily.'},
 {id:'tabs',title:'ORGANIZE YOUR TABS',subtitle:'LESS TAB CHAOS',body:'Keep track of website previews and course pages in one place. A preview is not a full authenticated browser session.',tip:'Browser actions remain supervised.'},
 {id:'missions',title:'TRACK YOUR MISSIONS',subtitle:'KEEP MOMENTUM',body:'Use Missions to track your goals and study progress locally.',tip:'Your mission list is not a Canvas gradebook.'},
 {id:'browser',title:'REVIEW EVERY ACTION',subtitle:'YOU ARE IN CONTROL',body:'Expand Supervised Computer-Use Agent in the browser to review suggested actions. Approve only actions you understand, and stop the session when needed.',tip:'No automatic assignment submission.'}
];
export default function Tutorial({mode='page',onClose,onNavigate,onStartTour}){
 const [index,setIndex]=useState(0);
 useEffect(()=>{if(mode!=='tour')return;const key=e=>{if(e.key==='Escape')onClose?.();if(e.key==='ArrowRight')setIndex(i=>Math.min(steps.length-1,i+1));if(e.key==='ArrowLeft')setIndex(i=>Math.max(0,i-1))};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[mode,onClose]);
 const step=steps[index];const tour=mode==='tour';
 return <div className={tour?'fx-guide-overlay':'fx-guide-page'} role={tour?'dialog':undefined} aria-modal={tour?'true':undefined} aria-label={tour?'Finessers guided tour':undefined}>
  {tour&&<button className="fx-guide-backdrop" aria-label="Close guided tour" onClick={onClose}/>}
  <section className="fx-guide-panel">
   <div className="fx-guide-top"><span><Sparkles size={16}/> FINESSERS / FIELD MANUAL</span>{tour?<button onClick={onClose} aria-label="Close tour"><X size={20}/></button>:<button onClick={onStartTour}>START INTERACTIVE TOUR <ArrowRight size={16}/></button>}</div>
   <div className="fx-guide-progress" aria-label={`Step ${index+1} of ${steps.length}`}>{steps.map((s,i)=><button key={i} aria-label={`Go to step ${i+1}: ${s.title}`} aria-current={i===index?'step':undefined} className={i<=index?'active':''} onClick={()=>setIndex(i)}/>)}</div>
   <div className="fx-guide-content"><span className="fx-guide-kicker">0{index+1} / 0{steps.length} — {step.subtitle}</span><BookOpen size={36}/><h2>{step.title}</h2><p>{step.body}</p><div className="fx-guide-tip"><ShieldCheck size={18}/>{step.tip}</div></div>
   <div className="fx-guide-actions"><button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}><ArrowLeft size={17}/> BACK</button><button onClick={()=>{if(tour)onClose?.();onNavigate?.(step.id)}}>OPEN {step.id.toUpperCase()} <ArrowRight size={16}/></button>{index===steps.length-1?<button className="fx-guide-primary" onClick={()=>{if(tour)onClose?.();else onNavigate?.('browser')}}><CheckCircle2 size={17}/> FINISH</button>:<button className="fx-guide-primary" onClick={()=>setIndex(i=>i+1)}>NEXT STEP <ArrowRight size={17}/></button>}</div>
  </section>
 </div>;
}