# CampusNx9 — Institutional Scheduling & Campus Governance OS

> **Chilika Institute of Technology (CIT)** · Academic Scheduling, Exam Optimization & Multi-Role Governance Platform  
> **Mathematical Verification Guarantee:** 0 Hard Violations Enforced via Google OR-Tools CP-SAT Solver & Deterministic Feasibility Pre-Scan.

---

## 1. Overview of CampusNx9

**CampusNx9** is an AI-assisted geospatial and institutional scheduling and campus governance platform engineered for Chilika Institute of Technology (CIT). Academic timetables, venue allocations, and mid-semester exams are notoriously fragile: instructor double-bookings, laboratory conflicts during lunch hours, and ad-hoc campus fest disruptions routinely break schedules. 

CampusNx9 replaces fragile manual guesswork with a mathematically verified, rule-enforced campus operating system designed to achieve:
- **Zero Hard Violations (H1–H14 Guaranteed):** Mathematically proves 0 professor collisions, 0 room overlaps, and strictly enforced lab continuity.
- **Midsem Exam Scheduling:** 41 mid-semester examinations scheduled across Week 8 with strict 50% halved venue capacities.
- **Spectra Fest Venue Management:** 6-tier institutional priority engine for club events, workshops, and student wing bookings with real-time slot recommendation and displacement stability.
- **Disruption Recovery with Minimum Jitter:** When emergencies occur (weather closures, faculty leave), the constraint solver identifies replacement slots with minimal timetable ripple.
- **Institutional Governance & Cross-Role Security:** Ironclad institutional rule: *"Nobody can approve their own request."* Role isolation is strictly maintained across Dean's Office, Department Coordinators, Faculty, and Student Club Representatives.

---

## 2. Architecture Overview

CampusNx9 is built with a decoupled modern architecture separating client presentation, secure cloud persistence, and high-performance constraint optimization.

```
                              ┌─────────────────────────────────────────┐
                              │           CLIENT USER AGENT             │
                              │   (Dean, Coordinator, Faculty, Club)    │
                              └────────────────────┬────────────────────┘
                                                   │
                                     HTTPS / WSS / JWT Tokens
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       VERCEL DEPLOYMENT EDGE                                    │
│  ┌────────────────────────────────────────┐       ┌──────────────────────────────────────────┐  │
│  │      React 18 + Vite SPA Frontend      │       │     Vercel Serverless Gateway / Proxy    │  │
│  │   - Role-Based Dynamic Dashboards      │       │  - Routes /api to backend FastAPI engine │  │
│  │   - Weekly Grid Matrix (P1–P9)         │──────▶│  - CORS & Security Headers Enforced      │  │
│  │   - Ambient CIT Aesthetic & Glow Glass │       │  - Edge Static Asset Caching             │  │
│  │   - 1-Click Instant Demo Portals       │       └────────────────────┬─────────────────────┘  │
│  └──────────────────┬─────────────────────┘                            │                        │
└─────────────────────┼──────────────────────────────────────────────────┼────────────────────────┘
                      │                                                  │
                      │ Auth & Profile Queries                           │ Internal API Calls
                      ▼                                                  ▼
┌───────────────────────────────────────────┐      ┌──────────────────────────────────────────────┐
│           SUPABASE CLOUD PLATFORM         │      │          FASTAPI SCHEDULING ENGINE           │
│  - PostgreSQL 15 Managed Cloud Database   │      │  - Python 3.10+ / Uvicorn ASGI Server        │
│  - Supabase Auth & Google OAuth Provider  │      │  - Google OR-Tools 9.15 (CP-SAT Solver)      │
│  - Row-Level Security (RLS) Policies      │      │  - Deterministic Feasibility Pre-Scan        │
│  - Institutional Profiles & Role Mapping  │      │  - 6-Tier Priority Spectra Engine            │
│  - System State & Audit Log Archival      │      │  - Vendored Official Validator Authority     │
└───────────────────────────────────────────┘      │  - Local SQLite Auto-Fallback Store          │
                                                   └──────────────────────────────────────────────┘
```

### Architectural Highlights
1. **Frontend Presentation Layer:** Built on React 18 with Vite and styled via Tailwind CSS, adopting the authentic CIT Maroon (`#7B1123`), amber, and ivory heritage aesthetic.
2. **Cloud Database & Auth (Supabase):** Handles user session persistence, password resets, institutional profile verification, and PostgreSQL relational storage.
3. **High-Performance Constraint Engine:** Python backend running Google OR-Tools CP-SAT formulation over binary decision variables with sub-second verified fast-paths.
4. **Vercel Cloud Deployment:** Hosted globally on Vercel with automatic rewrites forwarding frontend requests to the serverless backend.

---

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide React, Vite |
| **Styling & Theme** | CIT Maroon (`#7B1123`), Custom Parchment Vignettes, Ambient Glassmorphism |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, PyJWT |
| **Constraint Solver** | Google OR-Tools CP-SAT Solver (v9.15.x) |
| **Cloud Database** | Supabase (PostgreSQL 15), Supabase JavaScript Client (`@supabase/supabase-js`) |
| **Authentication** | Supabase Auth, Google OAuth integration, Institutional Session Tokens |
| **Local Persistence** | SQLite3 (`cit.db`) local auto-fallback |
| **Hosting & CI/CD** | Vercel Edge Platform |

---

## 4. Setup & Installation

### Option A: Local Development Setup

#### Prerequisites
- **Node.js** (v18.0.0 or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`

#### 1. Clone & Configure Environment
```bash
git clone https://github.com/jaishiv0-art/CampusNx9.git
cd CampusNx9

# Copy environment configuration
cp .env.example .env
```

#### 2. Start Python Backend
```bash
# In Terminal 1:
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```
*The backend API will be running on `http://127.0.0.1:8000`.*

#### 3. Start Frontend Client
```bash
# In Terminal 2:
npm install
npm run dev
```
*The application will launch on `http://localhost:5173`.*

---

### Option B: Vercel Cloud Deployment

1. Fork or push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. In **Project Settings** $\rightarrow$ **Environment Variables**, configure the following variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   JWT_SECRET=your-secure-jwt-secret-key
   ```
4. Click **Deploy**. Vercel will bundle the React SPA and serve the Python serverless endpoints automatically.

---

## 5. Demo Accounts & Evaluation Guide

Judges and evaluators can log in using either the **1-Click Instant Demo Buttons** on the login page (zero typing required) or manual credentials:

| Institutional Role | Username | Password | Institutional Email | Dashboard Capabilities |
|---|---|---|---|---|
| **Dean's Office (Master Administrator)** | `admin` | `admin123` | `dean.office@cit.ac.in` | Master CP-SAT Solver, Disruption Approvals, System Reset, Official JSON Exports |
| **Department Coordinator (CSE)** | `coord_cse` | `coord123` | `coord.cse@cit.ac.in` | Department Course & Lab Scheduling, Room Allocations, Faculty Requests |
| **Faculty Member (Dr. Ananya Mishra)** | `fac_f01` | `faculty123` | `ananya.mishra@cit.ac.in` | Personal Weekly Timetable, Unavailability Marking, AI-assisted Reschedule Requests |
| **Club Representative (Dramatics Society)** | `club_dramatics` | `club123` | `dramatics.society@cit.ac.in` | Spectra Fest Venue Requests, Alternative Slot Discovery, Booking Tracking |

> [!NOTE]
> **Admin Reset Demo Data Feature:**
> Administrators can reset the system state to the baseline demo dataset at any time by navigating to **Admin Console** $\rightarrow$ **Dataset & Solver Controls** $\rightarrow$ clicking **Reset System State to Baseline**. This re-seeds clean demo data without requiring a database wipe.

> [!IMPORTANT]
> **Cross-Role Self-Approval Security Invariant:**
> CampusNx9 strictly enforces the rule: *"Nobody can approve their own request."* If an Administrator or Coordinator submits a venue booking or reschedule proposal, the system prevents them from approving it themselves, requiring cross-role verification.

---

## 6. Official Validator Compliance & Exports

The project generates official JSON exports strictly adhering to competition schema requirements in the `exports/` folder:
- **`exports/schedule.json`**: Baseline schedule containing all 189 teaching sessions, 0 hard violations, and 41 midsem exams.
- **`exports/schedule_after.json`**: Post-disruption schedule demonstrating minimal timetable ripple (stability metric $\le 7$ sessions moved).

To verify compliance using the competition's unmodified validator:
```bash
python backend/official/validator.py --data data/cit_public.json --schedule exports/schedule.json
```
**Expected Output:** `Hard violations: 0`

---

## 7. Known Limitations

1. **Solver Optimization Ceiling:** CP-SAT solver search runs with a configurable timeout (`SOLVE_SECONDS`, default 180s). Under standard competition datasets, solutions are discovered and proven feasible within seconds.
2. **Dataset Format:** Dataset uploads currently require the official JSON structure (`rooms`, `faculty`, `student_groups`, `courses`, `sessions`). CSV representations must be converted to JSON.
3. **Single-Tenant Competition Model:** Sessions and timetable state are scoped to the primary competition institution (Chilika Institute of Technology). Multi-campus multi-tenancy is architected for Phase 2.
4. **Permanent vs. Ad-Hoc Room Closures:** Unavailability declarations in the official competition schema apply across the 5-day cycle (Monday–Friday) rather than calendar dates.
