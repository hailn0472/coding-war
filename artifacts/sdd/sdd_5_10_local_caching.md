# SDD 5.10 — Local Asset Caching (LRU Strategy)

> SDD yêu cầu: Giảm thiểu độ trễ nộp bài bằng cách lưu trữ LRU cache cho Testcases trên Judge Worker.

## Status: ⚠️ CHƯA TRIỂN KHAI

Module này chưa được triển khai trong codebase hiện tại.

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.10-01 | LRU Cache cho testcases trên Judge Worker chưa triển khai | 🟡 Medium |
| GAP-SDD-5.10-02 | Cache integrity verification (SHA-256 hash check) chưa có | 🟡 Medium |

## Kế hoạch triển khai

Cần xây dựng module LRU Cache kết hợp với:
- `testCaseService.ts` — để fetch testcases
- `executionService.ts` — để sử dụng cached testcases
