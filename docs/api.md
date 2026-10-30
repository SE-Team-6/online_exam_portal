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
