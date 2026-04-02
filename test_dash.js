const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:8000');
  await page.type('#si-email', 'izambrano@sipsconsults.com');
  await page.type('#si-pass', 'Gatorade4!');
  await page.click('button[onclick="doLogin()"]');
  await new Promise(r => setTimeout(r, 6000));
  const html = await page.evaluate(() => {
    return document.querySelector('#a-portal')?.innerHTML.substring(0, 500) || 
           document.querySelector('#h-portal')?.innerHTML.substring(0, 500) ||
           document.querySelector('#s-portal')?.innerHTML.substring(0, 500) ||
           document.querySelector('#x-portal')?.innerHTML.substring(0, 500) || 
           'No portal found';
  });
  console.log('PORTAL HTML:', html);
  await browser.close();
})();
