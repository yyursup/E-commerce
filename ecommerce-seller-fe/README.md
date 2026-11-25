# CỔNG NGƯỜI BÁN (SELLER PORTAL)
## E-commerce Merchant Center — cổng 3001

> Ứng dụng web cho chủ cửa hàng: đăng ký bán hàng bằng định danh sinh trắc học **eKYC**, quản lý sản phẩm – kho – voucher, xử lý đơn hàng và hàng trả về, theo dõi **quỹ ký quỹ** và uy tín của shop, chat với khách. Ứng dụng gọi Backend Spring Boot ở `http://localhost:8080` (xem [README gốc](../README.md) để chạy cả hệ thống).

---

## 💻 CÔNG NGHỆ

- **Nền tảng:** React 19.2 (kèm `babel-plugin-react-compiler`), Vite (gói `rolldown-vite` 7.2.5), React Router 7, Tailwind CSS 4.1, Headless UI, Framer Motion, React Hot Toast.
- **Trạng thái:** Zustand 5 — `useAuthStore`, `useCartStore`, `useThemeStore` (thư mục `src/store`).
- **Gọi API:** Axios 1.13 (`src/api/axiosClient.js`) với interceptor làm mới token có **mutex** (một request `refresh-token` duy nhất, các request `401` khác chờ rồi gửi lại; refresh thất bại thì xóa phiên và về trang đăng nhập); hook `useTokenLifecycle` làm mới token trước khi hết hạn.
- **Chat thời gian thực:** WebSocket thuần tới `ws://localhost:8080/api/v1/ws/chat?token=<access token>` (`src/services/websocketService.js`, có tự kết nối lại).
- **Ảnh và biểu mẫu:** `react-easy-crop` (cắt ảnh sản phẩm trước khi tải lên), React Hook Form; chụp ảnh CCCD và khuôn mặt bằng camera trình duyệt (`CameraCapture`).
- **Kiểm thử:** Vitest 5, React Testing Library, jsdom.

---

## 🚀 CÁC LUỒNG NGHIỆP VỤ

### 1. Đăng ký bán hàng và eKYC
Route `/seller-register` dẫn người dùng qua các bước: chụp CCCD mặt trước và mặt sau, quét khuôn mặt (liveness), so khớp khuôn mặt với ảnh CCCD qua nhóm endpoint `/api/v1/kyc/**`. Khi độ tương đồng đạt từ **95% trở lên**, biểu mẫu thông tin shop (mã số thuế, tên shop, tài khoản ngân hàng, giấy phép kinh doanh, địa chỉ GHN) được mở để gửi yêu cầu `POST /api/v1/request/regis-seller`.
- Tiến trình eKYC dở dang được lưu ở trình duyệt và khôi phục khi tải lại trang.
- `/pending`: chờ Admin duyệt; `/rejected`: thông báo bị từ chối kèm lý do. Khi được duyệt, tài khoản trở thành `BUSINESS` và vào được khu quản lý.

### 2. Sản phẩm, kho và voucher
- `/products`: danh sách sản phẩm của shop, thêm/sửa sản phẩm với nhiều biến thể (giá, tồn kho, ảnh), bật/tắt hiển thị, đánh dấu nổi bật. Sản phẩm mới hoặc đã sửa phải được Admin duyệt (kiểm duyệt) trước khi hiển thị công khai.
- `/inventory-history`: lịch sử biến động tồn kho.
- `/vouchers`: tạo và quản lý voucher của shop (giảm theo phần trăm, giảm số tiền cố định, miễn phí vận chuyển).

### 3. Đơn hàng và vận chuyển
- `/orders`, `/orders/:orderId`: xử lý đơn theo trạng thái, xác nhận và đóng gói, tạo/đồng bộ mã vận đơn **GHN**.
- Hàng trả về: khi hàng về đến shop, người bán có **72 giờ** để kiểm tra và chọn *hoàn tiền cho người mua* hoặc *khiếu nại tráo hàng/hư hỏng kèm bằng chứng*; quá hạn không phản hồi thì hệ thống tự hoàn tiền cho người mua. Khiếu nại của người mua được thương lượng trực tiếp trong 48 giờ trước khi chuyển lên Admin.
- Xuất báo cáo đối soát đơn hàng (`utils/exportSettlementReport.js`).

### 4. Quỹ ký quỹ, uy tín và vi phạm
- `/escrow-fund`: xem số dư quỹ ký quỹ, cấp uy tín (1–5 sao), nạp quỹ qua VNPAY, yêu cầu hoàn quỹ, theo dõi cảnh báo thiếu quỹ và hạn nạp bù.
- `/violations`: các vi phạm và tình trạng đình chỉ của shop.
- Phí hoa hồng của shop = tỷ lệ cơ bản − ưu đãi theo cấp ký quỹ − ưu đãi thâm niên, không thấp hơn ngưỡng sàn (xem README gốc).

### 5. Dashboard, chat và cài đặt
- `/dashboard`: số liệu doanh thu và đơn hàng (`GET /api/v1/statistics/seller/dashboard`).
- `/chat`: hội thoại với người mua và hỗ trợ sàn, thông báo tin nhắn mới.
- `/settings`: hồ sơ shop; `/policy`, `/seller-policy`, `/escrow-policy`: quy định dành cho người bán.

---

## ⚙️ THIẾT LẬP VÀ CHẠY

Yêu cầu Node.js 20.19+ hoặc 22.12+ và Backend đang chạy ở cổng 8080.

```bash
cd ecommerce-seller-fe
npm install
npm run dev        # http://localhost:3001
```

Không cần file `.env` để chạy cục bộ. Muốn đổi địa chỉ Backend, tạo `ecommerce-seller-fe/.env`:

```env
VITE_API_URL=http://localhost:8080
```

| Lệnh | Tác dụng |
|:---|:---|
| `npm run dev` | Máy chủ phát triển ở cổng 3001 |
| `npm run build` | Đóng gói production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run test` | Vitest chế độ theo dõi; `npx vitest run` để chạy một lần |

---

## 🧭 CẤU TRÚC THƯ MỤC

```text
ecommerce-seller-fe/
├── public/
├── src/
│   ├── api/                 # axiosClient.js — Axios + mutex làm mới token
│   ├── assets/
│   ├── components/          # Layout, Modal, CameraCapture, BusinessLicenseUpload, GhnAddressSelector, BankSelector...
│   ├── hooks/               # useTokenLifecycle, useChatNotification
│   ├── lib/                 # auth, jwt, orderStatus, voucherStatus, variantMapping, mediaUtils...
│   ├── pages/               # Login, Register, Verify, SellerLanding, SellerRegister (eKYC), PendingApproval, RejectedNotice, ShopProducts, ShopSettings
│   │   └── business/        # Khu quản lý: BusinessLayout, BusinessDashboard, ShopOrders, ShopOrderDetail,
│   │                        # ShopInventoryHistory, ShopVouchers, ShopEscrowFund, ShopViolations, ShopLiveChat, SellerPolicy
│   ├── services/            # Tầng gọi API theo miền (kyc, order, product, escrowFund, returnService, websocketService...)
│   ├── store/               # Zustand stores
│   ├── utils/               # cropImage, exportSettlementReport
│   ├── __tests__/           # Kiểm thử Vitest (hooks, lib, services, store, utils)
│   ├── App.jsx              # Khai báo route
│   └── main.jsx
├── index.html
├── vite.config.js           # Cấu hình Vite, cổng 3001
└── package.json
```
