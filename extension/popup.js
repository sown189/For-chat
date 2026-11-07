document.getElementById('inspect').addEventListener('click',async()=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const p=document.getElementById('page');p.textContent=tab?(tab.title||'Untitled')+' — '+(tab.url||'URL unavailable'):'No active tab';});
document.getElementById('open').addEventListener('click',()=>chrome.tabs.create({url:'http://localhost:5173/For-chat/'}));
