# Document Management API — Module 4 DevOps Assignment

Dự án Hệ thống Backend Quản lý Tài liệu (**NestJS + Prisma + PostgreSQL + Redis + MinIO**) được xây dựng chuẩn Production cho môn **Module 4 — DevOps**. 
Được thiết kế để thực hành phân chia công việc nhóm 2 người, quản lý file ownership, luồng Git Branch / Pull Request (PR), xử lý Merge Conflict thực tế và đóng gói Docker 1-click execution.

---

## 👥 PHÂN CÔNG VAI TRÒ & PHÂN QUYỀN SỞ HỮU FILE (FILE OWNERSHIP)

### 🚨 QUY TẮC VÀNG LÀM VIỆC NHÓM
1. **Một người sở hữu tuyệt đối mỗi file**: Người kia **KHÔNG** được tự ý chỉnh sửa file thuộc sở hữu của người còn lại.
2. **File chung duy nhất (`src/app.module.ts`)**: Nơi tạo ra **Merge Conflict cố ý** khi làm PR. Mỗi người chỉ được thêm import module của mình vào đúng phần được giao.
3. **Prisma Schema (`prisma/schema.prisma`)**: Do **Người A** viết sẵn toàn bộ 2 model `User` và `Document` ở phase Base. Người B không tự sửa.
4. **Thứ tự bất biến**: Base (mốc `M1`) phải xuất hiện trên `main` TRƯỚC, sau đó mới checkout các nhánh `feature/*`.

---

### 📋 BẢNG PHÂN QUYỀN CỤ THỂ

| File / Thư mục | Người A | Người B | Ghi chú |
| :--- | :---: | :---: | :--- |
| `package.json`, `nest-cli.json`, `tsconfig*.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`, `README.md` | **✓** | **✗** | **A** khởi tạo & quản lý ở Base |
| `src/main.ts` (Swagger UI + `/api-docs-json` + script export) | **✓** | **✗** | **A** sở hữu cấu hình Swagger |
| `src/app.controller.ts` / `service.ts` / `spec.ts` | **✓** | **✗** | Standard NestJS Core |
| `prisma/schema.prisma` (+ migrations) | **✓** | **▲báo-A** | **A** viết sẵn model `User` & `Document` |
| `src/prisma/*` | **✓** | **✗** | Database Client Module |
| `src/cache/*` (Redis) | **✓** | **▲dùng-không-sửa** | **B** chỉ GỌI service cache, không sửa code |
| `src/auth/api-key.guard.ts` | **✓** | **✗** | API Key Guard Module |
| `src/health/*` | **✓** | **✗** | Health Check Endpoint |
| `test/app.e2e-spec.ts`, `test/jest-e2e.json` | **✓** | **✗** | E2E Framework Base |
| `src/users/**` + `test/users.e2e-spec.ts` | **✓** | **✗ (Review)** | **A** phát triển, **B** review |
| `src/documents/**` | **✗ (Review)** | **✓** | **B** phát triển, **A** review |
| `src/storage/**` (MinIO Client) | **✗** | **✓** | **B** sở hữu toàn bộ luồng lưu trữ file |
| `test/documents.e2e-spec.ts` | **✗** | **✓** | **B** phát triển E2E test cho Document |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | **▲tạo-ở-base** | **✓** | **A** tạo mẫu ở base, **B** nâng cấp & sở hữu từ Phase B |
| `src/app.module.ts` | **▲ Khối Users** | **▲ Khối Documents** | **FILE CHUNG DUY NHẤT** → Tạo Conflict khi Merge PR #2 |

---

## 🛠️ TECH STACK

- **Core**: NestJS 10 (TypeScript), Prisma ORM
- **Database**: PostgreSQL (Lưu trữ `User` và `Document` metadata)
- **Caching**: Redis (Cache danh sách tài liệu theo `userId`)
- **Object Storage**: MinIO / S3 API Compatible (Lưu trữ file upload thực tế)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger UI (`/api-docs`), Raw JSON (`/api-docs-json`), Exporter script (`npm run swagger:export`)

---

## 🌿 GIT WORKFLOW & QUY TRÌNH MERGE PR

```
main (Base M1)
 ├── feature/user      → (Người A làm -> PR #1 -> Người B Review & Merge)
 └── feature/document  → (Người B làm -> PR #2 -> Conflict app.module.ts -> Người A Review & Resolve & Merge)
```

1. **Phase 0 (Base - Mốc M1)**: **Người A** hoàn thành cấu hình nền tảng, Swagger, Prisma schema trên `main` -> Push `main`.
2. **Phase 1 (Features)**:
   - **Người A**: Checkout `feature/user` từ `main` (M1) -> Làm User API + E2E test -> Push & Mở **PR #1**.
   - **Người B**: Checkout `feature/document` từ `main` (M1) -> Làm Document API + Storage + Docker -> Push & Mở **PR #2**.
3. **Phase 2 (Review & Merge)**:
   - **PR #1 (`feature/user`)**: **Người B** review code, chạy test -> Approve & Merge vào `main`.
   - **PR #2 (`feature/document`)**: Sau khi PR #1 vào `main`, PR #2 bị **Conflict tại `app.module.ts`**.
   - **Người A** tiến hành Review PR #2 -> Giải quyết Conflict (giữ CẢ `UsersModule` và `DocumentsModule`) -> Merge vào `main`.

---

## 🚀 HƯỚNG DẪN CHẠY HỆ THỐNG

### 1. Chạy 1-Click với Docker Compose (Recomended)

```bash
# Sau khi clone repo sạch
cp .env.example .env

# Khởi động toàn bộ stack (API + Postgres + Redis + MinIO)
docker compose up -d --build
```

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Swagger JSON Specification**: `http://localhost:3000/api-docs-json`
- **PostgreSQL**: `localhost:5433`
- **Redis**: `localhost:6379`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `minioadmin`)

### 2. Xuất File Swagger spec cho Postman

```bash
npm run swagger:export
```
-> File `swagger.json` sẽ tự động được ghi tại thư mục gốc dự án.

---

## 🧪 CHẠY UNIT TEST & E2E TEST

```bash
# Chạy Unit Tests
npm run test

# Chạy E2E Tests (Yêu cầu Postgres & Redis đang chạy)
npm run test:e2e
```

---

## 📋 ENDPOINTS SPECIFICATION

*Tất cả các endpoint cần bảo mật đều chấp nhận Header `x-api-key: change-me-local-dev-key` (hoặc giá trị trong `.env`).*

| Method | Endpoint | Description | Auth (API Key) | Owner |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/health` | Healthcheck hệ thống | ✗ | Người A |
| `GET` | `/api-docs-json` | Trả về raw OpenAPI spec | ✗ | Người A |
| `GET` | `/users` | Lấy danh sách Users | ✓ | Người A |
| `POST` | `/users` | Tạo mới User | ✓ | Người A |
| `POST` | `/documents/upload` | Upload tài liệu (Multipart) | ✓ | Người B |
| `GET` | `/documents?userId=...` | Danh sách tài liệu của User (Redis Cache) | ✓ | Người B |
| `GET` | `/documents/:id` | Chi tiết tài liệu | ✓ | Người B |
| `GET` | `/documents/:id/download` | Stream tải file từ MinIO | ✓ | Người B |
| `DELETE` | `/documents/:id` | Xóa tài liệu (MinIO + DB + Evict Cache) | ✓ | Người B |

---

## 🎬 KỊCH BẢN DEMO BÁO CÁO (TRƯỚC HỘI ĐỒNG)

1. **Kiểm tra Git Tree**:
   ```bash
   git log --graph --oneline --all
   ```
   *Minh chứng luồng nánh: Base -> Merge PR #1 -> Resolve Conflict & Merge PR #2.*
2. **Khởi chạy 1-Click**:
   ```bash
   docker compose up -d --build
   ```
3. **Mở Swagger UI**: Kiểm tra giao diện tại `http://localhost:3000/api-docs`.
4. **Import Swagger vào Postman**: Xuất file `npm run swagger:export` -> Import `swagger.json` vào Postman.
5. **Chạy Kịch bản Data**:
   - `POST /users`: Tạo 2 Users.
   - `POST /documents/upload`: Mỗi user upload 1 file đính kèm.
   - `GET /documents?userId=X`: Lần 1 đọc DB, Lần 2 đọc từ **Redis Cache (Cache Hit)**.
   - `GET /documents/:id/download`: Tải file trực tiếp.