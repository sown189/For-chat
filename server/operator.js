import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

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
// Defensive preflight against hostnames resolving to cloud metadata, loopback or LAN IPs.
// This is not DNS pinning or a substitute for production egress filtering.
const dnsCache=new Map();
function isNonPublicAddress(raw){
 const addr=String(raw).toLowerCase();
 if(isIP(addr)===4){
  const a=addr.split('.').map(Number),[first,second,third]=a;
  return first===0||first===10||first===127||first>=224||first===169&&second===254||
   first===100&&second>=64&&second<=127||first===172&&second>=16&&second<=31||
   first===192&&(second===168||second===0&&third===0||second===0&&third===2)||
   first===198&&(second===18||second===19||second===51&&third===100)||
   first===203&&second===0&&third===113;
 }
 if(isIP(addr)===6){
  // Only global-unicast IPv6 destinations are acceptable; reject mapped IPv4,
  // link-local, ULA, documentation and non-global ranges.
  return !/^[23][0-9a-f]{0,3}:/.test(addr)||addr.startsWith('2001:db8:')||addr==='2001:db8::';
 }
 return true;
}
async function verifyPublicUrl(raw){
 const url=checkUrl(raw),host=new URL(url).hostname.replace(/^\[|\]$/g,'');
 if(isIP(host)){if(isNonPublicAddress(host))throw Error('Non-public network destination is blocked');return url}
 const cached=dnsCache.get(host);
 if(cached&&cached.expires>Date.now()){if(!cached.ok)throw Error('Non-public DNS destination is blocked');return url}
 let addresses;
 try{addresses=await lookup(host,{all:true,verbatim:true})}catch{throw Error('Destination DNS could not be verified')}
 const ok=addresses.length>0&&addresses.every(({address})=>!isNonPublicAddress(address));
 dnsCache.set(host,{ok,expires:Date.now()+30000});
 if(!ok)throw Error('Non-public DNS destination is blocked');
 return url;
}
function publicSnapshot(page) {
  return page.locator('body').innerText({timeout: 5000}).then(text => text.slice(0, 16000));
}
async function createSession(url, options={}) {
  const permittedOrigin=options.allowedOrigin ? new URL(options.allowedOrigin).origin : null;
  if(permittedOrigin && new URL(url).origin!==permittedOrigin)throw Error('Browser destination is outside allowed origin');
  await verifyPublicUrl(url);
  await pruneSessions();
  if (sessions.size >= MAX_SESSIONS) throw Error('Session limit reached; close an existing session');
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({acceptDownloads: false});
    await context.route('**/*', async route => {
      try {
        await verifyPublicUrl(route.request().url());
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
    const destination=await verifyPublicUrl(action.url);
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
      const destination=await verifyPublicUrl(new URL(href,s.page.url()).toString());
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
export {createSession, observe, act, close, screenshot, checkUrl,verifyPublicUrl,isNonPublicAddress};
