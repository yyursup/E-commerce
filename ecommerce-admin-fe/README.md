# CỔNG QUẢN TRỊ TOÀN DIỆN SÀN THƯƠNG MẠI ĐIỆN TỬ (ADMIN PORTAL)
## E-commerce Platform Governance & Operations Hub — Port 3002

> Ứng dụng Web dành cho Ban quản trị sàn, Bộ phận kiểm soát tài chính, Hội đồng trọng tài phân xử tranh chấp và Đội ngũ hỗ trợ khách hàng. Được xây dựng trên nền tảng **React 19**, **Vite** và **Tailwind CSS v4**, đóng vai trò là "Trung tâm chỉ huy" giám sát toàn bộ hoạt động giao dịch, đối soát ký quỹ Escrow, thẩm tra danh tính người bán và bảo vệ công bằng hệ sinh thái.

---

## 💻 CÔNG NGHỆ CHỦ ĐẠO

- **Giao diện & Nền tảng:** React 19, Vite (Rolldown engine), Tailwind CSS v4
- **Quản lý Trạng thái:** Zustand 5 (Lưu trữ phiên đăng nhập Admin, danh sách sự vụ cần xử lý gấp)
- **Truyền thông Mạng:** Axios 1.13 kèm **Concurrency Mutex Interceptor** ngăn ngừa lỗi lệch token phiên
- **Thành phần Giao diện:** Headless UI, React Icons, React Hot Toast
- **Giao tiếp Realtime:** `@stomp/stompjs` & `sockjs-client` (Tổng đài hỗ trợ khách hàng và nhận thông báo tranh chấp mới)

---

## 🛡️ CÁC CỤM CHỨC NĂNG QUẢN TRỊ TRỌNG TÂM

### 1. Trung tâm Phân xử Tranh chấp Hoàn trả (Dispute Arbitration Center)
- **Bối cảnh:** Khi Người bán từ chối nhận hàng hoàn sau 72h thẩm định và gửi khiếu nại (`DISPUTED`), sự vụ được chuyển về Hội đồng quản trị sàn.
- **Đối chiếu bằng chứng song song (Side-by-side Evidence Audit):**
  * Hiển thị đồng thời: Ảnh/Video mở hàng của Người mua khi nhận hàng $\leftrightarrow$ Ảnh/Video khui kiện hoàn trả của Người bán.
  * Xem log mã vận đơn GHN, thời gian nhận hàng và chi tiết linh kiện bị báo cáo hư hỏng.
- **Quyết định phán quyết tối hậu (`POST /api/v1/returns/{returnId}/resolve-dispute`):**
  * **Chấp thuận khiếu nại của Shop:** Giải phóng tiền ký quỹ Escrow về Ví Người bán; Người mua không được hoàn tiền do làm hỏng hàng.
  * **Bác bỏ khiếu nại (Bảo vệ Người mua):** Hoàn toàn bộ số tiền đơn hàng về Ví Người mua; trừ điểm uy tín của Shop.

### 2. Cụm Thẩm định Hồ sơ Người bán & Kiểm tra eKYC (Seller Onboarding Hub)
- Danh sách các yêu cầu đăng ký mở cửa hàng (`RequestType.REGIS_SELLER`).
- Thẩm định chi tiết thông tin trích xuất tự động từ **VNPT eKYC**:
  * Họ tên, Số CCCD, Ngày sinh, Địa chỉ thường trú.
  * Kết quả kiểm tra ảnh khuôn mặt sống (Face Liveness Score) và tỷ lệ so khớp chân dung.
- Thao tác: **Phê duyệt (`/request/approve`)** cấp quyền `BUSINESS` cho tài khoản hoặc **Từ chối (`/request/reject`)** kèm lý do phản hồi cho người dùng.

### 3. Cụm Quản trị Biểu phí Hoa hồng Động (Dynamic Commission Hub)
- Điều chỉnh tỷ lệ phần trăm hoa hồng mặc định của toàn sàn (`GET/PATCH /api/v1/platform`).
- Cấu hình biểu phí hoa hồng theo từng danh mục hàng hóa công nghệ (Ví dụ: Laptop 3%, Điện thoại 3.5%, Phụ kiện linh kiện 7%).
- Báo cáo phân tích doanh thu phí sàn thu được theo tháng, theo danh mục sản phẩm và bảng xếp hạng Top Shop đóng góp hoa hồng lớn nhất.

### 4. Cụm Thâm niên & Quỹ Ký Quỹ Đảm Bảo (Seniority & Escrow Fund Hub)
- Thiết lập chính sách thâm niên nhà bán (Shop Seniority Policy): Cấp bậc Đồng, Bạc, Vàng, Kim Cương tương ứng với mức ký quỹ an toàn bắt buộc.
- Giám sát trạng thái quỹ ký quỹ cố định (`ShopEscrowFund`):
  * Cảnh báo các Shop có quỹ ký quỹ bị thâm hụt do bồi thường khiếu nại.
  * Quản lý thời hạn nộp bù tiền ký quỹ và áp dụng chế tài tạm khóa quyền đăng bán nếu vi phạm.

### 5. Giám sát Tài chính & Quỹ Ký Quỹ Sàn (Financial Ledger & System Wallet)
- Bảng điều khiển tài chính thời gian thực:
  * Tổng giá trị tiền hàng đang được khóa trong tài khoản ký quỹ trung gian (**Escrow Balance**).
  * Doanh thu thực tế đã ghi nhận của sàn (Hoa hồng thu được sau khi đơn hàng hoàn tất).
  * Tra cứu chi tiết số dư và lịch sử biến động ví của bất kỳ tài khoản nào trong hệ thống (`/api/v1/wallet/admin`).

### 6. Bàn Trực Hỗ trợ Khách hàng Realtime (Live Agent Console)
- Tiếp nhận các cuộc hội thoại cần hỗ trợ do AI Chatbot chuyển giao (Handoff) qua kênh WebSocket STOMP (`/api/v1/ws-chat`).
- Hỗ trợ trực tiếp cho Người mua và Người bán trong quá trình xử lý đơn hàng hoặc gặp khúc mắc về thanh toán VNPay.

---

## ⚙️ THIẾT LẬP MÔI TRƯỜNG & KHỞI CHẠY

### 1. Cấu hình file `.env`
Tạo file `ecommerce-admin-fe/.env` trong thư mục `ecommerce-admin-fe/`:

```env
# Địa chỉ API Backend Spring Boot
VITE_API_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080
```

### 2. Cài đặt thư viện
```bash
cd ecommerce-admin-fe
npm install
```

### 3. Khởi động môi trường phát triển (Port 3002)
```bash
npm run dev
```
Truy cập giao diện Quản trị tại: **`http://localhost:3002`**.

### 4. Đóng gói triển khai
```bash
npm run build
```

---

## 🧭 CẤU TRÚC THƯ MỤC NGUỒN

```text
ecommerce-admin-fe/
├── src/
│   ├── assets/          # Logo sàn, icon đồ họa
│   ├── components/      # Component quản trị (AdminSidebar, DisputeModal, StatCard...)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Các màn hình phân hệ quản trị:
│   │   ├── Dashboard/   # Báo cáo tổng thể doanh thu, GMV, Escrow & biểu đồ phát triển
│   │   ├── Dispute/     # Hội đồng phân xử tranh chấp hàng hoàn & ra phán quyết
│   │   ├── Seller/      # Duyệt hồ sơ Shop & thẩm tra dữ liệu sinh trắc học VNPT eKYC
│   │   ├── Commission/  # Cấu hình biểu phí hoa hồng động theo danh mục & thâm niên
│   │   ├── Escrow/      # Giám sát quỹ ký quỹ sàn & quỹ đảm bảo của các cửa hàng
│   │   ├── User/        # Quản trị danh sách người dùng, phân quyền & khóa tài khoản
│   │   └── Support/     # Tổng đài hỗ trợ trực tuyến qua WebSocket STOMP
│   ├── services/        # Gọi API quản trị Backend với Axios Mutex Interceptor
│   ├── stores/          # Zustand store cho Admin Auth
│   ├── App.jsx          # Định tuyến phân hệ quản trị
│   └── main.jsx         # Điểm khởi tạo ứng dụng React
├── vite.config.js       # Cấu hình cổng 3002
└── package.json
```
