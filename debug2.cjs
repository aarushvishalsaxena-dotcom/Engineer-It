const p = require('puppeteer');
async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p1 = await browser.newPage();
  p1.on('console', msg => console.log('PAGE LOG:', msg.text()));
  p1.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
  await p1.waitForSelector('input[type="text"]');
  await p1.type('input[type="text"]', 'Team Alpha');
  await p1.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  const html = await p1.content();
  if (html.includes('Team Alpha')) console.log("Joined successfully");
  else console.log(html.substring(0, 2000));
  
  await browser.close();
}
run();
