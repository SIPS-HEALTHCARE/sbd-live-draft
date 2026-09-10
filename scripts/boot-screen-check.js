// #1165 check. A: CDNs blocked -> login still renders. B: auth refresh hangs ->
// boot shows Loading, reveals the retry line at ~10s, login appears by the 12s timeout.
const puppeteer = require('puppeteer');
const assert = require('assert');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const CDN = /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.g/;

const srv = http.createServer((req,res)=>{
  const u = req.url.split('?')[0];
  const f = path.join(ROOT, u === '/' ? 'index.html' : decodeURIComponent(u));
  fs.readFile(f,(e,b)=> e ? (res.writeHead(404),res.end()) :
    (res.writeHead(200,{'Content-Type': f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'text/html'}),res.end(b)));
}).listen(0);

const visible = (p,s) => p.$eval(s, e => { const c=getComputedStyle(e); return c.visibility==='visible' && +c.opacity>.5; });

(async()=>{
  const port = srv.address().port, url = `http://localhost:${port}/`;
  const b = await puppeteer.launch({headless:'new'});

  // ── A: both CDNs blocked, no session ──
  let p = await b.newPage();
  await p.setRequestInterception(true);
  p.on('request', r => CDN.test(r.url()) ? r.abort() : r.continue());
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#login:not(.hidden)',{timeout:15000});
  console.log('A: login renders with both CDNs blocked ✓');
  await p.close();

  // ── B: expired session, refresh request black-holed ──
  p = await b.newPage();
  await p.setRequestInterception(true);
  p.on('request', r => {
    if (CDN.test(r.url())) return r.abort();
    if (r.url().includes('/auth/v1/token')) return;            // hang forever
    r.continue();
  });
  await p.evaluateOnNewDocument(() => localStorage.setItem('sbd_session', JSON.stringify({
    access_token:'x', refresh_token:'y', expires_at: Math.floor(Date.now()/1000)-60, user:{id:'u'} })));
  const t0 = Date.now();
  await p.goto(url,{waitUntil:'domcontentloaded'});
  assert.strictEqual(await p.$eval('.boot-text', e=>e.textContent.trim()), 'Loading', 'boot text');
  assert.strictEqual(await visible(p,'.boot-retry'), false, 'retry line must be hidden before 10s');
  console.log('B: boot shows "Loading", retry hidden ✓');

  await p.waitForFunction(()=>getComputedStyle(document.querySelector('.boot-retry')).visibility==='visible',{timeout:13000});
  const tRetry = (Date.now()-t0)/1000;
  assert.ok(tRetry > 9 && tRetry < 13, `retry revealed at ${tRetry.toFixed(1)}s, expected ~10s`);
  console.log(`B: retry line revealed at ${tRetry.toFixed(1)}s ✓`);

  await p.waitForSelector('#login:not(.hidden)',{timeout:10000});
  const tLogin = (Date.now()-t0)/1000;
  assert.ok(tLogin < 16, `login at ${tLogin.toFixed(1)}s, expected within the 12s refresh timeout`);
  console.log(`B: login appeared at ${tLogin.toFixed(1)}s with the refresh hung ✓`);

  await b.close(); srv.close();
})().catch(e=>{ console.error('FAIL:', e.message); process.exit(1); });
