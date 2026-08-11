# Product Metrics
## Internal SIH College Management & Intelligence Platform

This document presents the actual calculated counts of system components, endpoints, database schemas, and capabilities based on the codebase.

---

## 1. System Inventory Metrics

| Component / Parameter | Calculated Count | Source / Details |
| :--- | :--- | :--- |
| **User Roles** | 4 | Student, Coordinator, Judge, SPOC. |
| **Frontend Pages / Views** | 30 | Defined in React Router (`App.tsx`). |
| **Backend Endpoints** | 86 | Scanned from `@router` calls in the routes directory. |
| **Database Tables** | 25 | Defined in SQLAlchemy models (`app/models.py`). |
| **Workflow Lifecycle States** | 12 | Event state machine transition stages. |
| **Automated Test Cases** | 11 | Complete test suites (including E2E master lifecycle integration test). |

---

## 2. Dynamic Features Inventory

### 2.1. AI Capabilities (8 Features)
1. **AI Problem Explainer**: Summarizes problem requirements for students.
2. **AI Problem Matcher**: Suggests problem statements based on team profile skillsets.
3. **AI Compatibility Analyzer**: Assesses team capability against a problem statement.
4. **AI Submission Readiness Check**: Reviews draft uploads against official guidelines.
5. **AI Judge Evidence Assistant**: Extracts summary bullet points from solution links.
6. **AI Log Anomaly Checker**: Evaluates audit logs for suspicious administrative entries.
7. **AI Announcement Drafter**: Formulates draft deadline notifications.
8. **AI Intelligence Analytics**: Generates predictive graphs on participation and performance.

### 2.2. Security Controls (8 Layers)
1. **Password Hashing**: Cryptographic bcrypt hashing on user credentials.
2. **JWT Security**: Signed JWT access tokens with 24-hour lifespans.
3. **Multi-Tenant Isolation**: Scopes all database queries by `college` and `event_id`.
4. **IDOR / BOLA Ownership Checks**: Checks resource ownership before executing operations.
5. **HTTPS URL Validator**: Rejects insecure solution proposal URLs.
6. **Path Traversal Filter**: Blocks directory traversal attempts (`..`, `%2e%2e`) in links.
7. **Executable Suffix Shield**: Rejects file links ending with dangerous extensions (`.exe`, `.bat`, etc.).
8. **Score Correction Audit Logs**: Logs all manual scorecard overrides with pre-override and post-override values, actors, and reasons.
