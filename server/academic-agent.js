import {investigateCourseMission} from './course-investigation.js';
export function createAcademicAgent({loadAssignments,readAssignment,reason,openSource}){
 if(!loadAssignments||!readAssignment||!reason)throw Error('Missing agent dependencies');
 const sessions=new Map();
 const MAX_SESSIONS=100;
 const MAX_EVENTS=40;
 const id=()=>globalThis.crypto.randomUUID();
 async function run(goal,{limit=5}={}){
  if(typeof goal!=='string'||!goal.trim()||goal.length>2000)throw Error('Provide a clear task under 2000 characters');
  const session={id:id(),goal:goal.trim(),state:'running',events:[],pending:null,report:null,answer:null,error:null};
  if(sessions.size>=MAX_SESSIONS)sessions.delete(sessions.keys().next().value);
  sessions.set(session.id,session);
  const event=(type,detail)=>{session.events.push({type,detail,at:new Date().toISOString()});if(session.events.length>MAX_EVENTS)session.events.shift()};
  try{
   event('plan','Read upcoming Canvas assignments, inspect priority requirements, then build a grounded study response');
   const assignments=await loadAssignments();
   event('observe','Found '+assignments.length+' dated assignments');
   session.report=await investigateCourseMission(assignments,readAssignment,{limit});
   event('inspect','Read '+session.report.reviewed+' assignment descriptions; '+session.report.unavailable+' unavailable');
   if(session.report.reviewed===0){
    session.answer=session.report.mission.nextAction;
    session.state='completed';event('complete','No readable descriptions; provided verified next action');return session;
   }
   const sources=session.report.investigations.filter(x=>x.guide).map(x=>({title:x.task.title,course:x.task.course,dueAt:x.task.dueAt,url:x.guide.sourceUrl,requirements:x.guide.requirements}));
   session.sources=sources;
   session.answer=await reason({goal:session.goal,sources,limits:session.report.limitations});
   if(typeof session.answer!=='string'||!session.answer.trim())throw Error('Tutoring model returned no usable response');
   event('reason','Generated tutoring guidance from observed assignment descriptions');
   const first=session.report.investigations.find(x=>x.guide?.sourceUrl);
   if(first&&openSource){
    session.pending={type:'open-source',url:first.guide.sourceUrl,title:first.task.title};
    session.state='awaiting-approval';event('approval','Opening the source in a browser requires student approval');
   }else{session.state='completed';event('complete','Guidance ready')}
  }catch(e){session.error=String(e.message||e).slice(0,500);session.state='error';event('error',session.error)}
  return session;
 }
 async function approve(sessionId,approved){
  const s=sessions.get(sessionId);
  if(!s)throw Error('Unknown academic agent session');
  if(s.state!=='awaiting-approval'||!s.pending)throw Error('No pending browser action');
  s.state='observing';
  const action=s.pending;s.pending=null;
  if(approved===true){
   try{const observation=await openSource(action.url);s.events.push({type:'browser-observe',detail:JSON.stringify({title:observation.title,url:observation.url,text:String(observation.text||'').slice(0,1200)}),at:new Date().toISOString()});
    if(observation.text){try{s.answer=await reason({goal:s.goal,sources:s.sources,observation:{url:observation.url,title:observation.title,text:String(observation.text).slice(0,4000)},limits:s.report.limitations});s.events.push({type:'reason','detail':'Updated tutoring guidance after browser observation',at:new Date().toISOString()})}catch(e){s.events.push({type:'recover',detail:'Browser observed, but follow-up tutoring failed: '+String(e.message||e),at:new Date().toISOString()})}}
   }
   catch(e){s.error='Browser navigation failed: '+String(e.message||e);s.events.push({type:'recover',detail:s.error,at:new Date().toISOString()})}
  }else s.events.push({type:'declined',detail:'Student declined browser navigation',at:new Date().toISOString()});
  s.state='completed';return s;
 }
 function status(sessionId){const s=sessions.get(sessionId);if(!s)throw Error('Unknown academic agent session');return s}
 return {run,approve,status};
}
