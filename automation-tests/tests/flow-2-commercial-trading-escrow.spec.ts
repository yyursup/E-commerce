import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';
import { MOCK_PRODUCTS } from '../fixtures/test-data';

const BUYER_URL = 'http://localhost:3100';
const SELLER_URL = 'http://localhost:3101';
const ADMIN_URL = 'http://localhost:3102';

test.describe('FLOW 2: COMMERCIAL TRADING & SECURE ESCROW SETTLEMENT', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardApiMocks(page);
  });

  test('TC2.1 - [Happy Path] Seller quản lý sản phẩm -> Buyer chọn sản phẩm, thêm vào giỏ hàng, kiểm tra tổng tiền và đặt hàng bằng Ví Ký Quỹ (Escrow)', async ({
    page,
  }) => {
    // 1. Seller đã hoàn tất ký quỹ (ACTIVE) kiểm tra danh sách sản phẩm đang bán
    await seedAuthenticatedSession(page, 'BUSINESS', {
      hasShop: true,
      sellerStatus: 'APPROVED',
      shopStatus: 'ACTIVE',
    });

    await page.goto(`${SELLER_URL}/products`);
    await expect(page.getByRole('heading', { name: /Quản Lý Sản Phẩm/i })).toBeVisible();
    await expect(page.getByText(MOCK_PRODUCTS[0].name).first()).toBeVisible();

    // 2. Buyer truy cập chi tiết sản phẩm, chọn phân loại và Thêm vào giỏ hàng
    await seedAuthenticatedSession(page, 'CUSTOMER');
    await page.goto(`${BUYER_URL}/products/${MOCK_PRODUCTS[0].id}`);
    await expect(page.getByRole('heading', { name: MOCK_PRODUCTS[0].name }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Titan Tự Nhiên' }).click();
    await page.getByRole('button', { name: '256GB' }).click();
    await page.getByRole('button', { name: /Thêm vào giỏ/i }).click();

    // 3. Vào Giỏ hàng (/cart) kiểm tra thông tin sản phẩm và chuyển sang Checkout
    await page.goto(`${BUYER_URL}/cart`);
    await expect(page.getByRole('heading', { name: /Giỏ hàng của bạn/i })).toBeVisible();
    await expect(page.getByText(MOCK_PRODUCTS[0].name)).toBeVisible();
    await expect(page.getByText('Apple Official Store')).toBeVisible();

    await page.getByRole('button', { name: /Mua từ Shop này/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // 4. Kiểm tra cách tính tổng tiền (28.990.000 + 30.000 = 29.020.000 ₫) và đặt hàng bằng Ví số dư tài khoản (Escrow)
    await expect(
      page.getByRole('heading', { name: /Thanh toán \(Apple Official Store\)/i }),
    ).toBeVisible();
    await expect(page.getByText('Lê Văn Mua Hàng').first()).toBeVisible();
    await expect(page.getByText(/28\.990\.000/).first()).toBeVisible();
    await expect(page.getByText(/30\.000/).first()).toBeVisible();
    await expect(page.getByText(/29\.020\.000/).first()).toBeVisible();

    await page.getByText('Ví số dư tài khoản').click();
    await expect(page.getByText(/Trừ trực tiếp từ ví sàn, ký quỹ an toàn/i)).toBeVisible();

    await page.getByRole('button', { name: /^Đặt hàng$/i }).click();
    await expect(page.getByText(/Đặt hàng & thanh toán bằng ví thành công/i)).toBeVisible();
  });

  test('TC2.2 - [Happy Path] Kiểm tra khoản tiền giữ trong Escrow, Buyer xác nhận hoàn tất đơn hàng và Admin giải ngân/quyết toán Escrow', async ({
    page,
  }) => {
    // 1. Seller kiểm tra đơn hàng tại trang Quản lý đơn hàng (:3101/orders)
    await seedAuthenticatedSession(page, 'BUSINESS', {
      hasShop: true,
      sellerStatus: 'APPROVED',
      shopStatus: 'ACTIVE',
    });
    await page.goto(`${SELLER_URL}/orders`);
    await expect(page.getByRole('heading', { name: /Quản Lý Đơn Hàng/i })).toBeVisible();
    await expect(page.getByText(/ORD-20261026-0001/).first()).toBeVisible();
    await expect(page.getByText(/ORD-20261026-0002/).first()).toBeVisible();

    // 2. Buyer kiểm tra số dư Ký Quỹ Đang Bảo Vệ (Escrow) và xác nhận "Đã nhận được hàng"
    await seedAuthenticatedSession(page, 'CUSTOMER');
    await page.goto(`${BUYER_URL}/orders`);
    await expect(page.getByText(/Ký Quỹ Đang Bảo Vệ \(Escrow\)/i)).toBeVisible();
    await expect(page.getByText(/55\.540\.000/).first()).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    const receivedBtn = page.getByRole('button', { name: /Đã nhận được hàng/i }).last();
    await expect(receivedBtn).toBeVisible();
    await receivedBtn.click();
    await expect(page.getByText(/Đã xác nhận nhận hàng/i).first()).toBeVisible();

    // 3. Admin kiểm tra & giải ngân (Release) khoản tiền tạm giữ tại :3102/platform-wallet?tab=escrows
    await seedAuthenticatedSession(page, 'ADMIN');
    await page.goto(`${ADMIN_URL}/platform-wallet?tab=escrows`);

    await expect(
      page.getByText(/Danh Sách Tiền Tạm Giữ Đơn Hàng \(Order Escrow\)/i),
    ).toBeVisible();
    await expect(page.getByText(/ORD-20261026-0002/).first()).toBeVisible();
    await expect(page.getByText('HELD', { exact: true }).first()).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Release' }).first().click();

    await expect(page.getByText(/Đã giải ngân cưỡng chế Escrow đơn hàng thành công/i)).toBeVisible();
  });
});
