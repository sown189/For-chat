// Capture reproducible public/demo-only visual previews. Never capture private Canvas data.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const site=process.env.FINESSERS_TEST_URL||'http://127.0.0.1:5173/For-chat/';
await mkdir('artifacts/visual-preview',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const config of [
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
 ]){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(site,{waitUntil:'networkidle'});
  await page.getByRole('heading',{level:1,name:/FINESSERS/}).waitFor();
  await page.screenshot({path:'artifacts/visual-preview/'+config.name+'-landing.png',fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/ENTER THE BROWSER/}).click();
  await page.getByRole('heading',{name:'AI BROWSER'}).waitFor();
  await page.locator('.fx-browser-shell').waitFor();
  await page.screenshot({path:'artifacts/visual-preview/'+config.name+'-workspace.png',fullPage:true,animations:'disabled'});
  await context.close();
  console.log('CAPTURED '+config.name+' landing and workspace');
 }
}finally{await browser.close()}
