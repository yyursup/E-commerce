# Hướng Dẫn Test API E-commerce (Không sửa Backend)

Tài liệu này hướng dẫn cách kiểm thử các API (Request, Shipping, Order, Checkout) trực tiếp trên giao diện Frontend (UX/UI) và bằng công cụ manual (như Postman/cURL) nếu cần.

> **Lưu ý**: Các API dưới đây được tích hợp sẵn vào Frontend. Bạn chỉ cần thực hiện thao tác người dùng để kích hoạt chúng.

---

## 1. Test API Request (`/api/v1/request`)

### Kịch bản 1: Đăng ký Seller (Report/Request)
**Mục tiêu**: Kiểm tra tạo request mới.

- **Trên UI**: 
  1. Đăng nhập tài khoản Customer.
  2. Vào Menu Profile -> Chọn "Đăng ký bán hàng" (nếu có) hoặc truy cập `/seller/register`.
  3. Điền form và submit.
  4. Hệ thống sẽ gọi API `POST /request/regis-seller`.

### Kịch bản 2: Báo cáo vi phạm (Report)
- **Trên UI**: 
  1. Vào trang chi tiết sản phẩm bất kỳ.
  2. Tìm nút "Báo cáo" (nếu chưa có trên UI, API `POST /request/report` đã sẵn sàng trong service, bạn cần gắn nút vào UI để test).
- **Test nhanh bằng Console Browser**:
  Mở Console (F12) và chạy lệnh sau (khi đã login):
  ```javascript
  // Import service service/request.js (hoặc dùng axios trực tiếp)
  await fetch('/api/v1/request/report', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({
        targetId: "UUID-PRODUCT-ID", // ID sản phẩm
        reason: "Sản phẩm giả mạo",
        type: "PRODUCT"
    })
  }).then(r => r.json()).then(console.log);
  ```

---

## 2. Test API Shipping (`/api/v1/shipping`)

### Kịch bản: Tính phí ship
**Mục tiêu**: Kiểm tra API `POST /shipping/fee`.

- **Trên UI**:
  1. Thêm sản phẩm vào giỏ hàng.
  2. Vào giỏ hàng -> Nhấn "Thanh toán".
  3. Tại trang Checkout, chọn **Địa chỉ nhận hàng**.
  4. UI sẽ tự động gọi API `POST /shipping/fee`.
  5. Nếu thấy phí vận chuyển hiển thị (không phải `---` hay lỗi), API đã hoạt động.

---

## 3. Test API Checkout (`/api/v1/checkout`)

### Kịch bản 1: Xác nhận đơn hàng
**Mục tiêu**: Kiểm tra API `GET /checkout/confirm`.

- **Trên UI**:
  1. Vào giỏ hàng.
  2. Nhấn nút "Thanh toán" ở một shop cụ thể.
  3. Trang chuyển sang `/checkout?shopId=...`.
  4. Lúc này API `confirm` sẽ được gọi để load danh sách sản phẩm chuẩn bị mua.

### Kịch bản 2: Lấy báo giá (Quote)
**Mục tiêu**: Kiểm tra API `POST /checkout/quote`.

- **Trên UI**:
  1. Tương tự như phần Shipping, khi chọn địa chỉ, API này được gọi (thường kết hợp với tính phí ship trong logic Backend mới).
  2. Kiểm tra Network Tab (F12) để xem request `quote`.

---

## 4. Test API Order (`/api/v1/order`)

### Kịch bản 1: Tạo đơn hàng
**Mục tiêu**: Kiểm tra API `POST /api/v1/order`.

- **Trên UI**:
  1. Tại trang Checkout, sau khi có phí ship.
  2. Nhấn nút **"Đặt hàng"**.
  3. Nếu thành công, bạn được chuyển hướng đến trang Chi tiết đơn hàng.

### Kịch bản 2: Cập nhật trạng thái / Đã nhận hàng
**Mục tiêu**: Kiểm tra API `PATCH /{id}/received`.

- **Trên UI**:
  1. Vào danh sách đơn hàng (`/orders`).
  2. Chọn đơn hàng đang ở trạng thái `SHIPPED` (bạn có thể cần dùng DB hoặc tài khoản Admin để chuyển trạng thái đơn hàng sang SHIPPED trước).
  3. Nhấn nút **"Đã nhận được hàng"** (nếu UI hiển thị nút này).
  4. Trạng thái đơn đổi sang `COMPLETED`.

### Kịch bản 3: Admin/Shop thao tác đơn (Update Status, Retry GHN)
- **Trên UI (Admin/Business Dashboard)**:
  1. Đăng nhập tài khoản Shop (Business) hoặc Admin.
  2. Vào quản lý đơn hàng.
  3. Thử đổi trạng thái đơn hàng -> gọi API `PATCH /status`.
  4. Nếu đơn hàng lỗi vận chuyển, nút "Retry GHN" sẽ gọi API `POST /ghn/retry`.

---

## Tóm tắt luồng Test chính (Happy Path)
1. **Login** (Customer).
2. **Home** -> Thêm sản phẩm vào giỏ.
3. **Cart** -> Nhấn Thanh toán (Check Shop grouping).
4. **Checkout** -> Chọn địa chỉ -> Thấy phí ship hiện ra (Test Shipping/Quote).
5. **Place Order** -> Thành công (Test Order Create).
6. **Order Detail** -> Xem lại đơn vừa tạo.
