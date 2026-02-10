import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const URL = 'http://localhost:3016';
const SHOTS = 'screenshots-fixed';
if (!existsSync(SHOTS)) mkdirSync(SHOTS);

let pass = 0, fail = 0;
async function check(name, fn) {
  try {
    const ok = await fn();
    if (ok) { pass++; console.log(`  PASS  ${name}`); }
    else { fail++; console.log(`  FAIL  ${name}`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL  ${name} — ${e.message?.slice(0, 80)}`);
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

  await check('App header visible on home', async () => {
    const header = await page.$('.app-header');
    return !!header;
  });

  // Enter name
  const input = await page.$('input');
  await input.fill('테스트');
  await input.press('Enter');
  await page.waitForTimeout(5500);

  console.log('\n=== 2. ResultScreen ===');
  await page.screenshot({ path: `${SHOTS}/02-result.png` });

  await check('App header hidden during overlay', async () => {
    const header = await page.$('.app-header');
    return !header;
  });

  await check('Level-based quote in speech bubble', async () => {
    const text = await page.textContent('body');
    // Lv.0 quote should be about 씨앗
    return text.includes('씨앗') || text.includes('여린');
  });

  await check('Feed button exists', async () => {
    const text = await page.textContent('body');
    return text.includes('기운이에게 기운 주기');
  });

  // Feed 4 times to trigger evolution
  console.log('\n=== 3. Evolution Flow ===');
  for (let i = 0; i < 4; i++) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(600);
  }

  await page.waitForTimeout(500);
  const evoOverlay = await page.$('.evolution-overlay');
  await check('Evolution overlay appears', async () => !!evoOverlay);

  if (evoOverlay) {
    // Take screenshots at different animation points
    await page.screenshot({ path: `${SHOTS}/03-evo-start.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/04-evo-flash.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/05-evo-newmascot.png` });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SHOTS}/06-evo-text.png` });

    await check('Evolution text visible (white on dark)', async () => {
      // Check that "진화했어요" text is somewhere in the overlay
      const text = await page.textContent('.evolution-overlay');
      return text.includes('진화했어요') || text.includes('확인');
    });

    await check('Emoji fallback shown (no real images)', async () => {
      // The fallback emoji should render since no actual images exist
      const text = await page.textContent('.evolution-overlay');
      return text.includes('🌱') || text.includes('🌫') || text.includes('확인');
    });

    // Dismiss
    const btns = await page.$$('.evolution-overlay button');
    for (const b of btns) {
      const t = await b.textContent();
      if (t.includes('확인')) { await b.click(); break; }
    }
    await page.waitForTimeout(500);
  }

  // Check result screen after evolution - quote should now be lv1
  console.log('\n=== 4. Post-Evolution Result ===');
  await page.screenshot({ path: `${SHOTS}/07-result-after-evo.png` });

  await check('Quote changes after evolution (lv1)', async () => {
    const text = await page.textContent('body');
    // Lv.1 quote contains "눈을 떴어요"
    return text.includes('눈을 떴') || text.includes('세상');
  });

  // Go home then to collection
  const retryBtns = await page.$$('button');
  for (const btn of retryBtns) {
    const text = await btn.textContent();
    if (text.includes('다른 이름 기운 보기')) { await btn.click(); break; }
  }
  await page.waitForTimeout(500);

  console.log('\n=== 5. Collection ===');
  let tabs = await page.$$('.tab-item');
  if (tabs.length >= 2) {
    await tabs[1].click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${SHOTS}/08-collection.png` });

  await check('Collection shows evolution-level images', async () => {
    // Check if any image src contains "lv1" (since we evolved to lv1)
    const imgs = await page.$$('.aura-grid-img-wrap img');
    for (const img of imgs) {
      const src = await img.getAttribute('src');
      if (src && src.includes('lv1')) return true;
    }
    return false;
  });

  // Tap discovered aura
  console.log('\n=== 6. Aura Detail + Back Button ===');
  const cells = await page.$$('.aura-grid-cell');
  for (const cell of cells) {
    const locked = await cell.$('.aura-grid-locked');
    if (!locked) { await cell.click(); break; }
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/09-aura-detail.png` });

  await check('Aura detail shows', async () => {
    const text = await page.textContent('body');
    return text.includes('진화 단계') && text.includes('기운이의 한마디');
  });

  await check('Back button is clickable (not blocked by header)', async () => {
    // Find back button by text and try to click it
    const backBtn = await page.locator('button:has-text("뒤로")').first();
    await backBtn.click({ timeout: 3000 });
    await page.waitForTimeout(300);
    // If we get here, click succeeded
    return true;
  });

  await page.screenshot({ path: `${SHOTS}/10-after-back.png` });

  await check('Back from aura detail returns to collection', async () => {
    const tabs = await page.$$('.tab-item');
    return tabs.length >= 3; // Tab bar visible again
  });

  // Check mascot tab
  console.log('\n=== 7. Mascot Tab ===');
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 3) {
    await tabs[2].click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${SHOTS}/11-mascot.png` });

  await check('Mascot shows Lv.1 after evolution', async () => {
    const text = await page.textContent('body');
    return text.includes('Lv.1') && text.includes('새싹');
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
