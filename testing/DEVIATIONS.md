\# Performance Testing Deviations



\## Issue #32 — EXAM-NF-001



\### 1. Requirement



The SRS specifies that the 90th percentile (p90) API response time must be less than or equal to 2 seconds (2000 ms).



\### 2. Completed Testing



The initial local performance test was executed against:



\- \*\*Endpoint:\*\* `GET /api/health/`

\- \*\*Total measured requests:\*\* 100

\- \*\*Concurrency:\*\* 5

\- \*\*Successful responses:\*\* 100

\- \*\*Failed responses:\*\* 0

\- \*\*Average response time:\*\* 5.08 ms

\- \*\*Measured p90:\*\* 8.38 ms

\- \*\*Result for this test configuration:\*\* PASS



\### 3. Deviations and Pending Work



| ID | Deviation / Pending Work | Status |

|---|---|---|

| DEV-01 | Only the health endpoint was tested. Other key API endpoints remain untested. | Pending |

| DEV-02 | The 200-concurrent-user load scenario has not been executed. | Pending |

| DEV-03 | Protected question-management endpoints were excluded because valid test authentication and test data were not established. | Pending |

| DEV-04 | Sustained-load and deployment-environment performance have not been evaluated. | Pending |



\### 4. Impact



The current result confirms that the health endpoint meets the p90 threshold under the tested local configuration.



However, the complete performance requirement cannot yet be marked as fully verified because the remaining endpoints and the 200-concurrent-user scenario are pending.



\### 5. Follow-up Actions



1\. Arrange a suitable test database and valid test authentication.

2\. Identify and test additional key API endpoints.

3\. Execute the required 200-concurrent-user load test in an approved test environment.

4\. Record p90 response times and failures.

5\. Update this document with the final results and any additional deviations.





