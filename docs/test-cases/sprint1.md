# Sprint 1 test cases

| ID | Scenario | Expected result |
|---|---|---|
| TC-Auth-01 | Register with valid details | `201`; student user is returned without a password hash |
| TC-Auth-02 | Login with valid identifier/password | `200`; token, expiry, and role are returned |
| TC-Auth-03 | Login with five wrong passwords | First five attempts return `401`; subsequent attempt returns `423` |
| TC-QB-01 | Instructor creates a four-option question | `201`; question ID and version are returned |
| TC-QB-02 | Instructor edits and tags a question | `200`; version increases |
| TC-QB-03 | Instructor deletes a question | `204`; question is no longer listed |
| TC-QB-04 | Student calls question-bank API | `403` |
| TC-Sec-01 | Student navigates to an admin route | Frontend redirects to the student route |
