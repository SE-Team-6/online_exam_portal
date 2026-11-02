# Test Deviations — Online Exam Portal

**Project:** Online Exam Portal  
**Prepared by:** Test Engineer  
**Status:** Draft — confirm against the actual demo before submitting.

## 1. Purpose

This document records differences between the behavior and scope described in the SRS/STP and the functionality that has actually been demonstrated or verified. It must reflect the real demo. Do not describe a feature as implemented, missing or working unless the team has confirmed it.

## 2. Confirmed deviations from available test evidence

| ID | Planned requirement / behavior | Observed evidence | Impact | Current disposition |
|---|---|---|---|---|
| DEV-01 | Student authentication endpoint should accept login requests (SRS EXAM-F-001). | The Sprint 2 report records `POST /api/auth/login` returning structured `NOT_FOUND` / route not found. | Login API could not be verified through that check. | Linked defect #56 in the Sprint 2 report. Retest after the route is implemented or corrected. |
| DEV-02 | Functional exam workflow, registration, submission and results are within the SRS scope. | Sprint 1 execution log says registration is pending until the endpoint is implemented, and exam creation/submission/results are pending until endpoints are available. | These workflows are not demonstrated by the supplied execution evidence. | Confirm the current demo state with the development team; execute tests when available. |

## 3. Items requiring demo confirmation

The supplied documents do not establish whether the following items are implemented in the current demo. Mark each only after checking the actual demonstration:

| Area | SRS / STP expectation | Demo observation | Action |
|---|---|---|---|
| Authentication | Student/instructor authentication; secure password handling; account lockout and JWT/session behavior | **To be confirmed** | Record the exact screens/API behavior shown and any missing behavior. |
| Exam attempt and timer | Load randomized questions; server-side countdown; auto-submit at expiry | **To be confirmed** | Confirm whether timer and auto-submit are shown and tested. |
| Question bank | Create, edit, tag, delete, CSV import and version question banks | **To be confirmed** | List only the operations actually demonstrated. |
| Evaluation and results | Automatic grading, score/percentile calculation and results/analytics display | **To be confirmed** | Record actual grading and result behavior. |
| Admin dashboard | Schedule exams, monitor attempts, view audit logs and export reports | **To be confirmed** | Record available admin functions and omissions. |
| Non-functional requirements | ≤2-second p90 response time, 99.5% availability, 200 concurrent attempts, audit retention | **No qualifying results supplied** | Do not claim these targets are met without test reports. |

## 4. Scope exclusions stated in the SRS

The SRS Section 1.2 excludes proctoring/webcam invigilation and integration with external LMS platforms. These are scope exclusions, not implementation defects, unless the approved project scope has since changed.

The STP also excludes third-party services/infrastructure outside project scope and lists payment gateway and external email/SMS integration as excluded or not implemented.

## 5. Summary and approval

The only specific runtime deviation established by the supplied Sprint 2 evidence is the login API `NOT_FOUND` response. The Sprint 1 log also identifies registration and exam workflow items as pending at the time that log was written.

**Before finalizing this document:**
1. Compare every row with the latest demo build.
2. Replace each “To be confirmed” entry with the actual observed behavior, or remove it if not relevant.
3. Update defect references and statuses from GitHub.
4. Have the developer/team lead confirm that the document matches the demo.
5. Do not claim that security, performance, availability or load targets pass without test evidence.


## 6. Performance test evidence (Issue #32)

A local benchmark of GET /api/health/ recorded 100 measured requests at concurrency 5, with 100 successful responses, an average response time of 1.18 ms, and p90 of 1.85 ms. This result applies only to that endpoint and local configuration. The 200-concurrent-user scenario, protected endpoints, sustained load, and deployment-environment performance remain untested; EXAM-NF-001 is not fully verified.
