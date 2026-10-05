# CỔNG TRẢI NGHIỆM NGƯỜI MUA (BUYER PORTAL)
## E-commerce Tech Consumer Experience — Port 3000

> Ứng dụng Web dành cho khách hàng tìm kiếm, so sánh và mua sắm thiết bị công nghệ, điện thoại, máy tính, linh kiện điện tử. Được xây dựng trên nền tảng **React 19**, **Vite** và **Tailwind CSS v4**, tối ưu hóa trải nghiệm mượt mà, gợi ý sản phẩm thông minh bằng AI, xem livestream bán hàng trực tiếp và đảm bảo an toàn tuyệt đối qua quy trình Ký quỹ Escrow.

---

## 💻 CÔNG NGHỆ CHỦ ĐẠO

- **Giao diện & Thành phần:** React 19 (React Compiler Ready), Vite (Rolldown engine), Tailwind CSS v4
- **Quản lý Trạng thái (State Management):** Zustand 5 (Persist middleware cho Cart, Auth và User preferences)
- **Truyền thông Mạng (Networking):** Axios 1.13 kèm **Custom Mutex Refresh Interceptor**:
  * Bắt lỗi `401 Unauthorized`.
  * Tạm hoãn các request đồng thời vào hàng đợi.
  * Tự động gọi API cấp lại Token mới.
  * Tự động xóa sạch `localStorage` và chuyển trang về `/login` nếu Refresh Token hết hạn.
- **Phát sóng Trực tiếp (Live Commerce):** `@livekit/components-react` & `livekit-client` (Chuẩn WebRTC độ trễ siêu thấp)
- **Giao tiếp Realtime:** `@stomp/stompjs` & `sockjs-client` (Chat trực tiếp với người bán và hỗ trợ kỹ thuật sàn)
- **Hiệu ứng & Giao diện:** Framer Motion, Headless UI, React Slick Carousel, React Hot Toast
- **Kiểm thử Tự động:** Vitest 5, React Testing Library, jsdom

---

## 📱 CÁC TÍNH NĂNG VÀ LUỒNG TRẢI NGHIỆM CHÍNH

### 1. Khám phá Sản phẩm & Gợi ý Thông minh bằng AI
- **Tìm kiếm theo thông số công nghệ:** Lọc chi tiết theo hãng (Apple, Samsung, Sony, Dell, Asus...), tình trạng máy (Mới 100%, 99% Like New, Đã qua sử dụng - AS-IS), dung lượng RAM/SSD và khoảng giá.
- **Khối gợi ý cá nhân hóa (Recommendation Engine):** Tự động phân tích sản phẩm đang xem và lịch sử tìm kiếm để hiển thị "Sản phẩm tương tự" hoặc "Thiết bị cùng cấu hình tối ưu".

### 2. Giỏ hàng Đa Cửa Hàng & Thanh toán VNPay
- Gom nhóm sản phẩm theo từng Shop riêng biệt trong giỏ hàng.
- Tự động tính phí vận chuyển theo thời gian thực kết nối với API **Giao Hàng Nhanh (GHN)** dựa trên địa chỉ giao hàng của người mua.
- Áp dụng mã giảm giá (Voucher) toàn sàn hoặc voucher riêng của từng Shop.
- Tích hợp cổng thanh toán an toàn **VNPay Sandbox** và kiểm tra chữ ký số bảo mật HMAC-SHA512.

### 3. Vòng đời Trả hàng / Khiếu nại 7 Ngày (Return & Refund)
- Khách hàng có quyền gửi yêu cầu trả hàng trong vòng **7 ngày** kể từ khi shipper giao kiện hàng thành công.
- Tải lên hình ảnh/video bằng chứng sản phẩm bị lỗi hoặc không đúng mô tả.
- Sau khi yêu cầu được duyệt, người mua nhập mã vận đơn GHN trả hàng về kho người bán.
- Theo dõi toàn bộ tiến trình thẩm định 72h của người bán và tiến trình hoàn tiền trực tiếp về Ví sàn.

### 4. Xem Livestream Trực tiếp & Mua hàng Tức thì (LiveKit)
- Xem luồng phát trực tiếp của các cửa hàng công nghệ với chất lượng HD và độ trễ dưới 500ms.
- Xem danh sách sản phẩm được Shop ghim trực tiếp trên màn hình livestream, bấm mua hàng nhanh mà không bị gián đoạn video.

### 5. Trợ lý Mua sắm AI & Hỗ trợ Khách hàng Realtime
- Chatbot tự động hướng dẫn chọn cấu hình máy tính hoặc kiểm tra trạng thái đơn hàng.
- Chuyển giao thông minh (Handoff) sang nhân viên tư vấn người thật qua giao thức WebSocket STOMP.

---

## ⚙️ THIẾT LẬP MÔI TRƯỜNG & KHỞI CHẠY

### 1. Cấu hình file `.env`
Tạo file `ecommerce-fe/.env` trong thư mục `ecommerce-fe/`:

```env
# Địa chỉ máy chủ Backend Spring Boot
VITE_API_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080

# Địa chỉ máy chủ WebRTC LiveKit
VITE_LIVEKIT_WS_URL=ws://localhost:7880
```

### 2. Cài đặt các gói phụ thuộc
```bash
cd ecommerce-fe
npm install
```

### 3. Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại cổng mặc định: **`http://localhost:3000`**.

### 4. Kiểm thử tự động (Unit Test)
```bash
npm run test
```

### 5. Đóng gói triển khai (Production Build)
```bash
npm run build
```
Thư mục xuất bản tĩnh sẽ nằm tại `dist/`.

---

## 🧭 CẤU TRÚC THƯ MỤC SOURCE CODE

```text
ecommerce-fe/
├── src/
│   ├── assets/          # Hình ảnh, biểu tượng và tài nguyên đồ họa tĩnh
│   ├── components/      # Các thành phần UI tái sử dụng (Navbar, Footer, Modal, Card...)
│   ├── contexts/        # React Contexts (SocketContext, LiveContext...)
│   ├── hooks/           # Custom React Hooks (useCart, useAuth, useDebounce...)
│   ├── pages/           # Các trang giao diện chính:
│   │   ├── Home/        # Trang chủ & Banner khuyến mãi
│   │   ├── Product/     # Chi tiết sản phẩm & Thông số kỹ thuật
│   │   ├── Cart/        # Giỏ hàng đa shop
│   │   ├── Checkout/    # Đặt hàng & Chọn phương thức thanh toán
│   │   ├── Order/       # Quản lý đơn hàng & Yêu cầu trả hàng
│   │   ├── Live/        # Phòng xem Livestream tương tác
│   │   └── Profile/     # Hồ sơ người dùng, Sổ địa chỉ & Số dư ví
│   ├── services/        # Tầng giao tiếp API (api.js với Mutex Axios Interceptor)
│   ├── stores/          # Zustand State Stores (useAuthStore, useCartStore)
│   ├── App.jsx          # Cấu hình Route chính của ứng dụng
│   └── main.jsx         # Điểm khởi tạo ứng dụng React
├── index.html           # HTML template gốc
├── vite.config.js       # Cấu hình Vite & Port 3000
└── package.json         # Danh sách thư viện phụ thuộc
```
