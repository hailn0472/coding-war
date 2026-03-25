# Coding War Backend API

Backend API server for Coding War — An Online Judge Platform

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Queue**: Redis + Bull
- **Real-time**: Socket.io
- **Object Storage**: S3-compatible (MinIO for dev, AWS S3 for prod)
- **Containerization**: Docker (app + judge sandbox)

## Project Structure

```
backend/
├── src/
│   ├── routes/              # API route handlers
│   │   ├── index.ts         # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── problem.routes.ts
│   │   ├── submission.routes.ts
│   │   ├── contest.routes.ts
│   │   ├── user.routes.ts
│   │   └── admin.routes.ts
│   ├── services/            # Business logic services
│   │   ├── authService.ts
│   │   ├── adminService.ts
│   │   ├── problemService.ts
│   │   ├── submissionService.ts
│   │   ├── contestService.ts
│   │   ├── userService.ts
│   │   ├── judgeService.ts          # Judge orchestration
│   │   ├── compilationService.ts    # Code compilation
│   │   ├── executionService.ts      # Sandboxed execution
│   │   ├── dockerSandbox.ts         # Docker sandbox mgmt
│   │   ├── scoringService.ts        # IOI/ACM scoring
│   │   ├── scoreboardService.ts     # Scoreboard logic
│   │   ├── s3Service.ts             # S3 object storage
│   │   ├── testCaseService.ts       # Test case I/O
│   │   ├── emailService.ts          # Transactional email
│   │   ├── emailQueue.ts            # Email queue (Bull)
│   │   ├── submissionQueue.ts       # Submission queue (Bull)
│   │   ├── socketService.ts         # Socket.io core
│   │   ├── submissionSocketService.ts
│   │   └── scoreboardSocketService.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # JWT authentication
│   │   ├── authorize.ts      # RBAC authorization
│   │   ├── errorHandler.ts   # Global error handler
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── requestId.ts      # Request ID injection
│   │   ├── requestLogger.ts  # HTTP request logging
│   │   └── validation.ts     # Zod schema validation
│   ├── utils/                # Utility functions
│   │   ├── checksumUtils.ts  # SHA-256 integrity checks
│   │   ├── env.ts            # Env validation (Zod)
│   │   ├── exceptionHandler.ts
│   │   ├── logger.ts         # Winston logger
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── schemas.ts        # Shared Zod schemas
│   ├── types/                # TypeScript type definitions
│   └── index.ts              # Application entry point
├── test/                     # Test files (mirrors src structure)
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.js               # Database seeder
│   └── migrations/           # Database migrations
├── scripts/
│   ├── docker-entrypoint.sh  # Docker startup script
│   ├── verify-setup.sh       # Setup verification
│   └── check-users.ts        # User check utility
├── .env.example              # Environment variables template
├── Dockerfile                # Production image
├── Dockerfile.dev            # Development image
├── Dockerfile.judge          # Judge sandbox image (Ubuntu + compilers)
└── seccomp-profile.json      # Seccomp security profile for sandbox
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
3. Khởi tạo MinIO (port 9000/9001) — S3-compatible object storage
4. Build judge sandbox image
5. Build và chạy Backend (port 3000) — bao gồm `prisma generate` + `prisma migrate deploy`

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
# 1. Chỉ chạy Postgres + Redis + MinIO bằng Docker (KHÔNG chạy backend container)
docker-compose up -d postgres redis minio

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
| POST | `/api/problems/:id/test-cases` | Upload test cases (ZIP → S3) | Admin |

### Submissions (`/api/submissions`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/submissions` | Nộp bài | User |
| GET | `/api/submissions/:id` | Chi tiết submission | User |
| GET | `/api/submissions` | Danh sách submissions | User |

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
| GET | `/api/admin/statistics` | Thống kê hệ thống (cached 5 phút) | Admin |
| POST | `/api/admin/submissions/:id/rejudge` | Chấm lại submission | Admin |

### Health
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Health check |

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
| `NODE_ENV` | Môi trường | `development` |
| `PORT` | Port server | `3000` |
| `API_BASE_URL` | Base URL của API | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/coding_war` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | Secret key cho JWT (min 32 chars) | _(bắt buộc)_ |
| `JWT_EXPIRES_IN` | Thời hạn access token | `7d` |
| `JWT_REFRESH_SECRET` | Secret key cho refresh token | _(tùy chọn)_ |
| `JWT_REFRESH_EXPIRES_IN` | Thời hạn refresh token | `30d` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | _(tùy chọn)_ |
| `SMTP_PASSWORD` | SMTP password | _(tùy chọn)_ |
| `EMAIL_FROM` | Địa chỉ gửi email | `noreply@codingwar.com` |
| `FRONTEND_URL` | URL frontend (cho email links) | _(tùy chọn)_ |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | `http://localhost:5173` |
| `LOG_LEVEL` | Mức log | `info` |
| `JUDGE_CONCURRENCY` | Số judge worker song song | `4` |
| `JUDGE_TIMEOUT` | Timeout cho mỗi test case (ms) | `30000` |
| `SANDBOX_MEMORY_LIMIT` | Giới hạn memory sandbox (MB) | `512` |
| `RATE_LIMIT_WINDOW_MS` | Cửa sổ rate limit (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests / window | `100` |
| `RATE_LIMIT_SUBMISSION_MAX` | Max submissions / window | `10` |
| `RATE_LIMIT_LOGIN_MAX` | Max login attempts / window | `5` |
| `S3_ENDPOINT` | S3 endpoint (MinIO) | `http://localhost:9000` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | S3 access key | `minioadmin` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `minioadmin` |
| `S3_BUCKET_NAME` | S3 bucket name | `coding-war-testcases` |
| `S3_PRESIGNED_URL_EXPIRY` | Presigned URL expiry (seconds) | `300` |

---

## Database Schema

Các bảng chính trong database:

| Model | Mô tả |
|-------|--------|
| `User` | Tài khoản người dùng (username, email, role) |
| `Problem` | Bài tập (title, description, difficulty, time/memory limits) |
| `TestCase` | Test cases — lưu S3 object keys + SHA-256 checksums |
| `Submission` | Bài nộp (source code, status, verdict) |
| `TestCaseResult` | Kết quả từng test case cho mỗi submission |
| `Contest` | Cuộc thi (IOI/ACM scoring, freeze time) |
| `ContestProblem` | Map problem ↔ contest (order, points) |
| `ContestParticipant` | Đăng ký tham gia contest |

**Supported Languages:** C, C++, Python, Java

**Scoring Rules:** IOI, ACM

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

### S3/MinIO connection error
MinIO chưa chạy hoặc sai credentials.
```bash
# Kiểm tra MinIO container
docker ps | findstr minio

# Truy cập MinIO Console
# http://localhost:9001 (user: minioadmin / pass: minioadmin)
```

---

## Testing

```bash
npm test                    # Chạy tất cả tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## Security

- **Password hashing**: Argon2 (primary) + bcrypt (fallback, cost 12)
- **JWT**: 7-day access token, 30-day refresh token
- **RBAC**: Admin / User / Guest
- **Input validation**: Zod schemas on all endpoints
- **Rate limiting**: 100 req/min (general), 10/min (submissions), 5/min (login)
- **Docker sandbox**: Isolated code execution with seccomp profile
- **Test case integrity**: SHA-256 checksums for input/output files
- **S3 Presigned URLs**: Time-limited access to test case files (default 5 min)
- **Security headers**: Helmet.js middleware
- **CORS**: Configurable allowed origins
- **Request compression**: gzip via compression middleware

## License

MIT
