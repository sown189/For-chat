import { spawn } from 'node:child_process';
const tasks=[['npm',['run','dev']],['node',['server/agent-api.mjs']]];
const children=tasks.map(([cmd,args])=>spawn(cmd,args,{stdio:'inherit',env:process.env}));
function stop(){for(const child of children)child.kill();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
for(const child of children)child.on('exit',code=>{if(code)stop()});
