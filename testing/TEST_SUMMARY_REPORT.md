# Test Summary Report — Online Exam Portal
**Project:** Online Exam Portal
**Team:** 6
**Prepared by:** Test Engineer
**Report date:** 15 November 2026
**Report status:** Updated interim QA report — not final release sign-off
## 1. Purpose
This report summarizes the available automated, API, frontend, manual browser, and performance test evidence. It distinguishes historical executions from the latest retests and does not claim that all planned requirements have passed.
## 2. Latest automated test execution
**Tested repository commit:** `0ce4ad7`
### 2.1 Backend
**Execution date:** 15 November 2026
| Metric | Result |
|---|---:|
| Tests executed | 32 |
| Passed | 32 |
| Failed | 0 |
| Skipped | 0 |
| Result | PASS |
The backend suite covers health and HTTP behavior, request IDs, authentication, account lockout, JWT validation, password hashing, authorization, exam attempts, answer saving, submission, grading, result percentiles, CSV import, deadlines, and rate limiting.
### 2.2 Backend coverage
Node.js native test coverage:
| Metric | Coverage |
|---|---:|
| Lines | 76.76% |
| Branches | 70.06% |
| Functions | 77.27% |
| Statements | Not reported as an aggregate by this native coverage output |
These figures apply to the backend test run only.
### 2.3 Frontend
**Execution date:** 15 November 2026
**Test runner:** Vitest 4.1.12
| Metric | Result |
|---|---:|
| Test files passed | 4 |
| Tests executed | 12 |
| Passed | 12 |
| Failed | 0 |
| Result | PASS |
The four test files cover question CSV utilities, protected routes, results display, and question-bank CSV import behavior.
### 2.4 Frontend coverage
| Metric | Coverage |
|---|---:|
| Statements | 20.77% |
| Branches | 14.61% |
| Functions | 19.60% |
| Lines | 20.18% |
Several frontend pages and services currently have no test coverage. Passing the existing 12 tests does not establish complete frontend validation.
Backend and frontend coverage are reported separately because they come from separate test runs and coverage tools.
## 3. Historical execution records
### 3.1 Sprint 1 automated backend tests
| Test | Historical result |
|---|---|
| TC-01 — Health endpoint returns HTTP 200 | PASS |
| TC-03 — Unsupported HTTP method returns 404 | PASS |
| TC-05 — Unique request ID | PASS |
| TC-06 — Unknown route returns structured 404 | PASS |
| TC-07 — Malformed JSON returns HTTP 400 | PASS |
| TC-08 — JSON content type | PASS |
Historical total: 6 executed, 6 passed, 0 failed.
### 3.2 Sprint 1 Postman checks
Historical total: 5 executed, 5 passed, 0 errors.
These checks overlap with the automated backend checks and must not be counted as 11 unique test cases.
### 3.3 Sprint 2 initial checks
| Test | Historical result |
|---|---|
| S2-01 — Health endpoint | PASS |
| S2-02 — POST /api/auth/login | FAIL — returned NOT_FOUND |
Historical total: 2 checks, 1 passed, 1 failed.
The initial failure is retained as historical evidence.
## 4. Authentication and system validation
### 4.1 Login route retest
**Retest date:** 15 November 2026
**Endpoint:** POST /api/auth/login
**Input:** Non-existent test email and invalid password
| Expected behavior | Actual result |
|---|---|
| Route responds and rejects invalid credentials | HTTP 401 Unauthorized |
| Structured error code | INVALID_CREDENTIALS |
| Error message | Invalid email or password |
**Retest result:** PASS — the login route responds and handles invalid credentials as documented.
This retest does not verify successful login with valid credentials, registration, or the complete authentication workflow.
The historical 404 result remains in the Sprint 2 record. Do not close defect #56 based only on this retest; confirm its current GitHub status with the team.
### 4.2 Current student browser validation
**Validation date:** 15 November 2026
**Tested repository commit:** `0ce4ad7`
**Frontend:** `http://localhost:5173/`
**Backend:** `http://localhost:3000`
**Database:** `oep_system_validation_20261115`
**Validation type:** Manual local browser workflow
| ID | Browser validation check | Observed result | Status |
|---|---|---|---|
| SV-01 | Login page renders | Login heading, email and password fields, Login button, and Register link displayed. | PASS |
| SV-02 | Valid student login | Seeded student account authenticated successfully and opened the student workspace. | PASS |
| SV-03 | Student dashboard | Dashboard loaded and displayed available, completed, and average-score cards. | PASS |
| SV-04 | Available exam listing | Sprint 1 Sample Exam appeared as available with a 30-minute duration. | PASS |
| SV-05 | Start exam and render questions | Exam page opened with question 1 of 10, answer options, and question navigator. | PASS |
| SV-06 | Countdown timer | Timer displayed 29:58 initially and decreased during the session. | PASS |
| SV-07 | Answer saving | Selected answers were saved; navigator showed answered questions and save status displayed Saved. | PASS |
| SV-08 | Previous-question persistence | Question 5 retained Option B after navigating away and returning. | PASS |
| SV-09 | Next-question persistence | Question 6 retained Option C after navigating away and returning. | PASS |
| SV-10 | Exam submission | Successful-submission message appeared and answer/navigation controls were disabled. | PASS |
| SV-11 | Dashboard result update | Dashboard showed one completed attempt, 10.0% average score, and the recent exam result. | PASS |
| SV-12 | Detailed result record | Results page displayed 1/10, 10.0%, and 100th percentile for the submitted attempt. | PASS |
**Current browser result:** 12 checks passed, 0 failed, for the documented student workflow on commit `0ce4ad7`.
The browser run used the separate local database `oep_system_validation_20261115`; the original `online_exam_portal` database was not selected for this run. The seed data contained one student attempt. Therefore, the displayed 100th percentile is an observation for a single-attempt dataset and does not establish percentile behaviour across a larger cohort.
A visual consistency observation was recorded: the Student Exam page appeared less styled than the dashboard, although the tested controls and workflow functioned. This is a UI observation, not a failed functional check.
The current browser run does not cover registration, administrator or instructor workflows, timer expiry and automatic submission, or broader cohort-percentile behaviour. The earlier November 10 browser evidence remains historical and is not included in the current 12-check result.
## 5. Performance evidence
**Test date:** 15 November 2026
**Tested repository commit:** 882cfd1
**Runtime:** Node.js v24.19.0
**Endpoint:** GET /api/health/
**Test environment:** Local repository HTTP harness
| Configuration / metric | Result |
|---|---:|
| Warm-up requests | 10 |
| Measured requests | 100 |
| Concurrency | 5 |
| Successful HTTP 200 responses | 100 |
| Failed requests | 0 |
| Average response time | 7.34 ms |
| p90 response time | 10.43 ms |
| Configured p90 threshold | 2,000 ms |
| Result for this endpoint and configuration | PASS |
This is a limited health-endpoint performance check. It does not establish that the complete exam workflow meets the response-time requirement.
The 200-concurrent-attempt load scenario has not been executed. Sustained load, production deployment performance, and availability targets remain unverified.
See `testing/performance/PERFORMANCE_TEST_PLAN.md` and `testing/performance/performance-results.txt`.
## 6. Requirements coverage and outstanding tests
Requirement coverage is not calculated as a single percentage because the complete mapping between planned requirements, test cases, and executed results is not yet established.
The following areas require additional evidence or remain unverified:
- Student registration remains untested. One valid seeded-student login and the documented student exam workflow passed in the November 15 browser run; this does not establish every authentication scenario.
- Full exam scheduling and all student exam workflow variants; one seeded student sample-exam workflow was validated on 15 November 2026.
- Timer expiry and automatic submission in required scenarios; the November 15 exam was submitted manually before timeout.
- Full instructor and administrator workflows.
- Production HTTPS/TLS configuration and verification.
- Production password-storage and security configuration.
- Audit logging and retention requirements.
- Availability target of at least 99.5%.
- Performance of complete exam workflows under expected usage.
- 200 concurrent exam attempts.
- Sustained load and deployment-environment validation.
Refer to `testing/RTM.md` for requirement-level status. Requirements without recorded test evidence must remain Not Tested or otherwise accurately qualified.
## 7. Defect summary
- Defect #56: Historical Sprint 2 login request returned NOT_FOUND.
- The 15 November invalid-credentials retest received HTTP 401 INVALID_CREDENTIALS.
- A separate valid seeded-student login subsequently succeeded through the API and browser after duplicate backend processes were stopped and one clean backend was started with the isolated validation database.
- The retest confirms route availability for this request but does not prove the entire login workflow.
- Current issue status and priority must be confirmed in GitHub.
- Defect density and defect aging are not calculated because a complete defect inventory and the required denominators and lifecycle dates are not available.
## 8. Exit criteria and release recommendation
The available evidence does not demonstrate that all planned test cases have been executed or that all functional and non-functional acceptance criteria have been met.
**Recommendation:** This report is an interim QA summary, not final release sign-off. Complete outstanding testing, update the RTM and defect records, and obtain the required review and approval before release.
## 9. Evidence references
- `testing/TEST_EXECUTION_LOG.md` — historical Sprint 1 execution.
- `docs/test-results/sprint2.md` — historical Sprint 2 checks and login route retest.
- `testing/RTM.md` — requirement-to-test mapping.
- `testing/performance/PERFORMANCE_TEST_PLAN.md` — performance configuration and limitations.
- `testing/performance/performance-results.txt` — latest recorded health-endpoint result.
- `backend/backend-test-output.txt` — backend test and coverage output.
- `frontend/frontend-test-output.txt` — frontend test and coverage output.
- `backend/backend-coverage-output.txt` — current backend file-level coverage output.
- `frontend/frontend-coverage-output.txt` — current frontend coverage output.
- `testing/reports/Unit Test Report.pdf` — current automated test execution report.
- `testing/reports/System Validation Report.pdf` — current browser validation, historical evidence, and limitations.
- `testing/reports/Combined Code and Branch Coverage Report.pdf` — current backend and frontend coverage details.
