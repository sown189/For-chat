import React,{useEffect,useState} from 'react';
function parseLines(raw){
 const rows=String(raw||'').replace(/\r/g,'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
 return rows.flatMap(line=>line.length>230?line.split(/(?<=[.!?])\s+/).map(s=>s.trim()):[line]).filter(x=>x.length>=4).slice(0,40);
}
function makeCards(lines){return lines.map((line,i)=>{
 const split=line.split(/\s+[-–—:]\s+/);
 return {id:i,front:split.length>1?split[0]:'Explain: '+line.slice(0,80),back:split.length>1?split.slice(1).join(' — '):line};
})}
const studyDays=['Preview the material and list unfamiliar terms','Review first half of the material','Recall key ideas without notes','Review the remaining ideas','Practice questions and check mistakes','Revisit the toughest concepts','Self-test and review what you missed'];
export default function StudyGenerator({seed}){
 const [notes,setNotes]=useState('');
 const [cards,setCards]=useState([]);
 const [revealed,setRevealed]=useState([]);
 const [mode,setMode]=useState('flashcards');
 const [showGuide,setShowGuide]=useState(false);
 const [showPlan,setShowPlan]=useState(false);
 const [copyMessage,setCopyMessage]=useState('');
 const [origin,setOrigin]=useState(null);
 useEffect(()=>{if(!seed?.version)return;const text=String(seed.content||'').slice(0,12000);setNotes(text);setCards(makeCards(parseLines(text)));setRevealed([]);setOrigin({title:seed.title||'Selected page',sourceUrl:seed.sourceUrl||null});setShowGuide(true);setShowPlan(true)},[seed?.version]);
 const generate=()=>{setCards(makeCards(parseLines(notes)));setRevealed([])};
 const copy=async()=>{const content=cards.map(c=>c.front+' — '+c.back).join('\n');try{await navigator.clipboard.writeText(content);setCopyMessage('Study cards copied.')}catch{setCopyMessage('Clipboard unavailable.')}}; 
 return <section className="fx-tool-surface fx-generator"><h2>STUDY GENERATOR</h2><p>Turn the current page or your own notes into flashcards, recall prompts, a key-point outline and a 7-day study plan. These are generated locally with simple text rules, not AI; check for accuracy.</p>
 {origin&&<div className="fx-study-source"><strong>SOURCE: {origin.title}</strong>{origin.sourceUrl&&<a href={origin.sourceUrl} target="_blank" rel="noopener noreferrer">VERIFY ORIGINAL ↗</a>}</div>}
 <label htmlFor="fx-study-notes">YOUR NOTES</label><textarea id="fx-study-notes" value={notes} maxLength={12000} onChange={e=>setNotes(e.target.value)} placeholder={'Due process — Fair legal procedures\nVoir dire — Jury selection questioning'} rows={7}/>
 <div className="fx-inline-form"><button className="fx-neon" onClick={generate} disabled={!notes.trim()}>GENERATE STUDY CARDS</button><button onClick={()=>setMode(mode==='flashcards'?'quiz':'flashcards')}>{mode==='flashcards'?'QUIZ MODE':'FLASHCARDS'}</button><button onClick={()=>setShowGuide(x=>!x)}>KEY POINTS</button><button onClick={()=>setShowPlan(x=>!x)}>7-DAY PLAN</button><button onClick={copy} disabled={!cards.length}>COPY CARDS</button></div>
 {copyMessage&&<p role="status">{copyMessage}</p>}
 {showGuide&&<div className="fx-study-guide"><h3>KEY POINTS / REVIEW OUTLINE</h3>{parseLines(notes).slice(0,8).map((line,i)=><p key={i}>{i+1}. {line}</p>)}<small>Extracted from source text. Not an AI-generated summary.</small></div>}
 {showPlan&&<div className="fx-study-guide"><h3>7-DAY PRACTICE PLAN</h3>{studyDays.map((line,i)=><p key={i}>DAY {i+1} · {line}</p>)}<small>Template schedule. Adjust to the actual Canvas deadline.</small></div>}
 {cards.length>0&&<div className="fx-study-cards">{cards.map(c=><button key={c.id} onClick={()=>setRevealed(r=>r.includes(c.id)?r.filter(x=>x!==c.id):[...r,c.id])}><small>{mode==='quiz'?'PRACTICE QUESTION':'FLASHCARD'} {c.id+1}/{cards.length}</small><strong>{mode==='quiz'?'What does this mean? '+c.front:c.front}</strong><span>{revealed.includes(c.id)?c.back:'TAP TO REVEAL ANSWER'}</span></button>)}</div>}
 </section>;
}
