# CIT Scheduler - Comprehensive Test & Validation Report

## Executive Summary
The **CIT Scheduler** platform was subjected to complete static and runtime verification, unit and integration testing, full constraint solving, and official compliance evaluation.

**Overall Verdict: EXCELLENT / PRODUCTION-READY**
- **Test Suite:** 28 / 28 Passed (100% pass rate)
- **Official Validator (Baseline):** 0 Hard Violations, 3 Soft Penalty (Optimal)
- **Official Validator (Post-Disruption):** 0 Hard Violations, 3 Soft Penalty
- **Disruption Stability:** Minimal impact (only 7 sessions relocated out of 189 total; 6 were room-only reassignments)
- **Frontend & Build:** Clean TypeScript compilation & Vite production build without errors.

---

## 1. Automated Test Results (`pytest`)

```text
============================= test session starts =============================
platform win32 -- Python 3.13.3, pytest-9.2.0, pluggy-1.7.0
rootdir: backend
collected 28 items

tests/test_api.py::test_requires_auth PASSED                             [  3%]
tests/test_api.py::test_club_cannot_generate_import_or_approve PASSED    [  7%]
tests/test_api.py::test_booking_needs_confirmation PASSED                [ 10%]
tests/test_api.py::test_no_self_approval_and_cross_role PASSED           [ 14%]
tests/test_api.py::test_admin_own_booking_cannot_self_approve PASSED     [ 17%]
tests/test_api.py::test_faculty_only_own_unavailability PASSED           [ 21%]
tests/test_api.py::test_manual_move_cannot_break_hard_constraints PASSED [ 25%]
tests/test_api.py::test_assistant_works_without_api_key PASSED           [ 28%]
tests/test_core.py::test_validator_wrapper_flags_empty PASSED            [ 32%]
tests/test_core.py::test_fixture_timetable_is_hard_valid PASSED          [ 35%]
tests/test_core.py::test_booking_engine_passes_official_booking_rules PASSED [ 39%]
tests/test_core.py::test_cancelled_never_approved_and_impossible_rejected PASSED [ 42%]
tests/test_core.py::test_role_cap_applied PASSED                         [ 46%]
tests/test_core.py::test_institute_event_outranks_club_on_same_room PASSED [ 50%]
tests/test_core.py::test_nonexistent_requested_room_is_noted PASSED      [ 53%]
tests/test_core.py::test_week_blocks_hard_violations PASSED              [ 57%]
tests/test_core.py::test_nlp_english_hinglish PASSED                     [ 60%]
tests/test_core.py::test_nlp_asks_followup_when_essentials_missing PASSED [ 64%]
tests/test_core.py::test_nlp_mandatory_groups PASSED                     [ 67%]
tests/test_core.py::test_disruption_validation_and_noop PASSED           [ 71%]
tests/test_core.py::test_disruption_diff_reasons_cite_real_violations PASSED [ 75%]
tests/test_core.py::test_diagnose_names_overloaded_faculty PASSED        [ 78%]
tests/test_core.py::test_explain_slot_uses_real_counts PASSED            [ 82%]
tests/test_solver.py::test_all_189_scheduled_zero_hard PASSED            [ 85%]
tests/test_solver.py::test_exams_all_41_valid PASSED                     [ 89%]
tests/test_solver.py::test_full_schedule_with_bookings PASSED            [ 92%]
tests/test_solver.py::test_sample_disruption_minimal_moves PASSED        [ 96%]
tests/test_solver.py::test_infeasible_reports_reason PASSED              [100%]

======================== 28 passed in 367.61s (0:06:07) ========================
```

---

## 2. Official Validator Results (`official/validator.py`)

### Baseline Schedule (`exports/schedule.json`):
- **Dataset:** `cit-public-v1`
- **Hard Violations:** **0**
- **Soft Penalty:** **3** (`{'S1': 0, 'S2': 0, 'S3': 0, 'S4': 3, 'S5': 0, 'S6': 0}`)
- **Spectra Bookings:** Score `67.0` | Approved `22`, Alternatives `1`, Rejected `2`, Priority Inversions `0`
- **Midsem Exams:** 41 exams scheduled at 50% capacity, **Soft penalty: 0**

### Post-Disruption Schedule (`exports/schedule_after.json`):
- **Disruption Input:** `examples/sample_disruption.json`
- **Hard Violations:** **0**
- **Soft Penalty:** **3**
- **Stability:** **7 sessions moved** (only 1 time change, 6 room-only shifts)
- **Detailed Relocations with Explanations:**
  - `CS202-T2` added: None -> (`TUE`, P3, `LH-5`) [New session inserted into conflict-free slot]
  - `CS203-L3` time change: (`MON`, P3, `LH-1`) -> (`THU`, P8, `CR-201`) [F07 unavailable MON P3]
  - `EC201-L2` room only: (`THU`, P7, `CR-102`) -> (`THU`, P7, `CR-204`) [CR-102 unavailable THU P7]
  - `EC202-L2` room only: (`MON`, P4, `CR-102`) -> (`MON`, P4, `LH-3`) [CR-102 unavailable MON P4]
  - `HS101-A-L1` room only: (`THU`, P4, `CR-102`) -> (`THU`, P4, `CR-201`) [CR-102 unavailable THU P4]
  - `ME203-L2` room only: (`MON`, P5, `CR-102`) -> (`MON`, P5, `CR-105`) [CR-102 unavailable MON P5]
  - `ME302-L3` room only: (`TUE`, P6, `CR-102`) -> (`TUE`, P6, `CR-101`) [CR-102 unavailable TUE P6]
  - `PH101-A-L1` room only: (`MON`, P6, `CR-102`) -> (`MON`, P6, `LH-2`) [CR-102 unavailable MON P6]

---

## 3. Frontend Build Verification
- **Command:** `npm run build`
- **Result:** Successfully built production bundle in **12.32s**.
- **Output:** Clean bundle generated in `cit/frontend/dist/`.

---

## 4. Setup & Quickstart Guide

### Prerequisites
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ & npm

### Quick Run Instructions

#### Option A: Run Backend
```bash
cd backend
python -m pip install -r requirements.txt
python generate.py                  # Generates exports/schedule.json & schedule_after.json
python -m uvicorn app.main:app --port 8000 --reload
```

#### Option B: Run Frontend
```bash
cd frontend
npm install
npm run dev                         # Runs at http://localhost:5173
```

#### Option C: Verification Script
```bash
# To verify official validation outputs:
cd backend
python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule.json
python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule_after.json --disruption ../examples/sample_disruption.json --baseline ../exports/schedule.json
```

### Demo Login Accounts
| Role | Username | Password | Notes |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full access, disruption approvals |
| Coordinator | `coord_cse`, `coord_ece` | `coord123` | Dept views & operations |
| Faculty | `fac_f01` ... `fac_f40` | `faculty123` | Personal timetable & unavailability |
| Club Rep | `club_dramatics`, `club_robotics` | `club123` | Booking requests |
