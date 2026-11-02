# Sprint 1 API

The backend runs at `http://localhost:3000` and uses the `/api` prefix.
Protected requests use `Authorization: Bearer <token>`.

## Authentication

### Register

`POST /api/auth/register`

```json
{ "name": "Student", "email": "student@example.com", "password": "Password123!" }
```

Returns `201`:

```json
{ "user": { "id": "...", "role": "student" } }
```

### Login

`POST /api/auth/login`

```json
{ "identifier": "student@example.com", "password": "Password123!" }
```

Returns `200`:

```json
{ "token": "...", "expiresIn": "1h", "user": { "id": "...", "role": "student" } }
```

Invalid credentials return `401`; a locked account returns `423`.

## Question bank

All question-bank endpoints require an instructor or admin token.

- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `GET /api/admin/questions/:questionId`
- `PUT /api/admin/questions/:questionId`
- `DELETE /api/admin/questions/:questionId`

Create/update body:

```json
{
  "stem": "2 + 2 = ?",
  "options": [
    { "optionId": "a", "text": "3" },
    { "optionId": "b", "text": "4" },
    { "optionId": "c", "text": "5" },
    { "optionId": "d", "text": "6" }
  ],
  "correctOptionId": "b",
  "tags": ["math"],
  "difficulty": "Easy"
}
```

Every error uses:

```json
{ "error": { "code": "...", "message": "...", "requestId": "..." } }
```

## Question bank CSV import

Instructors and admins can import 1 to 500 questions at a time:

`POST /api/admin/questions/import`

```json
{
  "questions": [
    {
      "stem": "2 + 2 = ?",
      "options": [
        { "optionId": "a", "text": "3" },
        { "optionId": "b", "text": "4" },
        { "optionId": "c", "text": "5" },
        { "optionId": "d", "text": "6" }
      ],
      "correctOptionId": "b",
      "tags": ["math"],
      "difficulty": "Easy"
    }
  ]
}
```

The UI CSV headers are `stem,optionA,optionB,optionC,optionD,correctOptionId,tags,difficulty`. Separate multiple tags in a cell with semicolons. The importer validates every row before inserting any questions.

## Results and reporting

- `GET /api/student/results` returns only the authenticated student's submitted results, including percentage and exam cohort percentile.
- `GET /api/admin/results?limit=500` returns result rows, student/exam labels, percentiles and summary metrics. Admins and instructors can use it to filter and export reports.
- `GET /api/admin/audit-logs?limit=100` returns recent audit activity to admins.

The result percentile is the percentage of attempts in that exam with a score at or below the student's percentage. Tied scores share the same percentile.
