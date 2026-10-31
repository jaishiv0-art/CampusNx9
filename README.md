# CIT Scheduler - campus timetable, exam & venue platform

## What is this?
A working web application for **Chilika Institute of Technology (fictional)** built for the *Crunch Week* hackathon. It:
1. builds the weekly **timetable** (189 sessions, 27 rooms, 40 faculty, 14 groups) with a constraint solver,
2. schedules the **41 midsem exams** (rooms seat half their capacity during exams),
3. handles **Spectra-week venue bookings** with priorities, approval/rejection/alternatives and plain-language (English + Hinglish) requests,
4. repairs the timetable after **disruptions** (faculty leave, room closure, new/removed sessions) with the **fewest possible moves**, and applies changes only after **Admin approval**,
5. enforces **role-based access** (Admin, Department Coordinator, Faculty, Club Representative) on the backend,
6. exports the exact JSON the **official validator** reads.

## What problem are we fixing?
Hand-made timetables clash (a teacher in two rooms, a room double-booked, a lab during lunch), and every mid-semester change - a teacher on leave, a leaking room - forces someone to re-do it by hand and risks breaking something else. Event requests arrive as WhatsApp-style messages and compete for the same rooms as classes and exams. This project makes the *rules* explicit and machine-checked so that: no invalid schedule is ever accepted, changes disturb as little as possible, and every decision comes with a reason taken from real data.

## Architecture
```
 React + TS + Tailwind  --REST/JWT-->  FastAPI (RBAC enforced here)
   dashboard, forms                      |
                                         +-- core/solver.py      CP-SAT timetable + minimum-change repair
                                         +-- core/exams.py       CP-SAT exam scheduler (half capacity)
                                         +-- core/bookings.py    priority/approval/alternatives/displacement + explanations
                                         +-- core/disruption.py  apply change -> repair -> diff -> reasons -> pending proposal
                                         +-- core/nlp.py         deterministic English/Hinglish parser (no LLM needed)
                                         +-- core/checker.py --> official/validator.py (vendored, unmodified = ultimate authority)
                                         +-- assistant.py + llm.py   OPTIONAL LLM: intent only, never decides
                                         +-- store.py (SQLite): users, bookings, proposals, audit, state
```
Scheduling logic is independent of the frontend and the LLM. Nothing is applied to the approved timetable until an Admin approves, and approval re-runs the deterministic check.

## Stack
Python 3.10+, FastAPI, Pydantic v2, Google OR-Tools CP-SAT, SQLite, PyJWT - React 18, TypeScript, Tailwind, Vite. See `THIRD_PARTY.md`, `AI_USAGE.md`.

## Install & run
```bash
# backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # optional; defaults work
uvicorn app.main:app --reload --port 8000
# frontend (second terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173
```
First use: sign in as `admin` -> Admin tab -> **Generate timetable** -> **Generate exams** -> **Decide Spectra bookings** -> **Export**.

## Demo credentials
| User | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `coord_cse`, `coord_ece` | `coord123` | DEPARTMENT_COORDINATOR |
| `fac_f01` ... `fac_f40` | `faculty123` | FACULTY (own timetable only) |
| `club_dramatics`, `club_robotics` | `club123` | CLUB_REPRESENTATIVE |

## HOW TO TEST THE ZIP SETUP
**Fast path (one command, needs Python 3.10+ and internet for pip):**
```bash
unzip cit-scheduler.zip && cd cit && bash scripts/verify.sh
```
It installs dependencies, runs all tests, runs the real solver to create `exports/schedule.json` and `exports/schedule_after.json`, runs the **official validator** on both, and boots the API. **Pass = both validator lines say `Hard violations: 0`** and `/health` returns `"ortools": "<version>"`.

**Manual steps:**
1. `cd backend && pip install -r requirements.txt`
2. `python -m pytest -q tests` - expect all pass, none skipped (skips mean OR-Tools or FastAPI is missing).
3. `python generate.py` - prints timetable/exam/disruption status and the validator summary for both exports.
4. `python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule.json`
5. `python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule_after.json --disruption ../examples/sample_disruption.json --baseline ../exports/schedule.json` (also prints sessions moved).
6. Start API + UI, sign in as each role, and try: club submits a booking (needs confirm), club cannot open Admin, nobody can approve their own booking, faculty marks unavailability -> admin sees the diff + reasons -> approves.

If step 3 reports INFEASIBLE or `hard > 0`, the solver output lists the reasons; see Known limitations for tuning (`SOLVE_SECONDS`).

## Verification status (honest)
The build environment had **no internet**, so OR-Tools, FastAPI and the npm packages could not be installed there.

| Part | Status |
|---|---|
| Official validator wrapper, week-occupancy checks | Executed: tests pass |
| Booking engine (priorities, role caps, cancellations, alternatives, displacement) | Executed against a throwaway greedy timetable: **0 booking hard violations, 0 priority inversions** per the official validator |
| English/Hinglish parser | Executed: all 8 sample requests + SH-2 accessibility conflict; ~82% of 100 spot-checked fields on the dataset's own `raw_text` match (remaining misses are mostly needs the dataset implies but the text never states) |
| Disruption validation / no-op / diff reasons, diagnostics, slot explanation | Executed: tests pass (15/15 in `tests/test_core.py`) |
| **CP-SAT timetable, exam, and repair solvers** | **Written, compiled, NOT executed.** Run `scripts/verify.sh`. |
| **FastAPI app + RBAC tests** | **Written, compiled, static-scanned, NOT executed.** `tests/test_api.py` covers it. |
| **React UI** | **Written, NOT built or viewed.** |
| `exports/schedule*.json` | **Not included** - must be produced by running the app (rule: no hand-made files). |

Do not treat the project as passing until `verify.sh` shows zero hard violations on your machine.

## Known limitations
- Solver performance is unmeasured: the joint (session, day, period, room) model is large; if it is slow, raise `SOLVE_SECONDS` or split into time-then-room stages.
- Infeasibility diagnostics are rule-based pre-checks (`core/diagnose.py`), not a minimal-unsat-core.
- Dataset import accepts JSON only (the CSVs are the same data in spreadsheet form).
- Booking approvals never bump an already approved lower-priority *user* booking; only dataset-level processing orders by priority, and institute events may displace (move) regular classes for fest week.
- Admin-entered disruptions can be approved by an admin (they are instructions, not requests); every other request kind blocks self-approval.
- `move_session` is an internal extension (not in the official disruption schema); exports only contain official fields.
- Parser is heuristic; unusual phrasing yields follow-up questions rather than guesses. Single-day room closures from the assistant are stored as permanent weekday closures (the official model has no one-off dates).
- No password reset / email; demo passwords must be changed for any real deployment (`JWT_SECRET` too).
