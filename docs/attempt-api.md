# Exam attempt API

Attempt endpoints require a valid JWT for a user with the `student` role. The backend clock is authoritative. Clients must use the returned `expiresAt` for display only; they cannot extend the deadline.

## Start an attempt

Canonical SAD route:

```http
POST /api/exams/{examId}/attempts
Authorization: Bearer <student-token>
```

No request body is needed. The server checks the exam schedule, starts the timer, shuffles the exam's questions, and stores the question order and answer key in the attempt snapshot.

Example response (`201 Created`):

```json
{
  "attemptId": "6650f38c0d570c96d1cf1042",
  "examId": "6650f2710d570c96d1cf1010",
  "status": "in_progress",
  "startedAt": "2026-11-02T14:00:00.000Z",
  "expiresAt": "2026-11-02T15:00:00.000Z",
  "durationSeconds": 3600,
  "questions": [
    {
      "questionId": "6650f2bd0d570c96d1cf1020",
      "stem": "Example question?",
      "options": [
        { "optionId": "A", "text": "First option" },
        { "optionId": "B", "text": "Second option" },
        { "optionId": "C", "text": "Third option" },
        { "optionId": "D", "text": "Fourth option" }
      ]
    }
  ]
}
```

The response never includes `correctOptionId` or other answer-key metadata. An exam's `endsAt` can shorten the attempt deadline when it is earlier than the configured duration.

## Save answers

Canonical bulk-save route:

```http
PUT /api/attempts/{attemptId}/answers
Authorization: Bearer <student-token>
Content-Type: application/json
```

Request:

```json
{
  "answers": [
    { "questionId": "6650f2bd0d570c96d1cf1020", "selectedOptionId": "B" },
    { "questionId": "6650f2bd0d570c96d1cf1021", "selectedOptionId": "D" }
  ]
}
```

Example response (`200 OK`):

```json
{
  "attemptId": "6650f38c0d570c96d1cf1042",
  "savedAt": "2026-11-02T14:15:22.000Z",
  "savedCount": 2
}
```

Saving the same question again replaces its saved selection. The server rejects saves for another student's attempt, for a question outside the attempt, after the deadline, or after finalization.

## Submit

```http
POST /api/attempts/{attemptId}/submit
Authorization: Bearer <student-token>
```

Example response (`200 OK`):

```json
{
  "attempt": {
    "attemptId": "6650f38c0d570c96d1cf1042",
    "examId": "6650f2710d570c96d1cf1010",
    "status": "submitted",
    "submittedAt": "2026-11-02T14:15:22.000Z",
    "score": 1,
    "maxScore": 2
  }
}
```

Submission grades the frozen answer-key snapshot and persists one result per attempt. Repeated or concurrent submission requests return the same saved result. A request received after expiry finalizes at the server's `expiresAt`; the background expiry sweep also finalizes and grades attempts when the browser is disconnected.

## Read a result

```http
GET /api/attempts/{attemptId}/result
Authorization: Bearer <student-token>
```

Example response (`200 OK`):

```json
{
  "result": {
    "attemptId": "6650f38c0d570c96d1cf1042",
    "examId": "6650f2710d570c96d1cf1010",
    "score": 1,
    "maxScore": 2,
    "submittedAt": "2026-11-02T14:15:22.000Z"
  }
}
```

Only the owner can read a result, and a result cannot be read before submission. Common error codes are `UNAUTHORIZED` (401), `FORBIDDEN` (403), `ATTEMPT_NOT_FOUND` (404), `ATTEMPT_EXPIRED` or `ATTEMPT_NOT_ACTIVE` (409), and validation-specific `INVALID_*` codes (400).

## Compatibility routes

The existing frontend uses these equivalent routes, which remain supported:

- `POST /api/attempts` with `{ "examId": "..." }` in the body to start an attempt. Its response is wrapped in `{ "attempt": ... }`.
- `PUT /api/attempts/{attemptId}/answers/{questionId}` with `{ "selectedOptionId": "..." }` to save one answer. Its response is wrapped in `{ "answer": ... }`.

The SAD routes above are the canonical API for new clients. Backend changes do not require frontend changes for these compatibility routes.
