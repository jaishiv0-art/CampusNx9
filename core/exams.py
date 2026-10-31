"""CP-SAT midsem exam scheduler. Effective exam capacity = capacity // 2 (matches official validator)."""
from collections import defaultdict
from ortools.sat.python import cp_model


def solve_exams(data, time_limit=60, workers=8):
    cal = data["calendar"]["exam_week"]
    slots = [(d, s["id"]) for d in cal["days"] for s in cal["sessions"]]
    rooms = [r for r in data["rooms"] if "exam" in r["allowed_uses"]]
    exams = data["exams"]
    m = cp_model.CpModel()
    t = {(e["id"], k): m.NewBoolVar(f"t_{e['id']}_{k}") for e in exams for k in range(len(slots))}
    u = {(e["id"], r["id"], k): m.NewBoolVar(f"u_{e['id']}_{r['id']}_{k}")
         for e in exams for r in rooms for k in range(len(slots))}
    for e in exams:
        m.AddExactlyOne(t[e["id"], k] for k in range(len(slots)))
        for k in range(len(slots)):
            for r in rooms:
                m.AddImplication(u[e["id"], r["id"], k], t[e["id"], k])
            m.Add(sum((r["capacity"] // 2) * u[e["id"], r["id"], k] for r in rooms)
                  >= e["size"] * t[e["id"], k])
    for r in rooms:
        for k in range(len(slots)):
            m.AddAtMostOne(u[e["id"], r["id"], k] for e in exams)
    pen = []
    for g in {g for e in exams for g in e["groups"]}:
        ge = [e["id"] for e in exams if g in e["groups"]]
        for k in range(len(slots)):
            m.AddAtMostOne(t[i, k] for i in ge)
        for d in cal["days"]:
            ks = [k for k, (dd, _) in enumerate(slots) if dd == d]
            cnt = sum(t[i, k] for i in ge for k in ks)
            ex = m.NewIntVar(0, len(slots), f"ex_{g}_{d}")
            m.Add(ex >= cnt - 1); pen.append(5 * ex)
    pen += [u[e["id"], r["id"], k] for e in exams for r in rooms for k in range(len(slots))]  # fewer rooms
    m.Minimize(sum(pen))
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = time_limit
    s.parameters.num_search_workers = workers
    st = s.Solve(m)
    if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status": s.StatusName(st), "exams": None}
    out = []
    for e in exams:
        k = next(k for k in range(len(slots)) if s.Value(t[e["id"], k]))
        out.append({"exam_id": e["id"], "day": slots[k][0], "session": slots[k][1],
                    "rooms": [r["id"] for r in rooms if s.Value(u[e["id"], r["id"], k])]})
    return {"status": s.StatusName(st), "exams": out}
