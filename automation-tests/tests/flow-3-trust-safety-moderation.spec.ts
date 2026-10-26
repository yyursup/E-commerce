import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';
import { DUMMY_PNG_BUFFER, MOCK_PRODUCTS } from '../fixtures/test-data';

const BUYER_URL = 'http://localhost:3100';
const ADMIN_URL = 'http://localhost:3102';

test.describe('FLOW 3: TRUST, SAFETY & COMMUNITY MODERATION', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardApiMocks(page);
  });

  test('TC3.1 - [Happy Path] Người dùng gửi báo cáo sản phẩm vi phạm kèm minh chứng và ghi nhận thông tin báo cáo', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'CUSTOMER');

    let capturedPayload: Record<string, unknown> | null = null;
    await page.route(/\/api\/v1\/report(\?|$)/, async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'rep-new-001',
            status: 'PENDING',
            message: 'Gửi báo cáo thành công',
          }),
        });
      }
      return route.fallback();
    });

    await page.goto(
      `${BUYER_URL}/report?targetId=${MOCK_PRODUCTS[0].id}&targetType=PRODUCT&targetName=${encodeURIComponent(MOCK_PRODUCTS[0].name)}&backTo=/products`,
    );

    await expect(page.getByRole('heading', { name: /Báo cáo sản phẩm/i })).toBeVisible();
    await expect(page.getByText(MOCK_PRODUCTS[0].name).first()).toBeVisible();

    // Chọn lý do vi phạm và nhập mô tả chi tiết + tải ảnh bằng chứng giả lập
    await page.getByRole('button', { name: /Hàng giả \/ hàng cấm/i }).click();
    await page
      .locator('#description')
      .fill('Sản phẩm có dấu hiệu số serial không trùng khớp với hộp và thông tin mô tả.');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'evidence-serial.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER,
    });

    await page.getByRole('button', { name: /Gửi báo cáo/i }).click();

    await expect(page.getByText(/Gửi báo cáo thành công/i).first()).toBeVisible();
    expect(capturedPayload).toBeTruthy();
    expect(capturedPayload?.targetId).toBe(MOCK_PRODUCTS[0].id);
    expect(String(capturedPayload?.description)).toContain('[Hàng giả / hàng cấm]');
  });

  test('TC3.2 - [Happy Path] Admin thẩm định, xử lý báo cáo vi phạm và phê duyệt sản phẩm công nghệ chờ duyệt (Product Moderation)', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'ADMIN');

    // 1. Admin xem và thẩm định báo cáo vi phạm REP-2026-0089 (:3102/reports)
    await page.goto(`${ADMIN_URL}/reports`);
    await expect(page.getByText('REP-2026-0089').first()).toBeVisible();
    await expect(page.getByText('Chờ thẩm định').first()).toBeVisible();

    await page.getByRole('button', { name: /Xác nhận vi phạm/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài/i }),
    ).toBeVisible();

    await page
      .locator('textarea')
      .fill(
        'Xác nhận sản phẩm vi phạm quy chuẩn mô tả tình trạng thiết bị. Quyết định gỡ sản phẩm và cộng 1 gậy vi phạm.',
      );
    await page.getByRole('button', { name: /Xác nhận vi phạm \(Phạt Shop\)/i }).click();

    await expect(
      page
        .getByText(/Đã xác nhận vi phạm! Sản phẩm vi phạm đã được cập nhật trạng thái/i)
        .first(),
    ).toBeVisible();

    // 2. Admin kiểm duyệt và phê duyệt sản phẩm công nghệ chờ duyệt (:3102/moderation)
    await page.goto(`${ADMIN_URL}/moderation`);
    await expect(
      page.getByRole('heading', { name: /Kiểm Duyệt Sản Phẩm Công Nghệ/i }),
    ).toBeVisible();
    await expect(
      page.getByText('iPad Pro M2 11 inch WiFi 128GB Like New 99%').first(),
    ).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Phê duyệt' }).first().click();
    await expect(page.getByText(/Đã phê duyệt sản phẩm/i).first()).toBeVisible();
  });
});
