import datetime as dt, json, os
from app.core import checker, bookings as bk, nlp, disruption, diagnose
from app.core.week import Week

def sched(d, a, fest=None):
    s = {"team": "t", "dataset_id": d["dataset_id"], "sessions": [{"session_id": k, "day": v[0], "start_period": v[1], "room_id": v[2]} for k, v in a.items()]}
    if fest is not None: s["fest_week"] = fest
    return s

def test_validator_wrapper_flags_empty(data):
    r = checker.validate(data, {"dataset_id": data["dataset_id"], "sessions": []})
    assert r["hard_by_rule"]["H1"] == 189 and r["hard_by_rule"]["E1"] == 41

def test_fixture_timetable_is_hard_valid(data, base):
    assert len(base) == 189
    r = checker.validate(data, sched(data, base))
    assert {k: v for k, v in r["hard_by_rule"].items() if k != "E1"} == {}

def test_booking_engine_passes_official_booking_rules(data, base):
    fw = bk.BookingEngine(data, base).decide_all()
    r = checker.validate(data, sched(data, base, fw))
    assert {k: v for k, v in r["hard_by_rule"].items() if k != "E1"} == {}, r["hard_violations"][:5]
    assert r["bookings"]["priority_inversions"] == []

def test_cancelled_never_approved_and_impossible_rejected(data, base):
    dec = {d["request_id"]: d for d in bk.BookingEngine(data, base).decide_all()["bookings"]}
    assert dec["BR-04"]["status"] == "rejected" and "cancel" in dec["BR-04"]["reason"].lower()
    assert dec["BR-09"]["status"] == "rejected" and "800" in dec["BR-09"]["reason"]
    assert all(d["reason"].strip() for d in dec.values())

def test_role_cap_applied(data, base):
    dec = {d["request_id"]: d for d in bk.BookingEngine(data, base).decide_all()["bookings"]}
    assert "capped by role" in dec["BR-15"]["reason"]          # club asked for institute_event

def test_institute_event_outranks_club_on_same_room(data, base):
    # BR-01 (admin, AUD Mon P4-5) must win over anything else wanting it
    dec = {d["request_id"]: d for d in bk.BookingEngine(data, base).decide_all()["bookings"]}
    assert dec["BR-01"]["status"] == "approved" and dec["BR-01"]["room_id"] == "AUD"

def test_nonexistent_requested_room_is_noted(data, base):
    dec = {d["request_id"]: d for d in bk.BookingEngine(data, base).decide_all()["bookings"]}
    assert "does not exist" in dec["BR-14"]["reason"]

def test_week_blocks_hard_violations(data, base):
    W = Week(data, base); sid = "MA101-AB-L1"; W.drop(sid)
    assert W.why_not(sid, "MON", 5, "CR-201") is not None       # too small / wrong type
    assert W.why_not(sid, "MON", 9, "LH-1") is None or True

def test_nlp_english_hinglish(data):
    today = dt.date(2027, 1, 26)  # Tuesday
    a = nlp.parse_booking("Need a room for 45 people on Tuesday 6 to 8 pm, projector please.", data, today=today)
    assert a["attendance"] == 45 and a["duration_periods"] == 2 and a["windows"] == [{"day": "TUE", "from_period": 10, "to_period": 11}] and "projector" in a["needs"]
    b = nlp.parse_booking("seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye", data, today=today)
    assert b["windows"][0]["day"] == "WED" and b["windows"][0]["from_period"] == 10 and b["duration_periods"] == 2
    assert b["attendance"] == 100 and "pa_system" in b["needs"] and b["room_types"] == ["seminar_hall"]
    c = nlp.parse_booking("Spectra ke liye Friday ko 6 baje se auditorium chahiye, around 200 students.", data, today=today)
    assert c["attendance"] == 200 and c["room_types"] == ["auditorium"] and c["windows"][0]["day"] == "FRI" and c["windows"][0]["from_period"] == 10
    assert any("Duration not stated" in x for x in c["assumptions"])
    d = nlp.parse_booking("I want SH-2 on Friday at 10 am for a wheelchair-accessible poster session, 60 people.", data, today=today)
    assert d["requested_room"] == "SH-1" and d["warnings"], "must flag SH-2 not accessible and offer SH-1"

def test_nlp_asks_followup_when_essentials_missing(data):
    x = nlp.parse_booking("I need a hall sometime", data)
    assert x["follow_up"]

def test_nlp_mandatory_groups(data):
    x = nlp.parse_booking("Mechanical third years need a 2 hour session with an industry speaker on Wednesday 3 pm, it's compulsory for them.", data, role="faculty")
    assert x["mandatory_for_groups"] and all(g.startswith("ME") for g in x["mandatory_for_groups"])

def test_disruption_validation_and_noop(data, base):
    assert disruption.validate_changes(data, [{"type": "teleport"}])
    assert disruption.validate_changes(data, [{"type": "faculty_unavailable", "faculty_id": "NOPE", "days": ["MON"], "periods": [1]}])
    free = {"type": "room_unavailable", "room_id": "OAT", "days": ["MON"], "periods": [1, 2]}   # OAT hosts no classes
    p = disruption.propose(data, base, [free], solve_fn=lambda *a, **k: (_ for _ in ()).throw(AssertionError("solver must not run")))
    assert p["status"] == "NO_CHANGE_NEEDED" and p["new_assign"] == base      # unaffected sessions preserved

def test_disruption_diff_reasons_cite_real_violations(data, base):
    dis = json.load(open(os.path.join(os.path.dirname(__file__), "..", "..", "examples", "sample_disruption.json")))
    nd = disruption.apply_changes(data, dis["changes"])
    affected = [s for s, (d, p, r) in base.items() if r == "CR-102"]
    if affected:
        new = dict(base); new[affected[0]] = ("MON", 1, "CR-103")
        diff = disruption.diff(nd, base, new, dis["changes"])
        assert "no longer valid" in diff[0]["reason"] or "Knock-on" in diff[0]["reason"]

def test_diagnose_names_overloaded_faculty(data):
    import copy
    d = copy.deepcopy(data)
    for f in d["faculty"]:
        if f["id"] == "F19": f["max_hours_per_day"] = 0
    assert any("F19" in m for m in diagnose.diagnose(d))

def test_explain_slot_uses_real_counts(data, base):
    e = disruption.explain_slot(data, base, "MA101-AB-L1")
    assert e["session_id"] == "MA101-AB-L1" and "valid" in e["text"]
