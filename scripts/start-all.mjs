import { spawn } from 'node:child_process';

const tasks=[
 ['backend',process.execPath,['server/index.js']],
 ['frontend',process.platform==='win32'?'npm.cmd':'npm',['run','dev']]
];
const children=[];
let shuttingDown=false;
function stop(code=0){
 if(shuttingDown)return;
 shuttingDown=true;
 for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');
 process.exitCode=code;
}
for(const [name,command,args] of tasks){
 const child=spawn(command,args,{stdio:'inherit',env:process.env});
 children.push(child);
 child.on('error',error=>{console.error('[finessers] '+name+' failed to start:',error.message);stop(1)});
 child.on('exit',(code,signal)=>{
  if(!shuttingDown){console.error('[finessers] '+name+' exited ('+(signal||code)+')');stop(code||1)}
 });
}
process.on('SIGINT',()=>stop(0));
process.on('SIGTERM',()=>stop(0));
console.log('[finessers] Starting current AI backend and Vite frontend');
