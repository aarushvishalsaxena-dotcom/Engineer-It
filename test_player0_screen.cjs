const puppeteer = require('puppeteer');

async function testPlayer0Round2() {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  const content = await p.evaluate(() => document.body.innerText);
  console.log('PLAYER 0 SCREEN TEXT:\n', content);
  await b.close();
}

testPlayer0Round2();
