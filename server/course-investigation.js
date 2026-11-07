import {buildCourseMission} from './course-mission.js';
import {assignmentContext,buildGroundedStudyGuide} from './course-context.js';
export async function investigateCourseMission(assignments,fetchAssignment,{limit=5,now=new Date()}={}){
 const mission=buildCourseMission(assignments,now);
 const targets=mission.tasks.slice(0,Math.max(0,Math.min(10,limit)));
 const investigations=await Promise.all(targets.map(async task=>{
  const match=String(task.id).match(/^([0-9]+)-([0-9]+)$/);
  if(!match)return {task,error:'Invalid Canvas assignment reference',status:'unavailable'};
  try{
   const raw=await fetchAssignment(match[1],match[2]);
   const context=assignmentContext(raw,match[1]);
   return {task,guide:buildGroundedStudyGuide(context),status:'reviewed'};
  }catch(e){return {task,error:String(e.message||e).slice(0,250),status:'unavailable'}}
 }));
 return {mission,investigations,reviewed:investigations.filter(x=>x.status==='reviewed').length,unavailable:investigations.filter(x=>x.status==='unavailable').length,mode:'read-only',requiresStudentReview:true,limitations:'Only assignment descriptions were read. Linked documents, announcements, quizzes and grades were not inspected. No submissions or changes were made.'};
}
