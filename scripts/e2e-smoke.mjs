// Browser-level integration smoke tests against running local frontend + backend.
// Run: npm run test:e2e (after npm run start:all; Playwright Chromium installed).
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const site=process.env.FINESSERS_TEST_URL||'http://127.0.0.1:5173/For-chat/';
const api='http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const results=[];
async function check(name,fn){
 try{await fn();results.push({name,ok:true});console.log('PASS '+name)}
 catch(e){results.push({name,ok:false});console.error('FAIL '+name+': '+e.message)}
}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 page.on('pageerror',e=>console.error('BROWSER ERROR: '+e.message));
 await check('backend health endpoint',async()=>{
  const r=await fetch(api+'/api/health');assert.equal(r.status,200);
  const d=await r.json();assert.equal(d.mode,'local-beta');assert.equal(d.publicReady,false);
 });
 await check('backend rejects cross-site state changes',async()=>{
  const r=await fetch(api+'/api/canvas/oauth/disconnect',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'});
  assert.equal(r.status,403);
 });
 await check('backend rejects non-JSON mutations',async()=>{
  const r=await fetch(api+'/api/canvas/oauth/disconnect',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
  assert.equal(r.status,403);
 });
 await check('visual system loads on desktop and respects reduced motion',async()=>{
  await page.goto(site,{waitUntil:'networkidle'});
  await page.getByRole('heading',{level:1,name:/FINESSERS/}).waitFor();
  await page.locator('.fx-velocity-strip').waitFor();
  await page.locator('.fx-laptop').waitFor();
  const wordmarkSize=await page.locator('.fx-landing-brand .fx-mark').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(wordmarkSize>=24,'Landing brand must be readable: '+wordmarkSize+'px');
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,hero:getComputedStyle(document.querySelector('.fx-hero')).backgroundImage}));
  assert.ok(layout.overflow<=2,'Desktop must not scroll horizontally: '+layout.overflow);
  assert.match(layout.hero,/gradient/);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.fx-velocity-track').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
 });
 await check('landing layout fits a mobile screen',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:/ENTER THE BROWSER/}).waitFor();
  assert.ok(await page.locator('.fx-landing-brand .fx-mark').isVisible(),'Mobile wordmark must remain visible');
  assert.ok((await page.locator('.fx-landing-brand .fx-mark').boundingBox()).width>100,'Mobile wordmark must be legible');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,'Mobile landing must not scroll horizontally: '+overflow);
  await page.setViewportSize({width:1440,height:900});
 });
 await check('landing page and browser entry',async()=>{
  await page.goto(site,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/ENTER THE BROWSER/i}).click();
  await page.getByRole('heading',{name:'AI BROWSER'}).waitFor();
  await page.locator('.fx-command-ribbon').waitFor();
  assert.ok(await page.locator('.fx-browser-shell').isVisible(),'Interactive browser shell must be visible');
 });
 await check('unified browser displays Canvas tab and AI copilot',async()=>{
  await page.getByRole('tab',{name:'Canvas Live'}).waitFor();
  await page.getByRole('complementary',{name:'Finessers AI sidebar'}).waitFor();
  assert.equal(await page.getByText('Page contents aren\'t shared automatically.').count(),1);
 });
 await check('AI tab metadata is opt-in',async()=>{
  const sidebar=page.getByRole('complementary',{name:'Finessers AI sidebar'});
  const box=sidebar.getByRole('checkbox',{name:/Include tab title and URL/});
  assert.equal(await box.isChecked(),false);
  await box.check();assert.equal(await box.isChecked(),true);
  await box.uncheck();
 });
 await check('AI copilot submits to local API and shows response',async()=>{
  await page.route('**/api/agent/plan',async route=>{
   const payload=route.request().postDataJSON();
   assert.ok(payload.task.includes('Explain the current topic'));
   assert.ok(!payload.task.includes('Current tab'));
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({plan:'Mock study guidance from test provider.'})});
  });
  const sidebar=page.getByRole('complementary',{name:'Finessers AI sidebar'});
  await sidebar.getByRole('button',{name:'EXPLAIN'}).click();
  await sidebar.getByText('Mock study guidance from test provider.').waitFor();
  await page.unroute('**/api/agent/plan');
 });
 await check('new website tab and address validation',async()=>{
  await page.getByRole('button',{name:/NEW TAB/i}).click();
  await page.getByRole('textbox',{name:'Website address'}).fill('javascript:alert(1)');
  await page.getByRole('button',{name:/^GO$/}).click();
  await page.getByRole('alert').filter({hasText:'valid http(s)'}).waitFor();
  await page.getByRole('textbox',{name:'Website address'}).fill('https://example.com/');
  await page.getByRole('button',{name:/^GO$/}).click();
  await page.getByRole('tab',{name:'example.com'}).waitFor();
  assert.match(await page.getByRole('textbox',{name:'Website address'}).getAttribute('placeholder'),/example\.com/);
  await page.getByRole('button',{name:'AI NAVIGATE THIS SITE'}).click();
  assert.match(await page.getByLabel('WHAT SHOULD FINESSERS DO?').inputValue(),/example\.com/);
  await page.locator('.fx-computer-advanced summary').click();
 });
 await check('study generator creates and reveals a flashcard',async()=>{
  await page.getByRole('button',{name:'Study',exact:true}).first().click();
  await page.getByLabel('YOUR NOTES').fill('Due process — Fair legal procedures');
  await page.getByRole('button',{name:'GENERATE STUDY CARDS'}).click();
  await page.getByText('TAP TO REVEAL ANSWER').click();
  await page.locator('.fx-study-cards button span').getByText('Fair legal procedures',{exact:true}).waitFor();
 });
 await check('mission create, complete and delete',async()=>{
  await page.getByRole('button',{name:'Missions',exact:true}).first().click();
  await page.getByRole('textbox',{name:'New mission'}).fill('Review course notes');
  await page.getByRole('button',{name:'CREATE MISSION'}).click();
  await page.getByText('Review course notes').waitFor();
  await page.getByRole('button',{name:'COMPLETE'}).click();
  await page.locator('.fx-mission-list article small').getByText(/^COMPLETED/).waitFor();
  await page.getByRole('button',{name:'DELETE'}).click();
  assert.equal(await page.getByText('Review course notes').count(),0);
 });
 await check('Canvas navigation reports disconnected state without credentials',async()=>{
  await page.getByRole('button',{name:'Browser',exact:true}).first().click();
  await page.getByRole('tab',{name:'Canvas Live'}).click();
  const r=await fetch(api+'/api/canvas/navigate?view=courses');
  assert.ok([200,503].includes(r.status));
  if(r.status===503)await page.getByRole('alert').filter({hasText:'Canvas'}).waitFor();
 });
 await check('Canvas course, module, page and assignment UI with mocked Canvas',async()=>{
  await page.route('**/api/canvas/navigate?*',async route=>{
   const u=new URL(route.request().url());const view=u.searchParams.get('view');
   const fixtures={
    courses:{view:'courses',items:[{id:'42',title:'Demo Course',code:'DEMO 101'}]},
    assignments:{view:'assignments',courseId:'42',items:[{id:'9',title:'Demo Assignment',dueAt:null,description:'Practice',points:10}]},
    assignment:{view:'assignment',courseId:'42',assignment:{id:'9',title:'Demo Assignment',dueAt:null,description:'Practice these concepts',points:10}},
    modules:{view:'modules',courseId:'42',items:[{id:'7',title:'Week One',itemsCount:1}]},
    'module-items':{view:'module-items',courseId:'42',moduleId:'7',items:[{id:'8',title:'Reading',type:'Page',pageUrl:'reading'}]},
    pages:{view:'pages',courseId:'42',items:[{title:'Reading',pageUrl:'reading'}]},
    page:{view:'page',courseId:'42',page:{title:'Reading',body:'Study the material'}}
   };
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixtures[view]||{})});
  });
  await page.getByRole('region',{name:'Authenticated Canvas navigator'}).getByRole('button',{name:'REFRESH',exact:true}).click();
  await page.getByRole('button',{name:/Demo Course/}).click();
  await page.getByRole('button',{name:/Demo Assignment/}).click();
  await page.getByText('Practice these concepts').waitFor();
  await page.getByRole('button',{name:'MODULES'}).click();
  await page.getByRole('button',{name:/Week One/}).click();
  await page.getByRole('button',{name:/Reading/}).click();
  await page.getByText('Study the material').waitFor();
  await page.unroute('**/api/canvas/navigate?*');
 });
 await check('page-aware AI keeps page text private until opt-in',async()=>{
  const sidebar=page.getByRole('complementary',{name:'Finessers AI sidebar'});
  await sidebar.getByText(/PAGE TEXT READY/).waitFor();
  const consent=sidebar.getByRole('checkbox',{name:/Include current page text/});
  assert.equal(await consent.isChecked(),false);
  const prompts=[];
  await page.route('**/api/agent/plan',async route=>{
   prompts.push(route.request().postDataJSON().task);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({plan:'Page-aware response '+prompts.length})});
  });
  await sidebar.getByRole('button',{name:'EXPLAIN'}).click();
  await sidebar.getByText('Page-aware response 1').waitFor();
  assert.ok(!prompts[0].includes('Study the material'),'Page text must not be transmitted by default');
  await consent.check();
  await sidebar.getByRole('button',{name:'EXPLAIN'}).click();
  await sidebar.getByText('Page-aware response 2').waitFor();
  assert.ok(prompts[1].includes('Study the material'),'Opt-in must include the selected page text');
  await page.unroute('**/api/agent/plan');
  await sidebar.getByRole('button',{name:/STUDY THIS PAGE/}).click();
  await page.getByRole('heading',{name:'STUDY GENERATOR'}).waitFor();
  await page.waitForFunction(()=>document.getElementById('fx-study-notes')?.value.includes('Study the material'));
  assert.match(await page.getByLabel('YOUR NOTES').inputValue(),/Study the material/);
  await page.getByRole('heading',{name:/7-DAY PRACTICE PLAN/}).waitFor();
 });
 await check('Canvas deadline radar auto-syncs and opens local study',async()=>{
  await page.route('**/api/course-mission',async route=>{
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({totalUpcoming:1,dueThisWeek:1,tasks:[{id:'42-9',course:'Demo Course',title:'Demo Due Assignment',dueAt:'2026-11-10T17:00:00Z',priority:'high',studyActions:['Read details'],url:'https://example.edu/courses/42/assignments/9'}],canvas:{partial:false}})});
  });
  await page.route('**/api/course-context?*',async route=>{
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({context:{description:'Voir dire — Jury selection questioning'},guide:{requirements:['Explain voir dire']}})});
  });
  await page.getByRole('button',{name:'Browser',exact:true}).first().click();
  const radar=page.getByRole('region',{name:'Canvas deadlines radar'});
  await radar.getByText('Demo Due Assignment').waitFor();
  await radar.getByRole('button',{name:'STUDY'}).click();
  await page.getByRole('heading',{name:'STUDY GENERATOR'}).waitFor();
  await page.getByText('Voir dire',{exact:true}).first().click();
  await page.getByText('Jury selection questioning',{exact:true}).first().waitFor();
  await page.unroute('**/api/course-mission');
  await page.unroute('**/api/course-context?*');
 });
 await check('beta checklist exposes actual local deployment blockers',async()=>{
  await page.getByRole('button',{name:'Beta Setup'}).first().click();
  const setup=page.getByRole('region',{name:'Private beta setup'});
  await setup.getByText('Public user authentication').waitFor();
  assert.ok(await setup.getByText('Production readiness').count()>0);
  assert.ok(await setup.getByText('NOT READY',{exact:true}).count()>=2);
 });
 await check('computer use shows explicit next action and approved timeline',async()=>{
  await page.route('**/api/computer/start',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'demo-session',state:'awaiting-approval',pending:{action:{type:'click',x:10,y:30}},steps:[]})}));
  await page.route('**/api/computer/step',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'demo-session',state:'completed',steps:[{label:'click',detail:'navigation link'}],summary:'Demo task completed'})}));
  await page.getByRole('button',{name:'Browser',exact:true}).first().click();
  await page.locator('.fx-computer-advanced summary').click();
  await page.getByLabel('WHAT SHOULD FINESSERS DO?').fill('Open the school calendar');
  await page.getByRole('button',{name:'START COMPUTER USE'}).click();
  await page.getByText('APPROVE NEXT COMPUTER ACTION').waitFor();
  await page.getByRole('button',{name:/APPROVE & CONTINUE/}).click();
  await page.getByRole('heading',{name:/ACTION TIMELINE/}).waitFor();
  await page.getByText('Demo task completed').waitFor();
  await page.unroute('**/api/computer/start');
  await page.unroute('**/api/computer/step');
 });
 await check('mobile navigation remains available',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Toggle navigation'}).click();
  await page.getByRole('button',{name:'Close navigation'}).waitFor();
  await page.getByRole('button',{name:'Beta Setup'}).last().click();
  assert.equal(await page.getByRole('button',{name:'Close navigation'}).count(),0);
  await page.getByRole('heading',{name:'BETA SETUP'}).waitFor();
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,'Mobile workspace must not scroll horizontally');
  await page.setViewportSize({width:1440,height:900});
 });
 await context.close();
}finally{await browser.close()}
console.log('\nE2E checks: '+results.filter(x=>x.ok).length+'/'+results.length+' passed');
if(results.some(x=>!x.ok))process.exitCode=1;
