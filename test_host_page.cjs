const puppeteer = require('puppeteer');

async function testHost() {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const h = await b.newPage();
  h.on('console', msg => console.log('HOST LOG:', msg.text()));
  h.on('pageerror', err => console.log('HOST ERROR:', err.message));
  await h.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await h.type('input[type="password"]', 'engineerit2026');
  await h.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  const btns = await h.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
  console.log('HOST BUTTONS:', btns);
  await b.close();
}

testHost();
