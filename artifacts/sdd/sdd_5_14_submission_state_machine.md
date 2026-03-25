# SDD 5.14 — Submission Lifecycle State Machine

> SDD yêu cầu: Quản lý vòng đời trạng thái Submission từ lúc nộp đến khi có kết quả cuối cùng.

## State Transitions

| Trạng thái nguồn | Trigger | Trạng thái đích | Code Reference | Status |
|---|---|---|---|---|
| None | User_Submit | PENDING | [submissionService.ts:L30-L80](../../backend/src/services/submissionService.ts#L30-L80) | ✅ |
| PENDING | Enqueue_Task | QUEUED | [submissionQueue.ts:L20-L60](../../backend/src/services/submissionQueue.ts#L20-L60) | ✅ |
| QUEUED | Worker_Pick | COMPILING | [judgeService.ts:L30-L80](../../backend/src/services/judgeService.ts#L30-L80) | ✅ |
| COMPILING | Compile_Fail | CE (Final) | [compilationService.ts:L150-L250](../../backend/src/services/compilationService.ts#L150-L250) | ✅ |
| COMPILING | Compile_Success | RUNNING | [compilationService.ts:L250-L280](../../backend/src/services/compilationService.ts#L250-L280) | ✅ |
| RUNNING | Execute_All_Pass | AC (Final) | [judgeService.ts:L100-L200](../../backend/src/services/judgeService.ts#L100-L200) | ✅ |
| RUNNING | Constraint_Violate | WA/TLE/MLE/RTE (Final) | [executionService.ts:L200-L400](../../backend/src/services/executionService.ts#L200-L400) | ✅ |
| Bất kỳ | Security_Fail | INTERNAL_ERROR (Final) | [judgeService.ts:L200-L300](../../backend/src/services/judgeService.ts#L200-L300) | ✅ |

## Immutability & TTL Rules

| Rule | Yêu cầu SDD | Status |
|------|-------------|--------|
| Final states không thể thay đổi (trừ Admin) | [submissionService.ts](../../backend/src/services/submissionService.ts) | ✅ |
| TTL > 5 phút → INTERNAL_ERROR | Cron job chưa triển khai đầy đủ | ⚠️ Partial |
| Resume: RabbitMQ Ack → re-queue | [submissionQueue.ts](../../backend/src/services/submissionQueue.ts) | ✅ |

## Code Files Liên Quan

- [submissionService.ts](../../backend/src/services/submissionService.ts) — State management
- [submissionQueue.ts](../../backend/src/services/submissionQueue.ts) — Queue & recovery
- [judgeService.ts](../../backend/src/services/judgeService.ts) — Judge orchestration
- [executionService.ts](../../backend/src/services/executionService.ts) — Execution engine
- [compilationService.ts](../../backend/src/services/compilationService.ts) — Compilation
