# Performance Test Plan

## Objective

Evaluate API response time against EXAM-NF-001: p90 must be at most 2,000 ms.

## Scope and configuration

| Item | Value |
| --- | --- |
| Endpoint | `GET /api/health/` |
| Environment | Local development |
| Base URL | `http://localhost:3000` by default; override with `PERFORMANCE_BASE_URL` |
| Runtime | Node.js 24.19.0 |
| Warm-up requests | 10 |
| Measured requests | 100 |
| Concurrency | 5 |
| Percentile method | Nearest rank |
| Acceptance threshold | p90 <= 2,000 ms and no failed requests |

## Procedure

1. Start the backend with `npm start`.
2. If the backend is not at `http://localhost:3000`, set `PERFORMANCE_BASE_URL` to its base URL.
3. From the repository root, run `node testing/performance/health-performance.mjs`.
4. Save the output in `testing/performance/performance-results.txt`.

## Latest local result

| Metric | Result |
| --- | ---: |
| Measured requests | 100 |
| Successful responses | 100 |
| Failed responses | 0 |
| Failed warm-up requests | 0 |
| Concurrency | 5 |
| Average successful response time | 1.18 ms |
| p90 successful response time | 1.85 ms |
| Result for this endpoint/configuration | PASS |

This result covers only the health endpoint in the local environment. It does not verify the complete performance requirement.

## Limitations and pending work

- The required 200-concurrent-user scenario has not been executed.
- Protected endpoints and sustained load have not been tested.
- Deployment-environment performance has not been evaluated.
- The full EXAM-NF-001 requirement remains unverified until the remaining scenarios are run.

## Artifacts

- `testing/performance/health-performance.mjs`
- `testing/performance/performance-results.txt`
- `testing/performance/PERFORMANCE_TEST_PLAN.md`
