import {URL} from 'node:url';
export function validateCanvasSource(raw,canvasBase){
 if(typeof raw!=='string'||!raw)throw Error('Missing assignment source URL');
 const source=new URL(raw);
 const base=new URL(canvasBase);
 if(source.protocol!=='https:'&&!(base.hostname==='127.0.0.1'&&source.protocol==='http:'))throw Error('Canvas source must use HTTPS');
 if(source.origin!==base.origin)throw Error('Source is outside the configured Canvas origin');
 if(source.username||source.password)throw Error('Embedded credentials are not permitted');
 if(!/^\/courses\/\d+\/assignments\/\d+\/?$/.test(source.pathname))throw Error('Source is not a Canvas assignment page');
 if(source.search||source.hash)throw Error('Unexpected Canvas source parameters');
 return source.href;
}
