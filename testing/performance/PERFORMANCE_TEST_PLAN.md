\# Performance Test Plan



\## 1. Objective



To evaluate API response time for the Online Exam Portal and verify the performance requirement EXAM-NF-001.



\*\*Requirement:\*\* The 90th percentile (p90) response time must be less than or equal to 2 seconds (2000 ms).



\## 2. Test Scope



\### Endpoint tested



| Endpoint | Method | Purpose |

|---|---|---|

| `/api/health/` | GET | Check API response time |



\### Test configuration



| Parameter | Value |

|---|---|

| Environment | Local development environment |

| Base URL | `http://localhost:3000` |

| Runtime | Node.js v24.19.0 |

| Testing tool | Node.js performance test script |

| Warm-up requests | 10 |

| Measured requests | 100 |

| Concurrency | 5 |

| Performance metric | 90th percentile response time (p90) |

| Acceptance threshold | p90 ≤ 2000 ms |



\## 3. Test Procedure



1\. Start the backend server using `npm start`.

2\. Verify the health endpoint returns HTTP 200.

3\. Execute the Node.js performance test script.

4\. Send 10 warm-up requests before measurement.

5\. Execute 100 measured requests in batches of 5 concurrent requests.

6\. Record response times for successful requests.

7\. Calculate the p90 response time using the nearest-rank percentile method.

8\. Compare the measured p90 against the 2000 ms threshold.

9\. Save the execution output in `performance-results.txt`.



\## 4. Test Results



The following results are from the recorded execution:



| Metric | Result |

|---|---:|

| Total requests | 100 |

| Successful requests | 100 |

| Failed requests | 0 |

| Concurrency | 5 |

| Average response time | 5.08 ms |

| p90 response time | 8.38 ms |

| Maximum allowed p90 | 2000 ms |

| Result | PASS |



\## 5. Evaluation



The tested health endpoint achieved a p90 response time of 8.38 ms, which is below the required 2000 ms threshold.



Therefore, the initial local performance test passed for the tested endpoint and configuration.



\## 6. Limitations and Pending Tests



\- Only the health endpoint was included in this execution.

\- Protected question-management endpoints were not tested.

\- The required 200-concurrent-user load scenario has not been executed.

\- Performance under sustained load has not been evaluated.

\- Results from a local development environment may differ from deployment-environment performance.



The overall EXAM-NF-001 requirement cannot be considered fully verified until the remaining key endpoints and required load scenarios are tested.



\## 7. Test Artifacts



\- `testing/performance/health-performance.mjs`

\- `testing/performance/performance-results.txt`

\- `testing/performance/PERFORMANCE\_TEST\_PLAN.md`





