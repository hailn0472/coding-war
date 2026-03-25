# SDD 5.1 — Registration & Authentication Module

> SDD yêu cầu: Xử lý đăng ký và xác thực người dùng với password hashing an toàn (Argon2id) và quản lý phiên JWT.

## Algorithm: Secure Registration Flow

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Validate input (email, username, password) | [auth.routes.ts:L25-L60](../../backend/src/routes/auth.routes.ts#L25-L60) — Route handler với Zod validation | ✅ |
| 2 | Check email uniqueness | [auth.routes.ts:L84-L99](../../backend/src/routes/auth.routes.ts#L84-L99) — Prisma findUnique check | ✅ |
| 3 | Hash password (Argon2id) | [authService.ts:L25-L31](../../backend/src/services/authService.ts#L25-L31) — `hashPassword()` sử dụng Argon2id (memory=64MB, iterations=3, parallelism=4) | ✅ |
| 4 | Store user record | [auth.routes.ts:L109-L119](../../backend/src/routes/auth.routes.ts#L109-L119) — Prisma ORM create | ✅ |
| 5 | Generate JWT (access_token + refresh_token) | [authService.ts:L64-L82](../../backend/src/services/authService.ts#L64-L82) — `generateAccessToken()` + `generateRefreshToken()` | ✅ |
| 6 | Return tokens | [auth.routes.ts:L124-L128](../../backend/src/routes/auth.routes.ts#L124-L128) — Response handler | ✅ |

## Algorithm: Login Flow

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Validate credentials | [auth.routes.ts:L204-L230](../../backend/src/routes/auth.routes.ts#L204-L230) — Login route | ✅ |
| 2 | Compare password hash (Argon2id + bcrypt backward compat) | [authService.ts:L45-L56](../../backend/src/services/authService.ts#L45-L56) — `verifyPassword()` | ✅ |
| 3 | Transparent re-hash legacy bcrypt→Argon2id | [auth.routes.ts:L237-L243](../../backend/src/routes/auth.routes.ts#L237-L243) — `needsRehash()` check | ✅ |
| 4 | JWT middleware verification | [auth.ts:L10-L65](../../backend/src/middleware/auth.ts#L10-L65) — JWT middleware | ✅ |

## Algorithm: Refresh Token Rotation

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Validate refresh token | [auth.routes.ts:L276-L289](../../backend/src/routes/auth.routes.ts#L276-L289) | ✅ |
| 2 | Generate new access token | [auth.routes.ts:L296](../../backend/src/routes/auth.routes.ts#L296) | ✅ |
| 3 | Generate new refresh token (rotation) | [auth.routes.ts:L298](../../backend/src/routes/auth.routes.ts#L298) — `generateRefreshToken()` | ✅ |
| 4 | Return both tokens | [auth.routes.ts:L300-L303](../../backend/src/routes/auth.routes.ts#L300-L303) | ✅ |

## GAP Analysis

| ID | Mô tả | Mức độ | Status |
|----|-------|--------|--------|
| GAP-SDD-5.1-01 | Password hashing: bcrypt → Argon2id | 🔴 Critical | ✅ RESOLVED |
| GAP-SDD-5.1-02 | Refresh token rotation | 🟡 Medium | ✅ RESOLVED |

## Code Files Liên Quan

- [authService.ts](../../backend/src/services/authService.ts) — Password hashing (Argon2id), JWT generation/verification
- [auth.routes.ts](../../backend/src/routes/auth.routes.ts) — API endpoints (register, login, refresh, reset-password)
- [auth.ts](../../backend/src/middleware/auth.ts) — JWT middleware
- [authService.test.ts](../../backend/test/services/authService.test.ts) — Unit tests (33 tests)
- [auth.routes.test.ts](../../backend/test/routes/auth.routes.test.ts) — Integration tests
