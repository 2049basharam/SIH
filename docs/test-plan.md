# Test Plan & Strategy
## Internal SIH College Management & Intelligence Platform

This document describes the quality assurance guidelines, test suites, and validation commands.

---

## 1. Quality Assurance Strategy

We use a two-tiered testing strategy:
1. **Unit Testing**: Focuses on database schema constraints, authentication rules, team finalization logic, and score lock validations.
2. **Integration / E2E Testing**: Validates the complete 11-stage Smart India Hackathon selection lifecycle from event draft setup to SPOC result approval and final publication.

Tests are run on an isolated SQLite database (`test_sih.db`) created and seeded automatically during test configuration setup.

---

## 2. Test Execution Commands

To execute the test suite, run the following command in the backend directory:
```bash
cmd.exe /c "set PYTHONPATH=.&& venv\Scripts\pytest"
```
To run tests with code coverage details:
```bash
cmd.exe /c "set PYTHONPATH=.&& venv\Scripts\pytest --cov=app tests/"
```

---

## 3. Test Suite Structure

### 3.1. Authentication Tests (`tests/test_auth.py`)
- Verifies registration of students and validation of roll numbers.
- Checks password hashing and verifies correct JWT token generation.
- Confirms that `DISABLED` and `SUSPENDED` user accounts are blocked from accessing protected endpoints.
- Verifies single-use coordinator and judge activation token validation.

### 3.2. Team Formation & Finalization (`tests/test_teams.py`)
- Validates the atomic finalization logic (size must be 6, female count >= 1).
- Confirms that a student cannot be a member of two finalized teams simultaneously.
- Tests that team name uniqueness is enforced at the database constraint level.

### 3.3. Solution Upload & URL Security (`tests/test_teams.py` / `tests/test_evaluation.py`)
- Simulates malicious link uploads containing path traversals (`..`) or dangerous executable extensions (`.exe`, `.bat`).
- Verifies the server returns `422 Unprocessable Entity` or `400 Bad Request` as expected.

### 3.4. Score Overrides & Judge Evaluation (`tests/test_evaluation.py`)
- Verifies that a judge's scorecard is locked automatically upon submission.
- Confirms that a judge cannot modify locked scorecards.
- Verifies that direct score corrections by coordinators log the edit details (original score, new score, actor, reason) inside the audit trail.

### 3.5. Lifecycle Integration Suite (`tests/test_workflow_e2e.py`)
- Simulates a full, 11-stage SIH selection lifecycle:
  1. SPOC creates an event.
  2. SPOC provisions coordinator and judge activation tokens.
  3. Student registers.
  4. Student forms and invites team members.
  5. Team is finalized.
  6. Problem statement is selected.
  7. Solution proposal is uploaded.
  8. Coordinator assigns judges.
  9. Judges evaluate and lock scorecards.
  10. Coordinator shortlists and submits nominations.
  11. SPOC approves nominations and publishes final results.

### 3.6. Playwright Frontend E2E Suite (`frontend/tests_e2e/auth.spec.ts`)
- **Test Command**: `npx.cmd playwright test` *(run inside `frontend/`)*
- **Verifies**:
  - Landing pages load correctly with accurate text and neumorphic components.
  - Smooth sliding transitions and height animations work on login/register toggles.
  - Links properly route to the coordinator, judge, and SPOC portals.

---

## 4. Security Authorization Test Matrix

Protected endpoints are evaluated against the following authorization matrix in the test suite:

| User Role | Student Endpoints | Coordinator Endpoints | Judge Endpoints | SPOC Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **Unauthenticated** | `401 Unauthorized` | `401 Unauthorized` | `401 Unauthorized` | `401 Unauthorized` |
| **Student** | `200 OK` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` |
| **Coordinator** | `403 Forbidden` | `200 OK` | `403 Forbidden` | `403 Forbidden` |
| **Judge** | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **SPOC** | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| **Wrong College** | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` |
| **Wrong Event** | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` |
