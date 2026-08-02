// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://localhost:8000',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // 用 python 內建伺服器把 repo 根當靜態站服務（跟本機測試一致）
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
