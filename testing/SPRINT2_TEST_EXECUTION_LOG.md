# Sprint 2 Test Execution Log — Online Exam Portal
## 1. Execution Details
- Role: Test Engineer
- Branch: test/sprint-2-akasha
- Test date: 5 November 2026
- Backend command: npm test --prefix backend
- Framework: Node.js built-in test runner
- Lint: npm run lint --prefix backend
- Database: Isolated local MongoDB test database
## 2. Automated Test Results
| Test category | Executed | Passed | Failed |
|---|---:|---:|---:|
| Application/API | 8 | 8 | 0 |
| Exam attempt integration | 6 | 6 | 0 |
| Authentication integration | 2 | 2 | 0 |
| JWT | 6 | 6 | 0 |
| Password utilities | 5 | 5 | 0 |
| Total | 27 | 27 | 0 |
## 3. Test Coverage
- Health endpoint and JSON response handling.
- Malformed JSON and unsupported HTTP methods.
- Unique request IDs and structured 404 responses.
- Login validation and role-based access control.
- Student attempt creation and answer-key protection.
- Answer saving, ownership checks, and idempotency.
- Exam submission, grading, and concurrent retries.
- CSV question import validation.
- Deadline enforcement and automatic submission.
- Authentication lockout after repeated failed logins.
- Successful login resetting failed-login state.
- JWT signing, expiry, signature validation, and authorization.
- Password hashing and password verification.
## 4. Execution Summary
- Total tests: 27
- Passed: 27
- Failed: 0
- Skipped: 0
- Overall result: PASS
- Backend lint: PASS
## 5. Defects
No failures were reported during this automated test execution. This result applies only to the tested backend functionality and does not establish that the entire application is defect-free.
## 6. Evidence
- Terminal output showing 27 passing backend tests.
- Terminal output showing successful backend lint validation.
- Authentication integration test output showing 2 passing tests.
Execution date: 5 November 2026.
