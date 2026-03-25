# SDRD 5.6 — Logging, Monitoring & Audit

> **Posture:** Audit logs bất biến cho hành động Admin.
> **ADRs:** ADR-006 | **SEC:** SEC-08

---

### Winston Structured Logger

> artifact: [logger.ts (L1-L42)](../backend/src/utils/logger.ts#L1-L42)

### Request Logging Middleware

Ghi log mỗi request/response (method, path, status, duration).

> artifact: [requestLogger.ts](../backend/src/middleware/requestLogger.ts)

### Request ID Tracing

Gắn unique ID cho mỗi request để truy vết.

> artifact: [requestId.ts](../backend/src/middleware/requestId.ts)

### Global Exception Handler

Bắt uncaughtException/unhandledRejection, gửi alert cho Admin.

> artifact: [exceptionHandler.ts](../backend/src/utils/exceptionHandler.ts)

### Admin Actions (cần audit theo SDRD)

Ban/Kick thí sinh, thay đổi đề, sửa cấu hình Contest.

> artifact: [adminService.ts](../backend/src/services/adminService.ts)
>
> artifact: [admin.routes.ts](../backend/src/routes/admin.routes.ts)

### Authorization Failure Logging

Mỗi lần authorization thất bại đều được ghi log với IP, userId, path.

> artifact: [authorize.ts — logger.warn (L41-L50)](../backend/src/middleware/authorize.ts#L41-L50)

### GAP

> [!WARNING]
> **GAP** — Chưa có **Immutable Audit Log** riêng cho Admin.
> Hiện chỉ ghi log chung qua Winston (có thể bị xóa/sửa).
> Cần tạo Audit Log table trong DB + service riêng theo SDRD.

### Tests

> artifact: [requestLogger.test.ts](../backend/test/middleware/requestLogger.test.ts)
>
> artifact: [exceptionHandler.test.ts](../backend/test/utils/exceptionHandler.test.ts)
>
> artifact: [admin.routes.test.ts](../backend/test/routes/admin.routes.test.ts)
