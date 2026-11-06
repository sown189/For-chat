import http from 'node:http';
const respond=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
 if(req.url==='/api/agent/health')return respond(res,200,{ready:true,modelConfigured:!!process.env.OPENROUTER_API_KEY});
 return respond(res,404,{error:'Agent route not implemented'});
}).listen(8787,'127.0.0.1',()=>console.log('Finessers agent API listening on localhost:8787'));
