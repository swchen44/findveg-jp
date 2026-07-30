/* 日本找素 FindVeg JP — Service Worker
   策略：
   - App shell（index.html/manifest/icons/溝通卡/Leaflet CDN）→ 安裝時預先快取，離線可開。
   - 餐廳照片(images/、HappyCow CDN)、OSM 地圖圖磚 → runtime cache-first（看過的區域/照片離線可用）。
   - 其餘(CSV、外部連結) → network-first，失敗才回快取。
   ※ 完整離線地圖圖磚不保證，只有先前載入過的區塊會被快取（同 HappyCow Pro 的限制）。
   改版時把 VERSION 加一，舊快取會自動清掉。 */
const VERSION = 'findveg-v2';
const SHELL_CACHE = 'shell-' + VERSION;
const RUNTIME_CACHE = 'runtime-' + VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './素食溝通卡.html',
  './素食溝通卡.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => Promise.allSettled(APP_SHELL.map(u => c.add(u))))  // 個別加，單一失敗不擋整體
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isImageOrTile(url) {
  return /\/images\//.test(url) ||
         url.includes('images.happycow.net') ||
         url.includes('tile.openstreetmap.org') ||
         url.includes('tblg.k-img.com') ||
         /\.(png|jpe?g|webp|svg)(\?|$)/i.test(url);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  // 圖片/圖磚 → cache-first（含跨域 opaque 回應）
  if (isImageOrTile(url)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // 導覽/HTML/其他 → network-first，離線回快取；導覽失敗回 index.html
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() =>
      caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
