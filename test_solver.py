"""Requires OR-Tools. Runs the REAL solver and the OFFICIAL validator."""
import json, pytest
ortools = pytest.importorskip("ortools")
from app.core import solver, exams, checker, bookings as bk, disruption, export

@pytest.fixture(scope="module")
def solved(data):
    r = solver.solve_timetable(data, time_limit=240)
    assert r["assign"], r.get("explanation")
    return r

def test_all_189_scheduled_zero_hard(data, solved):
    assert len(solved["assign"]) == 189
    rep = checker.validate(data, export.build_schedule("t", data, solved["assign"], []))
    assert {k: v for k, v in rep["hard_by_rule"].items() if k != "E1"} == {}

def test_exams_all_41_valid(data, solved):
    e = exams.solve_exams(data)
    assert len(e["exams"]) == 41
    rep = checker.validate(data, export.build_schedule("t", data, solved["assign"], e["exams"]))
    assert rep["hard_by_rule"] == {}, rep["hard_violations"][:5]

def test_full_schedule_with_bookings(data, solved):
    e = exams.solve_exams(data); fw = bk.BookingEngine(data, solved["assign"]).decide_all()
    rep = checker.validate(data, export.build_schedule("t", data, solved["assign"], e["exams"], fw))
    assert rep["hard_violation_count"] == 0 and rep["bookings"]["priority_inversions"] == []

def test_sample_disruption_minimal_moves(data, solved):
    dis = json.load(open("../examples/sample_disruption.json"))
    p = disruption.propose(data, solved["assign"], dis["changes"], solver.solve_timetable, 240)
    assert p["status"] == "PROPOSED"
    after = export.build_schedule("t", p["newdata"], p["new_assign"])
    base = export.build_schedule("t", data, solved["assign"])
    rep = checker.validate(checker.apply_disruption(data, dis), after, base)
    assert rep["hard_violation_count"] == 0
    print("moved:", rep["stability"]["sessions_moved"])

def test_infeasible_reports_reason(data):
    import copy
    d = copy.deepcopy(data)
    d["rooms"] = [r for r in d["rooms"] if r["type"] != "lab_phy"]       # physics labs lose their only room
    r = solver.solve_timetable(d, time_limit=20)
    assert r["status"] == "INFEASIBLE" and r["explanation"]
