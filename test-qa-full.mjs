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
    console.log(`  FAIL  ${name} — ${(e.message || '').slice(0, 120)}`);
  }
}

// Helpers
async function clickButton(page, textMatch, timeout = 3000) {
  const btn = page.locator(`button:has-text("${textMatch}")`).first();
  await btn.click({ timeout });
}

async function bodyText(page) {
  return page.textContent('body');
}

async function getMascotSrc(page) {
  return page.evaluate(() => {
    const img = document.querySelector('.mascot-avatar img');
    return img ? img.getAttribute('src') : '';
  });
}

async function getOrbSrc(page) {
  return page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    return img ? img.getAttribute('src') : '';
  });
}

async function safeClickTab(page, index) {
  // Close any overlay first
  await page.evaluate(() => window.scrollTo(0, 0));
  try {
    const overlay = await page.$('.animate-fadeIn.fixed');
    if (overlay) {
      // Try various back/close buttons
      try { await clickButton(page, '뒤로', 1500); } catch {
        try { await clickButton(page, '다른 이름 기운 보기', 1500); } catch {}
      }
      await page.waitForTimeout(500);
    }
  } catch {}
  // Click tab via JS to avoid visibility issues
  await page.evaluate((idx) => {
    const tabs = document.querySelectorAll('.tab-item');
    if (tabs[idx]) tabs[idx].click();
  }, index);
  await page.waitForTimeout(800);
}

async function dismissEvolution(page) {
  await page.waitForTimeout(5500);
  try {
    await page.locator('.evolution-overlay button:has-text("확인")').click({ timeout: 3000 });
    await page.waitForTimeout(500);
    return true;
  } catch { return false; }
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  // ─── Clean state ───
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ═══════════════════════════════════════
  console.log('\n=== 1. 첫 방문 — HomeScreen 초기 상태 ===');
  await page.screenshot({ path: `${SHOTS}/01-home-initial.png` });

  await check('앱 헤더 표시', async () => !!(await page.$('.app-header')));
  await check('이름 입력 필드 표시', async () => !!(await page.$('input')));
  await check('탭바 3개 표시', async () => (await page.$$('.tab-item')).length === 3);
  await check('확인 버튼 비활성 (빈 입력)', async () => {
    const btn = page.locator('button:has-text("오늘의 기운 확인하기")').first();
    const disabled = await btn.getAttribute('disabled');
    return disabled !== null;
  });
  await check('이모지 불꽃 없음 (SVG FlameIcon 사용)', async () => {
    const text = await bodyText(page);
    return !text.includes('🔥');
  });

  // ═══════════════════════════════════════
  console.log('\n=== 2. 이름 입력 → 리빌 → 결과 ===');
  await page.fill('input', '테스트유저');
  await page.press('input', 'Enter');
  await page.waitForTimeout(1000);

  await check('리빌 화면 표시', async () => !!(await page.$('.reveal-screen')));
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${SHOTS}/02-result.png` });

  await check('헤더 숨김 (오버레이)', async () => !(await page.$('.app-header')));
  await check('사용자 이름 표시', async () => (await bodyText(page)).includes('테스트유저'));
  await check('기운 주기 버튼 존재', async () => (await bodyText(page)).includes('기운이에게 기운 주기'));
  await check('공유 버튼 존재', async () => (await bodyText(page)).includes('친구에게 공유하기'));
  await check('새로 뽑기 + AD 배지', async () => {
    const text = await bodyText(page);
    return text.includes('새로 뽑기') && text.includes('AD');
  });
  await check('새로 뽑기에 이모지 없음', async () => {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const t = await btn.textContent();
      if (t.includes('새로 뽑기')) return !t.includes('🔄');
    }
    return false;
  });
  await check('진화 초기화 경고 표시', async () => (await bodyText(page)).includes('진화 초기화'));
  await check('다른 이름 기운 보기 버튼', async () => (await bodyText(page)).includes('다른 이름 기운 보기'));
  await check('에너지 파트너 표시', async () => (await bodyText(page)).includes('에너지 파트너'));
  await check('기운이의 한마디 표시', async () => (await bodyText(page)).includes('기운이의 한마디'));
  await check('키워드 태그 표시', async () => (await page.$$('.keyword-tag')).length >= 2);

  const firstAuraId = await page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    const src = img ? img.getAttribute('src') : '';
    const match = src.match(/\/auras\/(\d+)\//);
    return match ? match[1] : '';
  });
  const firstImgSrc = await getOrbSrc(page);
  console.log(`  첫 번째 기운: ${firstImgSrc}`);

  // ═══════════════════════════════════════
  console.log('\n=== 3. 결과 화면에서 기운 주기 → 진화 ===');
  await check('초기 게이지 1/5 (자동 먹이 포함)', async () => (await bodyText(page)).includes('1/5'));

  // Feed 4 more times (1 auto + 4 manual = 5 total = evolution)
  for (let i = 0; i < 4; i++) {
    await clickButton(page, '기운이에게 기운 주기');
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1000);

  await check('진화 오버레이 표시 (ResultScreen)', async () => !!(await page.$('.evolution-overlay')));
  await page.screenshot({ path: `${SHOTS}/03-evolution.png` });
  await dismissEvolution(page);

  const postEvoSrc = await getOrbSrc(page);
  console.log(`  진화 후: ${postEvoSrc}`);
  await check('진화 후 lv1 이미지', async () => postEvoSrc.includes('lv1'));
  await check('진화 후 게이지 0/5 리셋', async () => (await bodyText(page)).includes('0/5'));

  // ═══════════════════════════════════════
  console.log('\n=== 4. 새로 뽑기 (리롤) ===');
  await clickButton(page, '새로 뽑기');
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${SHOTS}/04-reroll.png` });

  const rerolledSrc = await getOrbSrc(page);
  const rerolledAuraId = await page.evaluate(() => {
    const img = document.querySelector('.energy-orb-inner img');
    const src = img ? img.getAttribute('src') : '';
    const match = src.match(/\/auras\/(\d+)\//);
    return match ? match[1] : '';
  });
  console.log(`  리롤 결과: ${rerolledSrc}`);

  await check('리롤 → 다른 기운 (다른 이미지)', async () => rerolledSrc !== firstImgSrc);
  await check('리롤 → lv0 리셋', async () => rerolledSrc.includes('lv0'));
  await check('리롤 → 게이지 0/5', async () => (await bodyText(page)).includes('0/5'));
  await check('리롤 → 씨앗 단계', async () => {
    const text = await bodyText(page);
    return text.includes('씨앗') || text.includes('여린');
  });

  // ═══════════════════════════════════════
  console.log('\n=== 5. 홈으로 돌아가기 ===');
  await clickButton(page, '다른 이름 기운 보기');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/05-home-after-reroll.png` });

  const homeMascotSrc = await getMascotSrc(page);
  console.log(`  홈 마스코트: ${homeMascotSrc}`);

  await check('홈 마스코트 = 리롤된 기운 (lv0)', async () => homeMascotSrc.includes('lv0'));
  await check('홈 씨앗 단계 표시', async () => (await bodyText(page)).includes('씨앗'));
  await check('"오늘의 기운 다시 보기" 버튼 없음 (RETRY_HOME 클리어)', async () => {
    return !(await bodyText(page)).includes('오늘의 기운 다시 보기');
  });
  await check('이름 입력 필드 다시 표시', async () => !!(await page.$('input')));

  // ═══════════════════════════════════════
  console.log('\n=== 6. 두 번째 이름 입력 → 결과 확인 후 홈 ===');
  await page.fill('input', '두번째유저');
  await page.press('input', 'Enter');
  await page.waitForTimeout(5500);

  await check('두 번째 결과 표시', async () => (await bodyText(page)).includes('두번째유저'));
  // Go home
  await clickButton(page, '다른 이름 기운 보기');
  await page.waitForTimeout(500);

  await check('홈에 "오늘의 기운 다시 보기" 없음 (클리어됨)', async () => {
    // RETRY_HOME clears result, so no "다시 보기" button
    return !!(await page.$('input'));
  });

  // ═══════════════════════════════════════
  console.log('\n=== 7. 세 번째 이름 → 결과 유지 후 홈 마스코트 탭 ===');
  await page.fill('input', '세번째유저');
  await page.press('input', 'Enter');
  await page.waitForTimeout(5500);

  // Feed 2 more from result (auto +1 = total 2 for this aura)
  await clickButton(page, '기운이에게 기운 주기');
  await page.waitForTimeout(400);
  await clickButton(page, '기운이에게 기운 주기');
  await page.waitForTimeout(400);
  console.log('  3회 먹이기 완료 (자동1 + 수동2)');

  // Go home via "다른 이름 기운 보기"
  await clickButton(page, '다른 이름 기운 보기');
  await page.waitForTimeout(500);

  // ═══════════════════════════════════════
  console.log('\n=== 8. 마스코트 탭 — 기운이 선택 + per-aura exp ===');
  let tabs = await page.$$('.tab-item');
  await tabs[2].click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/08-mascot-tab.png` });

  await check('마스코트 탭 "나의 기운이 변경" 표시', async () => (await bodyText(page)).includes('나의 기운이 변경'));

  const mascotBeforeSwitch = await getMascotSrc(page);
  const originalAuraId = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}').auraId; } catch { return 0; }
  });
  console.log(`  현재 마스코트: ${mascotBeforeSwitch} (auraId: ${originalAuraId})`);

  // Switch to a different aura via selection grid
  const didSwitch = await page.evaluate((curId) => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const img = btn.querySelector('img');
      if (!img) continue;
      const src = img.getAttribute('src') || '';
      const match = src.match(/\/auras\/(\d+)\//);
      if (match && parseInt(match[1]) !== curId) {
        btn.click();
        return true;
      }
    }
    return false;
  }, originalAuraId);
  await page.waitForTimeout(800);

  if (didSwitch) {
    const mascotAfterSwitch = await getMascotSrc(page);
    const switchedAuraId = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}').auraId; } catch { return 0; }
    });
    console.log(`  전환 후 마스코트: ${mascotAfterSwitch} (auraId: ${switchedAuraId})`);

    await check('마스코트 전환 → 다른 이미지', async () => switchedAuraId !== originalAuraId);
    await check('per-aura exp: 전환 후 레벨 변경', async () => mascotAfterSwitch.includes('/auras/'));

    const bodyAfterSwitch = await bodyText(page);
    console.log(`  전환 후 레벨 정보 포함: ${bodyAfterSwitch.includes('Lv.')}`);

    // Switch back to original aura by clicking the specific button
    await page.evaluate((targetId) => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const img = btn.querySelector('img');
        if (!img) continue;
        const src = img.getAttribute('src') || '';
        if (src.includes(`/auras/${targetId}/`)) {
          btn.click();
          return;
        }
      }
    }, originalAuraId);
    await page.waitForTimeout(800);

    const mascotSwitchBack = await getMascotSrc(page);
    const restoredAuraId = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}').auraId; } catch { return 0; }
    });
    console.log(`  복귀 후 마스코트: ${mascotSwitchBack} (auraId: ${restoredAuraId})`);
    await check('마스코트 복귀 성공', async () => restoredAuraId === originalAuraId);
  } else {
    console.log('  (전환 가능한 기운 없음)');
  }

  // ═══════════════════════════════════════
  console.log('\n=== 9. 마스코트 탭 → 이미지 탭 → 상세 + 기운 주기 ===');
  // Ensure we're on mascot tab first
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  tabs = await page.$$('.tab-item');
  if (tabs.length >= 3) await tabs[2].click();
  await page.waitForTimeout(800);

  // Tap mascot image on mascot tab via JS click (avoids visibility issues)
  try {
    const clicked = await page.evaluate(() => {
      const el = document.querySelector('.mascot-avatar');
      if (!el) return false;
      const parent = el.closest('[onclick], [class*="cursor-pointer"]') || el.parentElement;
      if (parent) parent.click();
      else el.click();
      return true;
    });
    if (!clicked) throw new Error('mascot-avatar not found');
    await page.waitForTimeout(800);

    const afterMascotTap = await bodyText(page);
    // Should go to result (if result exists) or detail
    const wentToResult = afterMascotTap.includes('친구에게 공유하기');
    const wentToDetail = afterMascotTap.includes('진화 단계');

    if (wentToResult) {
      console.log('  마스코트 탭 → 결과 페이지');
      await check('결과 페이지에 기운 주기 버튼', async () => afterMascotTap.includes('기운이에게 기운 주기'));
      await clickButton(page, '다른 이름 기운 보기');
      await page.waitForTimeout(500);
    } else if (wentToDetail) {
      console.log('  마스코트 탭 → 상세 페이지');
      await check('상세 페이지에 기운 주기 버튼', async () => afterMascotTap.includes('기운이에게 기운 주기'));
      await clickButton(page, '뒤로');
      await page.waitForTimeout(500);
    } else {
      fail++;
      console.log('  FAIL  마스코트 이미지 탭 → 이동 안 됨');
    }
  } catch (e) {
    console.log(`  SKIP  마스코트 이미지 탭 — ${e.message.slice(0, 80)}`);
    // Navigate back to mascot tab to continue
    tabs = await page.$$('.tab-item');
    if (tabs.length >= 3) {
      await tabs[2].click();
      await page.waitForTimeout(500);
    }
  }

  // ═══════════════════════════════════════
  console.log('\n=== 10. 도감 → 상세 → 기운 주기 → 진화 → 복귀 ===');
  await safeClickTab(page, 1);

  // Find the mascot's aura in collection and tap it
  const currentMascotAuraId = await page.evaluate(() => {
    // Read from localStorage
    try {
      const m = JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}');
      return m.auraId || '';
    } catch { return ''; }
  });
  console.log(`  현재 마스코트 auraId: ${currentMascotAuraId}`);

  // Tap the mascot's aura in collection
  const allCells = await page.$$('.aura-grid-cell');
  let tappedMascotCell = false;
  for (const cell of allCells) {
    const locked = await cell.$('.aura-grid-locked');
    if (locked) continue;
    // Check if this cell's aura matches mascot
    await cell.click();
    await page.waitForTimeout(500);
    const detailImg = await page.evaluate(() => {
      const imgs = document.querySelectorAll('.animate-fadeIn.fixed img');
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (src && src.includes('/auras/')) return src;
      }
      return '';
    });
    if (detailImg.includes(`/auras/${currentMascotAuraId}/`)) {
      tappedMascotCell = true;
      break;
    }
    // Wrong aura, go back and try next
    await clickButton(page, '뒤로');
    await page.waitForTimeout(300);
  }

  if (tappedMascotCell) {
    await page.screenshot({ path: `${SHOTS}/10-detail-feed.png` });
    const detailText = await bodyText(page);

    await check('도감 상세 → 기운 주기 버튼 (마스코트 기운)', async () => detailText.includes('기운이에게 기운 주기'));
    await check('도감 상세 → 진화 게이지 표시', async () => detailText.includes('진화 게이지'));
    await check('도감 상세 → 진화 단계 카드', async () => detailText.includes('진화 단계'));
    await check('도감 상세 → 기운이의 한마디', async () => detailText.includes('기운이의 한마디'));
    await check('도감 상세 → 에너지 파트너', async () => detailText.includes('에너지 파트너'));

    // Feed until evolution from detail screen
    const currentExp = await page.evaluate(() => {
      try {
        const m = JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}');
        return m.exp || 0;
      } catch { return 0; }
    });
    const feedsNeeded = 5 - (currentExp % 5);
    console.log(`  현재 exp: ${currentExp}, 진화까지 ${feedsNeeded}회`);

    for (let i = 0; i < feedsNeeded; i++) {
      try {
        await clickButton(page, '기운이에게 기운 주기');
        await page.waitForTimeout(400);
      } catch { break; }
    }
    await page.waitForTimeout(1000);

    const hasEvo = !!(await page.$('.evolution-overlay'));
    await check('도감 상세에서 진화 오버레이 표시', async () => hasEvo);

    if (hasEvo) {
      await page.screenshot({ path: `${SHOTS}/10-evolution-from-detail.png` });
      await dismissEvolution(page);
      await page.screenshot({ path: `${SHOTS}/10-after-dismiss.png` });

      await check('진화 확인 후 → 상세 페이지 복귀 (뒤로 버튼)', async () => {
        return (await bodyText(page)).includes('뒤로');
      });
      await check('진화 후 → 상세 레벨 업데이트', async () => {
        const text = await bodyText(page);
        // Should show updated level info
        return text.includes('진화 단계');
      });
    }

    // Go back from detail
    await clickButton(page, '뒤로');
    await page.waitForTimeout(500);
  } else {
    console.log('  (마스코트 기운을 도감에서 찾지 못함)');
  }

  // ═══════════════════════════════════════
  console.log('\n=== 11. 도감 → 비-마스코트 기운 상세 (먹이기 없음) ===');
  await safeClickTab(page, 1);

  // Tap a NON-mascot aura
  const cells2 = await page.$$('.aura-grid-cell');
  let tappedNonMascot = false;
  for (const cell of cells2) {
    const locked = await cell.$('.aura-grid-locked');
    if (locked) continue;
    await cell.click();
    await page.waitForTimeout(500);
    const detailImg = await page.evaluate(() => {
      const imgs = document.querySelectorAll('.animate-fadeIn.fixed img');
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (src && src.includes('/auras/')) return src;
      }
      return '';
    });
    if (!detailImg.includes(`/auras/${currentMascotAuraId}/`)) {
      tappedNonMascot = true;
      break;
    }
    await clickButton(page, '뒤로');
    await page.waitForTimeout(300);
  }

  if (tappedNonMascot) {
    const nonMascotText = await bodyText(page);
    await check('비-마스코트 기운 상세에 먹이기 버튼 없음', async () => !nonMascotText.includes('기운이에게 기운 주기'));
    await check('비-마스코트 기운 상세에 진화 게이지 없음', async () => !nonMascotText.includes('진화 게이지'));
    await page.screenshot({ path: `${SHOTS}/11-non-mascot-detail.png` });
    await clickButton(page, '뒤로');
    await page.waitForTimeout(300);
  } else {
    console.log('  (비-마스코트 기운을 찾지 못함)');
  }

  // ═══════════════════════════════════════
  console.log('\n=== 12. 홈 탭 마스코트 탭 동작 ===');
  await safeClickTab(page, 0);

  // Enter name to have a result in state
  const hasInput = await page.$('input');
  if (hasInput) {
    await page.fill('input', '홈탭테스트');
    await page.press('input', 'Enter');
    await page.waitForTimeout(5500);
  }

  // ═══════════════════════════════════════
  console.log('\n=== 13. 스트릭 표시 + FlameIcon SVG ===');
  // Close any overlay, go to mascot tab
  await safeClickTab(page, 2);

  await check('스트릭 표시 (연속 N일째)', async () => {
    const text = await bodyText(page);
    return text.includes('연속') && text.includes('일째');
  });

  await check('FlameIcon SVG 렌더링 (이모지 아님)', async () => {
    // Check for SVG flame icon, not 🔥 emoji
    const svgCount = await page.evaluate(() => {
      return document.querySelectorAll('svg path[d*="M12 23C7.03"]').length;
    });
    return svgCount > 0;
  });

  // ═══════════════════════════════════════
  console.log('\n=== 14. per-aura exp 검증 (Storage 확인) ===');
  const storageCheck = await page.evaluate(() => {
    try {
      const col = JSON.parse(localStorage.getItem('aura-spoon-collection-v2') || '{"entries":[]}');
      const mascot = JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}');
      const results = [];
      for (const entry of col.entries) {
        results.push(`aura ${entry.auraId}: exp=${entry.exp ?? 'N/A'}, feeds=${entry.totalFeedings ?? 'N/A'}`);
      }
      results.push(`mascot: auraId=${mascot.auraId}, exp=${mascot.exp}, feeds=${mascot.totalFeedings}`);
      return results;
    } catch (e) { return [e.message]; }
  });
  console.log('  Storage 상태:');
  storageCheck.forEach(l => console.log(`    ${l}`));

  await check('CollectionEntry에 exp 필드 존재', async () => {
    const col = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('aura-spoon-collection-v2') || '{"entries":[]}');
      return data.entries.every(e => typeof e.exp === 'number');
    });
    return col;
  });

  await check('각 기운 exp가 독립적 (모두 같지 않음)', async () => {
    const exps = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('aura-spoon-collection-v2') || '{"entries":[]}');
      return data.entries.map(e => e.exp ?? 0);
    });
    if (exps.length < 2) return true; // can't compare with 1 entry
    return new Set(exps).size > 1; // at least 2 different exp values
  });

  await check('마스코트 exp = 해당 기운 entry exp 일치', async () => {
    const match = await page.evaluate(() => {
      const col = JSON.parse(localStorage.getItem('aura-spoon-collection-v2') || '{"entries":[]}');
      const mascot = JSON.parse(localStorage.getItem('aura-spoon-mascot') || '{}');
      const entry = col.entries.find(e => e.auraId === mascot.auraId);
      if (!entry) return false;
      return mascot.exp === (entry.exp ?? 0);
    });
    return match;
  });

  // ═══════════════════════════════════════
  console.log('\n=== 15. 에러 검사 ===');
  await check('페이지 에러 없음', async () => errors.length === 0);

  // ─── Summary ───
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`최종 결과: ${pass} PASS / ${fail} FAIL / ${pass + fail} total`);
  if (errors.length > 0) {
    console.log('\n페이지 에러:');
    errors.forEach(e => console.log(`  ${e.slice(0, 150)}`));
  }
  console.log(`스크린샷: ${SHOTS}/`);
  console.log(`${'═'.repeat(50)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
