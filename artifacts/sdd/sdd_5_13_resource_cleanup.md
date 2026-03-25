# SDD 5.13 — Resource Cleanup & S3 Lifecycle Management

> SDD yêu cầu: Quản lý dung lượng lưu trữ, xóa sạch dữ liệu nhạy cảm từ bộ nhớ tạm.

## Status: ⚠️ TRIỂN KHAI MỘT PHẦN

Container cleanup sau khi judge hoàn thành đã có, nhưng S3 Lifecycle và secure wipe chưa triển khai.

## Algorithm: PostJudgingCleanup

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Secure wipe temp directory (`shred -u -n 1`) | — | ⚠️ GAP |
| 2 | Close file handles | [dockerSandbox.ts:L250-L350](../../backend/src/services/dockerSandbox.ts#L250-L350) — `destroySandbox()` | ✅ Partial |
| 3 | S3 lifecycle management (Glacier migration) | — | ⚠️ GAP |
| 4 | Permanent DELETE after 1 year | — | ⚠️ GAP |
| 5 | Flush Redis cached metadata | — | ⚠️ GAP |

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.13-01 | S3 Lifecycle (Glacier migration) chưa triển khai (testcases vẫn trong DB) | 🟡 Medium |
| GAP-SDD-5.13-02 | Secure wipe (`shred`) cho temp files chưa triển khai | 🟡 Medium |

## Code Files Liên Quan

- [dockerSandbox.ts](../../backend/src/services/dockerSandbox.ts) — Container cleanup (cần bổ sung secure wipe)
