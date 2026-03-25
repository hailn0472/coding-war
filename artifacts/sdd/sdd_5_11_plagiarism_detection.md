# SDD 5.11 — Plagiarism Detection Service (Anti-Cheat)

> SDD yêu cầu: Phát hiện hành vi gian lận (copy bài) giữa thí sinh trong cùng kỳ thi bằng Winnowing Algorithm.

## Status: ⚠️ CHƯA TRIỂN KHAI

Module này chưa được triển khai trong codebase hiện tại.

## GAP Analysis

| ID | Mô tả GAP | Mức độ |
|----|-----------|--------|
| GAP-SDD-5.11-01 | Winnowing Algorithm cho plagiarism detection chưa triển khai | 🟡 Medium |
| GAP-SDD-5.11-02 | Code tokenization & normalization chưa có | 🟡 Medium |
| GAP-SDD-5.11-03 | Admin Alert system cho flagged submissions chưa có | 🟡 Medium |

## Kế hoạch triển khai

Cần xây dựng module riêng biệt kết hợp với:
- `submissionService.ts` — để query submissions theo contest
- `adminService.ts` — để gửi alert cho Admin
