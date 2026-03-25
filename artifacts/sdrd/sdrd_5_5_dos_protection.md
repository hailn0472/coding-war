# SDRD 5.5 — Availability & DoS Protections

> **Posture:** Rate limiting + quản lý hàng đợi chấm bài.
> **ADRs:** ADR-005 | **SEC:** SEC-05

---

### General Rate Limiter — 100 req/min

> artifact: [rateLimit.ts — generalRateLimiter (L37-L66)](../backend/src/middleware/rateLimit.ts#L37-L66)

### Submission Rate Limiter — 10 req/min (per user)

> artifact: [rateLimit.ts — submissionRateLimiter (L72-L104)](../backend/src/middleware/rateLimit.ts#L72-L104)

### Login Rate Limiter — 5 req/min (per IP)

> artifact: [rateLimit.ts — loginRateLimiter (L110-L139)](../backend/src/middleware/rateLimit.ts#L110-L139)

### Redis Store cho Rate Limiting

> artifact: [rateLimit.ts — Redis client setup (L12-L31)](../backend/src/middleware/rateLimit.ts#L12-L31)

### Submission Queue (Bull/Redis) — xếp hàng chấm bài

> artifact: [submissionQueue.ts](../backend/src/services/submissionQueue.ts)

### 429 Response Format

Khi vượt ngưỡng → trả về `{ code: 'RATE_LIMIT_EXCEEDED', message: '...' }` + HTTP 429.

> artifact: [rateLimit.ts — handler response (L46-L61)](../backend/src/middleware/rateLimit.ts#L46-L61)

### Tests

> artifact: [rateLimit.test.ts](../backend/test/middleware/rateLimit.test.ts)
