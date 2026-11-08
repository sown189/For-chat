// Read-only interaction checks: web pages cannot grant permission to submit or change data.
export function isUnsafeClickTarget(t){
 if(!t)return false;
 const tag=String(t.tag||'').toLowerCase(),type=String(t.type||'').toLowerCase();
 const label=String(t.label||'').trim().toLowerCase().slice(0,160);
 const href=String(t.href||'').toLowerCase().slice(0,2000);
 if(tag==='button'&&(!type||type==='submit'))return true;
 if(['submit','reset','file'].includes(type))return true;
 if(/(?:^|[^a-z])(delete|remove|logout|sign out|unsubscribe|purchase|pay now|checkout|publish|submit assignment|send message)(?:[^a-z]|$)/.test(label))return true;
 if(/(?:\/|[?&])(delete|remove|logout|signout|unsubscribe|checkout|purchase)(?:[\/?&#=]|$)/.test(href))return true;
 return false;
}
export function isSafeSearchEnter(t){
 if(!t)return false;
 const tag=String(t.tag||'').toLowerCase(),type=String(t.type||'text').toLowerCase();
 const method=String(t.formMethod||'get').toLowerCase();
 const label=String(t.label||'').toLowerCase();
 return tag==='input'&&['search','text'].includes(type)&&method==='get'&&/(search|query|find)/.test(label);
}
