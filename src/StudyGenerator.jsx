import React,{useState} from 'react';
function parseLines(raw){return raw.split(/\n+/).map(s=>s.trim()).filter(Boolean).slice(0,40)}
function makeCards(lines){return lines.map((line,i)=>{const split=line.split(/\s+[-–—:]\s+/);return {id:i,front:split.length>1?split[0]:'Explain concept '+(i+1),back:split.length>1?split.slice(1).join(' — '):line}})}
export default function StudyGenerator(){
 const [notes,setNotes]=useState('');
 const [cards,setCards]=useState([]);
 const [revealed,setRevealed]=useState([]);
 const [mode,setMode]=useState('flashcards');
 const generate=()=>{setCards(makeCards(parseLines(notes)));setRevealed([])};
 return <section className="fx-tool-surface fx-generator"><h2>STUDY GENERATOR</h2><p>Paste course notes or term–definition pairs. Generate practice prompts locally without sending your notes to an AI provider.</p><label htmlFor="fx-study-notes">YOUR NOTES</label><textarea id="fx-study-notes" value={notes} maxLength={12000} onChange={e=>setNotes(e.target.value)} placeholder={'Due process — Fair legal procedures\nVoir dire — Jury selection questioning'} rows={7}/><div className="fx-inline-form"><button className="fx-neon" onClick={generate} disabled={!notes.trim()}>GENERATE STUDY CARDS</button><button onClick={()=>setMode(mode==='flashcards'?'quiz':'flashcards')}>{mode==='flashcards'?'QUIZ MODE':'FLASHCARDS'}</button></div>{cards.length>0&&<div className="fx-study-cards">{cards.map(c=><button key={c.id} onClick={()=>setRevealed(r=>r.includes(c.id)?r.filter(x=>x!==c.id):[...r,c.id])}><small>{mode==='quiz'?'PRACTICE QUESTION':'FLASHCARD'} {c.id+1}/{cards.length}</small><strong>{mode==='quiz'?'What does this mean? '+c.front:c.front}</strong><span>{revealed.includes(c.id)?c.back:'TAP TO REVEAL ANSWER'}</span></button>)}</div>}</section>
}
