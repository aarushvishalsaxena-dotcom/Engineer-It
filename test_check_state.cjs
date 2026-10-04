const puppeteer = require('puppeteer');

async function checkPlayer0() {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const h = await b.newPage();
  await h.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await h.type('input[type="password"]', 'engineerit2026');
  await h.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  const hText = await h.evaluate(() => document.body.innerText);
  console.log('HOST CURRENT TEXT:\n', hText.substring(0, 400));
  
  await b.close();
}

checkPlayer0();
