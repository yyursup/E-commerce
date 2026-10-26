import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession, setupStandardApiMocks } from '../fixtures/api-mocks';
import { MOCK_PRODUCTS } from '../fixtures/test-data';

const BUYER_URL = 'http://localhost:3100';
const SELLER_URL = 'http://localhost:3101';

test.describe('FLOW 4: AI CONVERSATIONAL COMMERCE & INTELLIGENT CUSTOMER SUPPORT', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardApiMocks(page);
  });

  test('TC4.1 - [Happy Path] Người dùng mở Trợ lý ảo AI, hội thoại nhiều lượt (Multi-turn) tư vấn sản phẩm và nhận thẻ sản phẩm gợi ý', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'CUSTOMER');
    await page.goto(BUYER_URL);

    let lastRequestMessagesCount = 0;
    await page.route(/\/api\/v1\/chat\/ai(\?|$)/, async (route) => {
      const body = route.request().postDataJSON() || {};
      const messages = Array.isArray(body.messages) ? body.messages : [];
      lastRequestMessagesCount = messages.length;
      return route.fallback();
    });

    // 1. Mở Hộp thư nổi và chọn kênh "Trợ lý ảo AI"
    await page.getByRole('button', { name: 'Mở chat' }).click();
    await expect(page.getByRole('heading', { name: 'Hộp thư' })).toBeVisible();
    await page.getByText('Trợ lý ảo AI').click();

    await expect(
      page.getByText(/Hãy hỏi Trợ lý AI về sản phẩm, giá, voucher hoặc đơn hàng của bạn/i),
    ).toBeVisible();

    // 2. Lượt 1: Nhập câu hỏi tư vấn mua sắm và nhận phản hồi kèm thẻ sản phẩm gợi ý
    const aiInput = page.getByPlaceholder(/Hỏi AI, ví dụ: tư vấn điện thoại dưới 10 triệu/i);
    await aiInput.fill('Tôi muốn tìm hiểu về iPhone 15 Pro Max');
    await aiInput.press('Enter');

    await expect(
      page.getByText(
        /Xin chào! Tôi là Trợ lý AI của sàn\. Dưới đây là gợi ý điện thoại flagship/i,
      ),
    ).toBeVisible();
    await expect(page.getByText(MOCK_PRODUCTS[0].name).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tư vấn chi tiết cấu hình' })).toBeVisible();
    expect(lastRequestMessagesCount).toBe(1);

    // 3. Lượt 2: Bấm chọn gợi ý nhanh "Tư vấn chi tiết cấu hình" -> Giữ ngữ cảnh phiên làm việc (messages.length >= 2)
    await page.getByRole('button', { name: 'Tư vấn chi tiết cấu hình' }).click();

    await expect(
      page.getByText(
        /Dựa trên câu hỏi trước của bạn về iPhone 15 Pro Max, mẫu này hiện có sẵn bản 256GB/i,
      ),
    ).toBeVisible();
    expect(lastRequestMessagesCount).toBeGreaterThanOrEqual(2);
  });

  test('TC4.2 - [Happy Path] Kiểm tra kênh CSKH trực tuyến (Customer Support), lưu trữ lịch sử hội thoại và trung tâm tin nhắn Seller', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page, 'CUSTOMER');
    await page.goto(BUYER_URL);

    await page.getByRole('button', { name: 'Mở chat' }).click();
    await page.getByText('CSKH E-commerce Platform').click();

    // 1. Kiểm tra lịch sử hội thoại CSKH được tải từ server
    await expect(
      page.getByText('Tôi cần hỗ trợ kiểm tra trạng thái giải ngân đơn hàng.').first(),
    ).toBeVisible();
    await expect(
      page
        .getByText('Chào bạn, bộ phận CSKH có thể hỗ trợ gì cho đơn hàng của bạn?')
        .first(),
    ).toBeVisible();

    // 2. Gửi tin nhắn mới tới bộ phận CSKH
    const liveInput = page.getByPlaceholder('Nhắn tin cho nhân viên...');
    await liveInput.fill('Nhờ CSKH kiểm tra giúp tôi đơn hàng ORD-20261026-0002 nhé.');
    await page.getByTitle('Gửi').click();

    await expect(
      page.getByText('Nhờ CSKH kiểm tra giúp tôi đơn hàng ORD-20261026-0002 nhé.').first(),
    ).toBeVisible();

    // 3. Seller truy cập trung tâm tin nhắn Shop (:3101/chat) xem hội thoại khách hàng
    await seedAuthenticatedSession(page, 'BUSINESS', {
      hasShop: true,
      sellerStatus: 'APPROVED',
      shopStatus: 'ACTIVE',
    });
    await page.goto(`${SELLER_URL}/chat`);
    await expect(page.getByText('Lê Văn Mua Hàng').first()).toBeVisible();
    await expect(page.getByText(/Shop ơi máy còn màu Titan Tự Nhiên không/i).first()).toBeVisible();
  });
});
