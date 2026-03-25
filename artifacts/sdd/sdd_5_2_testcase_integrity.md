# SDD 5.2 — Testcase Integrity Verification

> SDD yêu cầu: Xác thực tính toàn vẹn bộ testcase bằng SHA-256 checksum trước khi đánh giá.

## Algorithm: FetchAndVerifyTestcase

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Upload testcase lên S3 storage | [testCaseService.ts:L109-L173](../../backend/src/services/testCaseService.ts#L109-L173) — S3 upload + SHA-256 | ✅ |
| 2 | Compute SHA-256 checksum on upload | [checksumUtils.ts:L14-L16](../../backend/src/utils/checksumUtils.ts#L14-L16) — `computeSHA256()` | ✅ RESOLVED |
| 3 | Fetch testcase từ S3 storage | [judgeService.ts:L300-L370](../../backend/src/services/judgeService.ts#L300-L370) — S3 download + verify | ✅ |
| 4 | Verify SHA-256 checksum before execution | [judgeService.ts:L330-L359](../../backend/src/services/judgeService.ts#L330-L359) — `verifySHA256()` | ✅ RESOLVED |
| 5 | Cache locally (LRU) | Chưa triển khai (SDD 5.10) | ⚠️ GAP |

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.2-01 | ~~Testcase lưu trong DB, chưa migrate sang S3 với Presigned URLs~~ | ✅ RESOLVED |
| GAP-SDD-5.2-02 | ~~SHA-256 checksum verification chưa triển khai~~ | ✅ RESOLVED |

## Code Files Liên Quan

- [testCaseService.ts](../../backend/src/services/testCaseService.ts) — Test case upload to S3 with SHA-256 checksums
- [s3Service.ts](../../backend/src/services/s3Service.ts) — S3 client wrapper (upload/download/presigned URL/delete)
- [checksumUtils.ts](../../backend/src/utils/checksumUtils.ts) — SHA-256 compute and verify utilities
- [judgeService.ts](../../backend/src/services/judgeService.ts) — Test case download from S3 with integrity verification
- [schema.prisma](../../backend/prisma/schema.prisma) — TestCase model with `inputChecksum`/`outputChecksum` fields
