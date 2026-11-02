# Requirements Traceability Matrix (RTM) — Online Exam Portal

**Project:** Online Exam Portal  
**Team:** 6  
**Prepared by:** Test Engineer  
**Source:** `6_SRS_MiniProject.pdf` (Section 8, with requirement details from Sections 4–5) and `team6_TestPlan_MiniProject.pdf` (Sections 8, 13 and 14)  
**Status:** Working draft — update statuses after executing the mapped tests.

## Status legend

- **N — Not tested** (the status used in the SRS)
- **P — Pass**
- **F — Fail**
- **Blocked — Cannot execute because the required feature or test environment is unavailable**
- **TBD — Test case mapping needs confirmation/design**

## Traceability matrix

| SRS requirement ID | Requirement summary | SRS section | Module | Test case(s) | Current status | Evidence / comments |
|---|---|---:|---|---|---|---|
| EXAM-F-001 | Authenticate users using email/username and password before granting access | 4.1; SRS §8 | Authentication | TC-Auth-01 | N / not yet verified | SRS §8 maps this requirement to TC-Auth-01. The Sprint 2 login API check returned `NOT_FOUND` (see `docs/test-results/sprint2.md`); confirm whether this is the same requirement/test before changing the requirement status. |
| EXAM-F-002 | Hash and salt passwords; never store or log plaintext passwords | 4.1 | Authentication / security | TC-Auth-02 | TBD | Test ID is specified in SRS §4.1. No execution evidence supplied. |
| EXAM-F-003 | Lock account after five consecutive failed login attempts and log the event | 4.1 | Authentication / security | TC-Auth-03 | TBD | Test ID is specified in SRS §4.1. No execution evidence supplied. |
| EXAM-F-010 | Load exam questions in randomized order and start a server-side countdown timer | 4.2; SRS §8 | Exam / timer | TC-Exam-01 | N / not yet verified | SRS §8 maps this requirement to TC-Exam-01. |
| EXAM-F-011 | Auto-submit the exam when the timer expires and save answered questions | 4.2 | Exam / submission | TC-Exam-02 | TBD | Test ID is specified in SRS §4.2. No execution evidence supplied. |
| EXAM-F-020–EXAM-F-025 | Instructor question-bank management: create, edit, tag, delete, CSV bulk import and version question banks | 4.3 | Question bank / instructor | TBD | Not tested / mapping needed | SRS gives the requirement ID range and behavior, but does not provide individual test-case IDs in the supplied section. |
| EXAM-F-030–EXAM-F-034 | Automatically grade submissions, compute scores/percentile and display results/analytics | 4.4 | Evaluation / results | TBD | Not tested / mapping needed | SRS gives the requirement ID range and behavior, but does not provide individual test-case IDs in the supplied section. |
| EXAM-F-040–EXAM-F-044 | Admin dashboard: schedule exams, monitor attempt counts, view audit logs and export result reports | 4.5 | Admin dashboard | TBD | Not tested / mapping needed | SRS gives the requirement ID range and behavior, but does not provide individual test-case IDs in the supplied section. |
| EXAM-NF-001 | Exam page load and answer-submission response time ≤ 2 seconds for 90% of requests under normal load | 5; SRS §8 | Web UI / API performance | TC-Perf-01 | N / not yet verified | SRS §8 maps this requirement to TC-Perf-01. No performance execution result supplied. |
| EXAM-NF-002 | Availability ≥ 99.5% during scheduled exam windows | 5 | Operations / availability | Ops reports | Not tested / evidence needed | SRS specifies operational reports as evidence; no availability report supplied. |
| EXAM-NF-003 | Store passwords and session tokens securely; never store plaintext passwords | 5 | Security / authentication | TC-Sec-01 | Not tested / evidence needed | SRS specifies TC-Sec-01. No security audit result supplied. |
| EXAM-NF-004 | Log exam attempts and submissions with timestamps and retain them for one academic year | 5 | Audit / data retention | TC-OPS-01 | Not tested / evidence needed | SRS specifies TC-OPS-01. No execution evidence supplied. |
| EXAM-NF-005 | Support up to 200 concurrent exam attempts without degraded response time | 5 | Scalability / load | TC-Load-01 | Not tested / evidence needed | SRS specifies TC-Load-01. No load-test result supplied. |
| EXAM-SR-001 | Enforce HTTPS/TLS 1.2+ for client-server communication | 5.1.2 | Security / transport | TBD | Not tested / mapping needed | SRS does not give a test-case reference for this row. |
| EXAM-SR-002 | Hash and salt stored passwords using a strong algorithm | 5.1.2 | Security / authentication | TC-Auth-02; TC-Sec-01 | TBD | Candidate links based on the matching password-security behavior; confirm exact test coverage before marking verified. |
| EXAM-SR-003 | Restrict question-bank and answer-key access to authorized instructor/admin roles | 5.1.2 | Authorization / question bank | TBD | Not tested / mapping needed | SRS does not give a test-case reference for this row. |
| EXAM-SR-004 | Use signed, expiring JWTs and reject tampered tokens | 5.1.2 | Authentication / session | TBD | Not tested / mapping needed | SRS does not give a test-case reference for this row. |
| EXAM-SR-005 | Log admin actions for audit purposes | 5.1.2 | Admin / audit | TC-OPS-01 (candidate) | TBD | Candidate link based on audit behavior; confirm the test verifies admin actions specifically. |

## Execution evidence currently available

The supplied Sprint 1 execution log records six automated backend tests as passed (health endpoint, unsupported method, unique request ID, unknown route, malformed JSON, and JSON content type) and five Postman checks as passed. These are infrastructure/API checks; the supplied evidence does **not** establish that the functional SRS requirements above have passed.

The supplied Sprint 2 report records:
- Health endpoint check: **PASS**
- `POST /api/auth/login`: **FAIL** — returned structured `NOT_FOUND` (defect #56 reported in the Sprint 2 report)

Do not count the Sprint 1 API checks as passing authentication, exam, evaluation, security, performance, or load requirements unless the test case explicitly verifies that requirement.

## Notes and follow-up

1. SRS Section 8 itself lists three initial RTM rows: EXAM-F-001, EXAM-F-010 and EXAM-NF-001. The additional rows above are expanded from the detailed requirement descriptions in SRS Sections 4, 5 and 5.1.2.
2. The STP uses a separate `OEP-*` feature-ID scheme in its examples. This RTM retains the SRS `EXAM-*` IDs rather than silently renaming or merging the two schemes.
3. Add test-case IDs for the question-bank, evaluation/results, admin, and security requirements after the team confirms the test design.
4. Update each status only from recorded execution evidence. Keep blocked, untested and failed requirements visible.
