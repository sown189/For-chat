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
 await check('landing page and browser entry',async()=>{
  await page.goto(site,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/GET STARTED FREE/i}).click();
  await page.getByRole('heading',{name:'AI BROWSER'}).waitFor();
 });
 await check('unified browser displays Canvas tab and AI copilot',async()=>{
  await page.getByRole('tab',{name:'Canvas Live'}).waitFor();
  await page.getByRole('complementary',{name:'Finessers AI sidebar'}).waitFor();
  assert.equal(await page.getByText(/Page contents aren't shared automatically/).count(),1);
 });
 await check('AI tab metadata is opt-in',async()=>{
  const sidebar=page.getByRole('complementary',{name:'Finessers AI sidebar'});
  const box=sidebar.getByRole('checkbox');
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
 await check('Canvas workflow builds practice cards and shares only after consent',async()=>{
  await page.route('**/api/deadlines',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({courses:1,assignments:[{id:'101-202',course:'Mock Criminal Justice',title:'Mock Assignment',dueAt:'2026-12-01T20:00:00Z'}]})}));
  await page.route('**/api/course-context?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({guide:{title:'Mock Assignment',requirements:['Explain the Sixth Amendment'],nextAction:'Review the lecture notes',sourceUrl:'https://canvas.instructure.com/courses/101/assignments/202'}})}));
  await page.getByRole('button',{name:'SYNC CANVAS'}).click();
  await page.getByRole('button',{name:/Mock Assignment/}).click();
  await page.getByText('What is requirement 1 for Mock Assignment?').waitFor();
  const send=page.getByRole('button',{name:'SEND REQUIREMENTS TO AI SIDEBAR'});
  assert.equal(await send.isDisabled(),true);
  await page.getByRole('checkbox',{name:/Allow sharing this assignment/}).check();
  await send.click();
  await page.getByText('SHARED ASSIGNMENT').waitFor();
  await page.getByRole('button',{name:'REMOVE SHARED CONTENT'}).click();
  await page.unroute('**/api/deadlines');
  await page.unroute('**/api/course-context?*');
 });
 await check('new website tab and address validation',async()=>{
  await page.getByRole('button',{name:/NEW TAB/i}).click();
  await page.getByRole('textbox',{name:'Website address'}).fill('javascript:alert(1)');
  await page.getByRole('button',{name:/^GO$/}).click();
  await page.getByRole('alert').filter({hasText:'valid http(s)'}).waitFor();
  await page.getByRole('textbox',{name:'Website address'}).fill('https://example.com/');
  await page.getByRole('button',{name:/^GO$/}).click();
  await page.getByRole('tab',{name:/example.com/}).waitFor();
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
  await page.getByRole('button',{name:'REFRESH',exact:true}).click();
  await page.getByRole('button',{name:/Demo Course/}).click();
  await page.getByRole('button',{name:/Demo Assignment/}).click();
  await page.getByText('Practice these concepts').waitFor();
  await page.getByRole('button',{name:'MODULES'}).click();
  await page.getByRole('button',{name:/Week One/}).click();
  await page.getByRole('button',{name:/Reading/}).click();
  await page.getByText('Study the material').waitFor();
  await page.unroute('**/api/canvas/navigate?*');
 });
 await context.close();
}finally{await browser.close()}
console.log('\nE2E checks: '+results.filter(x=>x.ok).length+'/'+results.length+' passed');
if(results.some(x=>!x.ok))process.exitCode=1;
