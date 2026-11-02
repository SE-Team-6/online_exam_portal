# Test Summary Report — Online Exam Portal

**Project:** Online Exam Portal  
**Team:** 6  
**Prepared by:** Test Engineer  
**Report status:** Working draft — based only on the execution evidence currently available  
**Reporting basis:** Software Test Plan (STP) Sections 8 and 14, plus the supplied Sprint 1 execution log and Sprint 2 test report.

## 1. Purpose

This report summarizes the test execution evidence available for the project. The STP Section 8 identifies the Test Summary Report as a test deliverable. STP Section 14 identifies reporting metrics including percentage of test cases executed, percentage passed/failed, defect density, defect aging and requirement coverage. It also calls for daily execution status and a final Test Summary Report.

This draft does not claim that the complete application or all planned test cases have been tested.

## 2. Test scope represented by the available evidence

The available execution records cover:
- Backend health and basic HTTP behavior.
- Request ID behavior.
- Unknown-route and malformed-JSON handling.
- JSON response content type.
- A Postman check of the same basic API behavior.
- A Sprint 2 login API availability check.

The records do not establish completion of end-to-end student registration, exam attempts, timer expiry, answer submission, automatic evaluation, result display, question-bank management, admin monitoring, security, performance or load testing.

## 3. Execution results

### 3.1 Sprint 1 — automated backend tests

| Test / check | Result |
|---|---|
| TC-01 — Health endpoint returns HTTP 200 | PASS |
| TC-03 — Unsupported HTTP method returns 404 | PASS |
| TC-05 — Unique `X-Request-Id` | PASS |
| TC-06 — Unknown route returns structured 404 | PASS |
| TC-07 — Malformed JSON returns HTTP 400 | PASS |
| TC-08 — JSON content type | PASS |

**Recorded total:** 6 executed, 6 passed, 0 failed, 0 skipped.  
**Pass rate:** 100% of these six executed checks.

### 3.2 Sprint 1 — Postman checks

| Test / check | Result |
|---|---|
| TC-01 — Health endpoint returns HTTP 200 | PASS |
| TC-02 — Unknown route returns 404 | PASS |
| TC-03 — Unsupported method returns 404 | PASS |
| TC-04 — Malformed JSON returns 400 | PASS |
| TC-05 — JSON content type | PASS |

**Recorded total:** 5 executed, 5 passed, 0 failed, 0 errors.  
**Pass rate:** 100% of these five executed checks.

The automated backend and Postman totals are separate executions. Do not add them together as 11 unique test cases because some checks overlap.

### 3.3 Sprint 2 — recorded checks

| Test / check | Result | Notes |
|---|---|---|
| S2-01 — Health endpoint | PASS | Returned `status: ok`. |
| S2-02 — `POST /api/auth/login` | FAIL | Returned structured `NOT_FOUND` / route not found. Defect #56 is recorded in the Sprint 2 report. |

**Recorded total:** 2 checks, 1 passed, 1 failed.  
**Pass rate:** 50% of the two recorded Sprint 2 checks.

The initial malformed `curl.exe` attempt noted in the Sprint 2 report was not counted as a test execution.

## 4. Consolidated view

| Execution record | Executed checks | Passed | Failed | Skipped / errors | Pass rate |
|---|---:|---:|---:|---:|---:|
| Sprint 1 automated backend | 6 | 6 | 0 | 0 | 100% |
| Sprint 1 Postman | 5 | 5 | 0 | 0 | 100% |
| Sprint 2 | 2 | 1 | 1 | 0 | 50% |

These figures are per execution record, not a count of unique requirements covered. The records do not provide a reliable overall requirement-coverage percentage.

## 5. Defect summary

- **Defect #56:** `POST /api/auth/login` returned a structured `NOT_FOUND` response in the Sprint 2 check.
- **Status / priority:** Refer to the current GitHub issue for the latest status and priority; this report does not assume it has been fixed.
- The Sprint 1 log reported no defects in the six automated backend checks.
- The Sprint 1 log also records registration as pending until the endpoint is implemented, and exam creation/submission/results as pending until endpoints are available.

Defect density and defect aging are not calculated in this draft because the supplied execution records do not provide the necessary complete defect inventory, code-size denominator or defect lifecycle dates.

## 6. Requirement coverage

Requirement coverage is **not yet calculated**. The Sprint 2 report explicitly says requirements must first be mapped to executed tests. The RTM should be used to establish which SRS requirements have test cases and which of those tests have actually been executed.

Passing basic health/HTTP checks does not demonstrate that authentication, exam workflow, grading, security, performance or load requirements pass.

## 7. Outstanding testing

The following areas need test execution evidence before final sign-off:
- Student registration and authentication, including the login defect retest.
- Exam loading, randomized questions, server-side timer and auto-submission.
- Question-bank management and authorization.
- Answer submission, automatic grading, scores, percentile and results display.
- Admin scheduling, monitoring, audit logs and report export.
- Security requirements, including HTTPS/TLS, password storage and JWT validation.
- Performance target: 90th percentile response time ≤ 2 seconds.
- Availability target: ≥ 99.5% during scheduled exam windows.
- Load target: 200 concurrent exam attempts.

## 8. Exit criteria and release recommendation

The STP states exit criteria of 100% of planned test cases executed, zero open critical defects and acceptance criteria satisfied. The available evidence does not demonstrate that these exit criteria have been met.

**Recommendation:** Treat this as an interim test summary, not final QA sign-off. Complete the outstanding functional and non-functional testing, update the RTM and defect records, and then issue the final summary report.

## 9. Evidence references

- `testing/TEST_EXECUTION_LOG.md` — Sprint 1 automated backend and Postman results.
- `docs/test-results/sprint2.md` — Sprint 2 health and login API checks.
- `testing/RTM.md` — requirement-to-test mapping and current status.
- GitHub defect #56 — login API route issue (verify current state before final submission).
