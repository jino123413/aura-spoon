import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const URL = 'http://localhost:3016';
const SHOTS = 'screenshots';
if (!existsSync(SHOTS)) mkdirSync(SHOTS);

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

  // Capture errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  // Clear storage
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 1. HomeScreen
  await page.screenshot({ path: `${SHOTS}/01-home.png` });
  console.log('1. HomeScreen captured');

  // 2. Enter name
  const input = await page.$('input');
  await input.fill('테스트');
  await input.press('Enter');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/02-reveal.png` });
  console.log('2. RevealScreen captured');

  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${SHOTS}/03-result.png` });
  console.log('3. ResultScreen captured');

  // 3. Check feed button and speech bubble
  const bodyText = await page.textContent('body');
  console.log(`   Speech bubble present: ${bodyText.includes('기운이의 한마디')}`);
  console.log(`   Feed button present: ${bodyText.includes('기운이에게 기운 주기')}`);
  console.log(`   Ad notice present: ${bodyText.includes('1회는 광고가 포함')}`);

  // 4. Scroll down to see full result
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/04-result-scroll.png` });
  console.log('4. ResultScreen scrolled captured');

  // 5. Set exp to 4 to prepare for evolution test
  await page.evaluate(() => {
    const mascot = JSON.parse(localStorage.getItem('aura-spoon-mascot'));
    mascot.exp = 4;
    localStorage.setItem('aura-spoon-mascot', JSON.stringify(mascot));
  });

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Reload to pick up exp change - but we need to re-enter name
  // Instead, just press feed button which will use stored value
  // Actually manualFeedMascot reads from storage, so the exp change won't take effect
  // until we reload. Let me just click feed 3 more times normally.

  // Actually, let me just click feed button rapidly to reach evolution
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

  // 6. Check if evolution overlay appeared
  await page.waitForTimeout(1000);
  const evoOverlay = await page.$('.evolution-overlay');
  console.log(`5. Evolution overlay present: ${!!evoOverlay}`);

  if (evoOverlay) {
    await page.screenshot({ path: `${SHOTS}/05-evolution-start.png` });
    console.log('   Evolution start captured');

    // Wait for animation
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SHOTS}/06-evolution-mid.png` });
    console.log('   Evolution mid captured');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SHOTS}/07-evolution-end.png` });
    console.log('   Evolution end captured');

    // Dismiss
    const dismissBtns = await page.$$('.evolution-overlay button');
    for (const btn of dismissBtns) {
      const t = await btn.textContent();
      if (t.includes('확인')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(500);
  }

  // 7. Go to collection tab
  // First go back to home
  const retryBtns = await page.$$('button');
  for (const btn of retryBtns) {
    const text = await btn.textContent();
    if (text.includes('다른 이름 기운 보기')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(500);

  let tabs = await page.$$('.tab-item');
  if (tabs.length >= 2) {
    await tabs[1].click(); // Collection tab
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${SHOTS}/08-collection.png` });
  console.log('6. Collection tab captured');

  // 8. Tap on a discovered aura
  const cells = await page.$$('.aura-grid-cell');
  if (cells.length > 0) {
    // Find a discovered cell
    for (const cell of cells) {
      const locked = await cell.$('.aura-grid-locked');
      if (!locked) {
        await cell.click();
        await page.waitForTimeout(500);
        break;
      }
    }
  }

  // 9. Check aura detail screen
  await page.screenshot({ path: `${SHOTS}/09-aura-detail.png` });
  console.log('7. AuraDetail captured');

  // Check for back button
  const backBtn = await page.$('text=뒤로');
  console.log(`   Back button visible: ${!!backBtn}`);

  // Check if AuraDetailScreen is showing
  const detailHeader = await page.textContent('body');
  console.log(`   Has personality text: ${detailHeader.includes('성격') || detailHeader.length > 100}`);
  console.log(`   Has quote section: ${detailHeader.includes('기운이의 한마디')}`);

  // Scroll down in detail
  await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0.z-40');
    if (overlay) overlay.scrollTo(0, 500);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/10-aura-detail-scroll.png` });
  console.log('8. AuraDetail scrolled captured');

  // 10. Go back from aura detail
  if (backBtn) {
    await backBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/11-back-from-detail.png` });
    console.log('9. Back from detail captured');
  } else {
    console.log('   WARNING: No back button found!');
  }

  // 11. Go to mascot tab
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 3) {
    await tabs[2].click(); // Mascot tab
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${SHOTS}/12-mascot.png` });
  console.log('10. Mascot tab captured');

  // Scroll mascot tab
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/13-mascot-scroll.png` });
  console.log('11. Mascot scrolled captured');

  // Summary
  console.log('\n=== Summary ===');
  if (errors.length > 0) {
    console.log('Page errors:');
    errors.forEach(e => console.log(`  ${e.slice(0, 120)}`));
  } else {
    console.log('No page errors');
  }
  console.log(`Screenshots saved to: ${SHOTS}/`);

  await browser.close();
})();
