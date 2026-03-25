# SDRD 5.4 — Testcase Integrity & Storage

> **Posture:** Testcases đã xuất bản là bất biến, bảo vệ bằng checksum.
> **ADRs:** ADR-004, ADR-006

---

### Testcase Upload & Validation

> artifact: [testCaseService.ts](../backend/src/services/testCaseService.ts)

### Testcase Data Model

> artifact: [schema.prisma — model TestCase (L73-L87)](../backend/prisma/schema.prisma#L73-L87)

### Problem Routes — Upload test cases (Admin)

> artifact: [problem.routes.ts — POST /:id/test-cases](../backend/src/routes/problem.routes.ts)

### GAP Analysis

> [!WARNING]
> **3 GAPs so với SDRD:**
> 1. **S3 Storage** — Code lưu testcase trực tiếp DB (`@db.Text`), chưa dùng S3.
> 2. **Presigned URLs** — Chưa triển khai Pre-signed URLs ngắn hạn.
> 3. **SHA-256 Checksum** — Chưa có cơ chế xác thực tính toàn vẹn file.

### Tests

> artifact: [testCaseService.test.ts](../backend/test/services/testCaseService.test.ts)
>
> artifact: [problem.routes.testcases.test.ts](../backend/test/routes/problem.routes.testcases.test.ts)
