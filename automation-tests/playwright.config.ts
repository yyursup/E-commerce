import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const ROOT_DIR = path.resolve(__dirname, '..');
const BUYER_DIR = path.join(ROOT_DIR, 'ecommerce-fe');
const SELLER_DIR = path.join(ROOT_DIR, 'ecommerce-seller-fe');
const ADMIN_DIR = path.join(ROOT_DIR, 'ecommerce-admin-fe');

/**
 * Cấu hình Playwright Test độc lập cho 5 Business Flows (Buyer :3000, Seller :3001, Admin :3002)
 * Không chỉnh sửa bất kỳ file nào thuộc source code Frontend hoặc Backend.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BUYER_BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    launchOptions: {
      slowMo: Number(process.env.SLOW_MO ?? 150),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
      },
    },
  ],
  webServer: [
    {
      command: `node "${path.join(BUYER_DIR, 'node_modules/vite/bin/vite.js')}" "${BUYER_DIR}" --config "${path.join(BUYER_DIR, 'vite.config.js')}" --port 3100 --strictPort`,
      cwd: BUYER_DIR,
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `node "${path.join(SELLER_DIR, 'node_modules/vite/bin/vite.js')}" "${SELLER_DIR}" --config "${path.join(SELLER_DIR, 'vite.config.js')}" --port 3101 --strictPort`,
      cwd: SELLER_DIR,
      url: 'http://localhost:3101',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `node "${path.join(ADMIN_DIR, 'node_modules/vite/bin/vite.js')}" "${ADMIN_DIR}" --config "${path.join(ADMIN_DIR, 'vite.config.js')}" --port 3102 --strictPort`,
      cwd: ADMIN_DIR,
      url: 'http://localhost:3102',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
