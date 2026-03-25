# SDRD 5.2 — Authorization & IDOR Prevention

> **Posture:** RBAC tập trung + kiểm tra ownership. Thí sinh không xem code người khác.
> **ADRs:** ADR-007

---

### RBAC Role Hierarchy (ADMIN > USER > GUEST)

> artifact: [authorize.ts — ROLE_HIERARCHY (L8-L12)](../backend/src/middleware/authorize.ts#L8-L12)

### Authorize Middleware — kiểm tra quyền truy cập

> artifact: [authorize.ts — authorize function (L22-L68)](../backend/src/middleware/authorize.ts#L22-L68)

### Convenience Middleware (adminOnly, userAndAbove, authenticated)

> artifact: [authorize.ts — (L74-L82)](../backend/src/middleware/authorize.ts#L74-L82)

### Role Enum trong Database

> artifact: [schema.prisma — enum Role (L33-L37)](../backend/prisma/schema.prisma#L33-L37)

### Authorization Failure Logging (security audit)

> artifact: [authorize.ts — logger.warn on failure (L41-L50)](../backend/src/middleware/authorize.ts#L41-L50)

### Acceptance Test: IDOR Prevention

SDRD yêu cầu: truy cập Submission của User khác → phải trả về 403.

> artifact: [authorize.test.ts](../backend/test/middleware/authorize.test.ts)
>
> artifact: [submission.routes.test.ts](../backend/test/routes/submission.routes.test.ts)
