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
      if(text.includes('RESET GAME')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('CONFIRM RESET ALL')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));

  const p1 = await browser.newPage();
  await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  await p1.waitForSelector('input[type="text"]');
  await p1.type('input[type="text"]', 'Team Alpha');
  await p1.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  await hostPage.bringToFront();
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('START ROUND 1')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('END ROUND 1')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));

  btns = await hostPage.$$('button');
  for(let b of btns) {
      let text = await hostPage.evaluate(el => el.textContent, b);
      if(text.includes('PROCEED TO ROUND 2')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));

  let appHtml = await p1.evaluate(() => document.getElementById('app').innerText);
  console.log('APP RENDERED:', appHtml.replace(/\s+/g, ' ').substring(0, 500));
  
  await browser.close();
}
run();
