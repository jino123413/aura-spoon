import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const URL = 'http://localhost:3016';
const SHOTS = 'screenshots-qa';
if (!existsSync(SHOTS)) mkdirSync(SHOTS);

let pass = 0, fail = 0;
async function check(name, fn) {
  try {
    const ok = await fn();
    if (ok) { pass++; console.log(`  PASS  ${name}`); }
    else { fail++; console.log(`  FAIL  ${name}`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL  ${name} — ${(e.message || '').slice(0, 100)}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  // Clear storage
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('\n=== 1. HomeScreen ===');
  await page.screenshot({ path: `${SHOTS}/01-home.png` });

  await check('App header visible', async () => !!(await page.$('.app-header')));
  await check('Name input visible', async () => !!(await page.$('input')));
  await check('Tab bar with 3 tabs', async () => (await page.$$('.tab-item')).length === 3);

  // Enter name
  console.log('\n=== 2. Name Submission ===');
  const input = await page.$('input');
  await input.fill('테스트유저');
  await input.press('Enter');
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${SHOTS}/02-result.png` });

  await check('Header hidden during overlay', async () => !(await page.$('.app-header')));
  await check('Result shows user name', async () => (await page.textContent('body')).includes('테스트유저'));
  await check('Feed button exists', async () => (await page.textContent('body')).includes('기운이에게 기운 주기'));
  await check('새로 뽑기 has AD badge', async () => {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await btn.textContent();
      if (text.includes('새로 뽑기') && text.includes('AD')) return true;
    }
    return false;
  });
  await check('새로 뽑기 has no emoji', async () => {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await btn.textContent();
      if (text.includes('새로 뽑기') && !text.includes('🔄')) return true;
    }
    return false;
  });
  await check('Reroll notice text visible', async () => {
    const text = await page.textContent('body');
    return text.includes('진화 초기화');
  });

  // Get first aura image src
  const firstImgSrc = await page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    return img ? img.getAttribute('src') : '';
  });
  console.log(`  First aura: ${firstImgSrc}`);

  // Feed 4 times to evolve first
  console.log('\n=== 3. Evolve first ===');
  for (let i = 0; i < 4; i++) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) { await btn.click(); break; }
    }
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(500);

  const evoOverlay = await page.$('.evolution-overlay');
  await check('Evolution overlay appears', async () => !!evoOverlay);

  if (evoOverlay) {
    await page.waitForTimeout(5500);
    const btns = await page.$$('.evolution-overlay button');
    for (const b of btns) {
      const t = await b.textContent();
      if (t.includes('확인')) { await b.click(); break; }
    }
    await page.waitForTimeout(500);
  }

  // Verify lv1 after evolution
  const postEvoSrc = await page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    return img ? img.getAttribute('src') : '';
  });
  console.log(`  After evolution: ${postEvoSrc}`);
  await check('Image is lv1 after evolution', async () => postEvoSrc.includes('lv1'));

  // Now reroll
  console.log('\n=== 4. Reroll (새로 뽑기) ===');
  const rerollBtns = await page.$$('button');
  for (const btn of rerollBtns) {
    const t = await btn.textContent();
    if (t.includes('새로 뽑기')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5500); // reveal animation

  await page.screenshot({ path: `${SHOTS}/03-reroll-result.png` });

  const rerolledSrc = await page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    return img ? img.getAttribute('src') : '';
  });
  console.log(`  Rerolled aura: ${rerolledSrc}`);

  await check('Reroll changes aura (different image)', async () => {
    return rerolledSrc !== firstImgSrc && rerolledSrc.includes('/auras/');
  });

  await check('Reroll resets to lv0', async () => {
    return rerolledSrc.includes('lv0');
  });

  await check('Reroll resets feed gauge to 0/5', async () => {
    const text = await page.textContent('body');
    return text.includes('0/5');
  });

  await check('Lv0 quote shown after reroll', async () => {
    const text = await page.textContent('body');
    return text.includes('씨앗') || text.includes('여린');
  });

  // Go home
  const retryBtns = await page.$$('button');
  for (const btn of retryBtns) {
    const text = await btn.textContent();
    if (text.includes('다른 이름 기운 보기')) { await btn.click(); break; }
  }
  await page.waitForTimeout(500);

  console.log('\n=== 5. Home after Reroll ===');
  await page.screenshot({ path: `${SHOTS}/04-home-after-reroll.png` });

  await check('Home mascot changed to rerolled aura', async () => {
    const img = await page.$('.mascot-avatar img');
    const src = img ? await img.getAttribute('src') : '';
    console.log(`    Mascot img: ${src}`);
    return src.includes('lv0'); // should be lv0 since reroll reset
  });

  await check('Home shows 씨앗 (lv0) after reroll', async () => {
    const text = await page.textContent('body');
    return text.includes('씨앗');
  });

  // Mascot tab - aura selection
  console.log('\n=== 6. Mascot Tab (Aura Selection) ===');
  let tabs = await page.$$('.tab-item');
  if (tabs.length >= 3) { await tabs[2].click(); await page.waitForTimeout(1000); }
  await page.screenshot({ path: `${SHOTS}/05-mascot-tab.png` });

  await check('Mascot tab shows aura selection (2+ discovered)', async () => {
    const text = await page.textContent('body');
    return text.includes('나의 기운이 변경');
  });

  // Click a different aura in the selection
  const auraSelectionBtns = await page.$$('.mascot-avatar ~ * button, button');
  let switched = false;
  const currentMascotSrc = await page.evaluate(() => {
    const img = document.querySelector('.mascot-avatar img');
    return img ? img.getAttribute('src') : '';
  });
  console.log(`  Current mascot: ${currentMascotSrc}`);

  // Find "나의 기운이 변경" section buttons
  const allButtons = await page.$$('button');
  for (const btn of allButtons) {
    const text = await btn.textContent();
    // Skip non-aura buttons
    if (text.includes('AD') || text.includes('뒤로') || text.includes('기운 주기')) continue;
    const img = await btn.$('img');
    if (!img) continue;
    const src = await img.getAttribute('src');
    if (src && !src.includes(currentMascotSrc.split('/')[2])) {
      await btn.click();
      switched = true;
      await page.waitForTimeout(500);
      break;
    }
  }

  if (switched) {
    await page.screenshot({ path: `${SHOTS}/06-mascot-switched.png` });
    const newMascotSrc = await page.evaluate(() => {
      const img = document.querySelector('.mascot-avatar img');
      return img ? img.getAttribute('src') : '';
    });
    console.log(`  After switch: ${newMascotSrc}`);

    await check('Mascot changed after selection', async () => {
      return newMascotSrc !== currentMascotSrc;
    });
  } else {
    console.log('  (Could not find a different aura to switch to)');
  }

  // Collection tab
  console.log('\n=== 7. Collection ===');
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 2) { await tabs[1].click(); await page.waitForTimeout(1000); }
  await page.screenshot({ path: `${SHOTS}/07-collection.png` });

  await check('Collection has 2+ discovered auras', async () => {
    const cells = await page.$$('.aura-grid-cell');
    let discovered = 0;
    for (const cell of cells) {
      const locked = await cell.$('.aura-grid-locked');
      if (!locked) discovered++;
    }
    console.log(`    (discovered: ${discovered})`);
    return discovered >= 2;
  });

  // Tap discovered aura → detail
  console.log('\n=== 8. Aura Detail ===');
  const cells = await page.$$('.aura-grid-cell');
  for (const cell of cells) {
    const locked = await cell.$('.aura-grid-locked');
    if (!locked) { await cell.click(); break; }
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/08-aura-detail.png` });

  await check('Aura detail shows', async () => {
    const text = await page.textContent('body');
    return text.includes('진화 단계') && text.includes('기운이의 한마디');
  });

  await check('Level cards are clickable (lv0)', async () => {
    const detailBtns = await page.$$('.animate-fadeIn.fixed button');
    for (const btn of detailBtns) {
      const text = await btn.textContent();
      if (text.includes('Lv.0')) { await btn.click(); break; }
    }
    await page.waitForTimeout(200);
    const img = await page.$('.animate-fadeIn.fixed img');
    const src = img ? await img.getAttribute('src') : '';
    return src.includes('lv0');
  });

  await check('Back button works', async () => {
    const backBtn = await page.locator('button:has-text("뒤로")').first();
    await backBtn.click({ timeout: 3000 });
    await page.waitForTimeout(300);
    return (await page.$$('.tab-item')).length >= 3;
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${pass} PASS / ${fail} FAIL / ${pass + fail} total`);
  if (errors.length > 0) {
    console.log('\nPage errors:');
    errors.forEach(e => console.log(`  ${e.slice(0, 120)}`));
  } else {
    console.log('No page errors');
  }
  console.log(`Screenshots: ${SHOTS}/`);
  console.log(`${'='.repeat(40)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
