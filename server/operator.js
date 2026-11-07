import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';

const sessions = new Map();
const MAX_SESSIONS = 3;
const TIMEOUT_MS = 15000;
const SESSION_TTL_MS = 15*60*1000;
async function pruneSessions(){
 const now=Date.now();
 await Promise.all([...sessions].filter(([,s])=>now-s.created>SESSION_TTL_MS).map(async([id,s])=>{sessions.delete(id);await s.browser.close().catch(()=>{})}));
}
const allowedProtocols = new Set(['https:', 'http:']);
const READ_ONLY_METHODS=new Set(['GET','HEAD']);
const BLOCKED_HOSTS = /^(?:0|0x[0-9a-f]+|0[0-7]+|169\.254\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|198\.18\.|198\.19\.|224\.|2(?:[3-4]\d|5[0-5])\.)/i;
function checkUrl(raw) {
  const url = new URL(raw);
  if (!allowedProtocols.has(url.protocol)) throw Error('Only HTTP(S) pages are supported');
  if (url.username || url.password) throw Error('Credentials in URLs are not allowed');
  if (url.port && !/^\d{1,5}$/.test(url.port)) throw Error('Invalid network port');
  if (BLOCKED_HOSTS.test(url.hostname)) throw Error('Reserved network targets are blocked');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host === '::1' ||
      host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host === '[::1]' || host.startsWith('[fc') || host.startsWith('[fd') || host.startsWith('[fe80:')) {
    throw Error('Local or private network targets are blocked');
  }
  return url.toString();
}
function publicSnapshot(page) {
  return page.locator('body').innerText({timeout: 5000}).then(text => text.slice(0, 16000));
}
async function createSession(url, options={}) {
  const permittedOrigin=options.allowedOrigin ? new URL(options.allowedOrigin).origin : null;
  if(permittedOrigin && new URL(url).origin!==permittedOrigin)throw Error('Browser destination is outside allowed origin');
  await pruneSessions();
  if (sessions.size >= MAX_SESSIONS) throw Error('Session limit reached; close an existing session');
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({acceptDownloads: false});
    await context.route('**/*', async route => {
      try {
        checkUrl(route.request().url());
        if(!READ_ONLY_METHODS.has(route.request().method().toUpperCase()))throw Error('Read-only browser blocks non-GET network requests');
        if(permittedOrigin && route.request().isNavigationRequest() && new URL(route.request().url()).origin!==permittedOrigin)throw Error('Cross-origin navigation blocked');
        await route.continue();
      } catch {
        await route.abort();
      }
    });
    const page = await context.newPage();
    page.on('popup',popup=>popup.close().catch(()=>{}));
    page.setDefaultTimeout(TIMEOUT_MS);
    await page.goto(checkUrl(url), {waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS});
    if(permittedOrigin && new URL(page.url()).origin!==permittedOrigin)throw Error('Browser left the approved origin');
    const id = randomUUID();
    sessions.set(id, {browser, page, created: Date.now(), permittedOrigin});
    return {id, ...await observe(id)};
  } catch (e) {
    await browser.close();
    throw e;
  }
}
async function observe(id) {
  await pruneSessions();
  const s = sessions.get(id);
  if (!s) throw Error('Unknown browser session');
  return {
    id,
    url: s.page.url(),
    title: await s.page.title(),
    text: await publicSnapshot(s.page),
    controls: await s.page.locator('a,button,input,textarea,select').evaluateAll(nodes =>
      nodes.slice(0, 100).map((node, index) => ({
        index, tag: node.tagName.toLowerCase(),
        label: (node.innerText || node.getAttribute('aria-label') || node.getAttribute('placeholder') || '').slice(0, 120),
        type: node.getAttribute('type') || ''
      }))
    )
  };
}
async function act(id, action) {
  await pruneSessions();
  const s = sessions.get(id);
  if (!s) throw Error('Unknown browser session');
  if (!action || !['click', 'scroll', 'navigate'].includes(action.type)) throw Error('Unsupported action');
  if (action.type === 'navigate') {
    const destination=checkUrl(action.url);
    if(s.permittedOrigin&&new URL(destination).origin!==s.permittedOrigin)throw Error('Navigation outside the approved origin is blocked');
    await s.page.goto(destination, {waitUntil: 'domcontentloaded'});
  } else if (action.type === 'scroll') {
    const amount = Number(action.amount);
    if (!Number.isFinite(amount) || Math.abs(amount) > 2000) throw Error('Invalid scroll distance');
    await s.page.mouse.wheel(0, amount);
  } else {
    const index = Number(action.index);
    if (!Number.isInteger(index) || index < 0 || index >= 100) throw Error('Invalid control index');
    const target = s.page.locator('a,button,input,textarea,select').nth(index);
    if (action.type === 'click') {
      const tag = await target.evaluate(node => node.tagName.toLowerCase());
      const type = (await target.getAttribute('type') || '').toLowerCase();
      if (tag !== 'a' || type === 'submit' || type === 'file') throw Error('Read-only mode allows navigation links only');
      const href=await target.getAttribute('href');
      if (!href) throw Error('Link has no destination');
      const destination=checkUrl(new URL(href,s.page.url()).toString());
      if(s.permittedOrigin&&new URL(destination).origin!==s.permittedOrigin)throw Error('Link outside the approved origin is blocked');
      await target.click();
    } else {
      throw Error('Read-only mode blocks form interaction');
    }
  }
  return observe(id);
}
async function screenshot(id) {
 await pruneSessions();
 const s=sessions.get(id);
 if(!s) throw Error('Unknown browser session');
 return {id,image:'data:image/jpeg;base64,'+(await s.page.screenshot({type:'jpeg',quality:65})).toString('base64')};
}
async function close(id) {
  const s = sessions.get(id);
  if (!s) return false;
  sessions.delete(id);
  await s.browser.close();
  return true;
}
export {createSession, observe, act, close, screenshot};
