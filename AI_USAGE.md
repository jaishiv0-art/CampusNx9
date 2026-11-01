# Mandatory AI Usage Declaration

This document provides a formal declaration of all Artificial Intelligence (AI) models, APIs, and development assistants utilized in the architecture, implementation, and runtime of **CampusNx9**, fulfilling all hackathon transparency requirements and compliance checks.

---

## 1. Runtime AI Models & APIs Called

| Component / Layer | Model / API Called | Purpose & Scope |
|---|---|---|
| **Natural Language Assistant** (`backend/app/assistant.py`) | **Google Gemini API** (`gemini-1.5-flash` / `gemini-pro`) & Anthropic Messages API (`claude-sonnet-4-6`) | Parses conversational, plain-language text (English & Hinglish) into structured form fields (e.g. extracts event title, day, start period, attendee count, required equipment like PA systems). |
| **Deterministic Fallback NLP** (`backend/app/core/nlp.py`) | Zero external API calls (RegEx heuristic token parser) | When no API key is supplied or when offline, deterministic keyword extraction parses requests without external network dependencies. |

### Prompt Template Locations
All prompt templates, persona instructions, and system schemas are centralized in:
- `backend/app/llm.py` — Prompt constant `SYSTEM` defines extraction schemas and output formatting constraints.
- `backend/app/assistant.py` — Conversational intent dispatcher and structured booking response constructor.

---

## 2. AI Coding Assistants & Development Tools Used During Building

The following AI-assisted coding tools were utilized during the development of this repository:

| AI Development Tool | Project Areas Assisted |
|---|---|
| **Google Antigravity** | Architecture design, mathematical constraint formulation for Google OR-Tools CP-SAT solver, React frontend component tree construction, and Supabase integration. |
| **Cursor & Gemini** | Rapid UI component styling with Tailwind CSS, error handling refinement, unit test generation (`tests/test_api.py`, `tests/test_core.py`), and documentation drafting. |

---

## 3. Strict Compliance Rule: Zero LLM Invalidation Invariant

To ensure mathematical precision and eliminate hallucinations, CampusNx9 enforces an ironclad architectural invariant:

> [!IMPORTANT]
> **THE LLM IS STRICTLY PROHIBITED FROM DECIDING SCHEDULE VALIDITY, CONSTRAINT SATISFACTION, OR BOOKING APPROVALS.**
> 
> All scheduling decisions, conflict detections, and booking approvals are handled **100% deterministically** by custom code logic and mathematical constraint solvers.

### Specific Compliance Invariants Enforced in Code:
1. **No Hallucinated Approvals:** The LLM output is strictly bounded to extracting query intents and slot parameters. It cannot approve, reject, or modify any timetable or booking record.
2. **Mathematical Verification:** Schedule feasibility is evaluated exclusively by **Google OR-Tools CP-SAT (v9.15)** and verified against the competition organizers' unmodified authority validator (`backend/official/validator.py`).
3. **Deterministic State Transitions:** Every proposal submitted via conversational AI is entered into the database in a `pending` state and requires explicit authorization by an authenticated human officer (Dean's Office or Department Coordinator) who is not the original requester.
4. **Transparent Decision Explanations:** Explanations for why a booking was approved, rejected, or displaced are generated from deterministic constraint audits (capacity deficits, faculty collisions, institutional tier scoring), never hallucinated by an LLM.
