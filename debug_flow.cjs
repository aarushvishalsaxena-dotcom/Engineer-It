const p = require('puppeteer');

async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  const hostPage = await browser.newPage();
  await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await hostPage.waitForSelector('input[type="password"]');
  await hostPage.type('input[type="password"]', 'engineerit2026');
  await hostPage.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  let btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('START ROUND 1')) { await b.click(); break; }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      console.log('After Start R1:', text);
      if(text.includes('END ROUND 1')) { await b.click(); break; }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      console.log('After End R1:', text);
  }
  
  await browser.close();
}
run();
