const p = require('puppeteer');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\Shorang\\.gemini\\antigravity\\brain\\e4681fce-8805-4dba-b665-2ea646df464e';

async function run() {
  console.log('Starting puppeteer tests...');
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox'] });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 800 });
    await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });
    
    try {
        await hostPage.waitForSelector('input[type="password"]', {timeout: 5000});
        await hostPage.type('input[type="password"]', 'engineerit2026');
        await hostPage.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));
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
        await new Promise(r => setTimeout(r, 2000));
    } catch(e) { console.error('Host login/reset failed:', e); }
    
    const p1 = await browser.newPage();
    await p1.setViewport({ width: 390, height: 844, isMobile: true });
    await p1.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
    await p1.screenshot({ path: `${OUT_DIR}\\01_player_join.png` });
    
    await p1.waitForSelector('input[type="text"]', {timeout: 5000});
    await p1.type('input[type="text"]', 'Team Alpha');
    await p1.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
    await p1.screenshot({ path: `${OUT_DIR}\\02_player_lobby.png` });

    const p2 = await browser.newPage();
    await p2.setViewport({ width: 390, height: 844, isMobile: true });
    await p2.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
    
    await p2.waitForSelector('input[type="text"]', {timeout: 5000});
    const inputs = await p2.$$('input[type="text"]');
    await inputs[0].type('Team Beta');
    await p2.click('button[type="submit"]');
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
    
    await hostPage.screenshot({ path: `${OUT_DIR}\\03_host_r2_dashboard.png` });
    
    btns = await hostPage.$$('button');
    for(let b of btns) {
        let text = await hostPage.evaluate(el => el.textContent, b);
        if(text.includes('LOAD NEXT QUESTION')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    await p1.bringToFront();
    await p1.screenshot({ path: `${OUT_DIR}\\04_player_r2_before_timer.png` });
    
    await hostPage.bringToFront();
    btns = await hostPage.$$('button');
    for(let b of btns) {
        let text = await hostPage.evaluate(el => el.textContent, b);
        if(text.includes('START TIMER')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    await p1.bringToFront();
    btns = await p1.$$('button');
    for(let b of btns) {
        let text = await p1.evaluate(el => el.textContent, b);
        if(text.trim().startsWith('A')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 1000));
    await p1.screenshot({ path: `${OUT_DIR}\\05_player_r2_selected.png` });
    
    btns = await p1.$$('button');
    for(let b of btns) {
        let text = await p1.evaluate(el => el.textContent, b);
        if(text.includes('SUBMIT ANSWER')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 1000));
    await p1.screenshot({ path: `${OUT_DIR}\\06_player_r2_submitted.png` });
    
    await p2.bringToFront();
    btns = await p2.$$('button');
    for(let b of btns) {
        let text = await p2.evaluate(el => el.textContent, b);
        if(text.trim().startsWith('B')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 1000));
    btns = await p2.$$('button');
    for(let b of btns) {
        let text = await p2.evaluate(el => el.textContent, b);
        if(text.includes('SUBMIT ANSWER')) { await b.click(); break; }
    }
    
    await hostPage.bringToFront();
    btns = await hostPage.$$('button');
    for(let b of btns) {
        let text = await hostPage.evaluate(el => el.textContent, b);
        if(text.includes('STOP & REVEAL')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    await p1.bringToFront();
    await p1.screenshot({ path: `${OUT_DIR}\\07_player_r2_reveal.png` });
    
    await hostPage.bringToFront();
    btns = await hostPage.$$('button');
    for(let b of btns) {
        let text = await hostPage.evaluate(el => el.textContent, b);
        if(text.includes('KICK')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 1000));
    btns = await hostPage.$$('button');
    for(let b of btns) {
        let text = await hostPage.evaluate(el => el.textContent, b);
        if(text.includes('KICK TEAM')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    await p2.bringToFront();
    await p2.screenshot({ path: `${OUT_DIR}\\08_player_not_qualified.png` });
    
    console.log("All screenshots captured successfully.");
    
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

run();
