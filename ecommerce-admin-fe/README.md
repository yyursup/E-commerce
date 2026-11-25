# CỔNG QUẢN TRỊ SÀN (ADMIN PORTAL)
## E-commerce Platform Operations — cổng 3002

> Ứng dụng web cho quản trị viên sàn: duyệt đăng ký bán hàng và sản phẩm, phân xử khiếu nại – tranh chấp trả hàng, quản lý hoa hồng – cấp uy tín – chính sách, giám sát Escrow và ví sàn, theo dõi thống kê và hỗ trợ khách trực tuyến. Ứng dụng gọi Backend Spring Boot ở `http://localhost:8080` (xem [README gốc](../README.md) để chạy cả hệ thống).

---

## 💻 CÔNG NGHỆ

- **Nền tảng:** React 19.2 (kèm `babel-plugin-react-compiler`), Vite (gói `rolldown-vite` 7.2.5), React Router 7, Tailwind CSS 4.1, Headless UI, Framer Motion, React Hot Toast.
- **Trạng thái:** Zustand 5 — `useAuthStore`, `useCartStore`, `useThemeStore` (thư mục `src/store`).
- **Gọi API:** Axios 1.13 (`src/api/axiosClient.js`) với interceptor làm mới token có **mutex**; hook `useTokenLifecycle` làm mới token trước khi hết hạn.
- **Chat thời gian thực:** WebSocket thuần tới `ws://localhost:8080/api/v1/ws/chat?token=<access token>` (`src/services/websocketService.js`).
- **Kiểm thử:** Vitest 5, React Testing Library, jsdom.

> Chỉ tài khoản có vai trò `ADMIN` đăng nhập được ở cổng này (`/login`). Tài khoản mẫu: `admin` / `admin123@`.

---

## 🛡️ CÁC NHÓM CHỨC NĂNG

| Nhóm | Route | Nội dung |
|:---|:---|:---|
| Tổng quan | `/dashboard` | Số liệu toàn sàn: người dùng, shop, doanh thu, tiền đang giữ Escrow, việc cần xử lý (`GET /api/v1/statistics/admin/dashboard`) |
| Duyệt người bán | `/requests`, `/requests/:requestId` | Danh sách yêu cầu đăng ký bán hàng; xem thông tin trích xuất từ eKYC, ảnh CCCD và khuôn mặt, điểm so khớp; **phê duyệt** (`PUT /api/v1/request/approve`, cấp vai trò `BUSINESS` và tạo shop) hoặc **từ chối** kèm lý do (`PUT /api/v1/request/reject`) |
| Kiểm duyệt sản phẩm | `/moderation` | Duyệt hoặc từ chối sản phẩm mới/đã sửa (`GET /api/v1/admin/products/pending`, `POST .../approve`, `POST .../reject`) |
| Đơn hàng | `/orders`, `/orders/:orderId`, `/orders/shops/:shopId` | Tra cứu đơn toàn sàn, chi tiết đơn, đơn theo từng shop; `/shop-ranking`: xếp hạng shop |
| Khiếu nại và tranh chấp | `/reports`, `/reports/:reportId` | Xử lý khiếu nại đã chuyển lên Admin (người bán không phản hồi trong 48 giờ hoặc leo thang); xem bằng chứng hai bên, chat tranh chấp; phân xử trả hàng `DISPUTED`: `APPROVE_RETURN` hoàn tiền cho người mua, `REJECT_RETURN` giải ngân cho người bán (`POST /api/v1/returns/{id}/resolve-dispute`) |
| Hoa hồng | `/commissions` | Tỷ lệ chuẩn toàn sàn, tỷ lệ hàng cũ, ngưỡng sàn, tỷ lệ theo danh mục, chính sách ưu đãi thâm niên (3/6/12 tháng); thống kê hoa hồng theo tháng, theo danh mục, top shop |
| Cấp uy tín và quỹ ký quỹ shop | `/trust-config` (mặc định mở tab quỹ `?tab=funds`) | Cấu hình 5 cấp uy tín theo mức ký quỹ và ưu đãi hoa hồng; giám sát quỹ ký quỹ của từng shop, điều chỉnh, khấu trừ bồi thường, xử lý yêu cầu hoàn quỹ/đóng shop |
| Ví sàn và Escrow | `/platform-wallet` (các tab, ví dụ `?tab=escrows`, `?tab=lookup`) | Ví sàn, Escrow theo từng đơn (giải ngân/hoàn tiền/chia tiền thủ công qua `/api/v1/escrow/...`), tra cứu ví người dùng, duyệt hoặc từ chối yêu cầu rút tiền, thống kê phí vận chuyển |
| Voucher và chính sách | `/vouchers`, `/policies` | Quản lý voucher sàn; soạn các điều khoản chính sách hiển thị cho người dùng |
| Hỗ trợ | `/live-chat` | Tiếp nhận và trả lời hội thoại hỗ trợ qua WebSocket |

Các đường dẫn cũ `/escrow-fund-supervision`, `/escrows`, `/wallets` được chuyển hướng sang các tab tương ứng ở trên.

---

## ⚙️ THIẾT LẬP VÀ CHẠY

Yêu cầu Node.js 20.19+ hoặc 22.12+ và Backend đang chạy ở cổng 8080.

```bash
cd ecommerce-admin-fe
npm install
npm run dev        # http://localhost:3002
```

Không cần file `.env` để chạy cục bộ. Muốn đổi địa chỉ Backend, tạo `ecommerce-admin-fe/.env`:

```env
VITE_API_URL=http://localhost:8080
```

| Lệnh | Tác dụng |
|:---|:---|
| `npm run dev` | Máy chủ phát triển ở cổng 3002 |
| `npm run build` | Đóng gói production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run test` | Vitest chế độ theo dõi; `npx vitest run` để chạy một lần |

---

## 🧭 CẤU TRÚC THƯ MỤC

```text
ecommerce-admin-fe/
├── public/
├── src/
│   ├── api/                 # axiosClient.js — Axios + mutex làm mới token
│   ├── assets/
│   ├── components/          # Layout, Modal, các thành phần dùng chung
│   ├── hooks/               # useTokenLifecycle, useChatNotification, useHorizontalScroll
│   ├── lib/                 # auth, jwt, orderStatus, reportHelpers, voucherStatus, mediaUtils...
│   ├── pages/
│   │   ├── AdminLogin.jsx   # Đăng nhập quản trị
│   │   └── admin/           # AdminLayout, AdminDashboard, AdminRequests/RequestDetail, AdminProductModeration,
│   │                        # AdminOrders/OrderDetail, AdminShopDetail, AdminShopRanking, AdminReports/ReportDetail,
│   │                        # AdminCommissions, AdminTrustConfig, AdminPlatformWallet, AdminVouchers,
│   │                        # AdminPolicies, AdminLiveChat và thư mục components/ cho từng nhóm
│   ├── services/            # Tầng gọi API theo miền (request, order, escrow, wallet, commission, seniorityPolicy, shippingFees, websocketService...)
│   ├── store/               # Zustand stores
│   ├── utils/               # escrowHelpers, exportAdminSettlementReport
│   ├── __tests__/           # Kiểm thử Vitest (hooks, lib, services, store, utils)
│   ├── App.jsx              # Khai báo route
│   └── main.jsx
├── index.html
├── vite.config.js           # Cấu hình Vite, cổng 3002
└── package.json
```
