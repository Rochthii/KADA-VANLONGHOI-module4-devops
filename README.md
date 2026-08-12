# URL Shortener API — nhóm demo

Rút gọn URL + thống kê lượt truy cập. Dùng đúng stack của module-4 để dễ demo:
**NestJS 10 + TypeScript + Prisma + PostgreSQL + Redis + Docker Compose**.

## Giao diện (FE)

Có sẵn trang web đơn giản do chính API serve tại **http://localhost:3100/**:
- Nhập link dài → bấm **Rút gọn** (không cần nhập API key)
- Bấm **Copy** để sao chép link ngắn
- **Bấm vào code trong bảng → mở thẳng tới URL gốc** (tab mới, redirect 302)
- Bảng danh sách link + lượt truy cập tự refresh mỗi 5s, có nút **Xoá**

Source FE nằm ở `src/public/` (HTML/JS/CSS thuần, NestJS serve qua `useStaticAssets`).

## API key & bảo mật

**API key chỉ nằm ở backend** (biến `API_KEY` trong `.env`) — trình duyệt không bao giờ thấy hay gửi key:

- `/api/*` — yêu cầu header `x-api-key` (dành cho client ngoài / Swagger)
- `/web/*` — endpoint nội bộ dành cho trang web, server tự xử lý, không cần key
- `GET /:code` (redirect) và `GET /health` — công khai

Mô hình này tách "web UI tin cậy trong cùng app" khỏi "API public". Với project học tập, `/web/*` chưa có auth riêng (ai gọi được cũng dùng được) — nếu làm thật có thể thêm session/login.

## Stack (3 services)

| Service | Cổng host | Vai trò |
|---|---|---|
| `url-shortener-api-1` | **3100** | API (Swagger: `/api-docs`) |
| `url-shortener-postgres-1` | 5434 | Lưu link + số lượt truy cập |
| `url-shortener-redis-1` | 6380 | Cache URL gốc theo code (TTL 1h) |

## Yêu cầu
- Docker Desktop (hoặc Docker Engine + plugin Compose)
- Không cần cài Node — mọi thứ chạy trong container

## Cách chạy (nhanh, ai cũng dùng được)

```bash
git clone <đường-dẫn-repo-này> url-shortener
cd url-shortener
cp .env.example .env     # tuỳ chọn: đổi API_KEY riêng của bạn trong .env
docker compose up -d --build
```

Rồi mở **http://localhost:3100/** (web) hoặc **http://localhost:3100/api-docs** (Swagger).

Nếu cổng bận, đổi `3100` / `5434` / `6380` trong `docker-compose.yml`. `prisma db push` tự đồng bộ bảng khi container api khởi động (không cần tạo bucket/minio, không cần cài migration thủ công).

## Endpoints

| Method | Path | Công dụng | API key |
|---|---|---|---|
| POST | `/api/shorten` | Rút gọn URL `{ "originalUrl": "..." }` | ✅ |
| GET | `/api/links` | Danh sách link + lượt truy cập | ✅ |
| GET | `/api/links/:code` | Thống kê 1 link | ✅ |
| DELETE | `/api/links/:code` | Xoá link | ✅ |
| POST | `/web/shorten` | Rút gọn (trang web, server tự lo key) | ❌ |
| GET | `/web/links` | Danh sách link (trang web) | ❌ |
| DELETE | `/web/links/:code` | Xoá link (trang web) | ❌ |
| GET | `/:code` | Redirect 302 tới URL gốc | ❌ (công khai) |
| GET | `/health` | Kiểm tra Postgres + Redis | ❌ |

API key nằm trong `.env` trên máy bạn (`API_KEY=...`) — dùng header `x-api-key`, hoặc bấm **Authorize** trong Swagger. Giá trị ví dụ trong `.env.example`: `change-me-shortener-key`.

## Test nhanh (Postman / curl)

```
# 1. Rút gọn
POST http://localhost:3100/api/shorten
Body (JSON): { "originalUrl": "https://en.wikipedia.org/wiki/Docker_(software)" }
Header: x-api-key: <API_KEY trong .env của bạn>
→ trả về { code, shortUrl, ... }  ví dụ shortUrl = http://localhost:3100/Abc123

# 2. Mở link ngắn (không cần key) — bị redirect 302
GET http://localhost:3100/Abc123

# 3. Xem lượt truy cập đã tăng
GET http://localhost:3100/api/links
```

Lưu ý curl trong PowerShell: gửi JSON qua file (`--data-binary @body.json`) vì quoting inline hay lỗi. Postman dùng bình thường.

## Kiến trúc (giải thích khi demo)

```
POST /api/shorten  → sinh code ngẫu nhiên (6 ký tự base62), lưu Postgres
GET /:code         → check Redis trước (link:{code}); miss thì query Postgres,
                     ghi cache TTL 1h, +1 lượt truy cập, redirect 302
GET /api/links     → đọc thẳng Postgres (không cache để số liệu luôn mới)
```

Điểm nhấn demo: **cache Redis** — mở 1 link 2 lần, lần 2 không chạm Postgres; kiểm chứng bằng `docker compose exec redis redis-cli keys "link:*"`.

## Dừng / reset

```bash
docker compose down       # giữ dữ liệu
docker compose down -v    # xoá luôn dữ liệu
```
