# SDRD 6 — Traceability Matrix & GAP Summary

> Bảng ma trận truy vết từ SEC ID → Threat → ADR → Code.

---

## Traceability Matrix

| SEC ID | Requirement | Threat | ADR | Code Artifact | Status |
|---|---|---|---|---|---|
| SEC-01 | Cô lập mạng Sandbox | E-01 | ADR-001 | [dockerSandbox.ts L85](../backend/src/services/dockerSandbox.ts#L85) | ✅ Done |
| SEC-02 | Giới hạn tài nguyên | D-02 | ADR-003 | [dockerSandbox.ts L82-L90](../backend/src/services/dockerSandbox.ts#L82-L90) | ✅ Done |
| SEC-03 | FS Read-only & Non-root | T-01 | ADR-001 | [dockerSandbox.ts L86-L89](../backend/src/services/dockerSandbox.ts#L86-L89) | ✅ Done |
| SEC-04 | Internal Auth Web↔Judge | S-03 | ADR-002 | — | ⚠️ Chưa triển khai |
| SEC-05 | Rate Limiting | D-01 | ADR-005 | [rateLimit.ts L37-L139](../backend/src/middleware/rateLimit.ts#L37-L139) | ✅ Done |
| SEC-06 | Password Hashing | I-04 | ADR-008 | [authService.ts L23-L35](../backend/src/services/authService.ts#L23-L35) | ⚠️ bcrypt thay vì Argon2id |
| SEC-07 | Cookie Safety | S-01 | ADR-007 | — | ⚠️ Dùng JWT Bearer |
| SEC-08 | Audit Logging | R-02 | ADR-006 | [logger.ts](../backend/src/utils/logger.ts) | ⚠️ Chưa immutable |

---

## GAP Summary — cần xử lý

| # | SEC | Yêu cầu SDRD | Hiện trạng | Hành động |
|---|---|---|---|---|
| 1 | SEC-06 | Argon2id | bcrypt cost 12 | Thay bcrypt → argon2id |
| 2 | SEC-04 | mTLS Web↔Judge | Chưa có | Triển khai mTLS/API Token |
| 3 | — | S3 + Presigned URLs | Testcase lưu DB | Chuyển sang S3 + SHA-256 |
| 4 | SEC-08 | Immutable Audit Log | Winston log chung | Tạo Audit table riêng |
| 5 | SEC-07 | Cookie flags | JWT Bearer | Thêm Secure/HttpOnly/SameSite |
