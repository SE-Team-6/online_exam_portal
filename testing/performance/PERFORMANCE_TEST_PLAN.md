# Performance Test Plan
## Objective
Evaluate API response time against the EXAM-NF-001 target of p90 <= 2,000 ms. This run measures only the health endpoint and is not sufficient to declare the full requirement satisfied.
## Scope and configuration
| Item | Value |
| --- | --- |
| Endpoint | `GET /api/health/` |
| Environment | Local development |
| Base URL | `http://127.0.0.1:3001` |
| Test date | 2026-11-15 |
| Tested repository commit | `882cfd1` |
| Runtime | Node.js `v24.19.0` |
| Server setup | Repository-local HTTP harness importing the application directly; no MongoDB connection |
| Warm-up requests | 10 |
| Measured requests | 100 |
| Concurrency | 5 |
| Request timeout | 10,000 ms |
| Percentile method | Nearest rank |
| Acceptance threshold | p90 <= 2,000 ms and no failed requests |
## Procedure
1. Start the local server using `node backend/performance-test-server.mjs`. It listens on `127.0.0.1:3001` by default.
2. Open a second terminal at the repository root.
3. Set `PERFORMANCE_BASE_URL` to `http://127.0.0.1:3001`.
4. Run `node testing/performance/health-performance.mjs`.
5. Save the benchmark output in `testing/performance/performance-results.txt`.
6. Stop the temporary server after testing.
## Latest local result
**Test date:** 2026-11-17
**Commit:** `af700d4`
**Runtime:** Node.js `v24.19.0`
| Metric | Result |
| --- | ---: |
| Warm-up requests | 10 |
| Measured requests | 100 |
| Successful responses | 100 |
| Failed responses | 0 |
| Failed warm-up requests | 0 |
| Concurrency | 5 |
| Total measurement time | 0.20 seconds |
| Average response time | 7.45 ms |
| p90 response time | 13.87 ms |
| p90 threshold | 2,000 ms |
| Result for this endpoint/configuration | PASS |
The measured p90 is below the configured threshold, and no measured or warm-up requests failed. This result applies only to the local health endpoint and this test configuration.
## Limitations and pending work
- This benchmark covers only `GET /api/health/`.
- Protected endpoints and complete exam workflows have not been performance-tested.
- The 200-concurrent-attempt scenario belongs to the separate load-testing work in Issue #33 and has not been executed here.
- Sustained-load behavior has not been evaluated.
- Deployment-environment performance has not been evaluated.
- This local health-endpoint result does not establish that the complete EXAM-NF-001 requirement is satisfied.
- Do not report EXAM-NF-005 or the 200-concurrent-attempt target as passed based on this benchmark.
## Artifacts
- `testing/performance/health-performance.mjs`
- `backend/performance-test-server.mjs`
- `testing/performance/performance-results.txt`
- `testing/performance/PERFORMANCE_TEST_PLAN.md`
