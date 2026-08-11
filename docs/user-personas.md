# User Personas
## Internal SIH College Management & Intelligence Platform

This document describes the key user personas interacting with the platform.

---

## 1. Student Persona: Aarav Mehta (Team Leader)
- **Role**: Student (3rd Year, Computer Science & Engineering)
- **Profile**: Technical team leader eager to participate in SIH. Comfort level with technology is high, but he finds administrative paperwork confusing.
- **Goals**:
  - Form a team of 6 compatible members with at least 1 female member.
  - Verify that none of his members are locked in other teams.
  - Search, filter, and match official SIH problem statements.
  - Upload his team's solution proposal PDF/PPT and GitHub link securely.
  - Check if his solution is compliant and ready for review.
- **Pain Points**:
  - Worrying that some team members might drop out or register with other teams, breaking his team status.
  - Finding out late that the selected problem statement was archived or edited.
  - Being locked out of editing his proposal due to deadline misunderstandings.

---

## 2. Coordinator Persona: Dr. Sunita Rao (SIH Event Coordinator)
- **Role**: Coordinator (Associate Professor, CSE Dept)
- **Profile**: Organizes the internal selection process. Multi-tasks between lectures, grading, and hackathon organization.
- **Goals**:
  - Monitor all registered and finalized teams within her department and college.
  - Enable or disable specific SIH problem statements for the event.
  - Assign judges to specific teams and track evaluation completeness.
  - Correct judge score errors (under strict audit constraints).
  - Draft and publish announcements for students and judges.
  - Propose the final nominated shortlist for SPOC approval.
- **Pain Points**:
  - Spending hours auditing spreadsheets to check for duplicate students or missing female members.
  - Dealing with judges who submit incorrect scores and lock their scorecards.
  - Managing student disputes over selection ranking and criteria.

---

## 3. Judge Persona: Rajesh Kumar (Industry Judge / Evaluator)
- **Role**: Judge (External Software Architect)
- **Profile**: Industry professional volunteering to evaluate hackathon projects. Limited time, prefers a clean and simple interface to score teams.
- **Goals**:
  - View a clean, isolated list of teams assigned to him for scoring.
  - Review team proposals, GitHub repositories, and prototype links.
  - Input scores based on a structured rubric (e.g. innovation, technical approach).
  - Submit the scorecard knowing it is locked and finalized once sent.
- **Pain Points**:
  - Cluttered dashboards showing teams he is not responsible for evaluating.
  - Unstructured feedback inputs that don't match the evaluation criteria.
  - Accidental double-submissions or score edits after finalizing evaluations.

---

## 4. SPOC Persona: Prof. K. V. Murthy (College SPOC)
- **Role**: SPOC (Head of Institution / Dean of Academics)
- **Profile**: The ultimate authority for the institution's SIH registration. Directs institutional compliance and coordinates with the central SIH office.
- **Goals**:
  - Issue coordinator and judge invitations.
  - Configure the core event settings (e.g. `spoc_approval_required`, team size).
  - View system-wide audit logs to trace any score corrections or manual unlocks.
  - Trigger and monitor SIH problem statement synchronizations.
  - Perform final review of the coordinator's nominated teams (approve or return with comments).
- **Pain Points**:
  - Risk of institutional disqualification due to compliance errors.
  - Unsanctioned score modifications that lead to complaints.
  - Direct result publication without administrative sign-off.
