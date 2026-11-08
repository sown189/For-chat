import React,{useEffect,useState} from 'react';
import {Lightbulb,X,ArrowRight} from 'lucide-react';
import './context-tips.css';
const tips={
 browser:{title:'YOUR BROWSER, YOUR RULES',body:'Start with a tab, then choose whether to share page content with your copilot. Browser previews do not automatically share your Canvas login.',action:'Try the Canvas tab'},
 canvas:{title:'CONNECT BEFORE YOU EXPLORE',body:'Canvas courses and deadlines need a working local connection. Check the setup instructions if your account is not connected.',action:'Explore your courses'},
 agent:{title:'ASK. CHECK. LEARN.',body:'Ask the AI for explanations or study plans. It needs a configured model and may make mistakes, so verify against your assignment.',action:'Ask a study question'},
 study:{title:'TURN PAGES INTO PRACTICE',body:'Generate flashcards, outlines and plans from content you explicitly choose to share.',action:'Create study material'},
 missions:{title:'KEEP YOUR STREAK MOVING',body:'Use Missions to track your personal study goals. This is not your official Canvas gradebook.',action:'Set a mission'},
 tabs:{title:'LESS TAB CHAOS',body:'Organize page previews here. Previews are separate from a logged-in browser session.',action:'Open a tab'},
 setup:{title:'YOUR PRE-FLIGHT CHECK',body:'Check Canvas, AI and browser readiness here before relying on live academic workflows.',action:'Review setup'},
 tutorial:{title:'YOUR FIELD MANUAL',body:'Explore every feature at your own pace, or start the full interactive tour.',action:'Read the guide'}
};
function seen(key){try{return localStorage.getItem('finessers-tip-seen-'+key)==='true'}catch{return false}}
export default function ContextTips({view,enabled,onToggle,onGuide}){
 const [dismissed,setDismissed]=useState(()=>seen(view));
 useEffect(()=>setDismissed(seen(view)),[view]);
 const tip=tips[view];if(!tip)return null;
 const dismiss=()=>{try{localStorage.setItem('finessers-tip-seen-'+view,'true')}catch{}setDismissed(true)};
 return <div className="fx-context-wrap">
  <button className="fx-context-help" onClick={onToggle} aria-pressed={enabled} title={enabled?'Turn contextual tips off':'Turn contextual tips on'}><Lightbulb size={16}/>{enabled?'TIPS ON':'TIPS OFF'}</button>
  {enabled&&!dismissed&&<aside className="fx-context-tip" aria-label="Helpful tip" role="note"><div className="fx-context-icon"><Lightbulb size={19}/></div><div className="fx-context-copy"><strong>{tip.title}</strong><p>{tip.body}</p><div className="fx-context-actions"><button onClick={dismiss}>GOT IT <ArrowRight size={14}/></button><button onClick={()=>{dismiss();onGuide?.()}}>FULL GUIDE</button></div></div><button className="fx-context-close" aria-label="Dismiss tip" onClick={dismiss}><X size={17}/></button></aside>}
 </div>;
}