// Pure policy boundary: AI suggestions are untrusted until validated and approved.
import {checkUrl} from './operator.js';
export const VIEWPORT={width:1280,height:800};
export const MAX_APPROVED_ACTIONS=40;
const METHODS=new Set(['GET','HEAD']);
export function authorizeReadOnlyRequest(url,method){
 checkUrl(url);
 if(!METHODS.has(String(method).toUpperCase()))throw Error('Write requests are blocked in read-only beta');
 return true;
}
export function validateProposedAction(a){
 if(!a||typeof a!=='object'||!['click','double_click','scroll','type','keypress','move','drag','screenshot','wait'].includes(a.type))throw Error('Unsupported computer action');
 const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<VIEWPORT.width&&p.y<VIEWPORT.height;
 if(['click','double_click','move'].includes(a.type)&&!point(a))throw Error('Computer action coordinates outside the browser');
 if(a.type==='click'&&!['left',undefined].includes(a.button))throw Error('Only left clicks are supported');
 if(a.type==='scroll'&&(!Number.isFinite(Number(a.scroll_y||0))||Math.abs(Number(a.scroll_y||0))>1500||!Number.isFinite(Number(a.scroll_x||0))||Math.abs(Number(a.scroll_x||0))>1500))throw Error('Scroll amount exceeds safe limit');
 if(a.type==='type'&&(typeof a.text!=='string'||a.text.length>3000))throw Error('Invalid typed text');
 if(a.type==='keypress'&&(!Array.isArray(a.keys)||a.keys.length<1||a.keys.length>4||a.keys.some(k=>typeof k!=='string'||!(/^(?:ARROWUP|ARROWDOWN|ARROWLEFT|ARROWRIGHT|TAB|ESC|ESCAPE|BACKSPACE|DELETE|HOME|END|PAGEUP|PAGEDOWN|CTRL|META|SHIFT|ALT|[A-Z0-9])$/i).test(k))))throw Error('Unsupported keyboard shortcut');
 if(a.type==='wait'&&a.ms!==undefined&&(!Number.isFinite(a.ms)||a.ms<0||a.ms>2000))throw Error('Wait action exceeds safe limit');
 if(a.type==='drag'&&(!Array.isArray(a.path)||a.path.length<2||a.path.length>30||a.path.some(p=>!point(p))))throw Error('Invalid drag path');
 return a;
}
export function authorizeAction(proposal,{approved,steps}){
 if(approved!==true)throw Error('Action requires explicit student approval');
 if(!Number.isInteger(steps)||steps<0||steps>=MAX_APPROVED_ACTIONS)throw Error('Maximum approved actions reached; start a new task');
 return structuredClone(validateProposedAction(proposal));
}
