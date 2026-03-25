# SDD 5.6 — Rate Limiting (Token Bucket)

> SDD yêu cầu: Triển khai Token Bucket algorithm để giới hạn tần suất nộp bài, chống DoS.

## Algorithm: TokenBucketRateLimit

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Tạo bucket key theo userID | [rateLimit.ts:L20-L40](../../backend/src/middleware/rateLimit.ts#L20-L40) — Key generation | ✅ |
| 2 | INCR counter trong Redis | [rateLimit.ts:L40-L80](../../backend/src/middleware/rateLimit.ts#L40-L80) — Redis Token Bucket | ✅ |
| 3 | Kiểm tra tokens remaining | [rateLimit.ts:L80-L100](../../backend/src/middleware/rateLimit.ts#L80-L100) — Token check | ✅ |
| 4 | Return 429 nếu exceeded | [rateLimit.ts:L100-L120](../../backend/src/middleware/rateLimit.ts#L100-L120) — Error response | ✅ |

## Code Files Liên Quan

- [rateLimit.ts](../../backend/src/middleware/rateLimit.ts) — Token Bucket rate limiter middleware (Redis-backed)
