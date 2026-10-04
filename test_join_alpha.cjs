const puppeteer = require('puppeteer');

async function testJoinAlpha() {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  const inputs = await p.$$('input[type="text"]');
  await inputs[0].type('Team Alpha');
  await p.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  console.log('ALPHA TEXT:\n', await p.evaluate(() => document.body.innerText));
  await b.close();
}

testJoinAlpha();
