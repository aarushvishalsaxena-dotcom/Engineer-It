const p = require('puppeteer');

async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1280, height: 800 });
  await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  
  await hostPage.waitForSelector('input[type="password"]', {timeout: 5000});
  await hostPage.type('input[type="password"]', 'engineerit2026');
  await hostPage.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  let btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      console.log('Button:', text);
  }
  
  await browser.close();
}
run();
