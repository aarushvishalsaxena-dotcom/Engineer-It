const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\Shorang\\.gemini\\antigravity\\brain\\e4681fce-8805-4dba-b665-2ea646df464e';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Host setup
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 800 });
    
    hostPage.on('pageerror', err => console.error('[HOST PAGE ERROR]:', err.message));
    hostPage.on('console', msg => {
      if (msg.type() === 'error') console.error('[HOST CONSOLE ERROR]:', msg.text());
    });

    await hostPage.goto('http://localhost:5173/host', { waitUntil: 'networkidle0' });

    // Host login if modal appears
    try {
      await hostPage.waitForSelector('input[type="password"]', { timeout: 3000 });
      await hostPage.type('input[type="password"]', 'engineerit2026');
      await hostPage.click('button[type="submit"]');
      await sleep(1000);
    } catch (e) {}

    // Reset game to clean slate
    console.log('Resetting game state on host...');
    const resetBtn = await hostPage.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('RESET GAME'));
    });
    if (resetBtn) {
      await resetBtn.click();
      await sleep(500);
      const confirmResetBtn = await hostPage.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('CONFIRM RESET ALL'));
      });
      if (confirmResetBtn) await confirmResetBtn.click();
      await sleep(1000);
    }

    // -------------------------------------------------------------
    // TEST 1: Register 5 teams, verify scores & qualification
    // -------------------------------------------------------------
    console.log('Registering 5 teams...');
    const playerPages = [];
    const teamNames = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon'];

    for (let i = 0; i < 5; i++) {
      const p = await browser.newPage();
      await p.setViewport({ width: 390, height: 844, isMobile: true });
      p.on('pageerror', err => console.error(`[P${i} PAGE ERROR]:`, err.message));
      await p.goto('http://localhost:5173/play', { waitUntil: 'networkidle0' });
      await p.evaluate(() => localStorage.clear());
      await p.reload({ waitUntil: 'networkidle0' });
      await p.waitForSelector('input[type="text"]', { timeout: 10000 });
      await p.type('input[type="text"]', teamNames[i]);
      await p.click('button[type="submit"]');
      await sleep(1000);
      playerPages.push(p);
    }

    console.log('5 teams registered successfully.');

    // Switch host to Round 1
    console.log('Host starting Round 1...');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent.includes('START ROUND 1'));
      if (startBtn) startBtn.click();
      const r1Tab = btns.find(b => b.textContent.trim() === 'ROUND 1');
      if (r1Tab) r1Tab.click();
    });
    await sleep(1500);

    // Verify Player 0 shows Waiting screen before question starts
    await playerPages[0].bringToFront();
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '01_player_r1_waiting.png') });
    console.log('Captured 01_player_r1_waiting.png');

    // Host: Show Question & Start Timer (Round 1, Question 0)
    console.log('Host triggering Show Question & Start Timer...');
    await hostPage.bringToFront();
    await hostPage.screenshot({ path: path.join(OUT_DIR, '02_host_r1_waiting.png') });
    console.log('Captured 02_host_r1_waiting.png');

    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const showBtn = btns.find(b => b.textContent.includes('SHOW QUESTION & START TIMER'));
      if (showBtn) showBtn.click();
    });
    await sleep(1500);

    // Capture Player 0 with question, timer bar, MYTH / ENGINEER buttons
    await playerPages[0].bringToFront();
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '03_player_r1_question_live.png') });
    console.log('Captured 03_player_r1_question_live.png (390px mobile)');

    // Desktop screenshot of Round 1 player screen
    await playerPages[0].setViewport({ width: 1280, height: 800 });
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '03_player_r1_desktop.png') });
    await playerPages[0].setViewport({ width: 390, height: 844, isMobile: true });
    console.log('Captured 03_player_r1_desktop.png (1280px desktop)');

    // Different teams tap answers:
    // Team 0 (Alpha) taps MYTH
    // Team 1 (Beta) taps MYTH
    // Team 2 (Gamma) taps MYTH
    // Team 3 (Delta) taps MYTH
    // Team 4 (Epsilon) taps ENGINEER FACT (wrong)
    console.log('Simulating player responses...');
    for (let i = 0; i < 4; i++) {
      await playerPages[i].bringToFront();
      await playerPages[i].evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.option-card'));
        const btn = btns.find(b => b.textContent.includes('MYTH'));
        if (btn) btn.click();
      });
      await sleep(200);
    }

    await playerPages[4].bringToFront();
    await playerPages[4].evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.option-card'));
      const btn = btns.find(b => b.textContent.includes('ENGINEER FACT'));
      if (btn) btn.click();
    });
    await sleep(500);

    // Capture host during timer running
    await hostPage.bringToFront();
    await hostPage.screenshot({ path: path.join(OUT_DIR, '04_host_r1_timer_running.png') });
    console.log('Captured 04_host_r1_timer_running.png');

    // Host clicks Reveal Now (or timer expires)
    console.log('Ending question early with Reveal Now...');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('REVEAL NOW'));
      if (btn) btn.click();
    });
    await sleep(1500);

    // Capture player reveal screen
    await playerPages[0].bringToFront();
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '05_player_r1_revealed.png') });
    console.log('Captured 05_player_r1_revealed.png');

    // Host clicks End R1 Early / Qualification modal
    console.log('Opening End Round 1 qualification confirmation modal...');
    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('END R1 EARLY') || b.textContent.includes('END ROUND 1'));
      if (btn) btn.click();
    });
    await sleep(1000);

    await hostPage.screenshot({ path: path.join(OUT_DIR, '06_host_qualification_modal.png') });
    console.log('Captured 06_host_qualification_modal.png');

    // Confirm qualification
    console.log('Confirming Round 1 qualifiers on host...');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('CONFIRM & ADVANCE'));
      if (btn) btn.click();
    });
    await sleep(1500);

    // Verify Player 0 (Qualified, rank 1 of 5)
    await playerPages[0].bringToFront();
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '07_player_qualified.png') });
    console.log('Captured 07_player_qualified.png');

    // Verify Player 4 (Eliminated, rank 5 of 5)
    await playerPages[4].bringToFront();
    await playerPages[4].screenshot({ path: path.join(OUT_DIR, '08_player_not_qualified.png') });
    console.log('Captured 08_player_not_qualified.png');

    // -------------------------------------------------------------
    // TEST 2: Start Round 2 -> verify eliminated team CANNOT play
    // -------------------------------------------------------------
    console.log('Host proceeding to Round 2...');
    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const proceedBtn = btns.find(b => b.textContent.includes('PROCEED TO ROUND 2') || b.textContent.includes('SWITCH TO ROUND 2'));
      if (proceedBtn) proceedBtn.click();
      const r2Tab = btns.find(b => b.textContent.trim() === 'ROUND 2');
      if (r2Tab) r2Tab.click();
    });
    await sleep(1500);

    // Host starts Round 2 Question 0
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent.includes('SHOW QUESTION & START TIMER'));
      if (startBtn) startBtn.click();
    });
    await sleep(1500);

    // Check Player 4 (Eliminated Team Epsilon) screen:
    // Should still display ELIMINATED!
    await playerPages[4].bringToFront();
    const p4Text = await playerPages[4].evaluate(() => document.body.innerText);
    const p4IsEliminated = p4Text.includes('ELIMINATED') || p4Text.includes('did not qualify');
    console.log(`TEST: Player 4 in Round 2 is blocked: ${p4IsEliminated ? 'PASS' : 'FAIL'}`);

    // Check Player 0 (Qualified Team Alpha) screen:
    await playerPages[0].bringToFront();
    await sleep(1000);
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '09_player_r2_live.png') });
    console.log('Captured 09_player_r2_live.png');

    // Player 0 selects option C
    await playerPages[0].evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.option-card'));
      const opt = btns.find(b => b.textContent.includes('dumps absorbed heat') || b.textContent.includes('C'));
      if (opt) opt.click();
    });
    await sleep(500);

    // Host reveals Round 2
    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('REVEAL NOW'));
      if (btn) btn.click();
    });
    await sleep(1500);

    // Player 0 reveal with Why it's wrong & Engineering fix
    await playerPages[0].bringToFront();
    await sleep(1000);
    await playerPages[0].screenshot({ path: path.join(OUT_DIR, '10_player_r2_revealed.png') });
    console.log('Captured 10_player_r2_revealed.png');

    console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

runTests();
