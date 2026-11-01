"""CP-SAT timetable solver (Google OR-Tools). Used for initial generation AND minimum-change repair.

Hard constraints are encoded as model constraints / pre-filtered candidates, so any returned
solution has zero hard violations. Soft penalties use the validator's S1-S6 definitions and weights.
"""
from collections import defaultdict
from ortools.sat.python import cp_model

LAST = 9
W_TIME_MOVE = 1000   # moving an existing session to another day/period (repair mode)
W_ROOM_MOVE = 300    # same time, different room


def _candidates(data, s, rooms, fac_un, room_un, lunch, lab_starts, days):
    out = []
    fx = s.get("fixed_slot")
    allowed_days = s.get("allowed_days")   # internal: set by 'move_session' requests
    for r in rooms:
        if r["type"] not in s["room_types"] or r["capacity"] < s["size"]:
            continue
        if s.get("needs_accessible") and not r["accessible"]:
            continue
        for d in days:
            if fx and fx["day"] != d:
                continue
            if allowed_days and d not in allowed_days:
                continue
            for p in range(1, LAST - s["duration"] + 2):
                if fx and fx["start_period"] != p:
                    continue
                per = list(range(p, p + s["duration"]))
                if per[0] <= lunch < per[-1]:
                    continue
                if s["kind"] == "lab" and p not in lab_starts:
                    continue
                if any((d, q) in fac_un[s["faculty_id"]] or (d, q) in room_un[r["id"]] for q in per):
                    continue
                out.append((d, p, r["id"]))
    return out


def solve_timetable(data, baseline=None, hint=None, time_limit=120, workers=8, locked=None, log=False):
    """baseline: sid -> (day,start,room) of the current approved timetable (repair mode with stability penalty).
    hint: sid -> (day,start,room) to warm-start solver without stability penalties (initial generation mode).
    locked: set of session ids that must not change (optional).
    Returns dict(status, assign, objective, infeasible_sessions)."""
    days = data["calendar"]["days"]
    lunch = data["calendar"]["lunch"]["after_period"]
    lab_starts = set(data["calendar"]["lab_start_periods"])
    rooms = [r for r in data["rooms"] if "lab" in r["allowed_uses"] or "lecture" in r["allowed_uses"]
             or "tutorial" in r["allowed_uses"]]
    fac = {f["id"]: f for f in data["faculty"]}
    fac_un = defaultdict(set)
    for f in data["faculty"]:
        for u in f.get("unavailable", []):
            for p in u["periods"]:
                fac_un[f["id"]].add((u["day"], p))
    room_un = defaultdict(set)
    for u in data.get("room_unavailability", []):
        for p in u["periods"]:
            room_un[u["room_id"]].add((u["day"], p))
    sessions = data["sessions"]
    baseline = baseline or {}
    locked = locked or set()

    cand, empty = {}, []
    for s in sessions:
        c = _candidates(data, s, rooms, fac_un, room_un, lunch, lab_starts, days)
        if s["id"] in locked and s["id"] in baseline and tuple(baseline[s["id"]]) in c:
            c = [tuple(baseline[s["id"]])]
        cand[s["id"]] = c
        if not c:
            empty.append(s["id"])
    if empty:  # diagnose before building the model
        return {"status": "INFEASIBLE", "assign": None, "infeasible_sessions": empty,
                "explanation": [f"{sid}: no (day, period, room) satisfies room type/capacity/accessibility, "
                                f"faculty & room unavailability, lunch and lab-start rules" for sid in empty]}

    m = cp_model.CpModel()
    x = {}
    for s in sessions:
        sid = s["id"]
        for (d, p, r) in cand[sid]:
            x[sid, d, p, r] = m.NewBoolVar(f"x_{sid}_{d}_{p}_{r}")
        m.AddExactlyOne(x[sid, d, p, r] for (d, p, r) in cand[sid])

    hint_map = hint or baseline
    if hint_map:
        for sid, slot in hint_map.items():
            b_tuple = tuple(slot)
            if (sid, b_tuple[0], b_tuple[1], b_tuple[2]) in x:
                m.AddHint(x[sid, b_tuple[0], b_tuple[1], b_tuple[2]], 1)

    # time indicator y[sid,d,p]
    y = defaultdict(list)
    for (sid, d, p, r), v in x.items():
        y[sid, d, p].append(v)
    yv = {}
    for k, lst in y.items():
        b = m.NewBoolVar("y_%s_%s_%d" % k)
        m.Add(sum(lst) == b)
        yv[k] = b
    sess = {s["id"]: s for s in sessions}

    def cover(sid, d):
        """dict period -> list of start-vars covering that period"""
        s = sess[sid]
        cov = defaultdict(list)
        for p in range(1, LAST + 1):
            for st in range(max(1, p - s["duration"] + 1), p + 1):
                if (sid, d, st) in yv:
                    cov[p].append(yv[sid, d, st])
        return cov

    cov = {(sid, d): cover(sid, d) for sid in sess for d in days}

    # H4 rooms
    rc = defaultdict(list)
    for (sid, d, p, r), v in x.items():
        for q in range(p, p + sess[sid]["duration"]):
            rc[r, d, q].append(v)
    for lst in rc.values():
        if len(lst) > 1:
            m.AddAtMostOne(lst)
    # H2 faculty
    fc = defaultdict(list)
    for sid, s in sess.items():
        for d in days:
            for p, lst in cov[sid, d].items():
                fc[s["faculty_id"], d, p].extend(lst)
    for lst in fc.values():
        if len(lst) > 1:
            m.AddAtMostOne(lst)
    # H11 baskets: identical time
    baskets = defaultdict(list)
    for s in sessions:
        if s.get("basket_slot"):
            baskets[s["basket_slot"]].append(s["id"])
    for b, ids in baskets.items():
        for other in ids[1:]:
            for d in days:
                for p in range(1, LAST + 1):
                    a, c = yv.get((ids[0], d, p)), yv.get((other, d, p))
                    if a is not None and c is not None:
                        m.Add(a == c)
                    elif a is not None:
                        m.Add(a == 0)
                    elif c is not None:
                        m.Add(c == 0)
    # H3 groups (a basket counts once per group); occupancy vars o[g,d,p]
    occ = {}
    gitems = defaultdict(lambda: defaultdict(list))   # (g,d,p) -> {key: [vars]}
    for sid, s in sess.items():
        key = s.get("basket_slot") or sid
        rep = (not s.get("basket_slot")) or baskets[s["basket_slot"]][0] == sid
        if not rep:
            continue  # basket members share time; count the representative only
        for g in s["groups"]:
            for d in days:
                for p, lst in cov[sid, d].items():
                    gitems[g, d, p][key].extend(lst)
    for (g, d, p), keys in gitems.items():
        allv = [v for lst in keys.values() for v in lst]
        o = m.NewBoolVar(f"o_{g}_{d}_{p}")
        m.Add(sum(allv) == o)       # >1 would violate H3 (o is boolean)
        occ[g, d, p] = o
    # H12 faculty daily hours
    for f in fac:
        for d in days:
            terms = [s["duration"] * yv[s["id"], d, p] for s in sessions if s["faculty_id"] == f
                     for p in range(1, LAST + 1) if (s["id"], d, p) in yv]
            if terms:
                m.Add(sum(terms) <= fac[f].get("max_hours_per_day", 4))

    pen = []
    # S1, S5, S6 per candidate (+ stability)
    for sid, s in sess.items():
        prefs = [pf for pf in fac[s["faculty_id"]].get("preferences", []) if pf.get("type") == "avoid"]
        for (d, p, r) in cand[sid]:
            per = range(p, p + s["duration"])
            c = 0
            for pf in prefs:
                if d in pf.get("days", days):
                    c += 2 * sum(1 for q in per if q in pf["periods"])
            cap = next(rr["capacity"] for rr in rooms if rr["id"] == r)
            if s["size"] / cap < 0.4:
                c += 1
            if LAST in per:
                c += 1
            b = baseline.get(sid)
            if b is not None:
                if (d, p, r) == tuple(b):
                    pass
                elif (d, p) == tuple(b[:2]):
                    c += W_ROOM_MOVE
                else:
                    c += W_TIME_MOVE
            if c:
                pen.append(c * x[sid, d, p, r])
    # S2 free periods, S3 >6h
    for g in {g for s in sessions for g in s["groups"]}:
        for d in days:
            o = [occ.get((g, d, p)) for p in range(1, LAST + 1)]
            if not any(v is not None for v in o):
                continue
            a = [m.NewBoolVar(f"a_{g}_{d}_{p}") for p in range(LAST)]
            bb = [m.NewBoolVar(f"b_{g}_{d}_{p}") for p in range(LAST)]
            for i in range(LAST):
                if o[i] is not None:
                    m.Add(a[i] >= o[i]); m.Add(bb[i] >= o[i])
                if i > 0:
                    m.Add(a[i] >= a[i - 1])
                if i < LAST - 1:
                    m.Add(bb[i] >= bb[i + 1])
            for i in range(LAST):
                gap = m.NewBoolVar(f"gap_{g}_{d}_{i}")
                m.Add(gap >= a[i] + bb[i] - 1 - (o[i] if o[i] is not None else 0))
                pen.append(gap)
            ex = m.NewIntVar(0, LAST, f"ex_{g}_{d}")
            m.Add(ex >= sum(v for v in o if v is not None) - 6)
            pen.append(3 * ex)
    # S4 duplicate lectures same day
    cg = defaultdict(list)
    for sid, s in sess.items():
        if s["kind"] == "lecture" and not s.get("basket_slot"):
            for g in s["groups"]:
                cg[g, s["course_id"]].append(sid)
    for (g, c), ids in cg.items():
        if len(ids) > 1:
            for d in days:
                cnt = sum(yv[i, d, p] for i in ids for p in range(1, LAST + 1) if (i, d, p) in yv)
                e = m.NewIntVar(0, len(ids), f"dup_{g}_{c}_{d}")
                m.Add(e >= cnt - 1); pen.append(3 * e)
    bc = defaultdict(list)
    for s in sessions:
        if s.get("basket_slot"):
            bc[s["course_id"]].append(s["id"])
    for c, ids in bc.items():
        if len(ids) > 1:
            for d in days:
                cnt = sum(yv[i, d, p] for i in ids for p in range(1, LAST + 1) if (i, d, p) in yv)
                e = m.NewIntVar(0, len(ids), f"bdup_{c}_{d}")
                m.Add(e >= cnt - 1); pen.append(3 * e)

    m.Minimize(sum(pen))
    sol = cp_model.CpSolver()
    sol.parameters.max_time_in_seconds = time_limit
    sol.parameters.num_search_workers = workers
    sol.parameters.log_search_progress = log
    st = sol.Solve(m)
    name = sol.StatusName(st)
    if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status": name, "assign": None, "infeasible_sessions": [],
                "explanation": ["No assignment satisfies all hard constraints together. "
                                "Run diagnose() to isolate conflicting constraint groups."]}
    assign = {}
    for (sid, d, p, r), v in x.items():
        if sol.Value(v):
            assign[sid] = (d, p, r)
    return {"status": name, "assign": assign, "objective": sol.ObjectiveValue(),
            "best_bound": sol.BestObjectiveBound(), "infeasible_sessions": []}
