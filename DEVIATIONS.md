# Sprint 1 deviations

| Area | Deviation | Reason |
|---|---|---|
| Password hashing | Node `scrypt` is used instead of bcrypt. | Avoids adding a native dependency while preserving salted, computationally expensive password hashing. |
| Seed data | Seed credentials use `SEED_PASSWORD` or the documented local default. | Seed data is for local demonstration only and must not be used in production. |
| Student question responses | No student-facing question endpoint exists in Sprint 1. | Student exam delivery belongs to the later exam lifecycle scope. |
