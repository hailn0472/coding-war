# SDD 5.3 — Submission Ingestion Module

> SDD yêu cầu: Tiếp nhận bài nộp (Submission Ingestion & Routing), validate input, đẩy vào Message Queue.

## Algorithm: IngestSubmission Flow

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Nhận mã nguồn từ User | [submission.routes.ts:L20-L60](../../backend/src/routes/submission.routes.ts#L20-L60) — POST /submissions | ✅ |
| 2 | Validate language, code size | [submissionService.ts:L30-L80](../../backend/src/services/submissionService.ts#L30-L80) — `createSubmission()` | ✅ |
| 3 | Rate Limit check | [rateLimit.ts:L10-L100](../../backend/src/middleware/rateLimit.ts#L10-L100) — Token Bucket middleware | ✅ |
| 4 | Lưu record PENDING vào DB | [submissionService.ts:L80-L120](../../backend/src/services/submissionService.ts#L80-L120) — Prisma create | ✅ |
| 5 | Đẩy task vào RabbitMQ | [submissionQueue.ts:L20-L100](../../backend/src/services/submissionQueue.ts#L20-L100) — Queue producer | ✅ |
| 6 | Return submissionID cho User | [submission.routes.ts:L60-L80](../../backend/src/routes/submission.routes.ts#L60-L80) — Response | ✅ |

## Code Files Liên Quan

- [submissionService.ts](../../backend/src/services/submissionService.ts) — Core submission logic
- [submissionQueue.ts](../../backend/src/services/submissionQueue.ts) — RabbitMQ queue producer
- [submission.routes.ts](../../backend/src/routes/submission.routes.ts) — API route handler
- [rateLimit.ts](../../backend/src/middleware/rateLimit.ts) — Rate limiting middleware
