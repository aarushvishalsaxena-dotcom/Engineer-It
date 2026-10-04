const p = require('puppeteer');

async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1280, height: 800 });
  await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  let html = await hostPage.content();
  console.log("Host Page Content:", html.substring(0, 1000));
  
  await browser.close();
}
run();
