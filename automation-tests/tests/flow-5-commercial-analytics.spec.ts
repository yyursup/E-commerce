import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';

const BUYER_URL = 'http://localhost:3100';
const SELLER_URL = 'http://localhost:3101';
const ADMIN_URL = 'http://localhost:3102';

test.describe('FLOW 5: MULTI-ROLE COMMERCIAL ANALYTICS & REPORTING (BUYER, SELLER & ADMIN)', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardApiMocks(page);
  });

  test('TC5.1 - [Happy Path] Buyer xem dữ liệu thống kê tài sản/dòng tiền Ví & Escrow; Seller xem báo cáo doanh thu, sản phẩm của Shop', async ({
    page,
  }) => {
    // 1. Buyer xem thống kê tài sản & dòng tiền giao dịch cá nhân (:3100/profile/wallet)
    await seedAuthenticatedSession(page, 'CUSTOMER');
    await page.goto(`${BUYER_URL}/profile/wallet`);

    await expect(page.getByRole('heading', { name: /Ví của tôi/i })).toBeVisible();
    await expect(page.getByText(/Tổng tài sản/i).first()).toBeVisible();
    await expect(page.getByText(/Số dư khả dụng/i).first()).toBeVisible();
    await expect(page.getByText('Đang trong Escrow', { exact: true })).toBeVisible();

    // Kiểm tra số liệu khớp với bộ dữ liệu kiểm thử đã biết:
    // Số dư khả dụng = 50.000.000 ₫, Đang trong Escrow = 55.540.000 ₫ (29.020.000 + 26.520.000)
    await expect(page.getByText(/50\.000\.000/).first()).toBeVisible();
    await expect(page.getByText(/55\.540\.000/).first()).toBeVisible();

    // 2. Seller xem báo cáo kinh doanh, doanh thu, sản phẩm của Shop (:3101/dashboard)
    await seedAuthenticatedSession(page, 'BUSINESS', {
      hasShop: true,
      sellerStatus: 'APPROVED',
      shopStatus: 'ACTIVE',
    });

    await page.goto(`${SELLER_URL}/dashboard`);
    await expect(page.getByRole('heading', { name: 'Apple Official Store' }).first()).toBeVisible();
    await expect(page.getByText('Shop Đã Xác Minh')).toBeVisible();
    await expect(page.getByRole('button', { name: '30 ngày' })).toBeVisible();
  });

  test('TC5.2 - [Happy Path] Admin xem dữ liệu tổng hợp toàn sàn, Bảng xếp hạng Shop và Báo cáo hoa hồng', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'ADMIN');

    // 1. Admin Dashboard (:3102/dashboard)
    await page.goto(`${ADMIN_URL}/dashboard`);
    await expect(page.getByRole('heading', { name: /Tổng Quan Sàn Giao Dịch/i })).toBeVisible();
    await expect(page.getByText(/Server-Side Realtime/i)).toBeVisible();
    await expect(page.getByText('850.000.000 ₫').first()).toBeVisible();

    // 2. Báo cáo Xếp hạng Shop (:3102/shop-ranking) với bộ dữ liệu kiểm thử đã biết
    await page.goto(`${ADMIN_URL}/shop-ranking`);
    await expect(page.getByRole('heading', { name: /Xếp hạng shop/i })).toBeVisible();
    await expect(page.getByText('Apple Official Store').first()).toBeVisible();
    await expect(page.getByText('Samsung Galaxy Flagship').first()).toBeVisible();

    // 3. Trung tâm Quản lý Hoa hồng & Biểu phí toàn sàn (:3102/commissions)
    await page.goto(`${ADMIN_URL}/commissions`);
    await expect(
      page.getByRole('heading', { name: /Trung Tâm Quản Lý Hoa Hồng & Biểu Phí Toàn Sàn/i }),
    ).toBeVisible();
    await expect(page.getByText('Apple Official Store').first()).toBeVisible();
  });
});
