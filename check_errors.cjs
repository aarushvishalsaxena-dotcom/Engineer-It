const p = require('puppeteer');
async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p1 = await browser.newPage();
  p1.on('console', msg => console.log('PAGE LOG:', msg.text()));
  p1.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  await browser.close();
}
run();
