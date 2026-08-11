# Release Notes (v1.0.0)
## Internal SIH College Management & Intelligence Platform

**Release Date**: 2026-08-11  
**Edition**: Production Hardened Release  

---

## 1. Key Deliverables & Features

### 1.1. Role-Based Login & Portals Separation
- Created isolated authentication views for all roles:
  - `/student/login`: Integrates student profile registration.
  - `/coordinator/login`: Coordinator login.
  - `/judge/login`: Judge evaluation view.
  - `/spoc/login`: SPOC administrator dashboard.
- Integrated a **dynamic sliding transition** between the Login and Registration screens on the student portal, with auto-resizing height transitions to prevent empty padding space.

### 1.2. Strict Event State Machine Validation
- Enforced server-side checks restricting API endpoints to correct event lifecycle stages:
  - Prevents updating teams after the **TEAM_FINALIZATION** stage is closed.
  - Locks submissions once the **SUBMISSION_CLOSED** stage starts.
  - Prevents premature publication of results prior to the **RESULTS_PENDING_APPROVAL** SPOC review stage.

### 1.3. Hardened Team Finalization Constraints
- Rejects team finalization attempts if:
  - Member count is not exactly 6.
  - Female member count is 0.
  - Any member is already registered in another finalized team.
  - Member profiles contain empty roll numbers or invalid contacts.
- Commits finalizations inside atomic database transactions.

### 1.4. Inbound Link Security Filters
- Backend checks reject solution proposal URLs that do not use `https://`.
- URL scanner blocks directory traversal attempts (`..`, `%2e%2e`) and unsafe file extensions (`.exe`, `.bat`, `.cmd`, `.msi`, `.scr`, `.pif`, `.vbs`, `.bin`).

### 1.5. SPOC Nomination & Score Correction Audits
- Added a score lock mechanism that renders scorecard evaluations immutable once submitted by a judge.
- Integrated a scorecard unlock workflow requiring coordinators to input a justification.
- Enabled direct score corrections by SPOCs and coordinators. The system automatically records the original scores, override values, editor identity, and justification in the audit trail.
- Implemented the SPOC review approval/return workflow for shortlists when `spoc_approval_required = true`.

### 1.6. Dynamic SIH Problems Crawler
- Abstraction layer supporting crawler syncs.
- Synced records track version status (`ACTIVE` vs. `UNAVAILABLE`). If a problem statement is archived or deleted from the official portal, local historical team mapping remains preserved.

### 1.7. Explainable AI Advisory fallbacks
- Integrates Google Gemini API recommendations.
- Safe failure fallbacks: Suppresses advisor widgets when external AI providers are offline, allowing all core hackathon processes to continue operating cleanly.

---

## 2. Bug Fixes & Optimization Updates
- **N+1 SQL Queries**: Resolved query loops on the coordinator analytics page by appending database pre-joins (`joinedload`).
- **Domain Link Rejections**: Fixed a bug where solution link checks rejected URLs containing domain keywords like `github.com`. The filter now targets only trailing file suffixes.
- **SQLite Database Locks**: Changed background crawl loops from raw python threads to FastAPI's native `BackgroundTasks` to prevent thread starvation or SQLite DB lockups.
