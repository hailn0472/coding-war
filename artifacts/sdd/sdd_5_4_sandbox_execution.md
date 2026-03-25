# SDD 5.4 — Sandbox Execution Engine

> SDD yêu cầu: Quản lý vòng đời Sandbox Docker để thực thi mã nguồn an toàn với isolation hoàn toàn.

## Algorithm: ExecuteInSandbox Flow

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Tạo Docker container với security flags | [dockerSandbox.ts:L50-L150](../../backend/src/services/dockerSandbox.ts#L50-L150) — `createSandbox()` | ✅ |
| 2 | `--network=none` (cấm mạng) | [dockerSandbox.ts:L80-L100](../../backend/src/services/dockerSandbox.ts#L80-L100) — Docker flags | ✅ |
| 3 | `--read-only` filesystem | [dockerSandbox.ts:L80-L100](../../backend/src/services/dockerSandbox.ts#L80-L100) | ✅ |
| 4 | `--cap-drop=ALL` | [dockerSandbox.ts:L80-L100](../../backend/src/services/dockerSandbox.ts#L80-L100) | ✅ |
| 5 | Memory & CPU limits | [dockerSandbox.ts:L100-L130](../../backend/src/services/dockerSandbox.ts#L100-L130) — Resource constraints | ✅ |
| 6 | Seccomp profile | [seccomp-profile.json:L1-L321](../../backend/seccomp-profile.json#L1-L321) — Syscall whitelist | ✅ |
| 7 | Execute test cases | [executionService.ts:L50-L200](../../backend/src/services/executionService.ts#L50-L200) — `executeTestCase()` | ✅ |
| 8 | Enforce timeout (TLE) | [executionService.ts:L200-L300](../../backend/src/services/executionService.ts#L200-L300) — Timeout logic | ✅ |
| 9 | Capture output & compare | [executionService.ts:L300-L400](../../backend/src/services/executionService.ts#L300-L400) — Output comparison | ✅ |
| 10 | Cleanup container | [dockerSandbox.ts:L250-L350](../../backend/src/services/dockerSandbox.ts#L250-L350) — `destroySandbox()` | ✅ |

## Security Flags Summary

| Flag | Mục đích | Implemented |
|------|----------|-------------|
| `--network=none` | Chặn network access hoàn toàn | ✅ |
| `--read-only` | Filesystem chỉ đọc | ✅ |
| `--cap-drop=ALL` | Xóa tất cả Linux capabilities | ✅ |
| `--pids-limit=50` | Giới hạn số process con | ✅ |
| `--security-opt=no-new-privileges` | Chặn privilege escalation | ✅ |
| `--security-opt seccomp=profile.json` | Syscall whitelist | ✅ |

## Code Files Liên Quan

- [dockerSandbox.ts](../../backend/src/services/dockerSandbox.ts) — Docker container lifecycle
- [executionService.ts](../../backend/src/services/executionService.ts) — Test case execution engine
- [seccomp-profile.json](../../backend/seccomp-profile.json) — Seccomp syscall whitelist
