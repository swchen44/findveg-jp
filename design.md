# design.md — 日本找素 FindVeg JP 架構與維護總覽

> 這份是「**app 怎麼組起來**」的技術地圖（給維護者快速建立心智模型）。
> 「**怎麼蒐集/新增/維護店家**」的流程在 [`finding_vegan_in_japan.md`](finding_vegan_in_japan.md)（SOP）；上架 app 商店在 [`app-shell/BUILD.md`](app-shell/BUILD.md)。

## 1. 一句話架構
**單一 `index.html`**（純前端 Leaflet 地圖 + 全部店家資料內嵌在一段 `<script>`）＝ app 本體；無 build、無後端。GitHub Actions 把 repo 根目錄直接部署到 GitHub Pages。PWA（manifest + service worker）讓它可安裝、離線。

## 2. 檔案地圖
| 檔案 | 角色 |
|---|---|
| `index.html` | **app 本體**：HTML/CSS + 一段含全部資料與邏輯的 `<script>`（唯一要編輯資料的地方） |
| `images/NNN.jpg` | 店家照片，`NNN`=店家 id |
| `素食溝通卡.html`／`.png` | 附屬頁：蛋奶素溝通卡（`index.html` header 有連結） |
| `manifest.json`／`sw.js`／`icons/` | PWA：安裝設定／離線快取／app 圖示 |
| `vegan_japan_places.csv` | 由 `make_csv.py` 從 `index.html` 匯出（給 Google My Maps；header「下載 CSV」） |
| `make_csv.py` | 解析 `index.html` 的資料表 → 產 CSV（**改資料後要重跑**） |
| `maintenance_scan.py` | 掃店家連結/照片、偵測疑似歇業/死圖（維護 Tier 0，零 LLM） |
| `.github/workflows/pages.yml` | GitHub Actions：push 到 main 就部署 Pages |
| `app-shell/` | Capacitor 打包成 iOS/Android app 的腳手架（不影響網頁） |

## 3. `index.html` 內的資料模型（都在那段 `<script>`）
一個主陣列 + 四個 id-keyed 側表（新店只 append，側表用 id 對應）：
- **`restaurants[]`**：主資料，一物件一店。欄位：`id, rank, group, region, name, nameJa, type, tags[], area, address, lat, lng, hours, dishes, notes, flag, hcStars, gStars, gmap, ghours, hcUrl, phone`。
- **`photos{}`**：`id → 圖片網址`（HappyCow 熱連 或 `images/NNN.jpg`）。
- **`PRICES{}`**：`id → 每人價位字串`。
- **`CLOSED{}`**：`id → 'YYYY-MM'`（軟下架：歇業查證年月）。
- **`CHECKED{}`**：`id → 'YYYY-MM-DD'`（逐店複查日期覆蓋）。

> ⚠️ 這四個側表 **id 是「弱參照」**：店歇業硬刪只刪 `restaurants[]` 物件，側表留孤兒無妨。新店永遠續編最大 id，**不重用空號**。

## 4. 核心系統（都是函式，改行為找這些）
| 系統 | 關鍵函式/變數 | 說明 |
|---|---|---|
| 地區篩選 | `activeRegion`、`filterRegion()`、`getFiltered()` | `region` 值 12 種；`getFiltered` 用 `活躍地區 && 篩選 && 搜尋`，**通用吃任何 region 字串** |
| marker 顏色 | `makeIcon()`、`iconTop/iconSocial/…/iconClosed`、group→icon 三元 | 依 `group` 上色；歇業用灰 `iconClosed` |
| ✅/❓ badge | `certainVeg()`、`vegBadge()`、`CERTAIN_OVERRIDE`、`ASK_OVERRIDE` | 依 `type` 用詞正則判定；例外用兩個 override set |
| 軟下架 | `CLOSED`、`isClosed()`、`closedBadge()`；`getFiltered` 的 `activeFilter==='closed'` 分支 | 預設隱藏、只在「⛔ 已歇業」篩選出現；灰底＋刪除線 CSS `.card-closed` |
| 核實日期 | `checkedDate(id, region)`、`CHECKED`、`CHECK_OVERRIDE`、`SHINSAIBASHI_RECHECK` | 順序：`CHECKED[id]` → 特例 → region → id 區間 |
| 百貨快篩 | `getFiltered` 的 `activeFilter==='depa'` id 白名單 | 加百貨店要擴白名單 |
| 找附近 | `nearbyCenter`、`haversine()`、`updateView()`、Geolocation/Nominatim | 需 HTTPS/localhost |
| 家數統計 | header `#total-badge`、`#count-label` | 動態＝`restaurants.length` 扣掉 `CLOSED` |

## 5. PWA
- `manifest.json`：`display:standalone`、`theme_color:#2E7D32`、icons 192/512/maskable。
- `sw.js`：app shell（index.html/manifest/icons/溝通卡/Leaflet CDN）install 時 precache；`images/`・HappyCow・OSM 圖磚 runtime cache-first；其餘 network-first。**改版把 `VERSION` 加一**（自動清舊快取）。
- `index.html <head>` 有 manifest/theme-color/apple-touch-icon；`</body>` 前註冊 SW。

## 6. 建置/部署管線
```
編輯 index.html → python3 make_csv.py(產CSV) → node --check(語法) → 瀏覽器實測
   → git push main → GitHub Actions(pages.yml) 自動部署 → https://swchen44.github.io/findveg-jp/
```
維護（增量更新/下架/複查）詳見 SOP §10 與 `maintenance_scan.py`。

## 7. 「我想改 X → 動 Y」速查
| 想做 | 改哪裡 |
|---|---|
| 新增店家 | `index.html`：append `restaurants[]`＋補 `photos`/`PRICES`；跑 `make_csv.py` |
| 新增一個地區(macro-region) | 見 SOP §4.5（篩選鈕＋checkedDate＋make_csv regionmap/checked，共 5 處） |
| 標某店歇業 | `CLOSED` 加 `id:'YYYY-MM'` → 跑 `make_csv.py` |
| 更新某店複查日 | `CHECKED` 加/改 `id:'YYYY-MM-DD'` |
| 改 badge 判定 | `certainVeg()` 正則 或 `CERTAIN_OVERRIDE`/`ASK_OVERRIDE` |
| 換 app 圖示 | 重產 `icons/*.png`（見 git 歷史的 Pillow 腳本），改 `manifest.json`/`sw.js` `VERSION` |
| 上架商店 | `app-shell/BUILD.md` |

## 8. 踩過的坑（改 code 前必看）
1. **`CLOSED`/`isClosed` 必須定義在 `restaurants.forEach`(建 marker) 之前** → 否則 marker 迴圈呼叫 `isClosed` 踩 `const` TDZ（`Cannot access 'CLOSED' before initialization`），**整個 script 中斷、全頁壞掉**。改完務必看瀏覽器 console 有無 exception。
2. **`make_csv.py`/`maintenance_scan.py` 抓「含 `const restaurants` 的 `<script>`」**，不是 `[-1]`（尾端有 SW 註冊那段 `<script>`，用 `[-1]` 會抓錯）。
3. **側表註解別寫 `數字:'值'` 樣式**（如 `// 範例 253:'2026-08'`）→ make_csv 的 regex 會誤當條目；已用 `_nocomment()` 去註解防呆，仍以 `<id>` 佔位為宜。
4. **照片下載**：Tabelog 裸圖網址無 token 會下載成文字檔；要從店頁 `<meta og:image>` 抓帶 token 版、JP 版網址。詳見 SOP §3。
5. 改資料**一定要重跑 `make_csv.py`** 讓 CSV 同步，否則「下載 CSV／My Maps」與地圖不一致。
