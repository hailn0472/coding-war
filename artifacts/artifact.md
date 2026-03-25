# Security & Design Traceability — Artifacts Index

> Central index cho tất cả artifacts ánh xạ yêu cầu thiết kế đến source code.

---

## SDD — Software Design Description

> Ánh xạ từng Module trong SDD Section 5 (Component Design) sang file mã nguồn cụ thể.

| # | Module | File | Status |
|---|--------|------|--------|
| 1 | 5.1 Registration & Authentication | [sdd_5_1_registration_auth.md](sdd/sdd_5_1_registration_auth.md) | ✅ OK (GAPs resolved) |
| 2 | 5.2 Testcase Integrity Verification | [sdd_5_2_testcase_integrity.md](sdd/sdd_5_2_testcase_integrity.md) | ✅ OK (GAPs resolved) |
| 3 | 5.3 Submission Ingestion | [sdd_5_3_submission_ingestion.md](sdd/sdd_5_3_submission_ingestion.md) | ✅ OK |
| 4 | 5.4 Sandbox Execution Engine | [sdd_5_4_sandbox_execution.md](sdd/sdd_5_4_sandbox_execution.md) | ✅ OK |
| 5 | 5.5 Verdict Evaluation | [sdd_5_5_verdict_evaluation.md](sdd/sdd_5_5_verdict_evaluation.md) | ✅ OK |
| 6 | 5.6 Rate Limiting (Token Bucket) | [sdd_5_6_rate_limiting.md](sdd/sdd_5_6_rate_limiting.md) | ✅ OK |
| 7 | 5.7 Real-time Notification Bridge | [sdd_5_7_realtime_notification.md](sdd/sdd_5_7_realtime_notification.md) | ✅ OK |
| 8 | 5.8 Multi-language Compiler Manager | [sdd_5_8_compiler_manager.md](sdd/sdd_5_8_compiler_manager.md) | ✅ OK |
| 9 | 5.9 Admin Security Audit Interceptor | [sdd_5_9_admin_audit.md](sdd/sdd_5_9_admin_audit.md) | 🔴 2 GAPs |
| 10 | 5.10 Local Asset Caching (LRU) | [sdd_5_10_local_caching.md](sdd/sdd_5_10_local_caching.md) | 🔴 Not Implemented |
| 11 | 5.11 Plagiarism Detection | [sdd_5_11_plagiarism_detection.md](sdd/sdd_5_11_plagiarism_detection.md) | 🔴 Not Implemented |
| 12 | 5.12 Worker Fault Tolerance | [sdd_5_12_worker_fault_tolerance.md](sdd/sdd_5_12_worker_fault_tolerance.md) | ⚠️ Partial |
| 13 | 5.13 Resource Cleanup & S3 | [sdd_5_13_resource_cleanup.md](sdd/sdd_5_13_resource_cleanup.md) | ⚠️ Partial |
| 14 | 5.14 Submission Lifecycle State Machine | [sdd_5_14_submission_state_machine.md](sdd/sdd_5_14_submission_state_machine.md) | ✅ OK |
| 15 | 6.x UI Design | [sdd_6_ui_design.md](sdd/sdd_6_ui_design.md) | ✅ OK |

---

## SDRD — Security Design Review Document

> Ánh xạ từng Security Control trong SDRD sang file mã nguồn cụ thể.

| # | Domain | File | Status |
|---|--------|------|--------|
| 1 | 5.1 Authentication & Identity | [sdrd_5_1_authentication.md](sdrd/sdrd_5_1_authentication.md) | ⚠️ 2 GAPs |
| 2 | 5.2 Authorization & IDOR | [sdrd_5_2_authorization.md](sdrd/sdrd_5_2_authorization.md) | ✅ OK |
| 3 | 5.3 Code Execution & Sandbox | [sdrd_5_3_sandbox.md](sdrd/sdrd_5_3_sandbox.md) | ✅ OK |
| 4 | 5.4 Testcase Integrity | [sdrd_5_4_testcase_integrity.md](sdrd/sdrd_5_4_testcase_integrity.md) | ⚠️ 3 GAPs |
| 5 | 5.5 Availability & DoS | [sdrd_5_5_dos_protection.md](sdrd/sdrd_5_5_dos_protection.md) | ✅ OK |
| 6 | 5.6 Logging & Audit | [sdrd_5_6_audit_logging.md](sdrd/sdrd_5_6_audit_logging.md) | ⚠️ 1 GAP |
| 7 | 6. Traceability Matrix | [sdrd_6_traceability_matrix.md](sdrd/sdrd_6_traceability_matrix.md) | ⚠️ 5 GAPs tổng |

---

> **Legend:** ✅ OK | ⚠️ Partial/GAPs | 🔴 Critical/Not Implemented
