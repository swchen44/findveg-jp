// 日本找素 FindVeg JP — E2E 煙霧測試
// 目的：自動擋「改了 JS 結果整頁白畫面 / 篩選炸掉」這類 runtime 錯誤（資料測試抓不到）。
const { test, expect } = require('@playwright/test');

// 收集「真正的 JS 錯誤」：pageerror(未捕捉例外，如 TDZ) + 非網路資源的 console.error。
// CI 上 OSM 圖磚/HappyCow 照片可能被擋 → 這類網路失敗要忽略，不然會假性失敗。
function trackJsErrors(page) {
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::|ERR_|status of [45]\d\d|tile|happycow|k-img/i.test(t)) return;
    errs.push('console: ' + t);
  });
  return errs;
}

async function waitAppReady(page) {
  await page.goto('/');
  await page.waitForSelector('.card', { timeout: 15_000 });   // 卡片渲染＝資料載入＋script 完整跑完
}

test('載入：零 JS 錯誤、共 460 家、地圖有 marker', async ({ page }) => {
  const errs = trackJsErrors(page);
  await waitAppReady(page);
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
  const total = await page.evaluate(() => restaurants.length);
  expect(total).toBe(460);
  expect(errs, '不應有 JS 例外/錯誤（防 TDZ 那種整頁壞）').toEqual([]);
});

test('地區篩選：點「沖繩」→ 顯示 35 家並重新對焦', async ({ page }) => {
  const errs = trackJsErrors(page);
  await waitAppReady(page);
  await page.locator('button.region-btn', { hasText: '沖繩' }).click();  // 限地區鈕（避開店名含「沖繩」的 marker）
  await expect
    .poll(() => page.evaluate(() => document.querySelectorAll('.card').length))
    .toBe(35);
  expect(errs).toEqual([]);
});

test('已歇業軟下架：預設隱藏、切換該篩選不炸（目前 0 家）', async ({ page }) => {
  const errs = trackJsErrors(page);
  await waitAppReady(page);
  await page.locator('button.filter-btn', { hasText: '已歇業' }).click();  // 限篩選鈕
  await expect
    .poll(() => page.evaluate(() => document.querySelectorAll('.card').length))
    .toBe(0); // CLOSED 側表目前為空
  expect(errs).toEqual([]);
});

test('PWA：manifest 名稱正確、service worker 有註冊', async ({ page }) => {
  await page.goto('/');
  const name = await page.evaluate(() =>
    fetch('manifest.json').then(r => r.json()).then(m => m.name)
  );
  expect(name).toContain('日本找素');
  await expect
    .poll(async () => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())),
      { timeout: 10_000 })
    .toBe(true);
});
