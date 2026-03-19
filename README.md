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

Mặc định backend chạy ở:

- **API**: `http://localhost:8080`
- **WebSocket endpoint** (SockJS): `/api/v1/ws-chat`

## Chạy frontend (Vite)

```bash
cd ecommerce-fe
npm install
npm run dev
```

Mặc định Vite thường chạy ở `http://localhost:5173`.

## Một vài endpoint/thành phần chính (tham khảo)

- **Auth**: `/api/v1/auth/*`
- **Chatbot API**: `/api/v1/chat/*`
- **Live chat WS**: `/api/v1/ws-chat`
- **Products**: `/api/v1/product/*`
- **Cart**: `/api/v1/cart/*`
- **Orders / Payment**: `/api/v1/order/*`, `/api/v1/payment/*`

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

