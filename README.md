# 日本找素 FindVeg JP 🌿

**繁中 × 訪日 × 蛋奶素**的日本素食導覽地圖 App（PWA）。全日本 **460 家**素食/蔬食友善店家，為**蛋奶素（ovo-lacto）**旅客量身整理，並針對日式料理的**隱藏葷料陷阱**（柴魚高湯かつおだし、豚骨、いりこ、味醂、五辛）逐店提醒——這是主流 App（HappyCow/Vegewel）沒做的細分。

👉 **線上使用**：<https://swchen44.github.io/findveg-jp/>（可「加到主畫面」變成離線 App）

## 特色
- **12 地區篩選**：關西（大阪/京都/奈良/神戶）・東京圈・北海道・九州・中部・廣島・東北・四國・沖繩。
- **✅ 確定素 / ❓ 需詢問**逐店查證標籤 ＋ 核實日期；素食專門店與葷店有素選項一目了然。
- **柴魚/豚骨等陷阱提醒**寫進每家 `notes`，並附繞過方式（指定昆布/精進だし等）。
- 找附近（GPS/地標）、照片、評分、營業時間、每人價位、電話、Google Maps 連結。
- **蛋奶素溝通卡**（日／英／中，可列印指給店家看）。
- **⛔ 已歇業**軟下架：歇業店保留存查（灰底標記、可篩選），展現資料時效。
- **PWA**：可安裝到 iOS/Android 主畫面，app shell 與看過的照片/圖磚可離線。

## 檔案結構
| 檔案 | 說明 |
|---|---|
| `index.html` | App 本體（Leaflet 互動地圖＋全部店家資料，單檔） |
| `vegan_japan_places.csv` | 從 index.html 匯出的資料檔（供 Google My Maps 匯入） |
| `images/` | 店家照片（`NNN.jpg`，id 對應） |
| `素食溝通卡.html` / `.png` | 蛋奶素餐廳溝通卡 |
| `manifest.json` / `sw.js` / `icons/` | PWA 設定、service worker、app 圖示 |
| `make_csv.py` | 從 index.html 產生 CSV |
| `maintenance_scan.py` | 偵測疑似歇業/移轉與死圖（維護用，零 LLM） |
| `finding_vegan_in_japan.md` | 完整 SOP：如何蒐集/寫入/驗證/維護（含 §10 維護心法） |

## 本機執行 / 維護
```bash
python3 -m http.server 8000    # 開 http://localhost:8000/
python3 make_csv.py            # 店家資料變動後重產 CSV
python3 maintenance_scan.py --region shikoku   # 偵測某區疑似歇業/死圖
```
維護做法（增量更新、下架、複查日期）詳見 `finding_vegan_in_japan.md` §10。

## 資料來源與版權
店家資料由 HappyCow／Tabelog／官方菜單／Google 地圖評論／素食社群心得**多方交叉查證**整理，原創價值在**蛋奶素查證與日式陷阱註解**。
⚠️ `images/` 內部分餐廳照片下載自 Tabelog/官網，**著作權屬原網站**，此處僅作導覽示意；如有權利人反映將移除或改為官方連結。歡迎回報歇業/錯誤。

## 飲食定義（蛋奶素 ovo-lacto）
✅ 可吃：蛋、奶製品、蔥、蒜、韭菜、洋蔥　❌ 不吃：肉、魚、海鮮、**柴魚/肉高湯**、魚露。
> 卡片標 ✅ 確定素＝素食專門/全素菜單、不用溝通；❓ 需詢問＝葷店有素選項或需客製、以現場為準。
