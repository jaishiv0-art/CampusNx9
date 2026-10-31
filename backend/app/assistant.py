"""Natural-language assistant. Produces DRAFTS / proposals only; all go through deterministic backend validation."""
import datetime as dt, re
from . import llm
from .core import nlp
from .core.week import Week
from .core import disruption

DAYN = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4}


def _day(text):
    for code, words in nlp.DAY_WORDS.items():
        if any(re.search(rf"\b{w}\b", text) for w in words): return code
    return None


def _all_days(text):
    return [c for c, ws in nlp.DAY_WORDS.items() if any(re.search(rf"\b{w}\b", text) for w in ws)]


def _find_session(data, assign, user, text, day=None, hint=None):
    t = text.lower() + " " + (hint or "").lower()
    cands = [s for s in data["sessions"] if s["id"] in assign]
    if user["role"] == "FACULTY": cands = [s for s in cands if s["faculty_id"] == user["faculty_id"]]
    titles = {c["id"]: c["title"].lower() for c in data["courses"]}
    def score(s):
        c = s["course_id"].lower(); title = titles.get(s["course_id"], "")
        sc = 0
        if c in t: sc += 3
        words = [w for w in re.findall(r"[a-z]{2,}", title) if len(w) > 2]
        initials = "".join(w[0] for w in words)
        if any(w in t for w in words): sc += 2
        if len(initials) >= 2 and re.search(rf"\b{initials}\b", t): sc += 2
        if day and assign[s["id"]][0] == day: sc += 2
        return sc
    ranked = sorted(cands, key=score, reverse=True)
    return [s for s in ranked if score(s) >= 2][:5]


def handle(message, user, data, assign, bookings, today=None):
    today = today or dt.date.today()
    t = message.lower()
    llm_out = llm.classify(message)          # None when API key missing/unavailable
    intent = (llm_out or {}).get("intent")
    if not intent or intent == "unknown":
        if re.search(r"why.*(reject|denied|declin)|kyun.*reject|reject.*kyun", t): intent = "why_rejected"
        elif re.search(r"why.*(scheduled|lecture|class|8 ?am|slot)|kyun.*(8|subah)", t): intent = "why_slot"
        elif re.search(r"(find|another|different|alternate).*room|room.*(change|badal)", t): intent = "find_room"
        elif re.search(r"not available|unavailable|available nahi|closed|band hai|leave|chutti", t): intent = "resource_unavailable"
        elif re.search(r"\bmove\b|shift|reschedule|badlo|\bto (mon|tue|wed|thu|fri)", t): intent = "move_session"
        elif re.search(r"book|need|chahiye|want|reserve|room for|hall|auditorium|lab for", t): intent = "booking"
        else: intent = "unknown"
    out = {"intent": intent, "used_llm": bool(llm_out)}
    if intent == "booking":
        out["draft"] = nlp.parse_booking(message, data, role={"ADMIN": "admin", "FACULTY": "faculty", "DEPARTMENT_COORDINATOR": "department_coordinator"}.get(user["role"], "club"),
                                         today=today, requester=user.get("org"))
        out["message"] = out["draft"]["follow_up"] or "I extracted these booking details. Please review/edit and confirm - nothing is submitted until you do."
        out["requires_confirmation"] = True
    elif intent == "why_rejected":
        mine = [b for b in bookings if b["owner"] == user["username"] and b.get("decision")]
        bad = [b for b in mine if b["decision"]["status"] in ("rejected", "alternative_offered")]
        if bad:
            b = bad[-1]; out["message"] = f"{b['id']} ({b['decision']['status']}): {b['decision']['reason']}"
        else: out["message"] = "I can't find a rejected or alternative-offered booking of yours with a recorded decision."
    elif intent == "why_slot":
        found = _find_session(data, assign, user, message, _day(t), (llm_out or {}).get("course_hint"))
        if found:
            ex = disruption.explain_slot(data, assign, found[0]["id"]); out["message"] = ex["text"]; out["evidence"] = ex
        else: out["message"] = "Which course/session do you mean? (e.g. 'Why is DS on Monday at 8 AM?')"
    elif intent == "find_room":
        found = _find_session(data, assign, user, message, _day(t), (llm_out or {}).get("course_hint"))
        if not found: out["message"] = "Which class needs another room? Mention the course and day."
        else:
            s = found[0]; W = Week(data, assign); d, p, r = assign[s["id"]]; W.drop(s["id"])
            alts = [rid for rid in W.rooms if rid != r and W.fits(s["id"], d, p, rid)]
            out["message"] = (f"Rooms that are valid for {s['id']} at {d} P{p} right now: {', '.join(alts[:8])}." if alts
                              else f"No other room is valid for {s['id']} at {d} P{p} (all fail type/capacity/accessibility/occupancy).")
            out["options"] = alts[:8]
            if alts: out["proposal"] = {"changes": [], "note": "Room change would be submitted as a change request for approval.", "session_id": s["id"], "suggested_room": alts[0]}
    elif intent == "move_session":
        ds = _all_days(t); target = (llm_out or {}).get("target_day") or (ds[-1] if len(ds) > 1 else None)
        src = ds[0] if ds else None
        found = _find_session(data, assign, user, message, src, (llm_out or {}).get("course_hint"))
        if not found or not target:
            out["message"] = "Which session and which day should it move to? (e.g. 'Move my Thursday DS lecture to Friday')"
        else:
            s = found[0]
            out["proposal"] = {"changes": [{"type": "move_session", "session_id": s["id"], "day": target}],
                               "session": s["id"], "current": assign[s["id"]]}
            out["message"] = f"I can request moving {s['id']} (now {assign[s['id']][0]} P{assign[s['id']][1]}) to {target}. The solver will find a valid period/room; an admin must approve."
            out["requires_confirmation"] = True
    elif intent == "resource_unavailable":
        rel = (llm_out or {}).get("relative_date") or ("tomorrow" if re.search(r"\bkal\b|tomorrow", t) else "today" if re.search(r"\baaj\b|today", t) else None)
        date = today + dt.timedelta(days=1 if rel == "tomorrow" else 0) if rel else None
        day = _day(t) or (nlp.DAYS[date.weekday()] if date else None)
        room = next((r for r in data["rooms"] if r["id"].lower() in t or r["name"].lower() in t), None)
        if not room and re.search(r"phy", t): room = next((r for r in data["rooms"] if r["type"] == "lab_phy"), None)
        if not room and re.search(r"\b(cs|computer) lab", t): room = next((r for r in data["rooms"] if r["type"] == "lab_cs"), None)
        if room and day in DAYN:
            out["proposal"] = {"changes": [{"type": "room_unavailable", "room_id": room["id"], "days": [day], "periods": list(range(1, 10)),
                                            "reason": f"Reported via assistant: {message[:80]}"}]}
            out["message"] = f"I'll propose closing {room['name']} ({room['id']}) on {day}. Sessions there will be minimally re-planned after admin approval."
            out["requires_confirmation"] = True
        elif user["role"] == "FACULTY" and day in DAYN:
            out["proposal"] = {"changes": [{"type": "faculty_unavailable", "faculty_id": user["faculty_id"], "days": [day], "periods": list(range(1, 10)), "reason": message[:80]}]}
            out["message"] = f"I'll propose marking you unavailable on {day}. Confirm to submit for approval."
            out["requires_confirmation"] = True
        else: out["message"] = "Which room or person is unavailable, and on which day?"
    else:
        out["message"] = "I can help with venue bookings, moving a class, reporting unavailability, finding a room, or explaining a decision."
    out["note"] = "Assistant output is a draft. Feasibility and approval are decided only by the scheduling engine and an authorised human."
    return out
