function pageOperator(req){
 const norm=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,150);
 const risk=/\b(?:submit|purchase|buy|pay|checkout|delete|remove|destroy|transfer|send|publish|sign\s*(?:in|out|up)|log\s*(?:in|out)|password|register|confirm|finish attempt|turn in|complete quiz|start quiz|grade|enroll|authorize|approve|accept|unsubscribe)\b/i;
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return !e.closest('[hidden],[inert],[aria-hidden="true"]')&&r.width>0&&r.height>0&&s.visibility==='visible'&&s.display!=='none'&&s.pointerEvents!=='none'&&!e.matches(':disabled,[aria-disabled="true"]')};
 function entries(){const out=[];for(const e of document.querySelectorAll('a[href],button,[role="button"],input[type="search"],input[role="searchbox"]')){
 if(!visible(e))continue;const label=norm(e.getAttribute('aria-label')||e.innerText||e.getAttribute('placeholder')||e.title||(e.type==='search'?'Search':''));
 if(!label||risk.test(label))continue;let kind='click',href='';
 if(e.matches('input[type="search"],input[role="searchbox"]')){if(!['search','text'].includes(e.type)||e.readOnly||risk.test([e.name,e.id,e.autocomplete,e.getAttribute('aria-label')].join(' '))||/^(?:email|username|tel|cc-|current-password|new-password)/i.test(e.autocomplete||'')||e.autocomplete==='one-time-code')continue;kind='search';}
 else if(e.tagName==='A'){try{const u=new URL(e.href);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||e.hasAttribute('download')||risk.test(decodeURIComponent(u.pathname+' '+u.search)))continue;href=u.href}catch{continue}}
 else if(e.closest('form')||e.matches('button[type="submit"],button[type="reset"]')||e.form)continue;
 out.push({e,label,kind,href});if(out.length===100)break}return out}
 if(req.action==='scan')return {title:norm(document.title),origin:location.origin,url:location.href,targets:entries().map(({label,kind,href},id)=>({id,label,kind,href}))};
 if(req.url!==location.href)return {error:'Page changed. Rescan.'};
 if(req.action==='scroll'){if(!['up','down'].includes(req.direction))return {error:'Invalid direction'};window.scrollBy({top:(req.direction==='up'?-1:1)*Math.round(innerHeight*.8),behavior:'smooth'});return {message:'Scrolled '+req.direction}}
 const t=entries()[req.target?.id];if(!t||t.label!==req.target.label||t.kind!==req.target.kind||t.href!==req.target.href)return {error:'Control changed. Rescan.'};
 if(req.action==='click'&&t.kind==='click'){t.e.scrollIntoView({block:'center'});if(!visible(t.e)||!t.e.isConnected)return {error:'Control no longer available.'};t.e.click();return {message:'Clicked '+t.label}}
 if(req.action==='search'&&t.kind==='search'&&typeof req.text==='string'&&req.text.length<=250){t.e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(t.e,req.text);t.e.dispatchEvent(new Event('input',{bubbles:true}));return {message:'Search text entered; submit manually.'}}
 return {error:'Action not permitted.'}
}
function commandPlan(command,targets){
 const c=command.trim(),s=c.match(/^scroll\s+(up|down)$/i);if(s)return {action:'scroll',direction:s[1].toLowerCase()};
 const q=c.match(/^search\s+(?:for\s+)?(.+)$/i);if(q){const f=targets.filter(t=>t.kind==='search');return f.length===1?{action:'search',target:f[0],text:q[1]}:{error:'Exactly one search field is needed.'}}
 const m=c.match(/^(?:click|open)\s+(.+)$/i);if(m){const n=m[1].trim().toLowerCase(),exact=targets.filter(t=>t.kind==='click'&&t.label.toLowerCase()===n),matches=exact.length?exact:targets.filter(t=>t.kind==='click'&&t.label.toLowerCase().includes(n));return matches.length===1?{action:'click',target:matches[0]}:{error:matches.length?'Several matches; select a control.':'No matching control.'}}
 return {error:'Try click Courses, scroll down, or search for biology.'}
}