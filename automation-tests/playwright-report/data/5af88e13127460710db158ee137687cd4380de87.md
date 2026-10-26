# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-3-trust-safety-moderation.spec.ts >> FLOW 3: TRUST, SAFETY & COMMUNITY MODERATION >> TC3.1 - [Happy Path] Người dùng gửi báo cáo sản phẩm vi phạm kèm minh chứng và ghi nhận thông tin báo cáo
- Location: tests\flow-3-trust-safety-moderation.spec.ts:13:7

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Gửi báo cáo/i })
    - locator resolved to <button disabled type="submit" class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition bg-red-600 hover:bg-red-700 cursor-not-allowed opacity-60">Gửi báo cáo</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - banner [ref=f1e3]:
    - generic [ref=f1e4]:
      - generic [ref=f1e5]:
        - link "Kênh Người Bán" [ref=f1e6] [cursor=pointer]:
          - /url: http://localhost:3001
        - generic [ref=f1e10]: "|"
        - link "Trở thành Người bán" [ref=f1e11] [cursor=pointer]:
          - /url: http://localhost:3001/register
      - generic [ref=f1e12]: "Hotline CSKH: 1900 1234"
    - navigation [ref=f1e14]:
      - link "E-commerce" [ref=f1e15] [cursor=pointer]:
        - /url: /
      - textbox "Tìm kiếm sản phẩm, danh mục, shop..." [ref=f1e22]
      - generic [ref=f1e25]:
        - link "Thông báo của tôi" [ref=f1e26] [cursor=pointer]:
          - /url: /profile?tab=notifications
        - link "Sản phẩm yêu thích" [ref=f1e29] [cursor=pointer]:
          - /url: /profile?tab=wishlist
        - link "Giỏ hàng" [ref=f1e32] [cursor=pointer]:
          - /url: /cart
        - button "Hộp thư & Trò chuyện" [ref=f1e35]
        - button "Toggle theme" [ref=f1e38]
        - button "L Lê Văn Mua Hàng 🛡️ 100đ" [ref=f1e45]:
          - generic [ref=f1e46]: L
          - generic [ref=f1e48]: Lê Văn Mua Hàng
          - generic [ref=f1e49]: 🛡️ 100đ
    - generic [ref=f1e53]:
      - link "Trang chủ" [ref=f1e54] [cursor=pointer]:
        - /url: /
      - link "Livestream" [ref=f1e55] [cursor=pointer]:
        - /url: /live
      - link "Tất cả sản phẩm" [ref=f1e57] [cursor=pointer]:
        - /url: /products
      - link "Khuyến mãi & Voucher" [ref=f1e58] [cursor=pointer]:
        - /url: /deals
      - link "Khám phá Gian hàng" [ref=f1e59] [cursor=pointer]:
        - /url: /marketplace
  - generic [ref=f1e62]:
    - generic [ref=f1e63]:
      - heading "Đăng nhập tài khoản" [level=1] [ref=f1e64]
      - paragraph [ref=f1e65]: Nhập tên đăng nhập để tiếp tục
    - generic [ref=f1e66]:
      - generic [ref=f1e67]:
        - generic [ref=f1e68]: Tên đăng nhập
        - textbox "Tên đăng nhập" [ref=f1e72]:
          - /placeholder: username
      - generic [ref=f1e73]:
        - generic [ref=f1e74]:
          - generic [ref=f1e75]: Mật khẩu
          - link "Quên mật khẩu?" [ref=f1e76] [cursor=pointer]:
            - /url: /forgot-password
        - textbox "Mật khẩu" [ref=f1e80]:
          - /placeholder: ••••••••
      - button "Đăng nhập" [ref=f1e81]
    - generic [ref=f1e82]:
      - generic [ref=f1e83]: Hoặc đăng nhập với
      - generic [ref=f1e88]:
        - button "Google" [ref=f1e89]
        - button "Facebook" [ref=f1e92]
    - paragraph [ref=f1e95]:
      - text: Chưa có tài khoản?
      - link "Đăng ký" [ref=f1e96] [cursor=pointer]:
        - /url: /register
  - button "Mở chat" [ref=f1e97]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';
  3   | import { DUMMY_PNG_BUFFER, MOCK_PRODUCTS } from '../fixtures/test-data';
  4   | 
  5   | const BUYER_URL = 'http://localhost:3100';
  6   | const ADMIN_URL = 'http://localhost:3102';
  7   | 
  8   | test.describe('FLOW 3: TRUST, SAFETY & COMMUNITY MODERATION', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     await setupStandardApiMocks(page);
  11  |   });
  12  | 
  13  |   test('TC3.1 - [Happy Path] Người dùng gửi báo cáo sản phẩm vi phạm kèm minh chứng và ghi nhận thông tin báo cáo', async ({
  14  |     page,
  15  |   }) => {
  16  |     await seedAuthenticatedSession(page, 'CUSTOMER');
  17  | 
  18  |     let capturedPayload: Record<string, unknown> | null = null;
  19  |     await page.route(/\/api\/v1\/report(\?|$)/, async (route) => {
  20  |       if (route.request().method() === 'POST') {
  21  |         capturedPayload = route.request().postDataJSON();
  22  |         return route.fulfill({
  23  |           status: 200,
  24  |           contentType: 'application/json',
  25  |           body: JSON.stringify({
  26  |             id: 'rep-new-001',
  27  |             status: 'PENDING',
  28  |             message: 'Gửi báo cáo thành công',
  29  |           }),
  30  |         });
  31  |       }
  32  |       return route.fallback();
  33  |     });
  34  | 
  35  |     await page.goto(
  36  |       `${BUYER_URL}/report?targetId=${MOCK_PRODUCTS[0].id}&targetType=PRODUCT&targetName=${encodeURIComponent(MOCK_PRODUCTS[0].name)}&backTo=/products`,
  37  |     );
  38  | 
  39  |     await expect(page.getByRole('heading', { name: /Báo cáo sản phẩm/i })).toBeVisible();
  40  |     await expect(page.getByText(MOCK_PRODUCTS[0].name).first()).toBeVisible();
  41  | 
  42  |     // Chọn lý do vi phạm và nhập mô tả chi tiết + tải ảnh bằng chứng giả lập
  43  |     await page.getByRole('button', { name: /Hàng giả \/ hàng cấm/i }).click();
  44  |     await page
  45  |       .locator('#description')
  46  |       .fill('Sản phẩm có dấu hiệu số serial không trùng khớp với hộp và thông tin mô tả.');
  47  | 
  48  |     const fileInput = page.locator('input[type="file"]').first();
  49  |     await fileInput.setInputFiles({
  50  |       name: 'evidence-serial.png',
  51  |       mimeType: 'image/png',
  52  |       buffer: DUMMY_PNG_BUFFER,
  53  |     });
  54  | 
> 55  |     await page.getByRole('button', { name: /Gửi báo cáo/i }).click();
      |                                                              ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  56  | 
  57  |     await expect(page.getByText(/Gửi báo cáo thành công/i).first()).toBeVisible();
  58  |     expect(capturedPayload).toBeTruthy();
  59  |     expect(capturedPayload?.targetId).toBe(MOCK_PRODUCTS[0].id);
  60  |     expect(String(capturedPayload?.description)).toContain('[Hàng giả / hàng cấm]');
  61  |   });
  62  | 
  63  |   test('TC3.2 - [Happy Path] Admin thẩm định, xử lý báo cáo vi phạm và phê duyệt sản phẩm công nghệ chờ duyệt (Product Moderation)', async ({
  64  |     page,
  65  |   }) => {
  66  |     await seedAuthenticatedSession(page, 'ADMIN');
  67  | 
  68  |     // 1. Admin xem và thẩm định báo cáo vi phạm REP-2026-0089 (:3102/reports)
  69  |     await page.goto(`${ADMIN_URL}/reports`);
  70  |     await expect(page.getByText('REP-2026-0089').first()).toBeVisible();
  71  |     await expect(page.getByText('Chờ thẩm định').first()).toBeVisible();
  72  | 
  73  |     await page.getByRole('button', { name: /Xác nhận vi phạm/i }).first().click();
  74  |     await expect(
  75  |       page.getByRole('heading', { name: /Phán Quyết: Xác Nhận Vi Phạm & Áp Chế Tài/i }),
  76  |     ).toBeVisible();
  77  | 
  78  |     await page
  79  |       .locator('textarea')
  80  |       .fill(
  81  |         'Xác nhận sản phẩm vi phạm quy chuẩn mô tả tình trạng thiết bị. Quyết định gỡ sản phẩm và cộng 1 gậy vi phạm.',
  82  |       );
  83  |     await page.getByRole('button', { name: /Xác nhận vi phạm \(Phạt Shop\)/i }).click();
  84  | 
  85  |     await expect(
  86  |       page
  87  |         .getByText(/Đã xác nhận vi phạm! Sản phẩm vi phạm đã được cập nhật trạng thái/i)
  88  |         .first(),
  89  |     ).toBeVisible();
  90  | 
  91  |     // 2. Admin kiểm duyệt và phê duyệt sản phẩm công nghệ chờ duyệt (:3102/moderation)
  92  |     await page.goto(`${ADMIN_URL}/moderation`);
  93  |     await expect(
  94  |       page.getByRole('heading', { name: /Kiểm Duyệt Sản Phẩm Công Nghệ/i }),
  95  |     ).toBeVisible();
  96  |     await expect(
  97  |       page.getByText('iPad Pro M2 11 inch WiFi 128GB Like New 99%').first(),
  98  |     ).toBeVisible();
  99  | 
  100 |     page.once('dialog', (dialog) => dialog.accept());
  101 |     await page.getByRole('button', { name: 'Phê duyệt' }).first().click();
  102 |     await expect(page.getByText(/Đã phê duyệt sản phẩm/i).first()).toBeVisible();
  103 |   });
  104 | });
  105 | 
```