# E-commerce Marketplace (Fullstack)

Dự án gồm:

- **Backend**: `ecommerce/` (Spring Boot, Java 21, PostgreSQL, JWT, MinIO, WebSocket live chat/chatbot)
- **Frontend**: `ecommerce-fe/` (React + Vite + Tailwind)

## Cấu trúc thư mục

- `ecommerce/`: API server + websocket + tích hợp (MinIO, Mail, GHN, VNPAY, VNPT eKYC, Ollama-embedding optional)
- `ecommerce-fe/`: UI web (mặc định gọi API `http://localhost:8080`)

## Yêu cầu môi trường

- **Java**: 21
- **Maven**: dùng `./mvnw` (Windows: `mvnw.cmd`)
- **Node.js**: khuyến nghị Node 18+ (hoặc mới hơn)
- **Docker Desktop** (khuyến nghị): để chạy PostgreSQL/MinIO/Ollama bằng Compose

## Biến môi trường / cấu hình

Backend đọc cấu hình từ biến môi trường trong `ecommerce/src/main/resources/application.properties` (qua `${...}`).

### File `.env` cho backend (khuyến nghị)

Tạo file: `ecommerce/.env` (file này đã được ignore trong `ecommerce/.gitignore`).

Các biến thường cần (tối thiểu để chạy local):

- **PostgreSQL**
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_PORT` (default `5432`)
- **MinIO**
  - `MINIO_ROOT_USER`
  - `MINIO_ROOT_PASSWORD`
  - `MINIO_API_PORT` (default `9000`)
  - `MINIO_CONSOLE_PORT` (default `9001`)
  - `MINIO_BUCKET_NAME`
- **JWT**
  - `JWT_SECRET`
  - `JWT_EXPIRATION`
  - `JWT_REFRESH_EXPIRATION`

Các biến **tích hợp** (có thể để trống nếu bạn chưa dùng tính năng tương ứng, nhưng một số flow có thể sẽ lỗi nếu gọi vào):

- **Mail**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- **GHN**: `GHN_URL`, `GHN_TOKEN`, `GHN_SHOP_ID`
- **VNPAY**: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`
- **VNPT eKYC**: `VNPT_EKYC_BASE_URL`, `VNPT_EKYC_ACCESS_TOKEN`, `VNPT_EKYC_TOKEN_ID`, `VNPT_EKYC_TOKEN_KEY`
- **Ollama (optional)**: `OLLAMA_PORT` (default `11434`)

### `.env` cho Docker Compose

`ecommerce/docker-compose.yml` dùng cú pháp `${VAR}` nên Docker Compose sẽ đọc biến từ file `.env` **cùng thư mục** với `docker-compose.yml` (tức là `ecommerce/.env`).

Bạn có thể tạo `ecommerce/.env` theo dạng template (đừng để trống các biến bắt buộc):

```env
# PostgreSQL
POSTGRES_DB=<CHANGE_ME>
POSTGRES_USER=<CHANGE_ME>
POSTGRES_PASSWORD=<CHANGE_ME>
POSTGRES_PORT=5432

# MinIO
MINIO_ROOT_USER=<CHANGE_ME>
MINIO_ROOT_PASSWORD=<CHANGE_ME>
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_BUCKET_NAME=ecommerce

# JWT (backend cần để login/auth)
JWT_SECRET=<CHANGE_ME>
JWT_EXPIRATION=<CHANGE_ME>
JWT_REFRESH_EXPIRATION=<CHANGE_ME>

# Các biến khác (MAIL/GHN/VNPAY/VNPT...) chỉ cần khi bạn gọi các tính năng tương ứng
```

### Biến môi trường cho frontend

Frontend dùng:

- `VITE_API_URL` (mặc định fallback: `http://localhost:8080`)
- (một số chỗ khác dùng) `VITE_API_BASE_URL` (mặc định fallback: `http://localhost:8080`)

Bạn có thể tạo `ecommerce-fe/.env` ví dụ:

```env
VITE_API_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080
```

## Chạy nhanh bằng Docker Compose (khuyến nghị)

Chạy các service phụ trợ (Postgres + MinIO + Ollama):

```bash
cd ecommerce
docker compose up -d
```

Sau khi lên xong, bạn có:

- **PostgreSQL**: `localhost:${POSTGRES_PORT}`
- **MinIO API**: `http://localhost:${MINIO_API_PORT}` (default `9000`)
- **MinIO Console**: `http://localhost:${MINIO_CONSOLE_PORT}` (default `9001`)
- **Ollama** (optional): `http://localhost:${OLLAMA_PORT:-11434}`

Gợi ý kiểm tra/pull model embedding cho Ollama (Windows PowerShell):

```powershell
cd ecommerce
.\scripts\ollama-check.ps1
```

## Chạy backend (Spring Boot)

```bash
cd ecommerce
./mvnw spring-boot:run
```

Trên Windows PowerShell, dùng:

```powershell
cd ecommerce
.\mvnw.cmd spring-boot:run
```

Mặc định backend chạy ở:

- **API**: `http://localhost:8080`
- **WebSocket endpoint** (SockJS): `/api/v1/ws-chat`

### Tài khoản demo (được seed tự động khi DB mới)

Backend có `DataInitializer` nên khi chạy lần đầu (hoặc DB chưa có dữ liệu), hệ thống sẽ tự tạo sẵn:

- `admin` / `admin123@` (role `ADMIN`)
- `seller1`..`seller5` / `seller123@` (role `BUSINESS`)
- `customer1`..`customer5` / `customer123@` (role `CUSTOMER`)

Nếu bạn đã chạy backend trước đó và DB đã có dữ liệu, seed có thể bị bỏ qua để tránh trùng dữ liệu.

## Build/Test (tối thiểu)

### Backend

Build (tạo jar):

```bash
cd ecommerce
./mvnw package
```

Test:

```bash
cd ecommerce
./mvnw test
```

Trên Windows, thay `./mvnw` bằng `.\mvnw.cmd`.

## Chạy frontend (Vite)

```bash
cd ecommerce-fe
npm install
npm run dev
```

Mặc định Vite thường chạy ở `http://localhost:5173`.

## Chức năng chính

### 1) Authentication & Accounts (Auth)
- `POST /api/v1/auth/register` (đăng ký tài khoản)
- `POST /api/v1/auth/verify` (xác minh tài khoản, theo flow backend)
- `POST /api/v1/auth/login` (đăng nhập, trả JWT trong response)
- `GET /api/v1/auth/users` (ADMIN: xem danh sách user)

### 2) Profile & Address
- `PUT /api/v1/user/profile` (cập nhật profile)
- `GET /api/v1/address` (lấy danh sách địa chỉ của mình)
- `POST /api/v1/address` (tạo địa chỉ)
- `PUT /api/v1/address/{addressId}` (cập nhật địa chỉ)
- `DELETE /api/v1/address/{addressId}` (xóa địa chỉ)
- `PATCH /api/v1/address/{addressId}/default` (đặt địa chỉ mặc định)

### 3) Product marketplace (Public + Similar)
- `GET /api/v1/product` (danh sách sản phẩm, có thể query theo điều kiện/pagination)
- `GET /api/v1/product/{productId}` (chi tiết sản phẩm; backend ghi nhận lịch sử để recommendation)
- `GET /api/v1/product/{productId}/similar` (gợi ý “sản phẩm tương tự” theo embedding)

### 4) Seller product management
- `POST /api/v1/seller` (seller tạo sản phẩm)
- `GET /api/v1/seller/{productId}` (lấy sản phẩm theo id)
- `GET /api/v1/seller/by-shop` (lấy sản phẩm theo shop của seller, có thể filter `status`)
- `PUT /api/v1/seller/{productId}` (cập nhật sản phẩm)
- `DELETE /api/v1/seller/{productId}` (xóa sản phẩm)

### 5) Product images (MinIO-backed)
- `POST /api/v1/product/image/upload` (upload 1 ảnh)
- `POST /api/v1/product/image/upload-multiple` (upload nhiều ảnh)
- `DELETE /api/v1/product/image?imageUrl=...` (xóa ảnh theo URL)

### 6) Cart & Checkout
- `GET /api/v1/cart` (lấy giỏ hàng của mình)
- `POST /api/v1/cart/items` (add item vào cart)
- `POST /api/v1/cart/items/{cartItemId}/plus` (tăng qty)
- `POST /api/v1/cart/items/{cartItemId}/minus` (giảm qty)
- `DELETE /api/v1/cart/items/{cartItemId}` (xóa item)

- `POST /api/v1/checkout/quote` (tính quote dựa trên cart/giỏ và shop)
- `GET /api/v1/checkout/confirm?shopId=...` (xác nhận checkout theo shop)

### 7) Orders (Create/Update + Query)
- `POST /api/v1/order` (tạo order từ cart theo shop)
- `PATCH /api/v1/order/{orderId}/status?status=...` (cập nhật trạng thái order)
- `PATCH /api/v1/order/{orderId}/received` (người mua xác nhận đã nhận)
- `POST /api/v1/order/{orderId}/ghn/retry` (retry tạo lệnh GHN)
- `PUT /api/v1/order/{orderId}/ghn/code?ghnOrderCode=...` (set GHN order code thủ công)

- `GET /api/v1/order/me?status=...` (liệt kê order của mình)
- `GET /api/v1/order/{orderId}/me` (chi tiết order của mình)
- `GET /api/v1/order/shops?status=...` (liệt kê order theo shop)
- `GET /api/v1/order/shops/orders/{orderId}` (chi tiết order theo shop)
- `GET /api/v1/order/shop-ranking` (ADMIN: bảng xếp hạng shop)
- `GET /api/v1/order/{orderId}` (ADMIN: get order theo id)
- `GET /api/v1/order` (ADMIN: list orders, có filter status)

### 8) Payment (VNPay + Escrow)
- VNPay: `POST /api/v1/payment/orders/{orderId}/vnpay` (trả `paymentUrl`), `GET /api/v1/payment/vnpay/return` (callback)
- Escrow (ADMIN): `GET /api/v1/escrow` (list theo status, pageable), `POST /api/v1/escrow/orders/{orderId}/release` (release escrow)

### 9) Shipping (GHN)
- `GET /api/v1/shipping/provinces` (lấy danh sách tỉnh)
- `GET /api/v1/shipping/districts?provinceId=...` (lấy quận/huyện)
- `GET /api/v1/shipping/wards?districtId=...` (lấy phường/xã)
- `POST /api/v1/shipping/fee` (tính phí giao hàng)
- `POST /api/v1/webhooks/ghn` (GHN webhook cập nhật trạng thái đơn, luôn trả HTTP 200)

### 10) Wallet
- `GET /api/v1/wallet/me` (lấy ví của mình)
- `GET /api/v1/wallet/admin?userName=...` (ADMIN: xem ví theo username)

### 11) Review & Seller reply
- Reviews: `GET /api/v1/review/products/{productId}/reviews`
- Reviews: `POST /api/v1/review/products/{productId}/reviews`
- Reviews: `PUT /api/v1/review/reviews/{reviewId}`
- Reviews: `DELETE /api/v1/review/reviews/{reviewId}`
- Reviews: `GET /api/v1/review/reviews/me?productId=...&subOrderId=...`
- Reviews: `GET /api/v1/review/products/{productId}/reviews/stats`
- Seller reply (SELLER/ADMIN, role check): `POST /api/v1/reply/reviews/reply`
- Seller reply (SELLER/ADMIN, role check): `PUT /api/v1/reply/reviews/update`

### 12) Seller registration request (Seller onboarding)
- `POST /api/v1/request/regis-seller` (user gửi yêu cầu đăng ký seller)
- `PUT /api/v1/request/approve` (ADMIN duyệt, params: `requestId`, `response`)
- `PUT /api/v1/request/reject` (ADMIN từ chối, params: `requestId`, `response`)
- `GET /api/v1/request` (user xem requests của mình)
- `GET /api/v1/request/admin?status=...` (ADMIN xem tất cả, filter status)
- `GET /api/v1/request/{id}` (xem chi tiết một request)

### 13) KYC (VNPT eKYC)
- `POST /api/v1/kyc/sessions:start` (tạo session KYC)
- `POST /api/v1/kyc/session/{id}/upload` (upload tài liệu + đính kèm vào VNPT)
- `POST /api/v1/kyc/session/{id}/attach` (attach theo `fileHash`)
- `POST /api/v1/kyc/sessions/{sessionId}/classify?fileHash=...` (classify tài liệu)
- `POST /api/v1/kyc/sessions/{sessionId}/ocr/front` (OCR mặt trước)
- `POST /api/v1/kyc/sessions/{sessionId}/ocr/back` (OCR mặt sau)
- `POST /api/v1/kyc/sessions/{sessionId}/ocr/liveness` (liveness)
- `POST /api/v1/kyc/sessions/{sessionId}/compare` (so khớp dữ liệu)
- `GET /api/v1/kyc/sessions/{sessionId}` (lấy trạng thái session)
- `POST /api/v1/kyc/sessions/{sessionId}/fullFlow-upload` (upload + chạy flow đầy đủ)

### 14) Chatbot & Live chat
- Chatbot HTTP: `GET /api/v1/chat/init` (init), `POST /api/v1/chat/interact` (tương tác; body có thể chứa `action` hoặc `text`)
- Live chat realtime (STOMP/SockJS): WS endpoint `/api/v1/ws-chat`, user gửi tới `@MessageMapping("/chat")`, admin reply qua `@MessageMapping("/chat/reply")` và broadcast theo `sessionId`

### 15) Recommendations
- `GET /api/v1/recommendations?limit=...` (recommend theo session/user; frontend gửi credentials để có session)

### 16) Platform & Commission (ADMIN)
- Platform setting: `GET /api/v1/platform` (lấy `commissionRate`), `PATCH /api/v1/platform` (cập nhật commission rate)
- Commission: `GET /api/v1/commissions/overview`
- Commission: `GET /api/v1/commissions/by-month`
- Commission: `GET /api/v1/commissions/by-category`
- Commission: `GET /api/v1/commissions/top-sellers?limit=...`
- Commission: `GET /api/v1/commissions` (filter theo query params trong `CommissionFilterRequest`)
- Commission: `POST /api/v1/commissions/orders/{orderId}` (tạo commission theo order)
- Commission: `GET /api/v1/commissions/orders/{orderId}` (chi tiết commission theo order)

### 17) File upload/serve (MinIO)
- `POST /files/upload?folder=general` (upload file ảnh; backend giới hạn size theo `spring.servlet.multipart.*`, đang là 25MB)
- `GET /files/view/{fileName}` (view ảnh)
- `GET /files/download/{fileName}` (download file)

## Flows End-to-End (gộp nhiều chức năng)

### Flow 1: Mua hàng từ A-Z (Customer)
1. Đăng nhập: `POST /api/v1/auth/login`
2. (Tuỳ chọn) Quản lý địa chỉ: `GET/POST/PUT/DELETE/PATCH /api/v1/address`
3. Đặt địa chỉ mặc định: `PATCH /api/v1/address/{addressId}/default`
4. Thêm sản phẩm vào cart: `POST /api/v1/cart/items`
5. (Tuỳ chọn) Điều chỉnh qty / xóa item: `POST /api/v1/cart/items/{cartItemId}/plus|minus` hoặc `DELETE /api/v1/cart/items/{cartItemId}`
6. Tính quote checkout: `POST /api/v1/checkout/quote`
7. Confirm theo shop: `GET /api/v1/checkout/confirm?shopId=...`
8. Tạo order: `POST /api/v1/order`
9. (Nếu dùng VNPay) Tạo payment link: `POST /api/v1/payment/orders/{orderId}/vnpay`
10. (Nếu dùng VNPay) Callback: `GET /api/v1/payment/vnpay/return`
11. (Nếu cần) Retry/tự set GHN code: `POST /api/v1/order/{orderId}/ghn/retry` hoặc `PUT /api/v1/order/{orderId}/ghn/code?ghnOrderCode=...`
12. GHN webhook cập nhật trạng thái: `POST /api/v1/webhooks/ghn`
13. Xác nhận đã nhận hàng: `PATCH /api/v1/order/{orderId}/received`
14. Xem history & để lại review: `GET /api/v1/order/me` và `POST /api/v1/review/products/{productId}/reviews`

### Flow 2: KYC VNPT eKYC rồi mới Onboarding người bán (Customer -> Seller)
1. Đăng nhập: `POST /api/v1/auth/login`
2. Tạo session KYC: `POST /api/v1/kyc/sessions:start`
3. Upload tài liệu: `POST /api/v1/kyc/session/{id}/upload`
4. Attach theo `fileHash`: `POST /api/v1/kyc/session/{id}/attach`
5. Classify: `POST /api/v1/kyc/sessions/{sessionId}/classify?fileHash=...`
6. OCR mặt trước: `POST /api/v1/kyc/sessions/{sessionId}/ocr/front`
7. OCR mặt sau: `POST /api/v1/kyc/sessions/{sessionId}/ocr/back`
8. Liveness: `POST /api/v1/kyc/sessions/{sessionId}/ocr/liveness`
9. Compare: `POST /api/v1/kyc/sessions/{sessionId}/compare`
10. Lấy trạng thái session: `GET /api/v1/kyc/sessions/{sessionId}`
11. (Tuỳ chọn) Full flow upload: `POST /api/v1/kyc/sessions/{sessionId}/fullFlow-upload`
12. Gửi yêu cầu đăng ký seller: `POST /api/v1/request/regis-seller`
13. Admin duyệt / từ chối: `PUT /api/v1/request/approve` hoặc `PUT /api/v1/request/reject`
14. Sau khi được duyệt: Seller tạo sản phẩm: `POST /api/v1/seller`
15. Seller cập nhật / xóa sản phẩm: `PUT /api/v1/seller/{productId}` hoặc `DELETE /api/v1/seller/{productId}`
16. Seller upload ảnh sản phẩm (MinIO-backed): `POST /api/v1/product/image/upload` hoặc `POST /api/v1/product/image/upload-multiple`

### Flow 4: Chatbot -> Live chat (Realtime)
1. Khởi tạo chatbot widget: `GET /api/v1/chat/init`
2. Tương tác chatbot HTTP: `POST /api/v1/chat/interact`
3. (Nếu handoff) kết nối WS endpoint: `/api/v1/ws-chat`
4. User gửi message tới `@MessageMapping("/chat")`
5. Admin trả lời qua `@MessageMapping("/chat/reply")` và broadcast theo `sessionId`

## Lưu ý về Git (rất quan trọng)

- **Không commit**: file `.env`, thư mục build/artifact như `target/` (backend) và `node_modules/` (frontend).
- Nếu bạn lỡ thấy `ecommerce/target/**` xuất hiện trong `git status`, hãy xoá khỏi index rồi commit lại (nếu trước đó đã add):

```bash
git rm -r --cached ecommerce/target
git rm -r --cached ecommerce-fe/node_modules
```

## Troubleshooting

- **Frontend gọi nhầm API**: đặt `VITE_API_URL`/`VITE_API_BASE_URL` trỏ đúng backend (mặc định là `http://localhost:8080`).
- **WebSocket bị chặn CORS**: backend whitelist ở `app.websocket.allowed-origins` trong `application.properties`.
- **MinIO không có bucket**: Compose có service `minio-init` để tạo bucket và set public download.
- **Lần chạy đầu lâu / thấy log seed dữ liệu**: do backend tự tạo data demo (products/shops/orders/chatbot nodes...) nên có thể mất vài chục giây tùy máy.

