# SDRD 5.1 — Authentication & Identity

> **Posture:** Xác thực tập trung, mật khẩu băm mạnh, bảo vệ phiên nghiêm ngặt.
> **ADRs:** ADR-002, ADR-007, ADR-008 | **SEC:** SEC-06, SEC-07

---

### Password Hashing (SEC-06)

> [!WARNING]
> **GAP** — SDRD yêu cầu **Argon2id** nhưng code dùng **bcrypt** (cost 12). Cần thay thế.

> artifact: [authService.ts — hashPassword (L23-L25)](../backend/src/services/authService.ts#L23-L25)
>
> artifact: [authService.ts — verifyPassword (L33-L35)](../backend/src/services/authService.ts#L33-L35)

### JWT Token — phát hành & xác thực

> artifact: [authService.ts — generateAccessToken (L43-L49)](../backend/src/services/authService.ts#L43-L49)
>
> artifact: [authService.ts — generateRefreshToken (L56-L62)](../backend/src/services/authService.ts#L56-L62)
>
> artifact: [auth.ts — authenticate middleware (L22-L60)](../backend/src/middleware/auth.ts#L22-L60)

### Login Brute-force Protection

> artifact: [rateLimit.ts — loginRateLimiter 5req/min (L110-L139)](../backend/src/middleware/rateLimit.ts#L110-L139)

### Auth Endpoints (Register/Login/Verify/Refresh/Reset)

> artifact: [auth.routes.ts — POST /register (L77-L142)](../backend/src/routes/auth.routes.ts#L77-L142)
>
> artifact: [auth.routes.ts — POST /login (L199-L261)](../backend/src/routes/auth.routes.ts#L199-L261)
>
> artifact: [auth.routes.ts — POST /refresh (L263-L310)](../backend/src/routes/auth.routes.ts#L263-L310)

### Cookie Safety (SEC-07)

> [!IMPORTANT]
> **GAP** — Hiện dùng JWT Bearer token. Chưa cấu hình cookie flags (HttpOnly, Secure, SameSite=Strict) theo SDRD.

### Tests

> artifact: [authService.test.ts](../backend/test/services/authService.test.ts)
>
> artifact: [auth.routes.test.ts](../backend/test/routes/auth.routes.test.ts)
>
> artifact: [auth.test.ts](../backend/test/middleware/auth.test.ts)
