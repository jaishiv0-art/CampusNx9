"""Disruption handling: apply change set as new constraints, repair with minimum movement, explain, await approval."""
import copy
from . import checker
from .diagnose import diagnose
from .week import Week

SUPPORTED = {"faculty_unavailable", "room_unavailable", "add_faculty", "add_session", "remove_session", "move_session"}


def validate_changes(data, changes):
    errs = []
    fids = {f["id"] for f in data["faculty"]}; rids = {r["id"] for r in data["rooms"]}
    sids = {s["id"] for s in data["sessions"]}
    for i, c in enumerate(changes):
        t = c.get("type")
        if t not in SUPPORTED: errs.append(f"change {i}: unsupported type {t!r}"); continue
        if t == "faculty_unavailable" and (c.get("faculty_id") not in fids or not c.get("days") or not c.get("periods")):
            errs.append(f"change {i}: faculty_unavailable needs a known faculty_id, days and periods")
        if t == "room_unavailable" and (c.get("room_id") not in rids or not c.get("days") or not c.get("periods")):
            errs.append(f"change {i}: room_unavailable needs a known room_id, days and periods")
        if t == "add_session":
            s = c.get("session") or {}
            for k in ("id", "course_id", "kind", "groups", "faculty_id", "size", "duration", "room_types"):
                if k not in s: errs.append(f"change {i}: session missing '{k}'")
            if s.get("id") in sids: errs.append(f"change {i}: session id {s.get('id')} already exists")
        if t == "remove_session" and c.get("session_id") not in sids: errs.append(f"change {i}: unknown session {c.get('session_id')}")
        if t == "move_session" and (c.get("session_id") not in sids or c.get("day") not in data["calendar"]["days"]):
            errs.append(f"change {i}: move_session needs a known session_id and a valid day")
    return errs


def apply_changes(data, changes):
    """Official semantics for the 5 starter-pack types (delegated to the validator's own function);
    move_session is an internal extension implemented as a restriction on that session."""
    official = [c for c in changes if c["type"] != "move_session"]
    d = checker.apply_disruption(data, {"changes": official})
    for c in changes:
        if c["type"] == "move_session":
            for s in d["sessions"]:
                if s["id"] == c["session_id"]:
                    if c.get("start_period"):
                        s["fixed_slot"] = {"day": c["day"], "start_period": c["start_period"]}
                    else:
                        s["allowed_days"] = [c["day"]]
    return d


def _reason(newdata, old_assign, new_assign, sid, changes):
    old = old_assign[sid]
    viol = [v for v in checker.timetable_violations(newdata, {sid: old}) if v["rule"] in ("H7", "H8", "H14", "H5", "H6", "H10", "H12") and sid in v["detail"]]
    if viol:
        return "Old slot is no longer valid: " + "; ".join(v["detail"] for v in viol[:2])
    for c in changes:
        if c["type"] == "move_session" and c["session_id"] == sid:
            return f"Moved on request to {c['day']}" + (f" P{c['start_period']}" if c.get("start_period") else "") + "."
    s = newdata["sessions"]; S = {x["id"]: x for x in s}
    d, p, r = old
    taken = []
    for other, (od, op, orr) in new_assign.items():
        if other == sid or other not in S: continue
        o = S[other]
        if od == d and op <= p + S[sid]["duration"] - 1 and p <= op + o["duration"] - 1:
            if orr == r: taken.append(f"{other} now uses {r}")
            elif o["faculty_id"] == S[sid]["faculty_id"]: taken.append(f"{other} (same faculty)")
            elif set(o["groups"]) & set(S[sid]["groups"]) and not (o.get("basket_slot") and o.get("basket_slot") == S[sid].get("basket_slot")):
                taken.append(f"{other} (same student group)")
    if taken:
        return "Knock-on change: its old slot was needed by " + ", ".join(taken[:3]) + " after that session was itself moved."
    return "Knock-on change required to make the whole timetable feasible under the new constraints."


def diff(newdata, old_assign, new_assign, changes):
    out = []
    S = {s["id"] for s in newdata["sessions"]}
    for sid in sorted(set(old_assign) | set(new_assign)):
        o, n = old_assign.get(sid), new_assign.get(sid)
        if o and sid not in S:
            out.append({"session_id": sid, "change": "removed", "old": o, "new": None, "reason": "Removed by remove_session."})
        elif not o and n:
            out.append({"session_id": sid, "change": "added", "old": None, "new": n, "reason": "New session inserted; placed in a slot with no hard conflicts."})
        elif o and n and tuple(o) != tuple(n):
            kind = "room_only" if tuple(o[:2]) == tuple(n[:2]) else "time_changed"
            out.append({"session_id": sid, "change": kind, "old": o, "new": n, "reason": _reason(newdata, old_assign, new_assign, sid, changes)})
    return out


def propose(data, baseline, changes, solve_fn, time_limit=120):
    """Never touches `baseline`. Returns a proposal dict; infeasible -> explanation, no schedule."""
    errs = validate_changes(data, changes)
    if errs: return {"status": "INVALID", "errors": errs}
    newdata = apply_changes(data, changes)
    removed = {c["session_id"] for c in changes if c["type"] == "remove_session"}
    base = {k: v for k, v in baseline.items() if k not in removed}
    viol = checker.timetable_violations(newdata, base)
    broken = {v["detail"].split(":")[0].split()[0] for v in viol if v["rule"] != "H1"}
    need_solver = bool(viol) or any(c["type"] in ("add_session", "move_session") for c in changes)
    if not need_solver:
        return {"status": "NO_CHANGE_NEEDED", "new_assign": base, "changes": [], "diff": [], "newdata": newdata}
    r = solve_fn(newdata, baseline=base, time_limit=time_limit)
    if not r.get("assign"):
        reasons = list(r.get("explanation") or []) + diagnose(newdata)
        return {"status": "INFEASIBLE", "reasons": reasons, "violations_if_unchanged": [v["detail"] for v in viol[:20]]}
    d = diff(newdata, baseline, r["assign"], changes)
    return {"status": "PROPOSED", "new_assign": r["assign"], "diff": d, "newdata": newdata,
            "moved": sum(1 for x in d if x["change"] in ("room_only", "time_changed")),
            "solver": {"status": r["status"], "objective": r.get("objective")}}


def explain_slot(data, assign, sid):
    """Why is this session where it is? Evidence = counting real blockers across all alternatives."""
    W = Week(data, assign); s = W.sess[sid]; cur = assign[sid]
    W.drop(sid)
    tally, free = {}, 0
    for d in W.days:
        for p in range(1, 10):
            if (d, p) == tuple(cur[:2]): continue
            reasons = []
            ok_any = False
            for r in W.rooms:
                why = W.why_not(sid, d, p, r)
                if why is None: ok_any = True; break
                reasons.append(why)
            if ok_any: free += 1
            else:
                key = "faculty unavailable/busy" if any("F" in x[:3] and ("unavail" in x or "teaches" in x) for x in reasons) else (
                    "student group busy" if any(x.startswith("group") for x in reasons) else "no suitable free room")
                tally[key] = tally.get(key, 0) + 1
    W.put(sid, *cur)
    return {"session_id": sid, "slot": cur, "other_valid_slots": free, "blocked_by": tally,
            "text": (f"{sid} is at {cur[0]} P{cur[1]} in {cur[2]}. {free} other day/period slot(s) are also valid for it; "
                     f"the rest are blocked ({', '.join(f'{v} by {k}' for k, v in tally.items()) or 'none'}). "
                     "The solver chose this one because it minimises the weighted soft penalties (free periods, faculty preferences, P9 use, room under-utilisation) among the valid options.")}
