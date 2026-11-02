# Sprint 1 deviations

| Area | Deviation | Reason |
|---|---|---|
| Password hashing | Node `scrypt` is used instead of bcrypt. | Avoids adding a native dependency while preserving salted, computationally expensive password hashing. |
| Seed data | Seed credentials use `SEED_PASSWORD` or the documented local default. | Seed data is for local demonstration only and must not be used in production. |
| Student question responses | No student-facing question endpoint exists in Sprint 1. | Student exam delivery belongs to the later exam lifecycle scope. |

## Sprint 2 attempt API compatibility

The SAD routes are implemented as the canonical API: `POST /api/exams/{examId}/attempts` starts an attempt, and `PUT /api/attempts/{attemptId}/answers` saves a batch of answers. The earlier frontend contract remains available through `POST /api/attempts` with `examId` in the body and `PUT /api/attempts/{attemptId}/answers/{questionId}` for a single answer. Their wrapper response shapes are retained for compatibility. See [docs/attempt-api.md](docs/attempt-api.md) for request and response examples.
