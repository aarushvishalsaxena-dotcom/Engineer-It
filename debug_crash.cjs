const p = require('puppeteer');
async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  const hostPage = await browser.newPage();
  await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
  await hostPage.waitForSelector('input[type="password"]');
  await hostPage.type('input[type="password"]', 'engineerit2026');
  await hostPage.click('button[type="submit"]');
  
  const p1 = await browser.newPage();
  p1.on('console', msg => console.log('P1 LOG:', msg.text()));
  p1.on('pageerror', error => console.log('P1 ERROR:', error.message));
  
  await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  await p1.waitForSelector('input[type="text"]');
  await p1.type('input[type="text"]', 'Team Alpha');
  await p1.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  await hostPage.bringToFront();
  let btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('START ROUND 1')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('END ROUND 1')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));

  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('PROCEED TO ROUND 2')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));

  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('LOAD NEXT QUESTION')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
}
run();
