# REST API Design Specification
## Internal SIH College Management & Intelligence Platform

This document describes the API endpoints, authentication schema, and HTTP response statuses.

---

## 1. Authentication & Security Headers

All protected endpoints require a JWT token passed in the header:
```http
Authorization: Bearer <JWT_TOKEN>
```
The token payload contains:
- `sub`: User ID
- `email`: User email address
- `role`: Role (`student`, `coordinator`, `judge`, `spoc`)
- `college`: Organization name
- `exp`: Expiry timestamp

---

## 2. Core API Endpoints

### 2.1. Authentication Router (`/api/auth`)

#### Register Student
- **POST** `/api/auth/register/student`
- **Request Body**:
  ```json
  {
    "email": "student@college.edu",
    "password": "SecurePassword123",
    "student_id": "2026CSE042",
    "full_name": "Aarav Mehta",
    "gender": "M",
    "phone": "9876543210",
    "department": "CSE",
    "branch": "CSE",
    "year": 3,
    "college": "Narasaraopeta Engineering College"
  }
  ```
- **Responses**:
  - `201 Created` on success.
  - `400 Bad Request` if email or student ID already exists.

#### Login
- **POST** `/api/auth/login`
- **Request Body**:
  ```json
  {
    "username": "student@college.edu",
    "password": "SecurePassword123"
  }
  ```
- **Responses**:
  - `200 OK` returning access token and role.
  - `401 Unauthorized` on invalid credentials or disabled/suspended accounts.

---

### 2.2. Student Router (`/api/student`)

#### Finalize Team
- **POST** `/api/student/team/finalize`
- **Responses**:
  - `200 OK` on successful team locking.
  - `400 Bad Request` if size < 6, female count is 0, event deadline has passed, or any member is in another finalized team.

#### Submit Solution Proposal
- **POST** `/api/student/submission`
- **Request Body**:
  ```json
  {
    "project_title": "AI Agriculture Optimizer",
    "proposed_solution": "Description of solution stack...",
    "pdf_url": "https://drive.google.com/...",
    "ppt_url": "https://drive.google.com/...",
    "github_url": "https://github.com/...",
    "prototype_url": "https://my-app.com"
  }
  ```
- **Responses**:
  - `200 OK` on successful solution save.
  - `422 Unprocessable Entity` if links use insecure protocols (`http://`), contain path traversal (`..`), or end in executable extensions (`.exe`, `.bin`).

---

### 2.3. Coordinator Router (`/api/coordinator`)

#### Propose Shortlist Nominations
- **POST** `/api/coordinator/shortlisting/submit`
- **Responses**:
  - `200 OK` on shortlist proposal submission.
  - `400 Bad Request` if event state is not `SHORTLISTING`.

#### Unlock Scorecard
- **POST** `/api/coordinator/evaluations/{id}/unlock`
- **Request Body**:
  ```json
  {
    "reason": "Judge entered a score under the wrong rubric item"
  }
  ```
- **Responses**:
  - `200 OK` resetting scorecard state to editable.
  - `400 Bad Request` if unlock reason is empty.

#### Direct Score Correction
- **POST** `/api/coordinator/evaluations/{id}/correct`
- **Request Body**:
  ```json
  {
    "reason": "Administrative score adjustment due to copy error",
    "scores": {
      "criteria_id_1": 9.5,
      "criteria_id_2": 8.0
    }
  ```
- **Responses**:
  - `200 OK` updating score and appending audit log.

---

### 2.4. SPOC Router (`/api/spoc`)

#### Approve Shortlist (Publish Results)
- **POST** `/api/spoc/shortlisting/approve`
- **Responses**:
  - `200 OK` changing event status to `RESULTS_PUBLISHED`.

#### Return Shortlist
- **POST** `/api/spoc/shortlisting/return`
- **Request Body**:
  ```json
  {
    "reason": "shortlist lacks the required count of hardware projects"
  }
  ```
- **Responses**:
  - `200 OK` returning shortlist proposal to draft mode.

---

## 3. Standard HTTP Status Responses

- **`200 OK`**: Operation completed successfully.
- **`201 Created`**: Resource created successfully.
- **`400 Bad Request`**: Request violates state machine or domain business rules.
- **`401 Unauthorized`**: Missing, expired, or invalid JWT.
- **`403 Forbidden`**: Role guard failure or cross-college tenant isolation breach.
- **`404 Not Found`**: Resource does not exist.
- **`422 Unprocessable Entity`**: Malicious or invalid input parameters (e.g., path traversals, unsafe URLs).
