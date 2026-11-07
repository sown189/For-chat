import fs from 'node:fs/promises';
import {scoreAnswers,validateBenchmark} from './benchmark-core.mjs';

const file=process.argv[2];
if(!file){console.error('Usage: npm run benchmark -- path/to/verified-questions.json');process.exit(2)}
const questions=validateBenchmark(JSON.parse(await fs.readFile(file,'utf8')));
const endpoint=process.env.FINESSERS_API_URL||'http://127.0.0.1:8787';
const predictions=[];
for(const q of questions){
 const choices=q.options.map((option,i)=>String.fromCharCode(65+i)+'. '+option).join('\n');
 const task='Answer this practice multiple-choice question. Respond with ONLY one option letter (A–'+String.fromCharCode(64+q.options.length)+'). If uncertain, still choose the best-supported option.\nQuestion: '+q.question+'\n'+choices;
 try{
  const response=await fetch(endpoint+'/api/agent/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task}),signal:AbortSignal.timeout(100000)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Model request failed');
  const answer=String(data.plan||'').trim().match(/^\s*(?:ANSWER\s*:\s*)?([A-H])(?:[.\s):]|$)/i)?.[1]?.toUpperCase()||null;
  predictions.push({id:q.id,answer,raw:String(data.plan||'').slice(0,500)});
 }catch(e){predictions.push({id:q.id,answer:null,error:e.message})}
}
const result=scoreAnswers(questions,predictions);
console.log(JSON.stringify({accuracy:result.accuracy,correct:result.correct,total:result.total,results:result.results.map((r,i)=>({...r,raw:predictions[i].raw,error:predictions[i].error}))},null,2));
if(result.accuracy===null||result.accuracy<0.9)process.exitCode=1;
