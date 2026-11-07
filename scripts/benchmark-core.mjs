export function scoreAnswers(questions,predictions){
 if(!Array.isArray(questions)||!Array.isArray(predictions))throw Error('Questions and predictions must be arrays');
 const byId=new Map(predictions.map(p=>[String(p.id),p]));
 const results=questions.map(q=>{
  const prediction=byId.get(String(q.id));
  const expected=String(q.answer||'').trim().toUpperCase();
  const actual=String(prediction?.answer||'').trim().toUpperCase();
  return {id:q.id,correct:!!actual&&actual===expected,expected,actual:actual||null};
 });
 const correct=results.filter(x=>x.correct).length;
 return {total:results.length,correct,accuracy:results.length?correct/results.length:null,results};
}
export function validateBenchmark(questions){
 if(!Array.isArray(questions)||questions.length<1||questions.length>200)throw Error('Provide 1–200 verified questions');
 const ids=new Set();
 for(const q of questions){
  if(!q||typeof q.id!=='string'||!q.id.trim()||ids.has(q.id))throw Error('Each question needs a unique string id');
  if(typeof q.question!=='string'||!q.question.trim())throw Error('Missing question text');
  if(!Array.isArray(q.options)||q.options.length<2||q.options.length>8||q.options.some(x=>typeof x!=='string'))throw Error('Provide 2–8 option strings');
  if(!/^[A-H]$/.test(q.answer)||q.answer.charCodeAt(0)-65>=q.options.length)throw Error('Verified answer must be an option letter');
  ids.add(q.id);
 }
 return questions;
}
