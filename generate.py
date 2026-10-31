"""CLI pipeline (uses the same core modules as the API):
   python generate.py   ->  exports/schedule.json and exports/schedule_after.json, then runs the OFFICIAL validator on both.
Exit code is non-zero if either file has hard violations."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from app.core import checker, solver, exams as ex, export, bookings as bk, disruption

ROOT = os.path.join(os.path.dirname(__file__), "..")
TEAM = os.environ.get("TEAM_NAME", "CIT Scheduler")
SECS = int(os.environ.get("SOLVE_SECONDS", 180))
DATA = os.environ.get("DATASET_PATH", f"{ROOT}/data/cit_public.json")
DIS = os.environ.get("DISRUPTION_PATH", f"{ROOT}/examples/sample_disruption.json")
OUT = os.environ.get("EXPORT_DIR", f"{ROOT}/exports")

data = json.load(open(DATA, encoding="utf-8"))
r = solver.solve_timetable(data, time_limit=SECS)
print("timetable:", r["status"], "objective", r.get("objective"))
if not r["assign"]:
    sys.exit("INFEASIBLE:\n" + "\n".join(r.get("explanation") or []))
e = ex.solve_exams(data)
print("exams:", e["status"])
if not e["exams"]: sys.exit("exam schedule infeasible")
fest = bk.BookingEngine(data, r["assign"]).decide_all()
sched = export.build_schedule(TEAM, data, r["assign"], e["exams"], fest)
export.write(f"{OUT}/schedule.json", sched)

dis = json.load(open(DIS, encoding="utf-8"))
p = disruption.propose(data, r["assign"], dis["changes"], lambda d, baseline, time_limit: solver.solve_timetable(d, baseline=baseline, time_limit=time_limit), SECS)
print("disruption:", p["status"], "moved:", p.get("moved"))
if p["status"] not in ("PROPOSED", "NO_CHANGE_NEEDED"):
    sys.exit("disruption could not be repaired:\n" + "\n".join(p.get("reasons") or p.get("errors") or []))
for d in p["diff"]: print("  ", d["session_id"], d["change"], d["old"], "->", d["new"], "|", d["reason"])
export.write(f"{OUT}/schedule_after.json", export.build_schedule(TEAM, p["newdata"], p["new_assign"]))

bad = 0
for name, args in (("schedule.json", dict(sched=f"{OUT}/schedule.json")),
                   ("schedule_after.json", dict(sched=f"{OUT}/schedule_after.json", dis=True))):
    d0 = checker.apply_disruption(data, dis) if args.get("dis") else data
    rep = checker.validate(d0, json.load(open(args["sched"])), json.load(open(f"{OUT}/schedule.json")) if args.get("dis") else None)
    print(f"{name}: hard={rep['hard_violation_count']} soft={rep['soft_total']} {rep['soft_penalties']}", rep.get("stability", {}).get("sessions_moved", ""))
    bad += rep["hard_violation_count"]
sys.exit(1 if bad else 0)
