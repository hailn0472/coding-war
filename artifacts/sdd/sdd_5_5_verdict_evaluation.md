# SDD 5.5 — Verdict Evaluation Module

> SDD yêu cầu: Thuật toán đánh giá kết quả (Verdict) sau khi thực thi mã nguồn trong Sandbox.

## Algorithm: EvaluateExecution

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Kiểm tra exit code | [executionService.ts:L300-L400](../../backend/src/services/executionService.ts#L300-L400) | ✅ |
| 2 | So sánh output (byte-by-byte) | [executionService.ts:L350-L400](../../backend/src/services/executionService.ts#L350-L400) | ✅ |
| 3 | Kiểm tra Time Limit Exceeded | [executionService.ts:L200-L300](../../backend/src/services/executionService.ts#L200-L300) | ✅ |
| 4 | Kiểm tra Memory Limit Exceeded | [dockerSandbox.ts:L100-L130](../../backend/src/services/dockerSandbox.ts#L100-L130) | ✅ |
| 5 | Return verdict (AC/WA/TLE/MLE/RTE/CE) | [judgeService.ts:L50-L200](../../backend/src/services/judgeService.ts#L50-L200) | ✅ |

## Verdict Types

| Verdict | Mô tả | Code Reference |
|---------|-------|----------------|
| AC | All test cases passed | [judgeService.ts](../../backend/src/services/judgeService.ts) |
| WA | Wrong Answer | [judgeService.ts](../../backend/src/services/judgeService.ts) |
| TLE | Time Limit Exceeded | [executionService.ts](../../backend/src/services/executionService.ts) |
| MLE | Memory Limit Exceeded | [dockerSandbox.ts](../../backend/src/services/dockerSandbox.ts) |
| RTE | Runtime Error | [executionService.ts](../../backend/src/services/executionService.ts) |
| CE | Compilation Error | [compilationService.ts](../../backend/src/services/compilationService.ts) |

## Code Files Liên Quan

- [executionService.ts](../../backend/src/services/executionService.ts) — Execution & output comparison
- [judgeService.ts](../../backend/src/services/judgeService.ts) — Judge orchestration
- [compilationService.ts](../../backend/src/services/compilationService.ts) — Compilation handling
