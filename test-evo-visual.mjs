import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const URL = 'http://localhost:3016';
const SHOTS = 'screenshots-evo';
if (!existsSync(SHOTS)) mkdirSync(SHOTS);

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Enter name
  const input = await page.$('input');
  await input.fill('테스트');
  await input.press('Enter');
  await page.waitForTimeout(5500);

  // Click feed button 4 times
  for (let i = 0; i < 4; i++) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('기운이에게 기운 주기')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(500);
  }

  // Wait for evolution overlay
  await page.waitForTimeout(300);
  const evoOverlay = await page.$('.evolution-overlay');
  console.log(`Evolution overlay: ${!!evoOverlay}`);

  if (evoOverlay) {
    // Capture at different points
    await page.screenshot({ path: `${SHOTS}/evo-0.0s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-0.7s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-1.4s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-2.1s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-2.8s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-3.5s.png` });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/evo-4.2s.png` });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/evo-5.0s.png` });

    // Check what the Player container looks like
    const playerRect = await page.evaluate(() => {
      const player = document.querySelector('.evolution-overlay-content > div');
      if (player) {
        const rect = player.getBoundingClientRect();
        return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
      }
      return null;
    });
    console.log('Player rect:', playerRect);

    // Check content inside the overlay
    const contentRect = await page.evaluate(() => {
      const content = document.querySelector('.evolution-overlay-content');
      if (content) {
        const rect = content.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }
      return null;
    });
    console.log('Content rect:', contentRect);
  }

  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();
})();
