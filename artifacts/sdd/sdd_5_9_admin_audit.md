# SDD 5.9 — Admin Security Audit Interceptor

> SDD yêu cầu: Immutable Action Logging — Ghi lại mọi hành động thay đổi cấu hình hoặc dữ liệu nhạy cảm của Admin.

## Algorithm: AuditInterceptor

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Extract adminID từ JWT claims | — | ⚠️ GAP |
| 2 | Capture originalState trước khi thực thi | — | ⚠️ GAP |
| 3 | Execute request logic | [adminService.ts:L1-L150](../../backend/src/services/adminService.ts#L1-L150) | ✅ Partial |
| 4 | Capture newState sau khi thực thi | — | ⚠️ GAP |
| 5 | Build AuditRecord (actor, action, diff, ip, timestamp) | — | ⚠️ GAP |
| 6 | ASYNC_PUSH to Immutable Storage | — | ⚠️ GAP |

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.9-01 | **Audit Interceptor chưa triển khai.** Hiện tại chỉ có standard Winston logging, không có immutable audit trail cho hành động Admin | 🔴 Critical |
| GAP-SDD-5.9-02 | Immutable Storage Service chưa có | 🔴 Critical |

## Code Files Liên Quan (Hiện có)

- [adminService.ts](../../backend/src/services/adminService.ts) — Admin business logic (cần bổ sung audit)
- [admin.routes.ts](../../backend/src/routes/admin.routes.ts) — Admin API routes
- [logger.ts](../../backend/src/utils/logger.ts) — Winston logger (cần nâng cấp thành Audit Log service)
