const MS_DAY=86400000;
export function buildCourseMission(assignments,now=new Date()){
 if(!Array.isArray(assignments))throw Error('Assignments must be an array');
 const today=new Date(now);
 if(Number.isNaN(today.getTime()))throw Error('Invalid current date');
 const tasks=assignments.flatMap(a=>{
  if(!a)return [];
  const due=new Date(a.dueAt);
  if(!a.title||Number.isNaN(due.getTime())||due<today)return [];
  const days=Math.max(0,Math.ceil((due-today)/MS_DAY));
  return [{id:String(a.id),course:String(a.course||'Course'),title:String(a.title),dueAt:due.toISOString(),url:a.url||null,daysUntilDue:days,priority:days<=1?'urgent':days<=3?'high':days<=7?'medium':'upcoming',studyActions:days<=1?['Review assignment requirements and rubric','Practice the hardest topic','Check completion and submission requirements']:['Review lecture and assignment instructions','Test recall with practice questions','Correct mistakes before the deadline']}];
 }).sort((a,b)=>a.daysUntilDue-b.daysUntilDue||a.course.localeCompare(b.course));
 const byCourse=Object.values(tasks.reduce((acc,t)=>{(acc[t.course]??={course:t.course,count:0,nextDue:t.dueAt}).count++;return acc},{}));
 return {generatedAt:today.toISOString(),totalUpcoming:tasks.length,dueThisWeek:tasks.filter(t=>t.daysUntilDue<=7).length,courses:byCourse,tasks:tasks.slice(0,30),nextAction:tasks.length?'Start with '+tasks[0].title+' in '+tasks[0].course+'. Open the source assignment, review its requirements, and practice the hardest material.':'No upcoming dated assignments were found. Check Canvas course pages for undated work or announcements.',limitations:'This plan uses Canvas assignment titles and due dates, not lecture content, grades, or submission status. Verify details in Canvas.'};
}
