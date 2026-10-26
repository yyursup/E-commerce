# E-commerce UI & E2E Test Automation (`automation-tests`)

Bộ kiểm thử tự động giao diện (UI Automation) độc lập sử dụng **Playwright + TypeScript** cho dự án E-commerce (3 cổng Frontend: Buyer `:3000`, Seller `:3001`, Admin `:3002`).

> **Cam kết độc lập:** Toàn bộ cấu hình, dependency và kịch bản test nằm gọn trong thư mục `automation-tests/`. Không chỉnh sửa bất kỳ dòng code hay cấu hình nào của `ecommerce-fe`, `ecommerce-seller-fe`, `ecommerce-admin-fe` hoặc `ecommerce` (Backend).

---

## 1. Cấu trúc thư mục

```text
automation-tests/
├── package.json                       # Quản lý dependency Playwright & TypeScript độc lập
├── tsconfig.json                      # Cấu hình TypeScript
├── playwright.config.ts               # Cấu hình chạy test, tự động khởi động 3 Vite dev servers (:3000, :3001, :3002)
├── fixtures/
│   ├── test-data.ts                   # Dữ liệu mẫu, tài khoản test local & hàm tạo JWT hợp lệ
│   └── api-mocks.ts                   # Route Interception giúp test UI độc lập và không gọi thanh toán thật
└── tests/
    ├── 01-auth-login.spec.ts          # Kiểm thử Đăng nhập & Validation (5 test cases)
    ├── 02-auth-register.spec.ts       # Kiểm thử Đăng ký & Validation (4 test cases)
    ├── 03-products-search.spec.ts     # Kiểm thử Danh sách sản phẩm, Tìm kiếm & Chi tiết sản phẩm (3 test cases)
    ├── 04-cart-checkout.spec.ts       # Kiểm thử Giỏ hàng & Checkout an toàn qua Ví sàn (3 test cases)
    ├── 05-orders-management.spec.ts   # Kiểm thử Quản lý đơn hàng, Lọc trạng thái & Chi tiết đơn (2 test cases)
    └── 06-rbac-permissions.spec.ts    # Kiểm thử Phân quyền Customer, Seller, Admin trên 3 cổng (5 test cases)
```

---

## 2. Hướng dẫn cài đặt cho thành viên nhóm

1. Đảm bảo các thư mục frontend đã cài `node_modules` (nếu chưa có):
   ```powershell
   cd D:\e-commerce\E-commerce\ecommerce-fe && npm install
   cd D:\e-commerce\E-commerce\ecommerce-seller-fe && npm install
   cd D:\e-commerce\E-commerce\ecommerce-admin-fe && npm install
   ```
2. Di chuyển vào thư mục `automation-tests` và cài đặt Playwright:
   ```powershell
   cd D:\e-commerce\E-commerce\automation-tests
   npm install
   ```
   *(Cấu hình mặc định sử dụng trình duyệt Google Chrome có sẵn trên máy thông qua `channel: 'chrome'`. Nếu muốn tải thêm Chromium riêng của Playwright, chạy `npx playwright install chromium`).*

---

## 3. Các lệnh chạy Test

Mở Terminal tại `D:\e-commerce\E-commerce\automation-tests`:

- **Chạy toàn bộ bộ test (Headless):**
  ```powershell
  npm test
  ```
  *(Lưu ý: Playwright sẽ tự động bật 3 cổng Frontend `3000`, `3001`, `3002` thông qua cấu hình `webServer` nếu bạn chưa bật sẵn).*

- **Chạy toàn bộ bộ test có hiển thị trình duyệt (Headed):**
  ```powershell
  npm run test:headed
  ```

- **Chạy giao diện tương tác Playwright UI Mode:**
  ```powershell
  npm run test:ui
  ```

- **Chạy từng cụm chức năng riêng lẻ:**
  ```powershell
  npm run test:auth       # Login & Register
  npm run test:products   # Danh sách, tìm kiếm & chi tiết sản phẩm
  npm run test:cart       # Giỏ hàng & Checkout
  npm run test:orders     # Quản lý đơn hàng
  npm run test:rbac       # Phân quyền Customer / Seller / Admin
  ```

- **Mở báo cáo HTML sau khi chạy xong:**
  ```powershell
  npm run report
  ```
  Hoặc mở trực tiếp file: `automation-tests/playwright-report/index.html`.
