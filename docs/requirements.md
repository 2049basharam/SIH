# System Requirements Specification (SRS)
## Internal SIH College Management & Intelligence Platform

This document outlines the functional and non-functional requirements of the system.

---

## 1. Functional Requirements

### 1.1. User Identity & Authentication (FR-01)
- **Role Separation**: Support four isolated roles: `Student`, `Coordinator`, `Judge`, and `SPOC`.
- **Credential Storage**: Passwords must be hashed using bcrypt before database storage.
- **Access Control**: Route guards must check token payloads and roles on both frontend and backend.
- **Account Life-Cycle**: Reject authentication for accounts marked as `DISABLED` or `SUSPENDED`.

### 1.2. Event Lifecycle & Workflow State Machine (FR-02)
- Enforce status-based validations across all major API endpoints.
- Valid statuses: `DRAFT`, `REGISTRATION_OPEN`, `TEAM_FORMATION`, `TEAM_FINALIZATION`, `PROBLEM_SELECTION`, `SUBMISSION_OPEN`, `SUBMISSION_CLOSED`, `EVALUATION`, `SHORTLISTING`, `RESULTS_PENDING_APPROVAL`, `RESULTS_PUBLISHED`, `COMPLETED`.
- Prevent illegal transitions (e.g. bypassing evaluation directly to publication).

### 1.3. Multi-Tenant Data Isolation (FR-03)
- Restrict all data queries by `college` or `event_id` associated with the authenticated user's organization.
- Block Cross-College data access at the controller layer.

### 1.4. Hardened Team Finalization (FR-04)
- Enforce strict size constraints (exactly 6 members).
- Enforce gender balance checks (minimum 1 female member).
- Prevent duplicate memberships (no student in two finalized teams).
- Ensure all members are active and registered under the same college.
- Commit all changes inside an ACID database transaction.

### 1.5. Solution Link Validation (FR-05)
- Parse and validate URLs on the backend.
- Require the `https://` secure protocol.
- Reject path traversal sequences (`..`, `%2e%2e`).
- Reject executable extensions: `.exe`, `.bat`, `.cmd`, `.msi`, `.scr`, `.pif`, `.vbs`, `.bin`.

### 1.6. Scorecard Override & Correction Auditing (FR-06)
- Lock scorecards automatically when a judge submits them.
- Require a coordinator to submit a mandatory justification comment to unlock scorecards.
- Log overrides in the audit trail, storing the editor, timestamp, target, old score, and new score.

### 1.7. Problem Statement Synchronization (FR-07)
- Sync problems dynamically with official SIH portals.
- Provide a mock crawler option for local tests and development.
- Edition-aware selection: Track active versioning and status (`ACTIVE`, `UNAVAILABLE`).

### 1.8. AI Intelligence Advisory (FR-08)
- Provide advisory recommendations (compatibility, matching, solution analysis).
- Fallback gracefully when AI providers (Gemini API) are offline: core selection workflows must remain 100% operational.

---

## 2. Non-Functional Requirements (NFR)

### 2.1. Performance & Efficiency
- Optimise SQL queries to avoid N+1 issues (e.g. using `joinedload` on team lists and dashboards).
- Database responses for standard list endpoints must resolve in under 100ms.

### 2.2. Security & Compliance
- Enforce CORS rules restricting requests to the authorized domain.
- Use secure JWT tokens for session verification.
- Enforce strict input sanitization on all text fields.

### 2.3. Availability & Fault Tolerance
- Core hackathon stages (registration, submission, judging) must operate independently of external integrations (Gemini AI, crawlers).

### 2.4. Accessibility
- All primary portals must be navigable via keyboard (Tab index, visible focus states).
- Use high-contrast colors (meeting WCAG AA compliance) for all texts and statuses.
- Use semantic HTML tags (`<header>`, `<main>`, `<nav>`, `<section>`).
