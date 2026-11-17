# Requirements Traceability Matrix (RTM) - Online Exam Portal
**Project:** Online Exam Portal
**Team:** 6
**Prepared by:** Test Engineer
**Last updated:** 17 November 2026
**Source:** `6_SRS_MiniProject.pdf` (Section 8, with requirement details from Sections 4-5) and `team6_TestPlan_MiniProject.pdf` (Sections 8, 13 and 14)
**Status:** Working draft - statuses reflect the available execution evidence.
## Status legend
- **N - Not tested:** No sufficient execution evidence exists.
- **P - Pass:** The mapped requirement has been verified by recorded test evidence.
- **F - Fail:** An executed test failed.
- **Partial:** Some, but not all, aspects of the requirement have been verified.
- **Blocked:** Cannot execute because the required feature or test environment is unavailable.
- **TBD:** Test-case mapping or evidence needs confirmation.
## Traceability matrix
| SRS requirement ID | Requirement summary | SRS section | Module | Test case(s) | Current status | Evidence / comments |
|---|---|---:|---|---|---|---|
| EXAM-F-001 | Authenticate users using email/username and password before granting access | 4.1; SRS Section 8 | Authentication | TC-Auth-01; SV-02 | Partial | On 2026-11-15, invalid credentials returned HTTP 401 `INVALID_CREDENTIALS`; a valid seeded-student email/password login subsequently succeeded through the API and browser on commit `0ce4ad7` using the isolated validation database. The email-based student path is verified; username-based login and all authentication scenarios are not. Historical Sprint 2 `NOT_FOUND` evidence remains in `docs/test-results/sprint2.md`. |
| EXAM-F-002 | Hash and salt passwords; never store or log plaintext passwords | 4.1 | Authentication / security | TC-Auth-02 | Partial | Backend password tests passed, including creation of a salted password hash. `backend/src/utils/password.js` uses Node.js scrypt with a random salt. Complete database-storage and plaintext logging verification remains outstanding. |
| EXAM-F-003 | Lock account after five consecutive failed login attempts and log the event | 4.1 | Authentication / security | TC-Auth-03 | Partial | Backend tests cover account lockout after five failed attempts and successful-login reset. Evidence that the lockout event is logged as required still needs confirmation. |
| EXAM-F-010 | Load exam questions in randomized order and start a server-side countdown timer | 4.2; SRS Section 8 | Exam / timer | TC-Exam-01; SV-05; SV-06 | Partial | On 2026-11-15, the student exam page displayed 10 questions and a visible countdown that decreased during the browser session. Randomized question order and server-side enforcement of the timer were not independently verified. |
| EXAM-F-011 | Auto-submit the exam when the timer expires and save answered questions | 4.2 | Exam / submission | TC-Exam-02; `backend/test/attempt.integration.test.js` | Partial | On 2026-11-17, both the late-save expiry test and background deadline-sweep test passed. The strengthened background test saved Option A before expiry and verified that it remained after automatic submission. It also verified the expiry timestamp and generated result. The attempt integration suite passed 9/9 and the full backend suite passed 38/38 on source commit `62c8d45`, using isolated database `oep_timer_validation_20261117`. The expiry worker is invoked directly in the test; live five-second scheduler execution and browser countdown reaching zero have not been verified end to end. |
| EXAM-F-020-EXAM-F-025 | Instructor question-bank management: create, edit, tag, delete, CSV bulk import and version question banks | 4.3 | Question bank / instructor | Frontend QuestionBank test; backend CSV import test | Partial / mapping needed | Backend CSV import validation and the frontend question-import API interaction test passed. The November 15 browser run was student-only. Create, edit, tag, delete, versioning and complete instructor workflows are not verified. Individual requirement-to-test mappings still need confirmation. |
| EXAM-F-030, EXAM-F-032-EXAM-F-034 | Automatically grade submissions, compute scores and display results/analytics | 4.4 | Evaluation / results | Attempt integration tests; SV-10; SV-11; SV-12 | Partial | Backend attempt integration tests cover grading and result behavior. On 2026-11-15, a student submitted the sample exam and the dashboard and detailed result page displayed 1/10 and 10.0%. The broader analytics and individual requirement mappings remain incomplete. |
| EXAM-F-031 | Compute a percentile against submitted attempts for the same exam | 4.4 | Evaluation / reporting | TC-Eval-04; SV-12 | P - Pass | `backend/test/attempt.integration.test.js`: 7/7 tests passed on 2026-11-15. Evidence includes cohort isolation and tied scores. The browser result page also displayed a percentile; the isolated browser database contained only one student attempt, so that display alone does not establish multi-student cohort behavior. |
| EXAM-F-040-EXAM-F-044 | Admin dashboard: schedule exams, monitor attempt counts, view audit logs and export result reports | 4.5 | Admin dashboard | TBD | N - Not tested / mapping needed | The available evidence does not verify all listed admin dashboard requirements. Individual test-case mappings and execution evidence are required. |
| EXAM-NF-001 | Exam page load and answer-submission response time <= 2 seconds for 90% of requests under normal load | 5; SRS Section 8 | Web UI / API performance | TC-Perf-01 | N - Not tested | The 2026-11-15 performance run tested only the local health endpoint: 100 requests, concurrency 5, p90 10.43 ms. This does not measure exam-page loading or answer submission, so it cannot establish this requirement. |
| EXAM-NF-002 | Availability >= 99.5% during scheduled exam windows | 5 | Operations / availability | Ops reports | N - Not tested | No availability monitoring report covering scheduled exam windows is available. |
| EXAM-NF-003 | Store passwords and session tokens securely; never store plaintext passwords | 5 | Security / authentication | TC-Sec-01 | N - Not tested | No complete security audit evidence is available for this requirement. |
| EXAM-NF-004 | Log exam attempts and submissions with timestamps and retain them for one academic year | 5 | Audit / data retention | TC-OPS-01 | N - Not tested | Timestamp and one-academic-year retention behavior have not been verified with recorded evidence. |
| EXAM-NF-005 | Support up to 200 concurrent exam attempts without degraded response time | 5 | Scalability / load | TC-Load-01 | N - Not tested | The 200-concurrent-attempt load test has not been executed. The health-endpoint test at concurrency 5 is not evidence for this requirement. |
| EXAM-SR-001 | Enforce HTTPS/TLS 1.2+ for client-server communication | 5.1.2 | Security / transport | TBD | N - Not tested | Production HTTPS/TLS configuration and protocol enforcement have not been verified. |
| EXAM-SR-002 | Hash and salt stored passwords using a strong algorithm | 5.1.2 | Security / authentication | TC-Auth-02; TC-Sec-01 | Partial | Password tests passed. Code inspection of `backend/src/utils/password.js` confirms Node.js scrypt and a randomly generated salt. Complete verification of database storage and all security requirements remains outstanding. |
| EXAM-SR-003 | Restrict question-bank and answer-key access to authorized instructor/admin roles | 5.1.2 | Authorization / question bank | Backend app and JWT/authorization tests | Partial | Backend tests include rejection of student access to the question bank, role enforcement and an attempt-start response that does not expose the answer key. All question-bank and answer-key operations have not been verified. |
| EXAM-SR-004 | Use signed, expiring JWTs and reject tampered tokens | 5.1.2 | Authentication / session | `backend/test/jwt.test.js` | P - Pass | The six JWT tests passed in the 2026-11-15 backend run. The execution output explicitly includes signing a token with user ID, role and expiry, rejecting a tampered signature, and rejecting an expired token. |
| EXAM-SR-005 | Log admin actions for audit purposes | 5.1.2 | Admin / audit | TC-OPS-01 (candidate) | TBD | Confirm that the mapped test verifies admin actions specifically and checks the required audit records. |
## Additional SAD Security-Control Verification
This implementation control is specified in SAD Section 3.9 and is recorded separately from the SRS requirement rows above.
| Design reference | Control | Test case | Status | Evidence / comments |
|---|---|---|---|---|
| SAD Section 3.9 | Limit API/login request rates and cap JSON request bodies at 1 MB | TC-Sec-03 | P - Pass | `backend/test/rateLimits.test.js` verifies the API request cap, login rate limit and identifier isolation. `backend/test/app.test.js` verifies oversized JSON returns HTTP 413. Targeted run: 12/12 tests passed on 2026-11-15. |
## Latest automated test execution summary
| Test suite | Result | Coverage |
|---|---|---|
| Backend | 38/38 passed; 0 failed; 0 skipped on 2026-11-17, source commit `62c8d45` | Lines 80.31%; branches 68.75%; functions 83.90%. Native Node coverage output does not provide an aggregate statement percentage. |
| Frontend | 12/12 passed across 4 test files; 0 failed | Statements 20.77%; branches 14.61%; functions 19.60%; lines 20.18%. |
| Manual student browser workflow | 12/12 documented checks passed on 2026-11-15, commit `0ce4ad7` | Local browser run using isolated validation database; see current system-validation evidence below. |
The backend row reflects the 17 November 2026 execution on commit `62c8d45`. The frontend and browser rows retain their separate 15 November 2026 evidence on commit `0ce4ad7`. These results do not mean that every SRS requirement in this matrix has passed.
## Execution evidence and limitations
### Sprint 1
The supplied Sprint 1 execution log records six automated backend checks as passed and five Postman checks as passed. These cover infrastructure and API behavior. They do not independently establish that the functional SRS requirements above have passed.
### Sprint 2 login route
The historical Sprint 2 report records:
- Health endpoint check: PASS.
- `POST /api/auth/login`: FAIL at the time; returned structured `NOT_FOUND` (defect #56).
A retest on 2026-11-15 returned HTTP 401 with error code `INVALID_CREDENTIALS` for invalid credentials. A later valid seeded-student login succeeded through the API and browser after duplicate backend processes were stopped and one backend was started with the isolated validation database. This verifies the email-based student login path on commit `0ce4ad7`. The original `NOT_FOUND` failure remains historical evidence; confirm the current GitHub status of issue #56 before closing it.
### Current student browser validation - 15 November 2026
**Tested repository commit:** `0ce4ad7`
**Database:** `oep_system_validation_20261115`
**Result:** 12 documented checks passed, 0 failed.
| Check | Observed evidence |
|---|---|
| Login page and student authentication | Login page rendered; valid seeded-student email/password login succeeded. |
| Student dashboard and exam listing | Dashboard loaded; Sprint 1 Sample Exam appeared as available. |
| Exam start and countdown | Ten questions displayed; visible countdown decreased during the session. |
| Answer save and navigation persistence | Save status displayed Saved; Question 5 Option B and Question 6 Option C were retained when navigating. |
| Exam submission | Successful-submission message appeared; answer and navigation controls were disabled. |
| Dashboard result update | Dashboard showed one completed attempt and a 10.0% average score. |
| Detailed results | Results page showed 1/10, 10.0%, and 100th percentile. |
The browser validation used a separate local MongoDB database, not the original `online_exam_portal` database. The isolated database contained one submitted student attempt; the displayed 100th percentile does not establish percentile behavior across a larger cohort. The Student Exam page appeared less styled than the dashboard; this is recorded as a visual consistency observation, not a functional failure.
This run did not test registration, administrator or instructor workflows, timer-expiry auto-submission, or large-cohort percentile behavior. The historical 7/7 browser run dated 2026-11-10 remains separate and is not included in the current 12-check result.
### Automatic expiry verification - 17 November 2026
**Source commit:** `62c8d45`
**Isolated database:** `oep_timer_validation_20261117`
- Targeted expiry tests: 2/2 passed.
- Complete `attempt.integration.test.js`: 9/9 passed.
- Complete backend test suite: 38/38 passed, 0 failed.
- The background expiry test saved Option A before expiry and confirmed that the answer remained in the submitted attempt.
- The test verified the submission timestamp and generated result.
- Code inspection confirmed an initial expiry sweep and a five-second recurring interval in `backend/src/server.js`.
The tests call `autoSubmitExpiredAttempts()` directly with an expired test fixture. They do not independently prove the live scheduler interval fires or that the browser automatically transitions at countdown zero. Therefore EXAM-F-011 remains Partial pending end-to-end verification.
### Current performance evidence
The 2026-11-15 local health-endpoint test recorded:
- Tested repository commit: `882cfd1`.
- Node.js: v24.19.0.
- Warm-up requests: 10.
- Measured requests: 100.
- Concurrency: 5.
- Successful responses: 100.
- Failed responses: 0.
- Average response time: 7.34 ms.
- p90 response time: 10.43 ms.
This result applies only to the tested local health endpoint and configuration. It does not establish exam workflow performance, sustained-load behavior, deployment availability, or support for 200 concurrent exam attempts.
## Notes and follow-up
1. SRS Section 8 itself lists three initial RTM rows: EXAM-F-001, EXAM-F-010 and EXAM-NF-001. The additional rows above are expanded from the detailed requirement descriptions in SRS Sections 4, 5 and 5.1.2.
2. The STP uses a separate `OEP-*` feature-ID scheme in its examples. This RTM retains the SRS `EXAM-*` IDs rather than silently renaming or merging the two schemes.
3. Add and confirm test-case IDs for question-bank, evaluation/results, admin and security requirements after the team confirms the test design.
4. Update each status only from recorded execution evidence. Keep partially verified, untested and failed requirements visible.
5. Do not treat unit-test suite totals or a health-endpoint performance result as proof that every functional or non-functional requirement has passed.
6. This RTM is a working QA document, not a final release sign-off.
