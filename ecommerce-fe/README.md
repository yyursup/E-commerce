# CỔNG NGƯỜI MUA (BUYER PORTAL)
## E-commerce Customer Web App — cổng 3000

> Ứng dụng web cho khách hàng: tìm và so sánh thiết bị công nghệ, mua hàng từ nhiều cửa hàng trong một giỏ, thanh toán an toàn qua **ký quỹ Escrow**, theo dõi đơn hàng, trả hàng/khiếu nại, quản lý ví, chat với người bán và hỏi trợ lý mua sắm AI. Ứng dụng gọi Backend Spring Boot ở `http://localhost:8080` (xem [README gốc](../README.md) để chạy cả hệ thống).

---

## 💻 CÔNG NGHỆ

- **Nền tảng:** React 19.2 (kèm `babel-plugin-react-compiler`), Vite (gói `rolldown-vite` 7.2.5), React Router 7.
- **Giao diện:** Tailwind CSS 4.1, Headless UI, Framer Motion, React Slick, AOS, React Hot Toast, React Icons.
- **Trạng thái:** Zustand 5 — các store `useAuthStore`, `useCartStore`, `useChatStore`, `useWishlistStore`, `useThemeStore` (thư mục `src/store`).
- **Gọi API:** Axios 1.13 (`src/api/axiosClient.js`) với interceptor làm mới token có **mutex**: khi nhiều request cùng nhận `401`, chỉ một request gọi `POST /api/v1/auth/refresh-token`, các request còn lại xếp hàng rồi gửi lại với token mới; nếu refresh thất bại, `localStorage` và store được xóa và người dùng quay về `/login`. Hook `useTokenLifecycle` làm mới token trước khi hết hạn.
- **Chat thời gian thực:** WebSocket thuần tới `ws://localhost:8080/api/v1/ws/chat?token=<access token>` (`src/services/websocketService.js`, có tự kết nối lại).
- **Biểu mẫu và đăng nhập:** React Hook Form; đăng nhập Google bằng `@react-oauth/google`.
- **Kiểm thử:** Vitest 5, React Testing Library, jsdom.

---

## 📱 TÍNH NĂNG VÀ MÀN HÌNH CHÍNH

| Nhóm | Route | Nội dung |
|:---|:---|:---|
| Khám phá | `/`, `/deals`, `/marketplace`, `/products`, `/products/:productId`, `/shop/:shopId` | Trang chủ, ưu đãi, danh sách và tìm kiếm nâng cao (có lịch sử tìm kiếm), chi tiết sản phẩm với biến thể và đánh giá, trang cửa hàng (theo dõi shop) |
| Mua hàng | `/cart`, `/checkout`, `/payment/vnpay_return` | Giỏ hàng gom theo shop, chọn địa chỉ (chọn tỉnh/huyện/xã theo GHN), tính phí ship GHN, áp voucher sàn và voucher shop, thanh toán bằng ví nội bộ hoặc VNPAY, trang kết quả thanh toán |
| Đơn hàng | `/my-orders`, `/orders`, `/orders/:orderId` | Theo dõi đơn, xác nhận đã nhận hàng, yêu cầu trả hàng và nhập mã vận đơn hàng trả, chat tranh chấp, xem tiến độ hoàn tiền, phiếu hóa đơn |
| Khiếu nại | `/report` | Gửi khiếu nại kèm bằng chứng (trong 3 ngày sau khi giao) |
| Hồ sơ | `/profile`, `/profile/wallet` | Thông tin cá nhân, đổi mật khẩu, sổ địa chỉ, thông tin ngân hàng, ví nội bộ (số dư, lịch sử giao dịch, yêu cầu rút tiền về ngân hàng), thông báo, yêu thích, đánh giá của tôi, thống kê chi tiêu |
| Tài khoản | `/login`, `/register`, `/verify`, `/forgot-password`, `/banned` | Đăng nhập (kể cả Google), đăng ký với OTP e-mail, quên mật khẩu, trang tài khoản bị khóa và kháng cáo |
| Chính sách | `/policy`, `/escrow-policy`, `/returns`, `/seller-policy`, `/shipping`, `/grading`, `/privacy`, `/terms` | Các trang quy định của sàn |
| Hỗ trợ | nút chat nổi | Trợ lý AI (`POST /api/v1/chat/ai`), chatbot kịch bản, chat với người bán và hỗ trợ sàn |

Gợi ý sản phẩm ("sản phẩm tương tự", phụ kiện, gợi ý cá nhân hóa) gọi nhóm endpoint `/api/v1/recommendations`. Đường dẫn `/seller/register` chuyển người dùng sang Seller Portal (địa chỉ lấy từ `VITE_SELLER_URL`).

---

## ⚙️ THIẾT LẬP VÀ CHẠY

Yêu cầu Node.js 20.19+ hoặc 22.12+ và Backend đang chạy ở cổng 8080.

```bash
cd ecommerce-fe
npm install
npm run dev        # http://localhost:3000
```

### Biến môi trường (tùy chọn)
Không cần file `.env` để chạy cục bộ. Nếu cần, tạo `ecommerce-fe/.env` (đã nằm trong `.gitignore`):

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
VITE_SELLER_URL=http://localhost:3001
```

- `VITE_API_URL` (hoặc `VITE_API_BASE_URL`): địa chỉ Backend, mặc định `http://localhost:8080`.
- `VITE_GOOGLE_CLIENT_ID`: Client ID cho nút đăng nhập Google (mặc định chuỗi giữ chỗ nên nút Google không hoạt động nếu không đặt).
- `VITE_SELLER_URL`: địa chỉ Seller Portal, mặc định `http://localhost:3001`.

### Lệnh npm
| Lệnh | Tác dụng |
|:---|:---|
| `npm run dev` | Chạy máy chủ phát triển ở cổng 3000 |
| `npm run build` | Đóng gói production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run test` | Chạy Vitest (chế độ theo dõi); dùng `npx vitest run` để chạy một lần |

---

## 🧭 CẤU TRÚC THƯ MỤC

```text
ecommerce-fe/
├── public/                  # Tài nguyên tĩnh
├── src/
│   ├── api/                 # axiosClient.js — Axios + mutex làm mới token
│   ├── assets/              # Hình ảnh, biểu tượng
│   ├── components/          # Thành phần dùng chung (Navbar, Footer, tìm kiếm nâng cao, chọn địa chỉ GHN, chatbot...)
│   ├── data/                # Dữ liệu tĩnh
│   ├── hooks/               # useTokenLifecycle, useDebounce, useSearchHistory, useChatNotification
│   ├── lib/                 # Tiện ích (auth, jwt, orderStatus, techBadges, mediaUtils...)
│   ├── pages/               # Trang: Home, Marketplace, Cart, Login, Register, Verify, Profile, ReportCreate, ShopProfile...
│   │   ├── checkout/        # Trang đặt hàng và các khối địa chỉ – thanh toán – voucher
│   │   ├── deals/           # Trang ưu đãi
│   │   ├── orders/          # Danh sách và chi tiết đơn, trả hàng, tranh chấp
│   │   ├── product-detail/  # Chi tiết sản phẩm
│   │   ├── products/        # Danh sách sản phẩm
│   │   └── profile/         # Thông tin cá nhân, ví, thông báo, yêu thích, đánh giá, thống kê chi tiêu
│   ├── services/            # Tầng gọi API theo miền (auth, order, product, returnService, websocketService...)
│   ├── store/               # Zustand stores
│   ├── __tests__/           # Kiểm thử Vitest (components, hooks, lib, services, store)
│   ├── App.jsx              # Khai báo route
│   └── main.jsx             # Điểm khởi tạo
├── index.html
├── vite.config.js           # Cấu hình Vite, cổng 3000
├── eslint.config.js
└── package.json
```
