// Finessers supervised computer-use protocol. Pure helpers are unit-tested without API credentials.
export const COMPUTER_MODEL='gpt-6.1-sol';
export const MAX_BATCH_ACTIONS=8;
export function buildComputerRequest(input,previousResponseId,model=COMPUTER_MODEL){
 const body={model,tools:[{type:'computer'}],input};
 if(previousResponseId)body.previous_response_id=previousResponseId;
 return body;
}
export function parseComputerCall(response){
 const call=response?.output?.find(item=>item?.type==='computer_call');
 if(!call)return null;
 if(typeof call.call_id!=='string'||!call.call_id)throw Error('Computer call has no call ID');
 if(!Array.isArray(call.actions)||call.actions.length===0||call.actions.length>MAX_BATCH_ACTIONS)throw Error('Computer requested an invalid action batch');
 return {callId:call.call_id,actions:call.actions,checks:call.pending_safety_checks||[]};
}
export function computerCallOutput(callId,screenshot,checks=[]){
 const result={type:'computer_call_output',call_id:callId,output:{type:'computer_screenshot',image_url:screenshot,detail:'original'}};
 if(checks.length)result.acknowledged_safety_checks=checks.filter(check=>check&&typeof check.id==='string').map(({id,code,message})=>({id,code,message}));
 return result;
}
export function browserBarrier({url='',title='',hasPasswordInput=false,bodyText=''}={}){
 let pathname='';
 try{pathname=new URL(url).pathname.toLowerCase()}catch{}
 if(/(?:^|\/)(?:login|signin|sign-in|auth)(?:\/|$)/i.test(pathname)||hasPasswordInput)
  return {code:'login-required',message:'This page requires a human login. The AI session is paused. Use Canvas connection setup or restart on a public page; never give the model passwords.'};
 const sample=String(title+' '+bodyText).slice(0,2500);
 if(/(?:captcha|verify you are human|checking your browser|unusual traffic|security challenge)/i.test(sample))
  return {code:'human-verification',message:'The site requires human verification. Computer use is paused; it will not try to bypass a CAPTCHA.'};
 return null;
}
export function redactedHistoryDetail(action){
 return action?.type==='type'?'[text hidden]':action?.type==='keypress'?'[keyboard shortcut]':'';
}

// Manual sign-in may resume only at the locally configured school Canvas origin.
export function authorizeHumanResume(currentUrl,canvasBaseUrl,barrier=null){
 if(!canvasBaseUrl)throw Error('Configure CANVAS_BASE_URL before opening an authenticated browser');
 if(new URL(currentUrl).origin!==new URL(canvasBaseUrl).origin)throw Error('Finish signing in and return to the Canvas page before resuming AI');
 if(barrier)throw Error('Complete the login or human-verification challenge before resuming AI');
 return true;
}
