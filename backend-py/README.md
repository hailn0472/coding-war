# Coding War Backend (Python/FastAPI)

> Migrated from TypeScript/Express/Prisma → Python/FastAPI/SQLAlchemy

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | PostgreSQL 15 + SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Cache/Queue | Redis 7 |
| Task Queue | Celery |
| WebSocket | python-socketio (ASGI) |
| Auth | Argon2id + JWT (python-jose) |
| Storage | S3/MinIO (boto3) |
| Validation | Pydantic v2 |
| Logging | structlog |
| Testing | Pytest + httpx |

## Quick Start

```bash
# 1. Install dependencies
pip install -e ".[dev]"

# 2. Start infrastructure
docker-compose up -d postgres redis

# 3. Configure environment
cp .env.example .env

# 4. Run migrations
python -m alembic revision --autogenerate -m "initial"
python -m alembic upgrade head

# 5. Start API server (dev mode with auto-reload)
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

# 6. Start judge worker (separate terminal)
celery -A app.worker worker --loglevel=info --concurrency=3
```

## API Documentation

- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc
- **Health**: http://localhost:3000/health

## API Endpoints (29 total)

### Authentication (`/api/auth`) — 6 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | User registration |
| POST | `/verify-email` | — | Email verification |
| POST | `/login` | — | Login → JWT |
| POST | `/refresh` | — | Refresh access token |
| POST | `/forgot-password` | — | Request password reset |
| POST | `/reset-password` | — | Reset with token |

### Problems (`/api/problems`) — 6 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Optional | List problems (filter, paginate) |
| GET | `/{id}` | Optional | Get problem details |
| POST | `/` | Admin | Create problem |
| PUT | `/{id}` | Admin | Update problem |
| DELETE | `/{id}` | Admin | Delete problem |
| POST | `/{id}/test-cases` | Admin | Upload test cases (zip) |

### Submissions (`/api/submissions`) — 4 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | User | Submit solution |
| GET | `/{id}` | User | Get submission (ownership check) |
| GET | `/` | User | List submissions |
| POST | `/{id}/rejudge` | Admin | Rejudge submission |

### Contests (`/api/contests`) — 7 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List contests |
| GET | `/{id}` | Optional | Get contest details |
| POST | `/` | Admin | Create contest |
| PUT | `/{id}` | Admin | Update contest |
| DELETE | `/{id}` | Admin | Delete contest |
| POST | `/{id}/register` | User | Register for contest |
| GET | `/{id}/scoreboard` | Optional | Get scoreboard |

### Users (`/api/users`) — 3 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/{id}` | Optional | Get profile + stats |
| PUT | `/{id}` | User | Update own profile |
| GET | `/{id}/submissions` | User | Submission history |

### Admin (`/api/admin`) — 3 endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| PUT | `/users/{id}/role` | Admin | Update user role |
| GET | `/statistics` | Admin | System statistics |

## Project Structure

```
app/
├── main.py              # FastAPI entry point + middleware
├── config.py            # Pydantic Settings (env vars)
├── database.py          # Async SQLAlchemy engine
├── worker.py            # Celery judge worker
├── models/              # 8 SQLAlchemy models
├── schemas/             # Pydantic request/response
├── routers/             # 6 API router modules
├── services/            # 14 business logic services
├── middleware/          # Security headers, error handler, rate limit, logging
├── dependencies/        # JWT auth, RBAC authorize, DB session
└── utils/               # Logger, SHA-256 checksum
```

## Security (SDRD-Aligned)

| Control | Implementation |
|---|---|
| Password Hashing | Argon2id (memory=64MB, iterations=3, parallelism=4) |
| Authentication | JWT Bearer (7-day access, 30-day refresh) |
| Authorization | RBAC with role hierarchy (Admin > User > Guest) |
| Rate Limiting | 3-tier: 100/min general, 10/min submit, 5/min login |
| Input Validation | Pydantic v2 schemas on all endpoints |
| Security Headers | HSTS, CSP, X-Frame-Options, X-Content-Type-Options |
| S3 Encryption | SSE-AES256 on all testcase uploads (ADR-006) |
| Integrity | SHA-256 checksums + timing-safe comparison |
| Sandbox | Docker: network=none, read-only, cap-drop ALL |
| Server Time | Centralized `_utc_now()` for all time logic (ADR-008) |
| IDOR Prevention | Ownership checks via `requesting_user_id` (ADR-007) |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL connection |
| `REDIS_HOST` | `localhost` | Redis for cache + Celery |
| `JWT_SECRET` | — | **Required** in production |
| `S3_ENDPOINT` | `http://localhost:9000` | S3/MinIO endpoint |
| `JUDGE_CONCURRENCY` | `3` | Parallel judge workers |

## WebSocket Events

| Direction | Event | Description |
|---|---|---|
| Client → Server | `subscribe:submission` | Subscribe to submission updates |
| Server → Client | `submission:update` | Real-time status (queued → compiling → running) |
| Server → Client | `submission:complete` | Final verdict with results |
| Client → Server | `subscribe:scoreboard` | Subscribe to scoreboard |
| Server → Client | `scoreboard:update` | Live scoreboard changes |
