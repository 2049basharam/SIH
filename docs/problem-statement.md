# Real-World Problem Statement
## Centralizing and Hardening the Internal SIH Selection Process

---

## 1. Context & Background

The **Smart India Hackathon (SIH)** is India's largest national-level hackathon. Because each participating college is limited to nominating a restricted number of student teams (typically 30 teams: 25 software and 5 hardware), every institution must host an **Internal Hackathon** to select, evaluate, and shortlist their best teams.

Traditionally, this internal selection process is run manually using spreadsheets, emails, shared documents, and chat groups, leading to friction, compliance issues, and selection delays.

---

## 2. Key Pain Points & Operational Challenges

### 2.1. Compliance & Finalization Violations
- **Gender Balance Constraint**: Official SIH rules mandate at least one female member per team. Manual tracking often overlooks this, leading to last-minute disqualifications.
- **Duplicate Memberships**: Students frequently sign up on multiple teams to maximize their chances. When one team is finalized, the other teams become invalid.
- **Out of Scope Members**: Mixing students across colleges or registering inactive student accounts.

### 2.2. Problem Statement Desynchronization
- College coordinators manually copy-paste hundreds of problem statements from the official SIH portal.
- The official SIH portal frequently updates, archives, or adds problem statements. Manual copy-paste results in teams submitting solutions to outdated or non-existent problems.

### 2.3. Scoring Integrity & Transparency
- Judge evaluations are often untraceable. If a coordinator alters a score, there is no public reason, leading to allegations of bias.
- Judges sometimes modify scores after seeing other scores, leading to a lack of independent evaluation.

### 2.4. Data Isolation (Multi-College Leaks)
- In a shared college management portal, data belonging to one college or event must never leak to another.
- Students must not access other teams' solutions, evaluations, or unpublished shortlists.

### 2.5. Administrative Bottlenecks
- Shortlist publication must go through the college SPOC for final sign-off. If coordinators directly publish shortlists without review, it causes administrative embarrassment if corrections are required.

---

## 3. Product Vision & Goals

The **Internal SIH College Management & Intelligence Platform** acts as the single source of truth for the entire internal hackathon. It guarantees:
- **100% Rule Compliance**: Hard constraints on team registration (female count, domain validation, size) are locked server-side using ACID database transactions.
- **Zero Copy-Paste**: Dynamic crawler-based synchronization keeps problem statements aligned with the official SIH database.
- **Full Traceability**: Immutable audit logs record every sensitive action, including team unlocks, score corrections (storing old/new scores, actor, reason), and SPOC approvals.
- **Safe Multi-Tenancy**: Data isolation rules enforce strict checks on college and event ownership.
- **Advisory AI Assistance**: An intelligence layer assists in compatibility matching, solution checks, and announcements without overriding human authority.
