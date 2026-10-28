# Sprint 2 Test Execution and Defect Tracking
## 1. Overview
- **Project:** Online Exam Portal
- **Sprint:** Sprint 2
- **Testing issue:** #34
- **Tester role:** Test Engineer
- **Environment:** Local development environment
- **Backend URL:** `http://localhost:3000`
## 2. Test Execution Results
| Test ID | Test scenario | Actual result | Status |
|---|---|---|---|
| S2-01 | Verify backend health endpoint | Returned `status: ok` | PASS |
| S2-02 | Verify login API endpoint exists | `POST /api/auth/login` returned `NOT_FOUND` with message `Route not found` | FAIL |
### Evidence for S2-02
- **Bug issue:** #56
- **Request ID:** `81d427b7-dbbd-4bae-8fb3-099dc4e881b5`
- **Endpoint:** `POST /api/auth/login`
The initial `curl.exe` attempt returned a JSON parsing error because the request body was malformed. It was not counted as a separate test.
## 3. Defect Tracking
### BUG-01: Login API endpoint returns 404
- **GitHub issue:** #56
- **Priority:** To be confirmed with the team
- **Status:** Open
- **Description:** The frontend expects a login API endpoint, but the backend returns a structured `NOT_FOUND` response.
- **Expected result:** The backend should provide the documented login functionality and return an appropriate authentication response.
- **Actual result:** `NOT_FOUND - Route not found`
## 4. Execution Summary
- **Checks executed:** 2
- **Passed:** 1
- **Failed:** 1
- **Execution pass rate:** 50%
**Requirement coverage:** Not yet calculated. The applicable Sprint 2 requirements must be mapped to executed tests before reporting requirement coverage.
## 5. Limitations and Next Steps
- Execute the remaining applicable Sprint 2 test cases.
- Verify registration, exam workflows, submission, evaluation, and results when the corresponding functionality is available.
- Confirm whether the login endpoint is in scope for this sprint.
- Retest the login endpoint after the defect is fixed.
- Update requirement coverage after verifying the requirements and test mapping.
This report records only the checks performed so far. It does not represent full application or requirement coverage.
