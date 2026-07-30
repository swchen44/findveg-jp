# 上架 App Store / Google Play 指南（Capacitor WebView 殼）

把 `findveg-jp` 這個 PWA 包成 iOS/Android 原生 app 送商店。**這是「準備好、之後要送審時才做」的腳手架**——實際建置與送審需要你自己的開發者帳號與 Xcode/Android Studio。

> 先評估：現在的 **PWA 已能「加到主畫面」離線用**，成本 0。只有當你想「在 App Store/Play 商店被搜尋到」時才需要這步（Apple 開發者 **US$99/年**、Google Play **US$25 一次**）。

## 前置需求
- Node.js 18+（`node -v`）
- **iOS**：macOS + Xcode + Apple Developer 帳號（$99/年）
- **Android**：Android Studio + Google Play Console 帳號（$25 一次）

## 步驟
```bash
cd app-shell
npm install                 # 裝 Capacitor
npm run add:ios             # 產生 ios/ 原生專案（需 macOS+Xcode）
npm run add:android         # 產生 android/ 原生專案
# 之後每次網頁有更新：
npm run sync                # 重新複製 www/ 並 cap sync
npm run open:ios            # 用 Xcode 開 → Product > Archive → 上傳 App Store Connect
npm run open:android        # 用 Android Studio 開 → Build > Generate Signed Bundle (.aab) → 上傳 Play Console
```
`sync-web.sh` 會把上層的 `index.html`／`images/`／`icons/`／`sw.js`／`manifest.json`／溝通卡／CSV 複製進 `www/`（Capacitor 打包的內容）。

## 送審重點 / 常見坑
- **⚠️ Apple 4.2「最低功能」駁回**：純把網頁包起來、無原生價值的 app 常被拒。降風險做法：
  - **內容打包在 app 內**（本專案已用 `webDir: www` 打包，不是遠端載入）——比 `server.url` 遠端殼安全。
  - 加一點原生能力：離線可用（已有 SW）、原生**定位**（`@capacitor/geolocation`）、原生**分享**（`@capacitor/share`）、狀態列/啟動畫面。
  - 商店描述強調「策展×蛋奶素查證×柴魚陷阱」的獨特價值，不要只寫「餐廳地圖」。
- **App 圖示/啟動畫面**：用 `icons/icon-512.png`；可用 `@capacitor/assets` 自動生成各尺寸。
- **隱私**：定位權限要在 `Info.plist`（iOS）寫 `NSLocationWhenInUseUsageDescription`；填 App Privacy 問卷（本 app 不蒐集個資，資料為公開餐廳資訊）。
- **照片版權**：`images/` 內部分照片下載自 Tabelog/官網，商店版建議改為**熱連 HappyCow CDN**或**只保留自攝/授權照片**，降低審核與版權風險（見主 README）。
- **appId**：目前 `io.github.swchen44.findvegjp`，可改成你要的 bundle id（要跟 Apple/Google 後台一致）。

## 這個 app-shell 資料夾不影響網頁部署
`app-shell/` 只是打包工具；GitHub Pages 部署的是 repo 根目錄的網頁，兩者互不干擾。`node_modules/`、`ios/`、`android/`、`www/` 都已 gitignore。
