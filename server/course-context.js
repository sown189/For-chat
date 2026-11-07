export function htmlToText(html){
 return String(html||'').replace(/<(script|style|iframe|object|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
 .replace(/<\s*br\s*\/?>/gi,'\n').replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi,'\n')
 .replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot|#39|#x27);/gi,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#x27;':"'"}[m.toLowerCase()]||m))
 .replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim().slice(0,12000);
}
export function assignmentContext(raw,courseId){
 if(!raw||typeof raw!=='object'||!raw.id)throw Error('Invalid Canvas assignment');
 return {id:String(raw.id),courseId:String(courseId),title:String(raw.name||'Untitled assignment').slice(0,200),description:htmlToText(raw.description),dueAt:raw.due_at||null,points:raw.points_possible??null,url:typeof raw.html_url==='string'&&/^https:\/\//.test(raw.html_url)?raw.html_url:null,submissionTypes:Array.isArray(raw.submission_types)?raw.submission_types:[],source:'Canvas assignment description',limitations:'Canvas assignment description only. Does not include linked files, lecture videos, or other course pages.'};
}
export function buildGroundedStudyGuide(context){
 const text=context.description||'';
 const sentences=text.split(/(?<=[.!?])\s+|\n/).map(s=>s.trim()).filter(s=>s.length>=15).slice(0,12);
 return {assignmentId:context.id,title:context.title,sourceUrl:context.url,sourceType:context.source,requirements:sentences.slice(0,8),studyPrompts:sentences.slice(0,5).map(s=>'Explain in your own words: '+s),nextAction:text?'Review these assignment requirements, then use the source link to confirm any linked readings or rubric.':'Open the source assignment to find its requirements; Canvas did not return a description.',limited:!text,limitations:context.limitations};
}
