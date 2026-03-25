# SDD — Traceability Artifacts

> Danh sách artifact cho từng Module trong SDD Section 5 (Component Design) và Section 6 (UI Design).
> Mỗi file ánh xạ yêu cầu thiết kế trong SDD sang file mã nguồn cụ thể, bao gồm tham chiếu đến dòng code.

## Component Design (Section 5)

| # | Module | File | Status |
|---|--------|------|--------|
| 1 | 5.1 Registration & Authentication | [sdd_5_1_registration_auth.md](sdd_5_1_registration_auth.md) | ✅ Mapped |
| 2 | 5.2 Testcase Integrity Verification | [sdd_5_2_testcase_integrity.md](sdd_5_2_testcase_integrity.md) | ✅ Mapped |
| 3 | 5.3 Submission Ingestion | [sdd_5_3_submission_ingestion.md](sdd_5_3_submission_ingestion.md) | ✅ Mapped |
| 4 | 5.4 Sandbox Execution Engine | [sdd_5_4_sandbox_execution.md](sdd_5_4_sandbox_execution.md) | ✅ Mapped |
| 5 | 5.5 Verdict Evaluation | [sdd_5_5_verdict_evaluation.md](sdd_5_5_verdict_evaluation.md) | ✅ Mapped |
| 6 | 5.6 Rate Limiting (Token Bucket) | [sdd_5_6_rate_limiting.md](sdd_5_6_rate_limiting.md) | ✅ Mapped |
| 7 | 5.7 Real-time Notification Bridge | [sdd_5_7_realtime_notification.md](sdd_5_7_realtime_notification.md) | ✅ Mapped |
| 8 | 5.8 Multi-language Compiler Manager | [sdd_5_8_compiler_manager.md](sdd_5_8_compiler_manager.md) | ✅ Mapped |
| 9 | 5.9 Admin Security Audit Interceptor | [sdd_5_9_admin_audit.md](sdd_5_9_admin_audit.md) | ⚠️ GAP |
| 10 | 5.10 Local Asset Caching (LRU) | [sdd_5_10_local_caching.md](sdd_5_10_local_caching.md) | ⚠️ GAP |
| 11 | 5.11 Plagiarism Detection (Anti-Cheat) | [sdd_5_11_plagiarism_detection.md](sdd_5_11_plagiarism_detection.md) | ⚠️ GAP |
| 12 | 5.12 Worker Fault Tolerance | [sdd_5_12_worker_fault_tolerance.md](sdd_5_12_worker_fault_tolerance.md) | ⚠️ GAP |
| 13 | 5.13 Resource Cleanup & S3 Lifecycle | [sdd_5_13_resource_cleanup.md](sdd_5_13_resource_cleanup.md) | ⚠️ GAP |
| 14 | 5.14 Submission Lifecycle State Machine | [sdd_5_14_submission_state_machine.md](sdd_5_14_submission_state_machine.md) | ✅ Mapped |

## UI Design (Section 6)

| # | Screen | File | Status |
|---|--------|------|--------|
| 1 | 6.x UI Design (Overview, Screens, Objects & Actions) | [sdd_6_ui_design.md](sdd_6_ui_design.md) | ✅ Mapped |

---

> **Legend:**
> - ✅ Mapped = Yêu cầu đã ánh xạ đến code hiện có
> - ⚠️ GAP = Module chưa được triển khai hoặc chưa đầy đủ, cần lập kế hoạch phát triển
