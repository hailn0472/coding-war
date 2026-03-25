# SDD 5.7 — Real-time Notification Bridge

> SDD yêu cầu: WebSocket Pub/Sub Flow — Cập nhật trạng thái chấm bài real-time về phía Client.

## Algorithm: NotifySubmissionUpdate

| Step | Yêu cầu SDD | Code Reference | Status |
|------|-------------|----------------|--------|
| 1 | Publish message to Redis Channel | [submissionSocketService.ts:L20-L80](../../backend/src/services/submissionSocketService.ts#L20-L80) | ✅ |
| 2 | WebSocket Server subscribe & forward | [socketService.ts:L20-L100](../../backend/src/services/socketService.ts#L20-L100) | ✅ |
| 3 | Scoreboard real-time update | [scoreboardSocketService.ts:L20-L100](../../backend/src/services/scoreboardSocketService.ts#L20-L100) | ✅ |

## Code Files Liên Quan

- [socketService.ts](../../backend/src/services/socketService.ts) — WebSocket connection manager
- [submissionSocketService.ts](../../backend/src/services/submissionSocketService.ts) — Submission status notifications
- [scoreboardSocketService.ts](../../backend/src/services/scoreboardSocketService.ts) — Real-time scoreboard updates
