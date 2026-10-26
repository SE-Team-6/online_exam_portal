\# Sprint 1 Test Execution Log — Online Exam Portal



\## 1. Execution Details



\- \*\*Role:\*\* Test Engineer

\- \*\*Branch:\*\* `test-enginner-akasha`

\- \*\*Test date:\*\* 26 October 2026

\- \*\*Backend test command:\*\* `npm test`

\- \*\*Framework:\*\* Node.js built-in test runner

\- \*\*Test file:\*\* `backend/test/app.test.js`



\## 2. Automated Backend Test Results



| Test ID | Test description | Result |

|---|---|---|

| TC-01 | Health endpoint returns HTTP 200 | PASS |

| TC-03 | Unsupported HTTP method returns 404 | PASS |

| TC-05 | Each request receives a unique request ID | PASS |

| TC-06 | Unknown route returns a structured 404 error | PASS |

| TC-07 | Malformed JSON returns HTTP 400 | PASS |

| TC-08 | Health endpoint returns JSON content type | PASS |



\## 3. Summary



\- Total automated tests executed: 6

\- Passed: 6

\- Failed: 0

\- Skipped: 0

\- Overall result: PASS



These results are based on the local `npm test` run. The backend tests verify the implemented health endpoint and basic HTTP error-handling behavior.



\## 4. Postman Testing Status



The Postman collection is being prepared for the currently implemented API routes.



\- Postman collection execution: Pending

\- Student registration testing: Pending until the registration endpoint is implemented and available

\- Exam creation, submission, and result testing: Pending until the corresponding endpoints are available



\## 5. Defects



No failures were reported in the six automated backend tests. This does not mean the entire application is defect-free. Further functional testing is required when the remaining features become available.



\## 6. Evidence



Attach screenshots of the terminal output showing the six passing automated tests and the Postman test results after execution.

