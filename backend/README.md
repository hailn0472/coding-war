# Coding War Backend API

Backend API server for Coding War - An Online Judge Platform

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Queue**: Redis + Bull
- **Real-time**: Socket.io
- **Containerization**: Docker

## Project Structure

```
backend/
├── src/
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic services
│   ├── middleware/     # Express middleware
│   ├── models/         # Data models and types
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Application entry point
├── test/               # Test files (mirrors src structure)
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── scripts/
│   └── docker-entrypoint.sh  # Docker startup script
├── .env.example        # Environment variables template
├── Dockerfile          # Production image
└── Dockerfile.dev      # Development image
```

## Getting Started

### Cách 1: Docker (Khuyến nghị) — Chạy tất cả bằng Docker

Chỉ cần 1 lệnh duy nhất từ **thư mục gốc project** (không phải thư mục `backend/`):

```bash
# Từ thư mục gốc coding-war/
docker-compose up -d --build
```

Lệnh này sẽ tự động:
1. Khởi tạo PostgreSQL (port 5432)
2. Khởi tạo Redis (port 6379)
3. Build và chạy Backend (port 3000) — bao gồm `prisma generate` + `prisma migrate deploy`

**Kiểm tra trạng thái:**

```bash
# Xem logs backend
docker logs coding-war-backend -f

# Xem tất cả containers
docker ps

# Backend đã sẵn sàng khi thấy log:
# ✅ Database is ready!
# 🚀 Starting application...
# Server running on port 3000
```

**Các lệnh Docker hữu ích:**

```bash
# Restart backend (sau khi sửa code)
docker restart coding-war-backend

# Rebuild backend (sau khi thêm npm package mới)
docker-compose up -d --build backend

# Stop tất cả
docker-compose down

# Xóa sạch (bao gồm database data)
docker-compose down -v

# Chạy Prisma Studio (xem DB qua GUI)
docker exec -it coding-war-backend npx prisma studio

# Chạy migration mới
docker exec -it coding-war-backend npx prisma migrate dev

# Check data trong DB
docker exec -it coding-war-postgres psql -U postgres -d coding_war -c "SELECT id, username, email, role FROM users;"
```

> **Lưu ý:** Khi dùng Docker, **KHÔNG chạy** `npm run dev` ở local vì sẽ bị lỗi `EADDRINUSE` (port 3000 đã bị container chiếm).

---

### Cách 2: Local Development — Chạy backend trực tiếp

Dùng cách này khi muốn debug hoặc không dùng Docker cho backend.

```bash
# 1. Chỉ chạy Postgres + Redis bằng Docker (KHÔNG chạy backend container)
docker-compose up -d postgres redis

# 2. Cài dependencies
cd backend
npm install

# 3. Copy env
cp .env.example .env

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Chạy migration (tạo bảng trong DB)
npm run prisma:migrate

# 6. Chạy dev server
npm run dev
```

Backend sẽ chạy tại `http://localhost:3000`

> **Lưu ý:** Khi chạy local, file `.env` phải có `DATABASE_URL=postgresql://postgres:password@localhost:5432/coding_war`. Trong Docker, URL là `postgresql://postgres:password@postgres:5432/coding_war` (host = `postgres`, tên container).

---

## Kiểm tra Database

### Dùng Prisma Studio (GUI)
```bash
# Docker
docker exec -it coding-war-backend npx prisma studio

# Local
npm run prisma:studio
```
Mở `http://localhost:5555` → xem/sửa data trực tiếp.

### Dùng psql (CLI)
```bash
# Kết nối vào Postgres container
docker exec -it coding-war-postgres psql -U postgres -d coding_war

# Một số query hữu ích:
\dt                                    -- Liệt kê tất cả bảng
SELECT * FROM users;                   -- Xem users
SELECT * FROM problems;                -- Xem problems
SELECT * FROM submissions;             -- Xem submissions
SELECT * FROM contests;                -- Xem contests
SELECT COUNT(*) FROM users;            -- Đếm users
\q                                     -- Thoát
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | Không |
| POST | `/api/auth/verify-email` | Xác thực email | Không |
| POST | `/api/auth/login` | Đăng nhập | Không |
| POST | `/api/auth/refresh` | Làm mới access token | Không |
| POST | `/api/auth/forgot-password` | Yêu cầu reset password | Không |
| POST | `/api/auth/reset-password` | Đặt lại password | Không |

### Problems (`/api/problems`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/problems` | Danh sách problems | Không |
| GET | `/api/problems/:id` | Chi tiết problem | Không |
| POST | `/api/problems` | Tạo problem | Admin |
| PUT | `/api/problems/:id` | Sửa problem | Admin |
| DELETE | `/api/problems/:id` | Xóa problem | Admin |
| POST | `/api/problems/:id/test-cases` | Upload test cases | Admin |

### Submissions (`/api/submissions`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/submissions` | Nộp bài | User |
| GET | `/api/submissions/:id` | Chi tiết submission | User |
| GET | `/api/submissions` | Danh sách submissions | User |
| POST | `/api/submissions/:id/rejudge` | Chấm lại | Admin |

### Contests (`/api/contests`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/contests` | Danh sách contests | Không |
| GET | `/api/contests/:id` | Chi tiết contest | Không |
| POST | `/api/contests` | Tạo contest | Admin |
| PUT | `/api/contests/:id` | Sửa contest | Admin |
| DELETE | `/api/contests/:id` | Xóa contest | Admin |
| POST | `/api/contests/:id/register` | Đăng ký contest | User |
| GET | `/api/contests/:id/scoreboard` | Bảng xếp hạng | Không |

### Users (`/api/users`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/users/:id` | Profile user | Không |
| PUT | `/api/users/:id` | Sửa profile | User |
| GET | `/api/users/:id/submissions` | Submissions của user | Không |

### Admin (`/api/admin`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/users` | Danh sách users | Admin |
| PUT | `/api/admin/users/:id/role` | Đổi role user | Admin |
| GET | `/api/admin/statistics` | Thống kê hệ thống | Admin |

### Health
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness (kiểm tra DB) |
| GET | `/health/live` | Liveness |

---

## WebSocket Events

### Submission Status
- `subscribe:submission` — Đăng ký nhận cập nhật submission
- `submission:update` — Cập nhật trạng thái real-time
- `submission:complete` — Kết quả cuối cùng

### Scoreboard
- `subscribe:scoreboard` — Đăng ký nhận cập nhật scoreboard
- `scoreboard:update` — Cập nhật bảng xếp hạng real-time

---

## Environment Variables

Xem file `.env.example` để biết đầy đủ. Các biến quan trọng:

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `PORT` | Port server | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/coding_war` |
| `REDIS_HOST` | Redis host | `localhost` |
| `JWT_SECRET` | Secret key cho JWT | _(bắt buộc)_ |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `JUDGE_CONCURRENCY` | Số judge worker song song | `4` |

---

## Troubleshooting

### `EADDRINUSE: address already in use :::3000`
Port 3000 đã bị chiếm. Nguyên nhân: chạy cả Docker container lẫn `npm run dev` cùng lúc.
```bash
# Kiểm tra ai đang dùng port 3000
netstat -aon | findstr :3000

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

### `@prisma/client did not initialize yet`
Chưa chạy `prisma generate`.
```bash
# Docker
docker exec -it coding-war-backend npx prisma generate
docker restart coding-war-backend

# Local
npm run prisma:generate
```

### `Can't reach database server`
PostgreSQL chưa chạy hoặc sai connection string.
```bash
# Kiểm tra container postgres
docker ps | findstr postgres

# Kiểm tra kết nối
docker exec -it coding-war-postgres psql -U postgres -d coding_war -c "SELECT 1;"
```

### Backend container bị restart liên tục
Xem logs để tìm lỗi:
```bash
docker logs coding-war-backend --tail 50
```

---

## Testing

```bash
npm test                    # Chạy tất cả tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## Security

- Password hashing: bcrypt (cost 12)
- JWT: 7-day access token, 30-day refresh token
- RBAC: Admin / User / Guest
- Input validation: Zod schemas
- Rate limiting: 100 req/min (general), 10/min (submissions), 5/min (login)
- Docker sandbox cho code execution

## License

MIT
