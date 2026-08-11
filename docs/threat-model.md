# Threat Model Design
## Internal SIH College Management & Intelligence Platform

This document describes the threat scenarios evaluated and resolved on the platform using the STRIDE threat modeling framework.

---

## 1. Threat Scenarios & STRIDE Mapping

| Threat Category | Threat Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **S**poofing | Attacker logs in using stolen credentials or intercepts sessions to pretend to be a Judge or SPOC. | High | Cryptographic bcrypt hashing on database passwords; JWT session tokens with short lifespans (e.g., 24 hours); secure token header checks on all API endpoints. |
| **T**ampering | Student updates their proposal to point to a malicious local script, or alters their team name to match another finalized team. | High | Backend input parser blocks dangerous file extensions (`.exe`, `.bat`, `.vbs`, etc.) and path traversals (`..`); database unique constraint `uq_event_team_name` enforces unique naming. |
| **R**epudiation | Coordinator changes a team's score to alter the selection ranking but denies making the modification. | Medium | All scorecard unlocks and score corrections write directly to an immutable `audit_logs` table, storing the actor, original scores, new scores, reasoning comment, and timestamp. |
| **I**nformation Disclosure | Student reads evaluation scores of another team before selection results are approved and published, or views private records of another college. | High | Multi-tenant isolation filters every database query by the authenticated user's `college` and `event_id`. Shortlists remain hidden until SPOC status is set to `RESULTS_PUBLISHED`. |
| **D**enial of Service | Attacker exhausts Gemini AI API limits, blocking the core hackathon submission and judging workflow. | Medium | The core hackathon workflows (registration, finalization, solution upload, evaluation, shortlisting) operate completely independent of the AI intelligence layer, falling back gracefully to mock advisory mode. |
| **E**levation of Privilege | Student calls SPOC endpoints directly (e.g., `POST /api/spoc/shortlisting/approve`) to publish their own team's nomination. | Critical | FastAPI dependencies explicitly verify the JWT payload's role claim on the backend (e.g., requiring SPOC role) before executing endpoint controllers. |

---

## 2. Secure Architecture Highlights

### 2.1. Prevention of BOLA / IDOR Attacks
- Every endpoint accepting resource IDs verifies that the target resource belongs to the current user's college tenant.
- E.g., `GET /api/student/team` will only return the team matching the student's authenticated session.

### 2.2. Secure Token Expiry
- Invitation tokens issued to coordinators or judges have a defined expiry window. Once used or expired, they are deactivated.
- Account suspensions are evaluated on every API request. If a SPOC suspends a user, their JWT is rejected immediately.
