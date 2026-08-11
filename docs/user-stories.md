# User Stories
## Internal SIH College Management & Intelligence Platform

This document presents the core user stories mapped to the platform's features.

---

## 1. Student User Stories

### US-01: Team Creation & Invitation
> **As a** Student  
> **I want to** create a team and invite members from my college  
> **So that** we can collaborate on our project idea.
- **Benefit**: Ensures team boundaries are locked and only members of the same college participate.

### US-02: Search & Bind Problem Statements
> **As a** Student  
> **I want to** search and bind official SIH problem statements to my team  
> **So that** our submission is mapped to a valid, active SIH ID.
- **Benefit**: Prevents manual typing mistakes or selections of outdated problem statements.

### US-03: Proposal Submission & Link Security
> **As a** Team Leader  
> **I want to** upload our proposal links (PDF, PPT, GitHub repository)  
> **So that** judges can access our project work.
- **Benefit**: Ensures links are validated against malicious scripts or unsafe extensions.

### US-04: AI Solution Readiness Check
> **As a** Student  
> **I want to** request an AI check on my solution proposal  
> **So that** I get advisory tips on matching the problem description before final submission.
- **Benefit**: Improves team submissions without overriding the student's final choice.

---

## 2. Coordinator User Stories

### US-05: Judge Assignment
> **As a** Coordinator  
> **I want to** assign specific judges to evaluate specific teams  
> **So that** scoring duties are distributed and isolated.
- **Benefit**: Restricts judges from seeing or modifying unrelated teams.

### US-06: Scorecard Unlock & Overwrite
> **As a** Coordinator  
> **I want to** unlock a scorecard or overwrite a team's score with a mandatory reason  
> **So that** I can fix judging entry errors.
- **Benefit**: Keeps scoring records accurate while logging an immutable audit record.

### US-07: Propose Nominated Shortlist
> **As a** Coordinator  
> **I want to** submit a nominated shortlist of teams to the SPOC  
> **So that** the final nominations can be officially approved.
- **Benefit**: Separates administrative review from direct publication.

---

## 3. Judge User Stories

### US-08: Rubric-Based Scoring
> **As a** Judge  
> **I want to** view my assigned teams and score them based on a structured rubric  
> **So that** my evaluations are clear and consistent.
- **Benefit**: Automates average and weighted score calculation.

### US-09: Score Finalization & Lock
> **As a** Judge  
> **I want to** lock my scorecard after submitting my evaluation  
> **So that** my scores are immutable and cannot be tampered with.
- **Benefit**: Secures grading integrity.

---

## 4. SPOC User Stories

### US-10: Coordinator & Judge Provisioning
> **As a** SPOC  
> **I want to** create coordinator and judge accounts and issue secure activation tokens  
> **So that** only authorized staff can join the event administration.
- **Benefit**: Keeps college-level event management secure.

### US-11: Dynamic Problem Statement Sync
> **As a** SPOC  
> **I want to** trigger a crawler-based sync of official SIH problem statements  
> **So that** our database remains aligned with the official SIH portal.
- **Benefit**: Fetches additions and handles unavailable/archived problems.

### US-12: Nomination Review & Publication
> **As a** SPOC  
> **I want to** review nominated teams, and either approve them (publishing the results) or return them to the coordinator with feedback  
> **So that** the final selection conforms to institutional standards.
- **Benefit**: SPOC holds final publishing authority.
