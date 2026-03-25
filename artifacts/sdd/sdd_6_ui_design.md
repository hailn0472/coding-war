# SDD 6.x — UI Design

> SDD Section 6: Human Interface Design — Thiết kế giao diện người dùng.

## 6.1 Overview: Design Principles

| Nguyên tắc | Yêu cầu SDD | Code Reference | Status |
|------------|-------------|----------------|--------|
| Real-time Feedback | WebSocket cập nhật trạng thái chấm bài | [socketService.ts](../../backend/src/services/socketService.ts) | ✅ |
| Responsiveness | Desktop (code) + Mobile (scoreboard) | [frontend/](../../frontend/) | ✅ |
| Security-First UI | Ẩn/hiện UI based on contest state | [frontend/](../../frontend/) — Contest-aware visibility | ✅ |

## 6.2 Screen: Problem Solving & Editor

| Component | Yêu cầu SDD | Frontend Reference | Status |
|-----------|-------------|-------------------|--------|
| Language Selector | Dropdown chọn ngôn ngữ | [frontend/](../../frontend/) — ProblemSolving page | ✅ |
| Code Editor | Monaco Editor + IntelliSense | [frontend/](../../frontend/) — CodeEditor component | ✅ |
| Submit Button | Rate-limited (10s cooldown) | [frontend/](../../frontend/) — Submit with cooldown | ✅ |
| Judging Console | Live feed: "Compiling..." → "Running Case #1" → "AC" | [frontend/](../../frontend/) — WebSocket live feed | ✅ |
| Test Output | Modal so sánh kết quả mẫu | [frontend/](../../frontend/) — Run Sample modal | ✅ |

## 6.3 Screen: Real-time Leaderboard

| Component | Yêu cầu SDD | Frontend Reference | Status |
|-----------|-------------|-------------------|--------|
| Bảng xếp hạng ACM/IOI | Scoreboard table | [frontend/](../../frontend/) — Leaderboard page | ✅ |
| Flash effect on rank change | Animation khi thứ hạng thay đổi | [frontend/](../../frontend/) — Rank animation | ✅ |
| Search & filter | Tìm thí sinh, lọc theo tổ chức | [frontend/](../../frontend/) — Search component | ✅ |

## 6.4 Screen: Admin Dashboard

| Component | Yêu cầu SDD | Frontend Reference | Status |
|-----------|-------------|-------------------|--------|
| System monitoring charts | Biểu đồ giám sát hệ thống | [frontend/](../../frontend/) — Admin dashboard | ✅ |
| Problem management | CRUD bài tập + test cases | [frontend/](../../frontend/) — Problem management | ✅ |
| Contest management | Tạo/quản lý kỳ thi | [frontend/](../../frontend/) — Contest management | ✅ |

## Code Files Liên Quan (Frontend)

- [frontend/](../../frontend/) — React frontend application
- Tất cả các components UI đã được triển khai theo yêu cầu SDD Section 6
