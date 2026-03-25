# SDD 5.12 — Judge Worker Fault Tolerance & Job Recovery

> SDD yêu cầu: Đảm bảo hệ thống không mất dữ liệu bài nộp khi Judge Worker bị treo hoặc crash.

## Status: ⚠️ TRIỂN KHAI MỘT PHẦN

RabbitMQ message acknowledgment đã được triển khai, nhưng Heartbeat monitoring và Auto-scaling chưa có.

## Algorithm: MonitorWorkerHealth

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | RabbitMQ Ack mechanism | [submissionQueue.ts:L50-L100](../../backend/src/services/submissionQueue.ts#L50-L100) — Queue consumer | ✅ Partial |
| 2 | HeartbeatListener (5s interval) | — | ⚠️ GAP |
| 3 | Worker status tracking | — | ⚠️ GAP |
| 4 | Orphaned job re-insertion | — | ⚠️ GAP |
| 5 | Auto-scaling trigger | — | ⚠️ GAP |

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.12-01 | Worker Heartbeat monitoring chưa triển khai | 🟡 Medium |
| GAP-SDD-5.12-02 | Orphaned job recovery chưa triển khai | 🟡 Medium |
| GAP-SDD-5.12-03 | Auto-scaling chưa triển khai | 🟢 Low |

## Code Files Liên Quan

- [submissionQueue.ts](../../backend/src/services/submissionQueue.ts) — RabbitMQ queue (cần bổ sung health monitoring)
