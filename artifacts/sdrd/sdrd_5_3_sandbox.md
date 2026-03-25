# SDRD 5.3 — Code Execution & Sandbox

> **Posture:** Cô lập container đa lớp (Defense-in-depth).
> **ADRs:** ADR-001, ADR-003 | **SEC:** SEC-01, SEC-02, SEC-03

---

### SEC-01: Network Isolation (`--network=none`)

Container thực thi code bị ngắt hoàn toàn kết nối mạng.

> artifact: [dockerSandbox.ts — `--network=none` (L85)](../backend/src/services/dockerSandbox.ts#L85)
>
> artifact: [executionService.ts — `--network=none` (L175)](../backend/src/services/executionService.ts#L175)

### SEC-02: Resource Limits (cgroups)

- `--memory={limit}m` + `--memory-swap={limit}m` → giới hạn RAM (không swap)
- `--cpus=1` → giới hạn CPU
- `--pids-limit=50` → chống fork-bomb

> artifact: [dockerSandbox.ts — resource flags (L82-L90)](../backend/src/services/dockerSandbox.ts#L82-L90)
>
> artifact: [executionService.ts — resource flags (L172-L179)](../backend/src/services/executionService.ts#L172-L179)

### SEC-03: Read-only FS & Non-root

- `--read-only` → filesystem chỉ đọc
- `--tmpfs /workspace:rw,noexec,nosuid` → workspace tạm
- `--cap-drop=ALL` → xóa mọi Linux capabilities
- `--security-opt=no-new-privileges`

> artifact: [dockerSandbox.ts — security flags (L86-L89)](../backend/src/services/dockerSandbox.ts#L86-L89)

### Seccomp Profile — whitelist syscalls

Default action `SCMP_ACT_ERRNO` (chặn tất cả), chỉ cho phép danh sách syscalls cụ thể.

> artifact: [seccomp-profile.json (L1-L320)](../backend/seccomp-profile.json#L1-L320)

### Judge Docker Image

> artifact: [Dockerfile.judge](../backend/Dockerfile.judge)

### Execution Flow

> artifact: [dockerSandbox.ts — executeInContainer (L211-L309)](../backend/src/services/dockerSandbox.ts#L211-L309)
>
> artifact: [executionService.ts — executeTestCase (L61-L162)](../backend/src/services/executionService.ts#L61-L162)

### Container Cleanup

> artifact: [dockerSandbox.ts — destroySandbox (L337-L355)](../backend/src/services/dockerSandbox.ts#L337-L355)

### Tests

> artifact: [dockerSandbox.test.ts](../backend/test/services/dockerSandbox.test.ts)
>
> artifact: [executionService.test.ts](../backend/test/services/executionService.test.ts)
