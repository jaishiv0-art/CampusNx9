"""Requires FastAPI. Verifies RBAC is enforced on the backend."""
import os, tempfile, pytest
pytest.importorskip("fastapi"); pytest.importorskip("httpx")
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db"); os.environ["EXPORT_DIR"] = tempfile.mkdtemp()
from fastapi.testclient import TestClient
from app.main import app, store
from tests.greedy_fixture import greedy

@pytest.fixture(scope="module")
def c():
    with TestClient(app) as cl:
        a = greedy(app_data()); store.kv_set("timetable", {k: list(v) for k, v in a.items()}); yield cl

def app_data():
    from app.main import get_data; return get_data()
def tok(c, u, p): return {"Authorization": "Bearer " + c.post("/auth/login", json={"username": u, "password": p}).json()["token"]}

def test_requires_auth(c): assert c.get("/timetable").status_code == 401
def test_club_cannot_generate_import_or_approve(c):
    h = tok(c, "club_dramatics", "club123")
    assert c.post("/admin/timetable/generate", headers=h).status_code == 403
    assert c.get("/admin/users", headers=h).status_code == 403
    assert c.post("/proposals/1/approve", headers=h).status_code == 403
    assert c.get("/timetable", headers=h).status_code == 403

BOOK = {"title": "Play", "attendance": 100, "duration_periods": 2, "windows": [{"day": "TUE", "from_period": 10, "to_period": 11}],
        "room_types": ["seminar_hall", "auditorium"], "needs": ["pa_system"], "requested_category": "club_event"}
def test_booking_needs_confirmation(c):
    h = tok(c, "club_dramatics", "club123")
    assert c.post("/bookings", json=BOOK, headers=h).status_code == 400
def test_no_self_approval_and_cross_role(c):
    h = tok(c, "club_dramatics", "club123"); r = c.post("/bookings", json=BOOK | {"confirm": True}, headers=h); bid = r.json()["id"]
    assert c.post(f"/bookings/{bid}/decide", json={"action": "approve"}, headers=h).status_code == 403
    assert c.post(f"/bookings/{bid}/decide", json={"action": "approve"}, headers=tok(c, "club_robotics", "club123")).status_code == 403
    assert c.post(f"/bookings/{bid}/decide", json={"action": "approve"}, headers=tok(c, "admin", "admin123")).status_code == 200
    assert c.post(f"/bookings/{bid}/cancel", headers=tok(c, "club_robotics", "club123")).status_code == 403
def test_admin_own_booking_cannot_self_approve(c):
    h = tok(c, "admin", "admin123"); bid = c.post("/bookings", json=BOOK | {"confirm": True}, headers=h).json()["id"]
    assert c.post(f"/bookings/{bid}/decide", json={"action": "approve"}, headers=h).status_code == 403
def test_faculty_only_own_unavailability(c):
    h = tok(c, "fac_f01", "faculty123")
    bad = {"changes": [{"type": "faculty_unavailable", "faculty_id": "F02", "days": ["MON"], "periods": [1]}]}
    assert c.post("/faculty/unavailability", json=bad, headers=h).status_code == 403
def test_manual_move_cannot_break_hard_constraints(c):
    h = tok(c, "admin", "admin123"); tt = c.get("/timetable", headers=h).json()["sessions"]
    s = tt[0]; other = next(x for x in tt if x["faculty_id"] == s["faculty_id"] and x["session_id"] != s["session_id"])
    r = c.post("/admin/timetable/manual", json={"session_id": s["session_id"], "day": other["day"], "start_period": other["start_period"], "room_id": s["room_id"]}, headers=h)
    assert r.status_code == 409
def test_assistant_works_without_api_key(c):
    h = tok(c, "club_dramatics", "club123")
    r = c.post("/assistant", json={"message": "seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye"}, headers=h).json()
    assert r["intent"] == "booking" and r["used_llm"] is False and r["requires_confirmation"]
