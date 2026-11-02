# Sprint 1 test results

## Automated checks

| Command | Result |
|---|---|
| `cd backend && npm test` | Passed |
| `cd backend && npm run lint` | Passed |
| `cd frontend && npm run lint` | Passed |
| `cd frontend && npm run build` | Passed |

## Runtime acceptance

The following require MongoDB and must be run locally:

1. `npm run seed` from `backend`.
2. Register and log in using the API examples in [api.md](../api.md).
3. Execute the Sprint 1 cases in [sprint1.md](../test-cases/sprint1.md).

The repository does not claim the MongoDB acceptance cases as passed until they are executed against a running database.

The feature collection is [Sprint1_Feature_API_Tests.postman_collection.json](../../testing/postman/Sprint1_Feature_API_Tests.postman_collection.json).
It requires the seed data and a running backend. Run five wrong-password requests manually
against a seeded account to verify the `423` lockout response.
