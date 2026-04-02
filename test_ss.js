const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 800});
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:8000');
  await page.type('#si-email', 'izambrano@sipsconsults.com');
  await page.type('#si-pass', 'Gatorade4!');
  await page.click('button[onclick="doLogin()"]');
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({path: 'dashboard.png'});
  await browser.close();
  console.log('Saved dashboard.png');
})();
