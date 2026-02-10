import { chromium } from 'playwright';

const URL = 'http://localhost:3016';
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

  // Clear storage for clean test
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('\n=== HomeScreen ===');
  await check('App title shows', async () => {
    const title = await page.$('.app-title');
    const text = title ? await title.textContent() : '';
    return text.includes('나만의 기운이');
  });

  await check('Name input exists', async () => {
    return !!(await page.$('input'));
  });

  await check('Tab bar visible', async () => {
    const tabs = await page.$$('.tab-item');
    return tabs.length >= 3;
  });

  // Submit a name
  console.log('\n=== Name Submit ===');
  const input = await page.$('input');
  await input.fill('테스트');
  await input.press('Enter');
  await page.waitForTimeout(4500); // wait for reveal animation

  await check('Reveal/Result screen shows', async () => {
    // Should be on result screen by now
    const resultText = await page.textContent('body');
    return resultText.includes('기운') || resultText.includes('오늘의');
  });

  // Wait a bit more for result screen
  await page.waitForTimeout(1000);

  console.log('\n=== ResultScreen ===');
  await check('Keywords visible', async () => {
    const tags = await page.$$('.keyword-tag');
    return tags.length >= 2;
  });

  await check('Speech bubble visible', async () => {
    const bubble = await page.$('.speech-bubble');
    return !!bubble;
  });

  await check('Share button has no gradient', async () => {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('공유하기')) {
        const bg = await btn.evaluate(el => getComputedStyle(el).background);
        return !bg.includes('gradient');
      }
    }
    return false;
  });

  await check('Retry button has NO AD badge', async () => {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('다른 이름 기운 보기')) {
        const adBadge = await btn.$('.ad-badge');
        return !adBadge; // Should NOT have ad badge
      }
    }
    return false;
  });

  await check('Feed button exists', async () => {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) return true;
    }
    return false;
  });

  await check('Feed progress shows', async () => {
    const text = await page.textContent('body');
    return text.includes('진화 게이지') && text.includes('/5');
  });

  await check('Ad notice shows', async () => {
    const text = await page.textContent('body');
    return text.includes('1회는 광고가 포함');
  });

  // Test feeding mechanic: press feed button multiple times
  console.log('\n=== Feeding Mechanic ===');
  const feedBtn = async () => {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) return btn;
    }
    return null;
  };

  // Press feed button once
  let btn = await feedBtn();
  if (btn) {
    await btn.click();
    await page.waitForTimeout(500);
  }

  await check('Feed count increments after click', async () => {
    const text = await page.textContent('body');
    // Should show 2/5 or higher (1 from auto-feed + 1 from button)
    return text.includes('2/5') || text.includes('3/5') || text.includes('4/5');
  });

  // Press feed button again
  btn = await feedBtn();
  if (btn) {
    await btn.click();
    await page.waitForTimeout(500);
  }

  await check('Feed count increments again', async () => {
    const text = await page.textContent('body');
    return text.includes('3/5') || text.includes('4/5');
  });

  // Navigate to Mascot tab via retry + home
  console.log('\n=== Storage Bug Fix Verification ===');

  // Check mascot tab to verify storage works
  const retryBtn = async () => {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await b.textContent();
      if (text.includes('다른 이름 기운 보기')) return b;
    }
    return null;
  };

  btn = await retryBtn();
  if (btn) {
    await btn.click();
    await page.waitForTimeout(1000);
  }

  // Click mascot tab (3rd tab)
  let tabs = await page.$$('.tab-item');
  if (tabs.length >= 3) {
    await tabs[2].click();
    await page.waitForTimeout(1000);
  }

  await check('Mascot tab shows content', async () => {
    const text = await page.textContent('body');
    return text.includes('총') && text.includes('회 먹이기');
  });

  await check('Mascot exp visible', async () => {
    const text = await page.textContent('body');
    return text.includes('경험치');
  });

  // Click collection tab (2nd tab)
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 2) {
    await tabs[1].click();
    await page.waitForTimeout(1000);
  }

  await check('Collection tab shows discovered aura', async () => {
    // Discovered items have aura-grid-img-wrap without aura-grid-locked
    const discovered = await page.$$('.aura-grid-img-wrap:not(.aura-grid-locked)');
    return discovered.length >= 1;
  });

  // Go back to home, enter another name to test storage persistence
  console.log('\n=== Second Name Entry ===');
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 1) {
    await tabs[0].click();
    await page.waitForTimeout(500);
  }

  const input2 = await page.$('input');
  if (input2) {
    await input2.fill('두번째');
    await input2.press('Enter');
    await page.waitForTimeout(5000);
  }

  await check('Second result shows', async () => {
    const text = await page.textContent('body');
    return text.includes('기운') && text.includes('두번째');
  });

  // Check the feed button is still there
  await check('Feed button on second result', async () => {
    const b = await feedBtn();
    return !!b;
  });

  // Final summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${pass} PASS / ${fail} FAIL / ${pass + fail} total`);
  console.log(`${'='.repeat(40)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
