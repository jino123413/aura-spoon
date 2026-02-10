import { chromium } from 'playwright';

const URL = 'http://localhost:3016';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

  // Clear storage
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('=== Evolution Flow Test ===\n');

  // Enter name
  const input = await page.$('input');
  await input.fill('진화테스트');
  await input.press('Enter');
  await page.waitForTimeout(5000);

  // Check initial state
  let mascotData = await page.evaluate(() => localStorage.getItem('aura-spoon-mascot'));
  if (mascotData) {
    const m = JSON.parse(mascotData);
    console.log(`After name submit: exp=${m.exp}, totalFeedings=${m.totalFeedings}`);
  }

  // Feed button helper
  const getFeedBtn = async () => {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) return btn;
    }
    return null;
  };

  // Check evolution overlay
  const isEvolutionShowing = async () => {
    const overlay = await page.$('.evolution-overlay');
    return !!overlay;
  };

  // Press feed button until evolution
  let evolutionHappened = false;
  for (let i = 0; i < 6; i++) {
    const btn = await getFeedBtn();
    if (!btn) {
      const isEvo = await isEvolutionShowing();
      if (isEvo) {
        console.log(`  -> Evolution overlay visible! (at press ${i + 1})`);
        evolutionHappened = true;
      } else {
        console.log(`  -> Feed button not found and no evolution overlay at press ${i + 1}`);
      }
      break;
    }

    const btnText = (await btn.textContent()).trim();
    console.log(`Press ${i + 1}: "${btnText}"`);
    await btn.click();
    await page.waitForTimeout(800);

    // Check storage state
    mascotData = await page.evaluate(() => localStorage.getItem('aura-spoon-mascot'));
    if (mascotData) {
      const m = JSON.parse(mascotData);
      console.log(`  -> exp=${m.exp}, totalFeedings=${m.totalFeedings}`);
    }

    const isEvo = await isEvolutionShowing();
    if (isEvo) {
      console.log(`  -> EVOLUTION TRIGGERED after press ${i + 1}!`);
      evolutionHappened = true;

      // Wait for dismiss button to appear (after 5 sec animation)
      console.log('  -> Waiting for animation to finish...');
      await page.waitForTimeout(6000);

      const buttons = await page.$$('.evolution-overlay button');
      for (const b of buttons) {
        const t = await b.textContent();
        if (t.includes('확인')) {
          await b.click();
          console.log('  -> Dismissed evolution overlay');
          break;
        }
      }
      await page.waitForTimeout(1000);
      break;
    }
  }

  // Final state
  mascotData = await page.evaluate(() => localStorage.getItem('aura-spoon-mascot'));
  if (mascotData) {
    const m = JSON.parse(mascotData);
    console.log(`\nFinal mascot: exp=${m.exp}, totalFeedings=${m.totalFeedings}, auraId=${m.auraId}`);
  }

  const colData = await page.evaluate(() => localStorage.getItem('aura-spoon-collection-v2'));
  if (colData) {
    const col = JSON.parse(colData);
    console.log(`Collection: ${col.entries.length} entries`);
  }

  console.log(`\nEvolution happened: ${evolutionHappened}`);
  console.log('\n=== Test Complete ===\n');

  await browser.close();
})();
