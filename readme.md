## Backend

Requirements: Node.js and a running MongoDB instance.

1. Open the backend folder: `cd backend`
2. Install packages: `npm install`
3. Copy `.env.example` to `.env` and set `MONGODB_URI` for your MongoDB.
4. Start the backend: `npm start`
5. Check the health endpoint at `http://localhost:3000/api/health`

To load Sprint 1 demonstration data, set `SEED_PASSWORD` if desired and run:

```text
npm run seed
```

The default local seed password is `Sprint1Pass123!`. Do not use it outside local development.

The API contract is documented in [docs/api.md](docs/api.md). Start the frontend separately with
`cd frontend`, `npm install`, and `npm run dev`.
