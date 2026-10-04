const p = require('puppeteer');
async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p1 = await browser.newPage();
  p1.on('console', msg => console.log('PAGE LOG:', msg.text()));
  p1.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await p1.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await p1.waitForSelector('input[type="password"]');
  await p1.type('input[type="password"]', 'engineerit2026');
  await p1.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  const html = await p1.content();
  console.log(html.substring(0, 1000));
  await browser.close();
}
run();
