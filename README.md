# Document Management API

Backend REST API (NestJS) dựng trong môn Module 4 — DevOps. Dự án thực hành Docker,
Docker Compose, Git Workflow làm việc nhóm (PR, review, merge), PostgreSQL, Redis và Swagger.

## Tech stack

- NestJS 10 (TypeScript), Prisma ORM
- PostgreSQL — lưu dữ liệu `User` và `Document`
- Redis — cache danh sách document theo user
- Docker + Docker Compose — chạy toàn bộ stack bằng 1 lệnh
- Swagger — UI test API + xuất `swagger.json` để import vào Postman

## Cấu trúc dự án (theo Git branch)

```
main (khung nền + kết nối DB)
 ├── feat/user     → User API: GET /users, POST /users
 └── feat/document → Document API: upload, list theo user, down-… load, delete
```

Quy trình: không push trực tiếp lên `main`; mọi thay đổi qua feature branch → Pull Request →
thành viên khác review → merge (xử lý conflict nếu có).

## Yêu cầu

- Node.js 20+ (để chạy local / sinh Swagger), hoặc chỉ cần Docker Desktop.

## Chạy bằng Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

Migrations tự chạy khi container `api` khởi động (`prisma migrate deploy`).

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs
- Postgres: localhost:5433 (host) → 5432 (container)
- Redis: localhost:6379
- MinIO: localhost:9000 (API) / 9001 (console)

Tạo MinIO bucket lần đầu:

```bash
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/documents
```

## Xuất swagger.json (import vào Postman)

```bash
npm install
npm run swagger:export   # tạo file swagger.json tại thư mục gốc
```

Hoặc lấy trực tiếp từ server đang chạy: `GET http://localhost:3000/api-docs-json`.

## Endpoint

| Method | Path | Mô tả | API key |
|---|---|---|---|
| GET | `/health` | health check | Không |
| GET | `/users` | Danh sách user | Có |
| POST | `/users` | Tạo user mới | Có |
| POST | `/documents/upload` | Upload tài liệu (multipart) | Có |
| GET | `/documents?userId=` | Danh sách document theo user (có cache Redis) | Có |
| GET | `/documents/:id` | Chi tiết document | Có |
| GET | `/documents/:id/download` | Tải file | Có |
| DELETE | `/documents/:id` | Xoá document | Có |

Authentication: gửi header `x-api-key` với giá trị `API_KEY` trong `.env`
(mặc định `change-me-local-dev-key`).

## Chạy test

```bash
npm run test       # unit test

cp .env.example .env   # cần Postgres + Redis đang chạy
npm run test:e2e        # e2e test
```

## Lệnh Docker hữu ích

```bash
docker compose ps              # trạng thái container
docker compose logs -f api     # xem log api
docker compose down            # dừng, giữ volume
docker compose down -v         # dừng và xoá cả volume
```