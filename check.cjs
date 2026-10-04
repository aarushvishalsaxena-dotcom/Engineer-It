const p = require('puppeteer');
async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p1 = await browser.newPage();
  await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  const html = await p1.content();
  console.log(html);
  await browser.close();
}
run();
