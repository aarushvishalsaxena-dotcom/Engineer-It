const p = require('puppeteer');

async function run() {
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });
  //... just run the test and check the html
}
