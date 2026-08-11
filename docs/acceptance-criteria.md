# Acceptance Criteria
## Internal SIH College Management & Intelligence Platform

This document outlines the strict acceptance criteria for key platform workflows.

---

## 1. Separate Login Experience (Role Isolation)
### Scenario: Accessing a protected dashboard
- **Given** an unauthenticated user attempts to access `/student/dashboard`,  
  **Then** the router must redirect them to `/student/login`.
- **Given** an unauthenticated user attempts to access `/coordinator/dashboard`,  
  **Then** the router must redirect them to `/coordinator/login`.
- **Given** a Student attempts to access `/spoc/dashboard`,  
  **Then** the server must return a `403 Forbidden` response and redirect.

---

## 2. Team Finalization Validation
### Scenario: Triggering team finalization
- **Given** a team leader attempts to finalize their team,  
  **Then** the system must execute the following server-side checks in a single database transaction:
  1. **Team Size**: Must meet the event's configured size (e.g. exactly 6 members).
  2. **Gender Diversity**: Must contain at least the configured number of female members (e.g. at least 1).
  3. **Duplicate Memberships**: No member can be a part of another already finalized team.
  4. **Account Status**: All member student accounts must be `ACTIVE` and belong to the same college and event.
  5. **Unique Name**: The team name must be unique within the current event.
- **When** any validation check fails,  
  **Then** the entire finalization transaction must be rolled back, and no partial modifications must persist.

---

## 3. Submission URL & File Security
### Scenario: Uploading proposal links
- **Given** a student submits links for their project proposal (PDF, GitHub repository, prototype link),  
  **Then** the backend must validate:
  1. **HTTPS Protocol**: Reject links using `http://` or other insecure protocols.
  2. **Path Traversal**: Reject any URL containing path traversal sequences (e.g., `..`, `/etc/`, `%2e%2e`).
  3. **Dangerous Extensions**: Block upload of links pointing to files ending in `.exe`, `.bat`, `.cmd`, `.msi`, `.scr`, `.pif`, `.vbs`, or `.bin`.
- **When** validation fails,  
  **Then** the server must block the submission and return a `422 Unprocessable Entity` with a clear explanation.

---

## 4. Judge Scorecard Locking & Audit Logs
### Scenario: Submitting evaluation scorecard
- **Given** a judge submits a scorecard for a team,  
  **Then** the scorecard status must be set to `LOCKED` (submitted = True), and the judge must be blocked from subsequent updates.
- **Given** a Coordinator or SPOC unlocks a scorecard,  
  **Then** the action must require a mandatory non-empty comment, and the database must record the actor, timestamp, team, and reason.
- **Given** a Coordinator or SPOC performs a direct score override,  
  **Then** the system must create an immutable audit record containing:
  - Actor ID & role
  - Timestamp
  - Target evaluation ID
  - Pre-override score
  - Post-override score
  - Override justification reason

---

## 5. SPOC Shortlist Nominations
### Scenario: Shortlist publication approval
- **Given** `spoc_approval_required = true` in the event settings,  
  **Then** the coordinator cannot publish final results.
- **When** the coordinator submits the shortlist nominations,  
  **Then** the event status must change to `RESULTS_PENDING_APPROVAL` (or equivalent), and students must see nothing in the results section.
- **When** the SPOC returns the nominations with comments,  
  **Then** the status reverts, and the coordinator is notified.
- **When** the SPOC approves the nominations,  
  **Then** the event status changes to `RESULTS_PUBLISHED`, and results become visible to students.

---

## 6. Dynamic Problem Statement Sync
### Scenario: Syncing problems
- **Given** the SPOC triggers problem statement synchronization,  
  **Then** the sync service must record a log with:
  - `started_at`, `completed_at`, `duration`
  - Total `fetched`, `created`, `updated`, `unchanged`, and `unavailable` counts
  - Execution status (`SUCCESS` or `FAILED`)
- **When** official problem statements disappear from the source,  
  **Then** their status in the local DB must be updated to `UNAVAILABLE`, but historical team selection records must not be deleted.
