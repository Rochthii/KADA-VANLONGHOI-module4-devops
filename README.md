# Document Management API — Module 4 DevOps Assignment

Hệ thống Backend Quản lý Tài liệu (NestJS, Prisma, PostgreSQL, Redis, MinIO) được xây dựng theo chuẩn kĩ thuật sản xuất phục vụ môn học Module 4 — DevOps. 
Dự án được thiết kế nhằm thực hành quy trình phân chia công việc trong nhóm 2 thành viên, quản lý quyền sở hữu file (File Ownership), triển khai quy trình Git Branch / Pull Request (PR), xử lý Merge Conflict thực tế và đóng gói triển khai tự động qua Docker Compose.

---

## Thành viên thực hiện

- **Người A**: Chăm Rốch Thi
- **Người B**: Nguyễn Tiến Thành

---

## Phân công vai trò & Quyền sở hữu file (File Ownership)

### Nguyên tắc phối hợp
1. **Sở hữu file độc lập**: Mỗi file thuộc quyền sở hữu duy nhất của 1 thành viên. Thành viên còn lại không tự ý chỉnh sửa file của người kia trừ khi được đồng ý.
2. **Quản lý file cấu hình chung (`src/app.module.ts`)**: Đây là file duy nhất hai thành viên cùng khai báo để thực hành tạo và giải quyết Merge Conflict trong quá trình mở Pull Request.
3. **Quản lý Prisma Schema (`prisma/schema.prisma`)**: Người A (Chăm Rốch Thi) định nghĩa sẵn toàn bộ cơ sở dữ liệu (`User` và `Document`) ở giai đoạn Base. Người B không can thiệp trực tiếp vào file schema.
4. **Thứ tự triển khai**: Nhánh nền tảng (`main`) phải được đẩy lên trước khi hai thành viên phân tách nhánh tính năng.

---

### Bảng phân quyền file

| File / Thư mục | Chăm Rốch Thi (Người A) | Nguyễn Tiến Thành (Người B) | Ghi chú |
| :--- | :---: | :---: | :--- |
| `package.json`, `nest-cli.json`, `tsconfig*.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`, `README.md` | ✓ | ✗ | Người A khởi tạo & quản lý cấu hình chung |
| `src/main.ts` (Swagger UI, `/api-docs-json`, script export) | ✓ | ✗ | Người A cấu hình Swagger OpenAPI |
| `src/app.controller.ts` / `service.ts` / `spec.ts` | ✓ | ✗ | NestJS Core Controller |
| `prisma/schema.prisma` (+ migrations) | ✓ | ▲ báo Người A | Định nghĩa sẵn model User & Document |
| `src/prisma/*` | ✓ | ✗ | Prisma Client Service Module |
| `src/cache/*` (Redis) | ✓ | ▲ gọi service | Người B gọi service cache, không sửa nguồn |
| `src/auth/api-key.guard.ts` | ✓ | ✗ | Module xác thực API Key |
| `src/health/*` | ✓ | ✗ | Endpoint kiểm tra sức khỏe ứng dụng |
| `test/app.e2e-spec.ts`, `test/jest-e2e.json` | ✓ | ✗ | Cấu hình End-to-End Test base |
| `src/users/**` + `test/users.e2e-spec.ts` | ✓ | ✗ (Review) | Người A phát triển, Người B review |
| `src/documents/**` | ✗ (Review) | ✓ | Người B phát triển, Người A review |
| `src/storage/**` (MinIO Client) | ✗ | ✓ | Người B quản lý lưu trữ tệp tin |
| `test/documents.e2e-spec.ts` | ✗ | ✓ | Người B phát triển E2E test cho Documents |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | ▲ tạo mẫu ở Base | ✓ | Người A tạo bản mẫu, Người B hoàn thiện |
| `src/app.module.ts` | ▲ Khối UsersModule | ▲ Khối DocumentsModule | File chung duy nhất tạo Merge Conflict |

---

## Kiến trúc công nghệ

- **Framework**: NestJS 10 (TypeScript), Prisma ORM
- **Database**: PostgreSQL (Lưu trữ dữ liệu người dùng và tài liệu)
- **Caching**: Redis (Bộ nhớ tạm lưu danh sách tài liệu theo người dùng)
- **Object Storage**: MinIO / S3 Compatible API (Lưu trữ tệp tin)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger UI (`/api-docs`), Raw JSON Spec (`/api-docs-json`), Export Script (`npm run swagger:export`)

---

## Quy trình Git & Pull Request

```
main (Base M1)
 ├── feature/user      → (Chăm Rốch Thi phát triển -> PR #1 -> Nguyễn Tiến Thành Review & Merge)
 └── feature/document  → (Nguyễn Tiến Thành phát triển -> PR #2 -> Conflict app.module.ts -> Chăm Rốch Thi Review & Merge)
```

1. **Giai đoạn Base (Mốc M1)**: Chăm Rốch Thi hoàn thành cấu hình nền tảng, Swagger UI, Prisma Schema trên nhánh `main` và đẩy lên repository.
2. **Giai đoạn phát triển Tính năng**:
   - Chăm Rốch Thi mở nhánh `feature/user` từ `main`, phát triển module quản lý người dùng và bộ test, tạo **PR #1**.
   - Nguyễn Tiến Thành mở nhánh `feature/document` từ `main`, phát triển module tài liệu, dịch vụ MinIO và nâng cấp Docker Compose, tạo **PR #2**.
3. **Giai đoạn Review & Merge**:
   - **PR #1 (`feature/user`)**: Nguyễn Tiến Thành thực hiện review code và tiến hành merge vào `main`.
   - **PR #2 (`feature/document`)**: Phát sinh Merge Conflict tại `src/app.module.ts`. Chăm Rốch Thi kiểm tra, giải quyết conflict (giữ nguyên cả hai module) và tiến hành merge vào `main`.

---

## Triển khai và Vận hành

### 1. Khởi chạy bằng Docker Compose

```bash
# Khởi tạo file cấu hình môi trường
cp .env.example .env

# Biên dịch và khởi chạy toàn bộ dịch vụ
docker compose up -d --build
```

Dịch vụ sẵn sàng tại các địa chỉ:
- Swagger UI: `http://localhost:3000/api-docs`
- Raw Swagger Specification: `http://localhost:3000/api-docs-json`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- MinIO Management Console: `http://localhost:9001` (Tài khoản: `minioadmin` / Mật khẩu: `minioadmin`)

### 2. Xuất Swagger Specification

```bash
npm run swagger:export
```
Tệp `swagger.json` sẽ tự động được khởi tạo tại thư mục gốc.

---

## Kiểm thử ứng dụng

```bash
# Chạy Unit Test
npm run test

# Chạy End-to-End (E2E) Test (Yêu cầu PostgreSQL và Redis đang hoạt động)
npm run test:e2e
```

---

## Danh sách API Endpoints

*Yêu cầu Header `x-api-key: change-me-local-dev-key` đối với các API cần xác thực.*

| Phương thức | Endpoint | Mô tả | Xác thực | Người phụ trách |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/health` | Kiểm tra trạng thái hệ thống | Không | Chăm Rốch Thi |
| `GET` | `/api-docs-json` | Trả về cấu trúc OpenAPI JSON | Không | Chăm Rốch Thi |
| `GET` | `/users` | Lấy danh sách người dùng | Có | Chăm Rốch Thi |
| `POST` | `/users` | Tạo mới người dùng | Có | Chăm Rốch Thi |
| `POST` | `/documents/upload` | Tải lên tài liệu (Multipart) | Có | Nguyễn Tiến Thành |
| `GET` | `/documents?userId=...` | Danh sách tài liệu theo người dùng (Redis Cache) | Có | Nguyễn Tiến Thành |
| `GET` | `/documents/:id` | Xem thông tin tài liệu | Có | Nguyễn Tiến Thành |
| `GET` | `/documents/:id/download` | Tải về tài liệu từ MinIO | Có | Nguyễn Tiến Thành |
| `DELETE` | `/documents/:id` | Xóa tài liệu (DB, MinIO, Evict Cache) | Có | Nguyễn Tiến Thành |

---

## Kịch bản báo cáo và nghiệm thu

1. **Kiểm tra lịch sử Git**:
   ```bash
   git log --graph --oneline --all
   ```
   *Xác minh luồng nhánh: Base -> Merge PR #1 -> Resolve Conflict & Merge PR #2.*
2. **Khởi chạy hệ thống**:
   ```bash
   docker compose up -d --build
   ```
3. **Nghiệm thu API qua Swagger UI**: Truy cập `http://localhost:3000/api-docs` để kiểm tra tài liệu API.
4. **Nghiệm thu dữ liệu và Caching**:
   - Gọi `POST /users` để tạo hai người dùng.
   - Gọi `POST /documents/upload` tải tệp lên cho người dùng tương ứng.
   - Gọi `GET /documents?userId=...` kiểm tra phản hồi từ cơ sở dữ liệu và bộ nhớ đệm Redis (Cache Hit ở truy vấn tiếp theo).
   - Gọi `GET /documents/:id/download` xác minh tính năng tải tệp từ hệ thống MinIO.