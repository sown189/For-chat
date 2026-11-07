import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {checkUrl} from '../server/operator.js';

test('operator URL policy blocks private and credential-bearing URLs',()=>{
 for(const url of ['http://localhost/','http://127.0.0.1/','http://192.168.1.1/','http://169.254.169.254/','http://user:pass@example.com/','file:///etc/passwd','http://[::1]/']){
  assert.throws(()=>checkUrl(url),undefined,url);
 }
 assert.equal(checkUrl('https://example.com/study'),'https://example.com/study');
});
test('real Chromium can navigate a simulated course page and capture screenshots',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.route('https://finessers-test.example/course',route=>route.fulfill({
   status:200,contentType:'text/html',
   body:'<!doctype html><title>Course assignments</title><h1>Criminal Justice</h1><a href="/course/quiz">Quiz</a><p>Quiz 1 — November 18, 2026</p>'
  }));
  await page.route('https://finessers-test.example/course/quiz',route=>route.fulfill({
   status:200,contentType:'text/html',body:'<!doctype html><title>Quiz</title><h1>Quiz instructions</h1>'
  }));
  await page.goto('https://finessers-test.example/course');
  assert.equal(await page.title(),'Course assignments');
  assert.match(await page.locator('body').innerText(),/November 18, 2026/);
  const shot=await page.screenshot({type:'png'});
  assert.ok(shot.length>1000);
  await page.getByRole('link',{name:'Quiz'}).click();
  assert.equal(await page.title(),'Quiz');
 }finally{await browser.close()}
});
