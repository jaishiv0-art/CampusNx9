"""Pure-Python pre-solve feasibility diagnostics: names the constraint families that make a problem infeasible."""
from collections import defaultdict


def diagnose(data):
    out = []
    days = len(data["calendar"]["days"])
    lunch = data["calendar"]["lunch"]["after_period"]
    fac_un = defaultdict(set)
    for f in data["faculty"]:
        for u in f.get("unavailable", []):
            for p in u["periods"]: fac_un[f["id"]].add((u["day"], p))
    # faculty load vs availability and daily cap
    load = defaultdict(int)
    for s in data["sessions"]: load[s["faculty_id"]] += s["duration"]
    for f in data["faculty"]:
        avail = days * 9 - len(fac_un[f["id"]])
        cap = days * f.get("max_hours_per_day", 4)
        if load[f["id"]] > min(avail, cap):
            out.append(f"Faculty {f['id']} needs {load[f['id']]}h/week but only {min(avail, cap)}h are available "
                       f"(unavailability {len(fac_un[f['id']])} periods, daily cap {f.get('max_hours_per_day',4)}).")
    # group load
    gl = defaultdict(int); seen = set()
    for s in data["sessions"]:
        for g in s["groups"]:
            k = (g, s.get("basket_slot") or s["id"])
            if k in seen: continue
            seen.add(k); gl[g] += s["duration"]
    for g, h in gl.items():
        if h > days * 9: out.append(f"Group {g} has {h}h of classes but a week has only {days*9} teaching periods.")
    # room-type demand
    room_closed = defaultdict(int)
    for u in data.get("room_unavailability", []): room_closed[u["room_id"]] += len(u["periods"])
    for typ in {t for s in data["sessions"] for t in s["room_types"]}:
        rooms = [r for r in data["rooms"] if r["type"] == typ]
        supply = sum(days * 9 - room_closed[r["id"]] for r in rooms)
        demand = sum(s["duration"] for s in data["sessions"] if s["room_types"] == [typ])
        if demand > supply:
            out.append(f"Sessions restricted to room type '{typ}' need {demand} room-hours but only {supply} exist after closures.")
    # per-session candidate check
    for s in data["sessions"]:
        ok = [r for r in data["rooms"] if r["type"] in s["room_types"] and r["capacity"] >= s["size"]
              and (r["accessible"] or not s.get("needs_accessible"))]
        if not ok:
            out.append(f"Session {s['id']} (size {s['size']}, types {s['room_types']}, accessible={s.get('needs_accessible')}) has no eligible room.")
    return out
