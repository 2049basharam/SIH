# Product Requirement Document (PRD)
## Internal SIH College Management & Intelligence Platform (v1.0.0)

---

## 1. Executive Summary & Objective

The **Internal SIH College Management & Intelligence Platform** is a centralized, secure, multi-tenant portal designed to streamline the end-to-end lifecycle of Smart India Hackathon (SIH) internal college selections. 

By replacing disjointed spreadsheets, forms, and documents, it provides a structured workspace for **Students**, **Coordinators**, **Judges**, and **SPOCs** (Single Point of Contact). The platform integrates a strict **Event Lifecycle State Machine**, secure **Team Finalization** rules, an **Official SIH Problem Statement Sync System**, and an explainable **AI Intelligence Layer** that offers advisory recommendations without making authoritative decisions.

---

## 2. Key Target Audience & Personas

The platform supports four primary roles, each isolated to their respective scope:
- **Student**: Registers profiles, joins or creates teams, selects problems, and submits solution proposals.
- **Coordinator**: Oversees events, assigns judges, reviews scores, performs score overrides (under audit), and recommends shortlisted teams to the SPOC.
- **Judge**: Reviews assigned team proposals and scores them according to a structured evaluation rubric. Scorecard becomes immutable after submission.
- **SPOC**: High-level administrator who manages coordinators, provisions judges, manages system parameters, triggers problem statements synchronization, views system-wide audit logs, and holds final selection approval authority.

---

## 3. Product Scope & Functional Requirements

### 3.1. Role-Based Portals & Separate Access
- Dedicated login routes (`/student/login`, `/coordinator/login`, `/judge/login`, `/spoc/login`).
- Student registration form (`/student/register`) with field validation.
- Block disabled or suspended accounts from authentication.

### 3.2. Event Lifecycle State Machine
Strict validation of API endpoints against the current status of the college event:
- **DRAFT / REGISTRATION_OPEN / TEAM_FORMATION**: Allows team setup and modification.
- **TEAM_FINALIZATION**: Locks team membership. Finalization requires strict constraints.
- **PROBLEM_SELECTION**: Restricts problem changes after the deadline.
- **SUBMISSION_OPEN**: Allows teams to upload solution links/files.
- **SUBMISSION_CLOSED / EVALUATION**: Freezes submissions; judge scoring becomes active.
- **SHORTLISTING**: Shortlist candidates are selected by Coordinators.
- **RESULTS_PENDING_APPROVAL / RESULTS_PUBLISHED**: Published nominations are displayed to students.

### 3.3. Secure Team Finalization Rules
Atomic team finalization checklist:
- Team size constraints (e.g. exactly 6 members).
- Minimum female member constraint (typically at least 1).
- Single-team membership: No student can be in more than one finalized team.
- Same college/event check.
- Active student profile validations (valid roll number, phone, email).
- Transactional database commit (either all succeed, or roll back).

### 3.4. Solution Upload & URL Security
- Validate that all uploaded links use the `https://` protocol.
- Perform backend validation of path traversal attempts (`..`, `/etc/`).
- Enforce strict extension filters: Block dangerous executable file extensions (`.exe`, `.bat`, `.cmd`, `.msi`, `.scr`, `.pif`, `.vbs`, `.bin`).

### 3.5. Problem Statement Synchronization
- Retrieve official problem statements dynamically from the official SIH portals.
- Provider abstraction: `OfficialSIHProvider`, `CachedProvider`, `MockProvider`.
- Maintain history of synclogs containing fetched, created, updated, and unavailable count tracking.
- Edition-aware metadata (e.g., separating SIH 2025 and 2026 problem statements).

### 3.6. Judge Evaluation & Score Overrides
- Judges are locked out from editing scores once submitted.
- Authorized Coordinators/SPOCs can unlock a scorecard with a mandatory reason.
- SPOCs/Coordinators can perform direct score corrections, storing the original score, new score, editor identity, timestamp, and modification reason in the audit logs.

### 3.7. SPOC Nomination Approval Workflow
- When `spoc_approval_required = true`, the coordinator cannot publish results directly.
- The coordinator proposes a candidate shortlist.
- The SPOC reviews the nominations, either approving them (which publishes the results) or returning them with feedback comments.

### 3.8. Explainable AI Intelligence Layer
- Provides advisory metrics: Problem statement explanation, problem-team compatibility, solution readiness checks, GitHub analysis, and AI announcement drafting.
- AI must NEVER make authoritative decisions, generate official IDs, or modify judge scores.
- Exposes reasoning, confidence levels (High/Medium/Low), and evidence.
- Safe failure modes: If the AI provider is unavailable, all core portal workflows must continue operating unaffected.

---

## 4. User Experience & Theme
- **Theme**: Neumorphic Soft UI design system.
- **Color Accent**: Saffron Orange, Tricolor Green, and Navy Blue.
- **Responsiveness**: Mobile-friendly layout.
- **Transitions**: Smooth sliding auth layouts that expand and collapse form heights dynamically to eliminate blank whitespace.

---

## 5. Security & Isolation Constraints
- Strict multi-tenant data isolation: College A cannot view or manipulate data belonging to College B.
- No storage of plaintext passwords (use bcrypt/hash).
- Session and token expirations are strictly enforced.
- Single-use invite tokens.
