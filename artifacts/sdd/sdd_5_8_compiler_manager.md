# SDD 5.8 — Multi-language Compiler Manager

> SDD yêu cầu: Xử lý biên dịch an toàn cho C++, Java và diễn giải cho Python.

## Algorithm: CompileSource

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Create compile sandbox | [compilationService.ts:L20-L80](../../backend/src/services/compilationService.ts#L20-L80) | ✅ |
| 2 | SWITCH language (cpp17/java17/python3) | [compilationService.ts:L80-L150](../../backend/src/services/compilationService.ts#L80-L150) — Language switch | ✅ |
| 3 | Execute CMD with Timeout (10s) | [compilationService.ts:L150-L200](../../backend/src/services/compilationService.ts#L150-L200) | ✅ |
| 4 | Capture stderr on error | [compilationService.ts:L200-L250](../../backend/src/services/compilationService.ts#L200-L250) — CE handling | ✅ |
| 5 | Return binary path | [compilationService.ts:L250-L280](../../backend/src/services/compilationService.ts#L250-L280) | ✅ |

## Code Files Liên Quan

- [compilationService.ts](../../backend/src/services/compilationService.ts) — Compilation service with multi-language support
