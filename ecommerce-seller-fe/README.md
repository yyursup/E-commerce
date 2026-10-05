# CỔNG QUẢN TRỊ DÀNH CHO NGƯỜI BÁN (SELLER PORTAL)
## E-commerce Merchant Studio & Operations — Port 3001

> Ứng dụng Web dành cho các chủ cửa hàng, đại lý phân phối thiết bị công nghệ và linh kiện điện tử. Được thiết kế chuyên biệt để hỗ trợ định danh sinh trắc học bắt buộc (**VNPT eKYC**), quản lý kho hàng linh kiện, đóng gói giao vận qua **GHN**, thẩm định hàng hoàn trong **khung giờ vàng 72 giờ** và phát sóng bán hàng trực tiếp qua **LiveKit WebRTC Studio**.

---

## 💻 CÔNG NGHỆ CHỦ ĐẠO

- **Giao diện & Nền tảng:** React 19, Vite (Rolldown engine), Tailwind CSS v4
- **Quản lý Trạng thái:** Zustand 5 (Đồng bộ thông tin Shop, trạng thái eKYC và cài đặt phiên làm việc)
- **Truyền thông Mạng & Bảo mật:** Axios 1.13 tích hợp **Concurrency Mutex Interceptor**:
  * Đảm bảo không xảy ra xung đột khi làm mới Access Token.
  * Tự động dọn sạch State và chuyển hướng về màn hình đăng nhập nếu tài khoản bị khóa hoặc token hết hạn.
  * Hỗ trợ cơ chế đăng xuất an toàn ngay cả khi đang ở bước dở dang của quy trình eKYC.
- **Phát sóng Bán hàng Trực tiếp (Live Studio):** `@livekit/components-react` & `livekit-client` (Phát sóng HD, điều khiển Camera/Mic, quản lý người xem)
- **Xử lý Hình ảnh & Đa phương tiện:** `react-easy-crop` (Cắt và căn chỉnh ảnh sản phẩm đạt chuẩn trước khi đẩy lên MinIO S3)
- **Biểu mẫu & Xác thực dữ liệu:** `react-hook-form`
- **Giao tiếp Realtime:** `@stomp/stompjs` & `sockjs-client` (Nhận thông báo đơn hàng mới và chat với người mua)

---

## 🚀 CÁC QUY TRÌNH NGHIỆP VỤ CỐT LÕI

### 1. Quy trình Onboarding & Định danh Sinh trắc học Bắt buộc (VNPT eKYC)
- **Bắt buộc 100%:** Người bán không thể đăng bán sản phẩm nếu chưa vượt qua khâu kiểm định danh tính:
  1. Quét OCR mặt trước và mặt sau Căn cước công dân gắn chip.
  2. Thực hiện quét nhận diện khuôn mặt sống (Face Liveness) để phòng ngừa giả mạo hình ảnh tĩnh/Deepfake.
  3. So khớp độ tương đồng khuôn mặt với ảnh trên CCCD.
- **Xử lý các tình huống gián đoạn mạng:** Nếu gặp sự cố mạng hoặc tắt trình duyệt giữa chừng, hệ thống lưu vết session an toàn, cho phép người dùng đăng xuất hoặc tiếp tục bước đang dở mà không bị kẹt màn hình hay mất dữ liệu.

### 2. Quản lý Danh mục Thiết bị & Linh kiện Công nghệ
- Thiết lập thông số kỹ thuật chi tiết theo danh mục: Bộ vi xử lý (CPU), Bộ nhớ (RAM), Ổ cứng (SSD), Card màn hình (GPU), Tình trạng máy (Mới 100%, 99% Like New, hoặc AS-IS).
- Hỗ trợ tải lên nhiều hình ảnh sắc nét lưu trữ trực tiếp trên hệ thống phân tán MinIO S3.
- Cơ chế quản lý tồn kho chặt chẽ, đồng bộ theo thời gian thực với khóa bi quan (Pessimistic Locking) từ Backend.

### 3. Xử lý Đơn hàng & Giao vận Tự động qua GHN
- Nhận thông báo tức thì khi khách đặt hàng thành công.
- Xác nhận đơn, đóng gói và tạo lệnh vận chuyển trực tiếp sang hệ thống **Giao Hàng Nhanh (GHN)** chỉ với một cú nhấp chuột.
- In phiếu gửi hàng có mã vạch vận đơn GHN tiêu chuẩn.
- Theo dõi vị trí và trạng thái di chuyển của kiện hàng theo thời gian thực.

### 4. Quy trình Thẩm định Hàng Hoàn 72 Giờ & Khiếu nại (Return & Dispute)
- **Đặc thù đồ công nghệ:** Nguy cơ bị tráo tráo linh kiện (RAM zin thành RAM hỏng, pin chai, tráo màn hình) khi nhận hàng hoàn.
- **Đếm ngược 72 giờ:** Ngay khi bưu tá GHN giao kiện hàng hoàn về địa chỉ Shop (`DELIVERED_TO_SELLER`), đồng hồ đếm ngược 72h kích hoạt:
  * **Trường hợp A — Hàng còn nguyên vẹn:** Người bán bấm nút **"Xác nhận đã nhận & Hoàn tiền"** $\rightarrow$ Hệ thống hoàn tiền cho người mua, kết thúc phiên đổi trả.
  * **Trường hợp B — Phát hiện gian lận/hư hại:** Người bán bấm nút **"Khiếu nại bồi hoàn (Dispute)"**, cung cấp video quay lúc khui hộp và hình ảnh linh kiện bị tổn hại. Hồ sơ lập tức được chuyển sang Cổng Quản trị sàn (Admin Portal) để mở phiên trọng tài phân xử.
  * **Cơ chế tự động:** Nếu quá 72 giờ mà người bán không thực hiện bất kỳ hành động nào, Cron Job của sàn sẽ tự động hoàn tiền cho người mua để đảm bảo quyền lợi khách hàng.

### 5. Quản trị Tài chính & Quỹ Ký Quỹ Cửa Hàng (Shop Escrow Fund)
- Tra cứu dòng tiền đang được giữ tại tài khoản Ký quỹ Escrow và dòng tiền đã được giải phóng về Ví khả dụng.
- Quản lý mức ký quỹ cố định đảm bảo trách nhiệm bảo hành theo cấp bậc thâm niên (Seniority Tier).
- Thực hiện lệnh rút tiền từ Ví sàn về tài khoản ngân hàng liên kết.

### 6. Phòng Thu Trực Tiếp Đồ Công Nghệ (LiveKit Live Studio)
- Dành cho chủ Shop mở phiên bán hàng trực tiếp trên sóng.
- Tính năng ghim sản phẩm (Pin Product): Đưa thiết bị đang trên tay lên màn hình của tất cả người xem kèm giá khuyến mãi độc quyền trong phiên live.

---

## ⚙️ THIẾT LẬP MÔI TRƯỜNG & KHỞI CHẠY

### 1. Cấu hình file `.env`
Tạo file `ecommerce-seller-fe/.env` trong thư mục `ecommerce-seller-fe/`:

```env
# Địa chỉ API Backend Spring Boot
VITE_API_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080

# Địa chỉ WebRTC LiveKit Server
VITE_LIVEKIT_WS_URL=ws://localhost:7880
```

### 2. Cài đặt thư viện
```bash
cd ecommerce-seller-fe
npm install
```

### 3. Khởi động môi trường phát triển (Port 3001)
```bash
npm run dev
```
Truy cập giao diện tại: **`http://localhost:3001`**.

### 4. Đóng gói triển khai
```bash
npm run build
```

---

## 🧭 CẤU TRÚC THƯ MỤC NGUỒN

```text
ecommerce-seller-fe/
├── src/
│   ├── assets/          # Logo, icon, hình ảnh đồ họa
│   ├── components/      # Component giao diện (Sidebar, Topbar, ReturnTimer, CropModal...)
│   ├── contexts/        # Contexts chia sẻ trạng thái
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Các màn hình nghiệp vụ chính:
│   │   ├── Dashboard/   # Bảng điều khiển doanh thu & đơn hàng cần xử lý
│   │   ├── Product/     # Đăng bán thiết bị, danh sách sản phẩm & kho hàng
│   │   ├── Order/       # Quản lý đơn hàng, xuất mã GHN & in hóa đơn
│   │   ├── Return/      # Quản lý hàng hoàn & Thẩm định linh kiện trong 72h
│   │   ├── Live/        # Studio phát sóng trực tiếp LiveKit WebRTC
│   │   ├── Kyc/         # Màn hình định danh CCCD và quét khuôn mặt sống
│   │   └── Finance/     # Ví doanh thu, quỹ ký quỹ & lịch sử quyết toán
│   ├── services/        # Gọi API Backend với cơ chế Mutex Axios Interceptor
│   ├── stores/          # Zustand store cho Shop & Auth
│   ├── App.jsx          # Định tuyến các trang chức năng
│   └── main.jsx         # Điểm khởi tạo ứng dụng
├── vite.config.js       # Thiết lập cổng 3001
└── package.json
```
