# Performance Test Plan
## Objective
Evaluate API response time against EXAM-NF-001: p90 must be at most 2,000 ms.
## Scope and configuration
| Item | Value |
| --- | --- |
| Endpoint | `GET /api/health/` |
| Environment | Local development |
| Base URL | `http://127.0.0.1:3001` |
| Runtime | Node.js 24.19.0 |
| Server setup | Temporary Express server importing `app.js` directly; no MongoDB connection |
| Warm-up requests | 10 |
| Measured requests | 100 |
| Concurrency | 5 |
| Request timeout | 10,000 ms |
| Percentile method | Nearest rank |
| Acceptance threshold | p90 <= 2,000 ms and no failed requests |
## Procedure
1. Start the temporary local server using `node backend/performance-test-server.mjs`.
2. Open a second terminal at the repository root.
3. Set `PERFORMANCE_BASE_URL` to `http://127.0.0.1:3001`.
4. Run `node testing/performance/health-performance.mjs`.
5. Save the benchmark output in `testing/performance/performance-results.txt`.
6. Stop the temporary server after testing.
## Latest local result
**Test date:** 2026-11-05
| Metric | Result |
| --- | ---: |
| Measured requests | 100 |
| Successful responses | 100 |
| Failed responses | 0 |
| Failed warm-up requests | 0 |
| Concurrency | 5 |
| Total measurement time | 0.16 seconds |
| Average successful response time | 6.16 ms |
| p90 successful response time | 10.46 ms |
| Result for this endpoint/configuration | PASS |
The measured p90 of 10.46 ms is below the 2,000 ms threshold. No measured or warm-up requests failed.
## Limitations and pending work
- This benchmark covers only the health endpoint.
- Protected endpoints and complete exam workflows have not been performance-tested.
- The 200-concurrent-attempt scenario belongs to the separate load-testing work in Issue #33 and has not been executed here.
- Sustained-load behavior has not been evaluated.
- Deployment-environment performance has not been evaluated.
- This local health-endpoint result does not establish that the complete EXAM-NF-001 requirement is satisfied.
## Artifacts
- `testing/performance/health-performance.mjs`
- `testing/performance/performance-results.txt`
- `testing/performance/PERFORMANCE_TEST_PLAN.md`
