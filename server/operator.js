import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';

const sessions = new Map();
const MAX_SESSIONS = 3;
const TIMEOUT_MS = 15000;
const allowedProtocols = new Set(['https:', 'http:']);
function checkUrl(raw) {
  const url = new URL(raw);
  if (!allowedProtocols.has(url.protocol)) throw Error('Only HTTP(S) pages are supported');
  if (url.username || url.password) throw Error('Credentials in URLs are not allowed');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host === '::1' ||
      host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.endsWith('.local')) {
    throw Error('Local or private network targets are blocked');
  }
  return url.toString();
}
function publicSnapshot(page) {
  return page.locator('body').innerText({timeout: 5000}).then(text => text.slice(0, 16000));
}
async function createSession(url) {
  if (sessions.size >= MAX_SESSIONS) throw Error('Session limit reached; close an existing session');
  const browser = await chromium.launch({headless: true});
  try {
    const context = await browser.newContext({acceptDownloads: false});
    await context.route('**/*', async route => {
      try {
        checkUrl(route.request().url());
        await route.continue();
      } catch {
        await route.abort();
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(TIMEOUT_MS);
    await page.goto(checkUrl(url), {waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS});
    const id = randomUUID();
    sessions.set(id, {browser, page, created: Date.now()});
    return {id, ...await observe(id)};
  } catch (e) {
    await browser.close();
    throw e;
  }
}
async function observe(id) {
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
  const s = sessions.get(id);
  if (!s) throw Error('Unknown browser session');
  if (!action || !['click', 'fill', 'select', 'scroll', 'navigate'].includes(action.type)) throw Error('Unsupported action');
  if (action.type === 'navigate') {
    await s.page.goto(checkUrl(action.url), {waitUntil: 'domcontentloaded'});
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
      if (tag === 'button' || type === 'submit' || type === 'file') throw Error('Button and submission clicks require a separate approval workflow');
      await target.click();
    } else if (action.type === 'fill') {
      const type = (await target.getAttribute('type') || '').toLowerCase();
      if (['password','hidden','file'].includes(type)) throw Error('Sensitive fields are not supported');
      if (typeof action.value !== 'string' || action.value.length > 2000) throw Error('Invalid input');
      await target.fill(action.value);
    } else {
      if (typeof action.value !== 'string' || action.value.length > 200) throw Error('Invalid selection');
      await target.selectOption(action.value);
    }
  }
  return observe(id);
}
async function screenshot(id) {
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
