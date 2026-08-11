# System Security Design
## Internal SIH College Management & Intelligence Platform

This document describes the security controls, validation checks, and data isolation strategies implemented in the system.

---

## 1. Authentication Security

- **Hashing Algorithm**: Cryptographic bcrypt hashing is applied to all user passwords before storage. Plaintext passwords are never stored in the database.
- **Session Tokens**: JWT (JSON Web Tokens) are generated upon successful login. Tokens expire after a configured duration (e.g., 24 hours).
- **Account Status Enforcements**:
  - `INVITED`: Requires activation using a secure single-use activation token.
  - `ACTIVE`: Allowed full API access corresponding to the role.
  - `DISABLED` / `SUSPENDED`: Denied authentication. Login and token verification endpoints return a `401 Unauthorized` response immediately.

---

## 2. Authorization & RBAC Isolation

Role-based access control is enforced at both the client and server layers:
- **Frontend guards**: React route components check JWT role credentials before loading pages.
- **Backend dependencies**: FastAPI dependencies (e.g., `get_current_active_student`, `get_current_active_coordinator`, etc.) inspect JWT claims and reject unauthorized roles with a `403 Forbidden` response.

### 2.1. Prevention of BOLA / IDOR Attacks
Every API endpoint that accepts an ID parameter (e.g., team ID, evaluation ID) performs ownership checks:
- **Student Profile**: Can only read/update their own profile or their own team's submissions.
- **Judge Profile**: Can only access and submit evaluations for teams assigned to them.
- **Data Scoping**: Queries strictly filter records by `event_id` and `college` corresponding to the active token payload.

---

## 3. Data Validation & Injection Controls

### 3.1. Secure Solution URL Parser
To prevent code execution or traversal attacks, all solution link submissions are evaluated on the backend:
1. **HTTPS Enforcement**: Rejected if the protocol is not `https://`.
2. **Blocked Extensions**: Explicitly rejects links pointing to executable or script files (`.exe`, `.bat`, `.cmd`, `.msi`, `.scr`, `.pif`, `.vbs`, `.bin`).
3. **Path Traversal Shield**: Regular expressions search for and block traversal signatures like `..`, `/etc/`, or URL-encoded equivalents (`%2e%2e`).

---

## 4. Audit Logging & Score Correction Integrity

Every sensitive administrative action writes to the `audit_logs` table:
- **Locking**: Scorecards submitted by judges are marked `submitted = True`, rendering them immutable.
- **Unlocking**: Requires an audit comment detailing the coordinator's reasoning.
- **Override Logging**: If a coordinator performs a direct score correction, the system inserts an audit log capturing:
  - Actor ID & role
  - Evaluation target
  - Original scores
  - Modified scores
  - Justification comment
  - Timestamp
