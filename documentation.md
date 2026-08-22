# Academic GPA/CGPA Result Management System

## 1. Overview

The Academic GPA/CGPA Result Management System is a pure-Python terminal application for managing academic results and calculating GPA and CGPA.

The system is responsible for:

- Calculating semester GPA
- Calculating cumulative CGPA
- Assigning grades and grade points
- Submitting student results
- Admin review and approval
- Result rejection
- Locking approved results
- Student access to approved results
- Academic summaries
- Local JSON-based storage

The system is designed as a result-management module that can later integrate with an existing school portal/backend.

---

## 2. Grading Scale

The application currently uses a configurable 5-point grading scale.

| Score | Grade | Grade Point |
|------:|:-----:|------------:|
| 70–100 | A | 5 |
| 60–69.99 | B | 4 |
| 50–59.99 | C | 3 |
| 45–49.99 | D | 2 |
| 40–44.99 | E | 1 |
| 0–39.99 | F | 0 |

The grading scale is defined as data so that it can be changed for another institution without changing the calculation logic.

---

## 3. GPA Calculation

For every course:

**Quality Point = Credit Unit × Grade Point**

Semester GPA is calculated as:

**GPA = Total Quality Points ÷ Total Credit Units**

Example:

| Course | Units | Grade | Grade Point | Quality Point |
|---|---:|---|---:|---:|
| Course A | 3 | A | 5 | 15 |
| Course B | 3 | B | 4 | 12 |
| Course C | 2 | B | 4 | 8 |

Total Quality Points = 35

Total Credit Units = 8

GPA:

**35 ÷ 8 = 4.375 → 4.38**

---

## 4. CGPA Calculation

CGPA is calculated using the total quality points and total credit units from all approved semesters.

**CGPA = Total Quality Points ÷ Total Credit Units**

The system does not simply average semester GPAs.

This is important because different semesters may carry different numbers of credit units.

---

## 5. Rounding Policy

The application uses academic half-up rounding to two decimal places.

Python's normal `round()` function uses banker's rounding, so the system instead uses `Decimal` with `ROUND_HALF_UP`.

Example:

```text
4.125 → 4.13
```

---

## 6. Academic Session and Semester

Lecturers do not manually select the student's academic session or semester.

The student's current registration determines:

- Academic session
- Semester
- Level
- Registered courses

Only courses belonging to the student's current registration can be submitted.

This prevents incorrect submissions and cross-semester course mixing.

---

## 7. Result Workflow

### Lecturer Workflow

1. Lecturer logs in.
2. Lecturer enters the student's matric number.
3. The system finds the student.
4. The system loads the student's current academic term.
5. The system displays the registered courses.
6. Lecturer enters scores.
7. The system calculates grades and grade points.
8. The system calculates the semester GPA.
9. Lecturer reviews the result.
10. Lecturer submits the result for approval.

A submitted result receives:

```text
PENDING
```

status.

### Admin Workflow

The admin can:

- View pending results
- Review results
- Approve results
- Reject results
- View approved results

An admin cannot approve or reject a result they personally submitted.

When a result is approved:

```text
PENDING → APPROVED
```

The result becomes locked and cannot be modified.

When a result is rejected:

```text
PENDING → REJECTED
```

The result can be corrected and resubmitted.

### Student Workflow

Students can:

- View their profile
- View approved semester results
- View academic history
- View total credit units
- View total quality points
- View current CGPA

Students only see approved results.

---

## 8. Registration Validation

The system validates that submitted results match the student's current academic registration.

It prevents:

- Wrong academic session
- Wrong semester
- Wrong level
- Unregistered courses
- Missing registered courses
- Mixing courses from different semesters

The lecturer does not manually determine the academic term for the result.

---

## 9. Architecture

The system separates the terminal interface, workflow logic, and GPA/CGPA calculation engine.

```text
main.py
   ↓
approval_service
   ↓
result_service
   ↓
app/services
   ↓
GPA / CGPA calculation engine
```

The GPA/CGPA calculation logic remains isolated from authentication, UI, and storage concerns.

---

## 10. Important Files

### `main.py`

Controls the terminal application and role-based menus.

### `services/result_service.py`

Handles result submission, retrieval, semester results, student academic history, and running CGPA.

### `services/approval_service.py`

Handles pending results, approval, rejection, reviewer permissions, self-review prevention, and result locking.

### `services/student_service.py`

Handles student and course-registration lookups.

### `services/auth_service.py`

Provides the current local authentication boundary.

Passwords are hashed using PBKDF2 with a random salt. Plain-text passwords are not stored.

### `services/storage.py`

Provides JSON-based storage.

### `app/services/gpa_service.py`

Contains semester GPA calculations.

### `app/services/cgpa_service.py`

Contains cumulative CGPA calculations.

### `app/core/grading.py`

Contains the configurable grading scale.

### `app/core/rounding.py`

Contains the academic half-up rounding policy.

### `app/core/validation.py`

Contains shared validation rules.

---

## 11. Data Storage

The standalone application currently uses JSON files:

```text
data/
├── users.json
├── students.json
├── courses.json
└── results.json
```

The final baseline has been cleared of demo accounts, demo students, demo registrations, and demo results.

The application starts clean and expects real user/student/registration data to be supplied by the appropriate school portal/backend.

---

## 12. Authentication Integration Boundary

The project does not implement public registration/signup.

The intended production architecture is:

```text
School Portal
      ↓
Existing Portal Authentication
      ↓
Student / Staff Identity
      ↓
GPA/CGPA Result Management System
```

The school's existing backend/portal should provide:

- User accounts
- Portal usernames
- Portal passwords
- Student records
- Academic sessions
- Semester information
- Course registrations

The GPA/CGPA module is responsible for result processing rather than replacing the school's portal.

---

## 13. Testing

The final cleanup completed with:

**79 tests passed, 0 failed**

Tests cover:

- GPA calculation
- CGPA calculation
- Grading
- Rounding
- Validation
- Current registration
- Semester restrictions
- Course registration matching
- Result submission
- Approval workflow
- Result rejection
- Result locking
- Student approved-result access
- Clean-seed behavior

The application also boots successfully to the main terminal menu and exits cleanly.

---

## 14. Security and Integrity Rules

The system includes:

- Password hashing rather than plain-text password storage
- Locked approved results
- Admin-only approval/rejection
- Self-approval prevention
- Approved-only CGPA calculation
- Registration-based academic term selection
- Course registration validation
- Removal of all demo accounts and demo academic data from the final baseline

---

## 15. Current Scope

The current system is intentionally focused on GPA/CGPA result management.

It does not currently implement:

- Public registration
- Web frontend
- FastAPI
- School portal authentication
- Full student management
- Production database integration
- Course registration management
- Payment processing

These responsibilities belong to the larger school portal/backend system.

---

## 16. Running the Application

From the project directory:

```powershell
python main.py
```

Run the automated tests:

```powershell
pytest
```

---

## 17. Project Status

The GPA/CGPA result-management module is complete for the current standalone baseline.

Final test status:

```text
79 passed, 0 failed
```

All demo identities and demo academic data were removed.

The final Git commit was:

```text
chore: finalize GPA CGPA system baseline
```

---

## 18. Production Integration Notes

Before production deployment, the following should connect to the school's existing systems:

1. Portal authentication
2. Student records
3. Academic session, semester, and level
4. Course registration data
5. Production database/storage

The GPA/CGPA calculation engine should remain isolated from these integration concerns.

---

## 19. Final Handoff

The project is a focused academic result-management module, not a complete school portal.

Its responsibility is to:

1. Receive valid student registration/course information.
2. Validate the registration.
3. Accept course scores.
4. Calculate grades and grade points.
5. Calculate semester GPA.
6. Submit results for admin approval.
7. Allow admin review and rejection/approval.
8. Lock approved results.
9. Calculate CGPA from approved academic history.
10. Present approved academic results to students.

Integration with the school's existing portal/backend should supply the real authentication and academic data.

## Integration Principle

> The GPA/CGPA engine should remain independent from authentication, UI, and database concerns.

The production portal should provide the authenticated user and valid academic registration data, while this module handles result processing, approval, locking, GPA, and CGPA.