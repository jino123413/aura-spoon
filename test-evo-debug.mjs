import { chromium } from 'playwright';

const URL = 'http://localhost:3016';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  // Clear storage
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Enter name
  const input = await page.$('input');
  await input.fill('테스트');
  await input.press('Enter');
  await page.waitForTimeout(5000);

  // Set mascot exp to 4 directly so next feed triggers evolution
  await page.evaluate(() => {
    const mascot = JSON.parse(localStorage.getItem('aura-spoon-mascot'));
    mascot.exp = 4;
    mascot.totalFeedings = 4;
    localStorage.setItem('aura-spoon-mascot', JSON.stringify(mascot));
  });

  // Reload to pick up storage changes
  // Actually, the state is in React context. We need to trigger via the button.
  // Let's just press feed button and see what happens

  // Find and click feed button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('기운이에게 기운 주기')) {
      console.log(`Clicking feed button: "${text.trim()}"`);
      await btn.click();
      break;
    }
  }

  // Wait and check
  await page.waitForTimeout(2000);

  const overlay = await page.$('.evolution-overlay');
  console.log(`Evolution overlay present: ${!!overlay}`);

  // Check page HTML for any clues
  const html = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
  console.log(`\nBody HTML snippet:\n${html.slice(0, 500)}`);

  if (errors.length > 0) {
    console.log('\n=== Console Errors ===');
    errors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\nNo console errors.');
  }

  // Check mascot state
  const mascotData = await page.evaluate(() => localStorage.getItem('aura-spoon-mascot'));
  console.log(`\nMascot: ${mascotData}`);

  await browser.close();
})();
