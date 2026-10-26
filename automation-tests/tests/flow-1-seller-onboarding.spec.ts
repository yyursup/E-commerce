import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';
import { DUMMY_PNG_BUFFER, TEST_ACCOUNTS, MOCK_SELLER_REQUEST } from '../fixtures/test-data';

const SELLER_URL = 'http://localhost:3101';
const ADMIN_URL = 'http://localhost:3102';

test.describe('FLOW 1: SELLER ONBOARDING & BIOMETRIC eKYC VERIFICATION', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardApiMocks(page);
  });

  test('TC1.1 - [Happy Path] Quy trình xác minh danh tính điện tử eKYC (Upload CCCD giả lập & Đối chiếu sinh trắc học MATCH -> Mở form Seller)', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'SELLER_CANDIDATE', {
      accountVerified: false,
      hasShop: false,
      sellerStatus: 'NONE',
    });

    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: TEST_ACCOUNTS.sellerCandidate.accountId,
          username: TEST_ACCOUNTS.sellerCandidate.username,
          email: TEST_ACCOUNTS.sellerCandidate.email,
          phoneNumber: TEST_ACCOUNTS.sellerCandidate.phoneNumber,
          role: 'CUSTOMER',
          accountVerified: false,
          hasShop: false,
          sellerStatus: 'NONE',
        }),
      }),
    );

    await page.goto(`${SELLER_URL}/seller-register`);

    // Bước 1: Upload mặt trước CCCD (sử dụng buffer PNG 1x1 giả lập, không dùng giấy tờ thật)
    await expect(page.getByRole('heading', { name: 'Xác minh danh tính (KYC)' })).toBeVisible();
    await expect(page.getByText('Bước 1: Upload ảnh mặt trước CCCD')).toBeVisible();

    await page.locator('#frontFile').setInputFiles({
      name: 'mock-cccd-front.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER,
    });
    await page.getByRole('button', { name: /Upload ảnh mặt trước/i }).click();

    // Bước 2: Upload mặt sau CCCD
    await expect(page.getByText(/Bước 2: Upload ảnh mặt sau CCCD/i)).toBeVisible();
    await page.locator('#backFile').setInputFiles({
      name: 'mock-cccd-back.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER,
    });
    await page.getByRole('button', { name: /Upload ảnh mặt sau/i }).click();

    // Bước 3 -> Bước 4: Xác nhận ảnh khuôn mặt (Selfie) và đối chiếu sinh trắc học (Compare MATCH)
    await expect(page.getByText('Bước 3: Chụp ảnh khuôn mặt')).toBeVisible();
    await page.evaluate(() => {
      window.localStorage.setItem(
        'seller_kyc_session_progress',
        JSON.stringify({
          sessionId: 'kyc-sess-2026-001',
          currentStep: 4,
          frontUploaded: true,
          backUploaded: true,
          selfieUploaded: true,
          updatedAt: Date.now(),
        }),
      );
    });

    await page.reload();
    await expect(page.getByText('Bước 4: Xem lại và xác minh')).toBeVisible();
    await page.getByRole('button', { name: 'Xác minh danh tính' }).click();

    // Sau khi eKYC VERIFIED, hệ thống tự động mở biểu mẫu Đăng ký bán hàng
    await expect(page.getByRole('heading', { name: 'Đăng ký bán hàng' })).toBeVisible();
  });

  test('TC1.2 - [Happy Path] Điền đầy đủ thông tin đăng ký Seller, chọn gói Ký quỹ bảo chứng -> Chờ duyệt (/pending) -> Admin phê duyệt & Kích hoạt Dashboard Seller', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'SELLER_CANDIDATE', {
      accountVerified: true,
      hasShop: false,
      sellerStatus: 'NONE',
    });

    await page.goto(`${SELLER_URL}/seller-register`);
    await expect(page.getByRole('heading', { name: 'Đăng ký bán hàng' })).toBeVisible();

    // 1. Điền Hồ sơ shop
    await page.getByPlaceholder('VD: TechZone Official').fill('TechZone Official Store');
    await page
      .getByPlaceholder('Giới thiệu ngắn về shop...')
      .fill('Chuyên thiết bị công nghệ chính hãng bảo hành uy tín.');

    // 2. Chọn Địa chỉ lấy hàng GHN và đồng bộ Địa chỉ trả hàng
    const selects = page.locator('select');
    await selects.nth(0).selectOption('202'); // TP. Hồ Chí Minh
    await selects.nth(1).selectOption('1442'); // Quận 1
    await selects.nth(2).selectOption('20101'); // Phường Bến Nghé
    await page
      .getByPlaceholder(/Số nhà, tên đường/i)
      .first()
      .fill('123 Nguyễn Huệ');
    await page.getByLabel('Địa chỉ trả hàng giống Địa chỉ lấy hàng').check();

    // 3. Nhập Mã số thuế cá nhân & Email hóa đơn
    await page.getByPlaceholder('VD: 0123456789 hoặc CCCD 12 số').fill('0123456789');
    await page.getByPlaceholder('email.hoadon@example.com').fill('billing@techzone.vn');

    // 4. Chọn Ngân hàng thụ hưởng
    await page.getByPlaceholder(/Tìm kiếm hoặc chọn ngân hàng/i).fill('Vietcombank (VCB)');
    await page.getByPlaceholder('VD: NGUYEN VAN A').fill('TRAN MINH KHOI');
    await page.getByPlaceholder('Nhập số tài khoản ngân hàng (chỉ gồm số)').fill('0071001234567');

    // 5. Chọn gói Ký Quỹ Bảo Chứng 3 Sao (10.000.000 ₫) và gửi đăng ký
    await page.getByText('Ký Quỹ Bảo Chứng', { exact: true }).click();
    await page.getByRole('button', { name: /10\.000\.000 ₫/i }).click();
    await expect(page.getByText('3 Sao Uy Tín')).toBeVisible();

    await page.getByRole('button', { name: 'Gửi đăng ký' }).click();

    // Kiểm tra điều hướng sang trang /pending
    await expect(page).toHaveURL(/\/pending/);
    await expect(page.getByRole('heading', { name: 'Gian Hàng Đang Được Xét Duyệt' })).toBeVisible();

    // 6. Admin phê duyệt hồ sơ đăng ký Seller tại :3102/requests/:id
    await seedAuthenticatedSession(page, 'ADMIN');
    await page.goto(`${ADMIN_URL}/requests/${MOCK_SELLER_REQUEST.requestId}`);
    await expect(page.getByRole('heading', { name: 'Chi tiết yêu cầu' })).toBeVisible();
    await expect(page.getByText('TechZone Official')).toBeVisible();

    await page
      .getByPlaceholder(/Nhập lý do hoặc phản hồi cho người đăng ký/i)
      .fill('Hồ sơ pháp lý và eKYC hợp lệ, chấp thuận mở gian hàng.');
    await page.getByRole('button', { name: /Phê duyệt đơn/i }).click();
    await expect(page.getByText('Đã phê duyệt yêu cầu thành công!')).toBeVisible();

    // 7. Seller đã kích hoạt truy cập vào Dashboard quản lý bán hàng
    await seedAuthenticatedSession(page, 'BUSINESS', {
      accountVerified: true,
      hasShop: true,
      sellerStatus: 'APPROVED',
      shopStatus: 'ACTIVE',
    });
    await page.goto(`${SELLER_URL}/dashboard`);
    await expect(page.getByRole('heading', { name: /Apple Official Store/i }).first()).toBeVisible();
  });
});
