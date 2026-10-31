"""FastAPI application. All authorisation is enforced here (not in the UI). Scheduling logic lives in app/core."""
import json, os, datetime as dt
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from . import config, store, auth, assistant
from .auth import need, need_any, current_user, allowed
from .core import checker, bookings as bk, disruption, export, nlp
from .core.diagnose import diagnose
from .core.week import Week

app = FastAPI(title="CIT Scheduler API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])
DAYS = ["MON", "TUE", "WED", "THU", "FRI"]


# ------------------------------------------------------------------ state helpers
def get_data():
    d = store.kv_get("dataset")
    if d is None:
        d = json.load(open(config.DATASET_PATH, encoding="utf-8")); store.kv_set("dataset", d)
    if store.kv_get("priority_order"): d["priority_order"] = store.kv_get("priority_order")
    return d
def get_assign(): return {k: tuple(v) for k, v in (store.kv_get("timetable") or {}).items()}
def fest(): return store.kv_get("fest") or {"bookings": [], "session_overrides": []}
def solver_mod():
    try:
        from .core import solver; return solver
    except ImportError:
        raise HTTPException(503, "OR-Tools is not installed on the server (pip install ortools).")
def solve_fn(data, baseline=None, time_limit=None):
    return solver_mod().solve_timetable(data, baseline=baseline, time_limit=time_limit or config.SOLVE_SECONDS, workers=config.SOLVER_WORKERS)
def schedule_obj(with_fest=True):
    d = get_data(); a = get_assign()
    return export.build_schedule(config.TEAM_NAME, d, a, store.kv_get("exams"), fest() if with_fest else None)
def live_decisions():
    ds = list(fest()["bookings"])
    for b in store.q("SELECT * FROM bookings WHERE status NOT IN ('cancelled','pending','rejected')"):
        dec = json.loads(b["decision"]) if b["decision"] else None
        if dec: ds.append(dec)
    return ds
def booking_row(b):
    return {"id": b["id"], "owner": b["owner"], "status": b["status"], "request": json.loads(b["request"]),
            "recommended": json.loads(b["recommended"]) if b["recommended"] else None,
            "decision": json.loads(b["decision"]) if b["decision"] else None, "decided_by": b["decided_by"], "created": b["created"]}
def recommend(req):
    d, a = get_data(), get_assign()
    e = bk.engine_from_state(d, a, live_decisions(), fest()["session_overrides"])
    return e.decide(req)


@app.on_event("startup")
def startup():
    store.seed_users(get_data())


# ------------------------------------------------------------------ auth
class Login(BaseModel): username: str; password: str
@app.post("/auth/login")
def login(b: Login):
    r = store.q("SELECT * FROM users WHERE username=? AND active=1", (b.username,))
    if not r or not store.check_pw(b.password, r[0]["pw"]): raise HTTPException(401, "Bad credentials")
    store.audit(b.username, "login")
    u = r[0]; return {"token": auth.make_token(u), "user": {k: u[k] for k in ("username", "role", "department", "faculty_id", "org")}}
@app.get("/me")
def me(u=Depends(current_user)): return {k: u[k] for k in ("username", "role", "department", "faculty_id", "org")} | {"permissions": sorted(auth.PERMS[u["role"]])}


# ------------------------------------------------------------------ admin: dataset, generation, export
def validate_dataset(d):
    errs = []
    for k in ("dataset_id", "calendar", "rooms", "faculty", "student_groups", "courses", "sessions", "priority_order", "role_category_cap"):
        if k not in d: errs.append(f"missing key '{k}'")
    if errs: return errs
    for name in ("rooms", "faculty", "student_groups", "sessions"):
        ids = [x.get("id") for x in d[name]]
        if len(ids) != len(set(ids)): errs.append(f"duplicate ids in {name}")
    rooms = {r["id"] for r in d["rooms"]}; fac = {f["id"] for f in d["faculty"]}; grp = {g["id"] for g in d["student_groups"]}
    for s in d["sessions"]:
        if s.get("faculty_id") not in fac: errs.append(f"{s.get('id')}: unknown faculty {s.get('faculty_id')}")
        for g in s.get("groups", []):
            if g not in grp: errs.append(f"{s['id']}: unknown group {g}")
        if not isinstance(s.get("duration"), int) or s["duration"] < 1: errs.append(f"{s['id']}: bad duration")
        if not isinstance(s.get("size"), int) or s["size"] < 1: errs.append(f"{s['id']}: bad size")
    for u in d.get("room_unavailability", []):
        if u["room_id"] not in rooms: errs.append(f"room_unavailability: unknown room {u['room_id']}")
    return errs + [f"infeasible by inspection: {m}" for m in diagnose(d)]


@app.post("/admin/dataset/import")
async def import_dataset(file: UploadFile = File(...), u=Depends(need("dataset.import"))):
    try: d = json.loads((await file.read()).decode("utf-8"))
    except Exception as e: raise HTTPException(400, f"Not valid JSON: {e}")
    errs = validate_dataset(d)
    if errs: raise HTTPException(422, {"message": "Dataset rejected", "errors": errs[:50]})
    store.kv_set("dataset", d)
    for k in ("timetable", "exams", "fest", "initial_timetable"): store.kv_set(k, None)
    store.audit(u["username"], "dataset.import", {"sessions": len(d["sessions"]), "rooms": len(d["rooms"])})
    return {"ok": True, "sessions": len(d["sessions"]), "rooms": len(d["rooms"]), "faculty": len(d["faculty"])}


@app.post("/admin/timetable/generate")
def generate(u=Depends(need("timetable.generate"))):
    d = get_data(); r = solve_fn(d)
    if not r.get("assign"):
        raise HTTPException(409, {"message": "No valid timetable", "status": r["status"], "reasons": (r.get("explanation") or []) + diagnose(d)})
    store.kv_set("timetable", {k: list(v) for k, v in r["assign"].items()})
    store.kv_set("initial_timetable", {k: list(v) for k, v in r["assign"].items()})
    store.kv_set("fest", None)
    rep = checker.validate(d, schedule_obj(with_fest=False), None)
    store.audit(u["username"], "timetable.generate", {"status": r["status"], "objective": r.get("objective"), "hard": rep["hard_violation_count"]})
    return {"status": r["status"], "objective": r.get("objective"), "sessions": len(r["assign"]), "soft": rep["soft_penalties"],
            "hard_violations_excluding_exams": [v for v in rep["hard_violations"] if v["rule"] != "E1"]}


@app.post("/admin/exams/generate")
def gen_exams(u=Depends(need("exam.generate"))):
    from .core import exams as ex   # imported lazily: needs OR-Tools
    d = get_data(); r = ex.solve_exams(d)
    if not r["exams"]: raise HTTPException(409, {"message": "Exams infeasible", "status": r["status"]})
    store.kv_set("exams", r["exams"]); store.audit(u["username"], "exams.generate", {"count": len(r["exams"])})
    return {"status": r["status"], "count": len(r["exams"])}


@app.post("/admin/bookings/decide-dataset")
def decide_dataset(u=Depends(need("booking.decide_all"))):
    d, a = get_data(), get_assign()
    if not a: raise HTTPException(409, "Generate the timetable first")
    out = bk.BookingEngine(d, a).decide_all(); store.kv_set("fest", out)
    store.audit(u["username"], "bookings.decide_dataset", {"n": len(out["bookings"])})
    return out


@app.post("/admin/export")
def do_export(u=Depends(need("export"))):
    if not get_assign(): raise HTTPException(409, "No timetable to export")
    p = os.path.join(config.EXPORT_DIR, "schedule.json")
    d0 = get_data(); init = store.kv_get("initial_timetable")
    sched = schedule_obj()
    if init and store.kv_get("disrupted"):   # keep schedule.json = pre-disruption
        sched = export.build_schedule(config.TEAM_NAME, store.kv_get("dataset_initial") or d0, {k: tuple(v) for k, v in init.items()}, store.kv_get("exams"), fest())
        export.write(os.path.join(config.EXPORT_DIR, "schedule_after.json"), export.build_schedule(config.TEAM_NAME, d0, get_assign()))
    export.write(p, sched)
    store.audit(u["username"], "export", {"dir": config.EXPORT_DIR}); return {"written": os.listdir(config.EXPORT_DIR)}
@app.get("/export/schedule.json")
def get_schedule(u=Depends(need("export"))): return schedule_obj()


@app.get("/admin/validate")
def run_validator(u=Depends(need_any("timetable.generate", "timetable.view_dept"))):
    return checker.validate(get_data(), schedule_obj(), None)


# ------------------------------------------------------------------ read views
def _decorate(d, a):
    S = {s["id"]: s for s in d["sessions"]}; F = {f["id"]: f for f in d["faculty"]}; G = {g["id"]: g for g in d["student_groups"]}
    C = {c["id"]: c for c in d["courses"]}; rows = []
    for sid, (day, p, r) in a.items():
        s = S.get(sid)
        if not s: continue
        rows.append({"session_id": sid, "course_id": s["course_id"], "title": C.get(s["course_id"], {}).get("title"), "kind": s["kind"], "day": day,
                     "start_period": p, "duration": s["duration"], "room_id": r, "faculty_id": s["faculty_id"], "faculty": F[s["faculty_id"]]["name"],
                     "department": F[s["faculty_id"]]["department"], "groups": s["groups"], "basket": s.get("basket_slot"),
                     "group_depts": sorted({G[g]["department"] for g in s["groups"]})})
    return rows


@app.get("/timetable")
def timetable(day: Optional[str] = None, period: Optional[int] = None, faculty: Optional[str] = None, department: Optional[str] = None,
              group: Optional[str] = None, room: Optional[str] = None, u=Depends(need_any("timetable.view_dept", "timetable.view_own"))):
    d, a = get_data(), get_assign(); rows = _decorate(d, a)
    if not allowed(u, "*"):
        if u["role"] == "FACULTY": rows = [r for r in rows if r["faculty_id"] == u["faculty_id"]]
        else: rows = [r for r in rows if r["department"] == u["department"] or u["department"] in r["group_depts"] or any(g.startswith(u["department"]) for g in r["groups"])]
    if day: rows = [r for r in rows if r["day"] == day]
    if period: rows = [r for r in rows if r["start_period"] <= period < r["start_period"] + r["duration"]]
    if faculty: rows = [r for r in rows if r["faculty_id"] == faculty]
    if department: rows = [r for r in rows if r["department"] == department or department in r["group_depts"]]
    if group: rows = [r for r in rows if group in r["groups"]]
    if room: rows = [r for r in rows if r["room_id"] == room]
    return {"sessions": rows, "count": len(rows)}


@app.get("/meta")
def meta(u=Depends(current_user)):
    d = get_data()
    return {"days": DAYS, "rooms": [{"id": r["id"], "name": r["name"], "type": r["type"], "capacity": r["capacity"]} for r in d["rooms"]],
            "faculty": [{"id": f["id"], "name": f["name"], "department": f["department"]} for f in d["faculty"]],
            "groups": [{"id": g["id"], "department": g["department"], "year": g["year"]} for g in d["student_groups"]],
            "priority_order": d["priority_order"], "departments": sorted({f["department"] for f in d["faculty"]}), "has_timetable": bool(get_assign())}


@app.get("/exams")
def exams(u=Depends(current_user)): return {"exams": store.kv_get("exams") or []}


@app.get("/conflicts")
def conflicts(u=Depends(need_any("timetable.generate", "timetable.view_dept"))):
    rep = checker.validate(get_data(), schedule_obj(), None)
    return {"hard_violation_count": rep["hard_violation_count"], "violations": rep["hard_violations"][:200], "soft": rep["soft_penalties"]}


@app.get("/stats/utilization")
def utilization(u=Depends(need_any("timetable.generate", "timetable.view_dept"))):
    d, a = get_data(), get_assign(); S = {s["id"]: s for s in d["sessions"]}; used = {r["id"]: 0 for r in d["rooms"]}; low = 0
    cap = {r["id"]: r["capacity"] for r in d["rooms"]}
    for sid, (_, _, r) in a.items():
        if sid in S: used[r] += S[sid]["duration"]; low += S[sid]["size"] / cap[r] < 0.4
    return {"rooms": [{"room_id": r, "hours": h, "utilization": round(h / 45, 3)} for r, h in used.items()], "sessions_below_40pct_fill": low}


# ------------------------------------------------------------------ bookings
class Window(BaseModel):
    day: str; from_period: int = Field(ge=1, le=13); to_period: int = Field(ge=1, le=13)
class BookingIn(BaseModel):
    title: str; attendance: int = Field(gt=0); duration_periods: int = Field(ge=1, le=13)
    windows: List[Window]; room_types: List[str] = []; needs: List[str] = []; requested_room: Optional[str] = None
    mandatory_for_groups: List[str] = []; requested_category: str = "club_event"; raw_text: str = ""; series_id: Optional[str] = None
    requester: Optional[str] = None; confirm: bool = False
class ParseIn(BaseModel): text: str; today: Optional[str] = None


@app.post("/bookings/parse")
def parse(b: ParseIn, u=Depends(need("booking.create"))):
    today = dt.date.fromisoformat(b.today) if b.today else dt.date.today()
    role = auth.ROLE_KEY[u["role"]]
    return nlp.parse_booking(b.text, get_data(), role=role, today=today, requester=u["org"])


@app.post("/bookings")
def create_booking(b: BookingIn, u=Depends(need("booking.create"))):
    if not b.confirm: raise HTTPException(400, "Booking not submitted: user confirmation required (confirm=true).")
    d = get_data()
    for w in b.windows:
        if w.day not in DAYS or w.to_period < w.from_period: raise HTTPException(422, f"Invalid window {w}")
    if not b.windows or not b.room_types: raise HTTPException(422, "At least one window and one room type are required")
    bid = f"UB-{len(store.q('SELECT id FROM bookings')) + 1:04d}"
    req = b.model_dump(exclude={"confirm"}) | {"id": bid, "submitted_at": store.now(), "role": auth.ROLE_KEY[u["role"]], "department": u["department"],
                                              "requester": b.requester or u["org"]}
    rec = recommend(req)
    store.x("INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?)", (bid, u["username"], "pending", json.dumps(req), json.dumps(rec), None, None, store.now()))
    store.audit(u["username"], "booking.submit", {"id": bid, "recommended": rec["status"]})
    return {"id": bid, "status": "pending", "recommendation": rec}


def _visible(u, row):
    if allowed(u, "*") or row["owner"] == u["username"]: return True
    return u["role"] == "DEPARTMENT_COORDINATOR" and json.loads(row["request"]).get("department") == u["department"]


@app.get("/bookings")
def list_bookings(u=Depends(need_any("booking.view_own", "booking.view_dept"))):
    rows = [booking_row(b) for b in store.q("SELECT * FROM bookings ORDER BY created DESC") if _visible(u, b)]
    out = {"user_bookings": rows}
    if allowed(u, "*") or u["role"] == "DEPARTMENT_COORDINATOR": out["dataset_decisions"] = fest()["bookings"]
    return out


@app.get("/bookings/pending")
def pending(u=Depends(need_any("booking.approve_dept_lab", "booking.decide"))):
    return {"pending": [booking_row(b) for b in store.q("SELECT * FROM bookings WHERE status='pending'") if _visible(u, b) and b["owner"] != u["username"]]}


class Decide(BaseModel): action: str; note: str = ""
LAB_TYPES = ("lab_cs", "lab_elec", "lab_phy", "lab_civil", "workshop")


@app.post("/bookings/{bid}/decide")
def decide(bid: str, b: Decide, u=Depends(current_user)):
    rows = store.q("SELECT * FROM bookings WHERE id=?", (bid,))
    if not rows: raise HTTPException(404, "No such booking")
    row = rows[0]
    if row["owner"] == u["username"]: raise HTTPException(403, "Nobody can approve or reject their own request")
    if row["status"] != "pending": raise HTTPException(409, f"Booking is already {row['status']}")
    req = json.loads(row["request"]); rec = recommend(req)
    if not allowed(u, "*"):
        d = get_data(); room = next((r for r in d["rooms"] if r["id"] == rec.get("room_id")), None)
        eligible = (u["role"] == "DEPARTMENT_COORDINATOR" and req.get("department") == u["department"] and room and room["type"] in LAB_TYPES)
        if not eligible: raise HTTPException(403, "Only Admin, or a coordinator for a lab booking of their own department, may decide")
    if b.action == "reject":
        dec = {"request_id": bid, "status": "rejected", "reason": f"Rejected by {u['username']}: {b.note or 'no note'}. Engine view: {rec['reason']}"}
    elif b.action == "approve":
        if rec["status"] == "rejected": raise HTTPException(409, {"message": "Cannot approve: no valid venue", "explanation": rec["reason"]})
        dec = rec | {"reason": rec["reason"] + (f" Approved by {u['username']}." + (f" Note: {b.note}" if b.note else ""))}
    else: raise HTTPException(400, "action must be approve or reject")
    store.x("UPDATE bookings SET status=?, decision=?, decided_by=? WHERE id=?", (dec["status"], json.dumps(dec), u["username"], bid))
    store.audit(u["username"], f"booking.{b.action}", {"id": bid, "status": dec["status"]})
    return dec


@app.post("/bookings/{bid}/cancel")
def cancel(bid: str, u=Depends(need("booking.cancel_own"))):
    rows = store.q("SELECT * FROM bookings WHERE id=?", (bid,))
    if not rows: raise HTTPException(404, "No such booking")
    if rows[0]["owner"] != u["username"] and not allowed(u, "*"): raise HTTPException(403, "You can only cancel your own requests")
    store.x("UPDATE bookings SET status='cancelled' WHERE id=?", (bid,)); store.audit(u["username"], "booking.cancel", {"id": bid})
    return {"id": bid, "status": "cancelled"}


@app.get("/bookings/{bid}/explanation")
def explanation(bid: str, u=Depends(need_any("booking.view_own", "booking.view_dept"))):
    rows = store.q("SELECT * FROM bookings WHERE id=?", (bid,))
    if not rows or not _visible(u, rows[0]): raise HTTPException(404, "No such booking")
    r = booking_row(rows[0]); return {"id": bid, "status": r["status"], "explanation": (r["decision"] or r["recommended"] or {}).get("reason")}


# ------------------------------------------------------------------ disruptions / change requests
class ChangeIn(BaseModel): changes: List[dict]; note: str = ""
def make_proposal(kind, user, changes, note=""):
    d, a = get_data(), get_assign()
    if not a: raise HTTPException(409, "No approved timetable yet")
    res = disruption.propose(d, a, changes, solve_fn)
    stored = {k: v for k, v in res.items() if k != "newdata"}
    if "new_assign" in stored and stored["new_assign"]: stored["new_assign"] = {k: list(v) for k, v in stored["new_assign"].items()}
    if "diff" in stored: stored["diff"] = [x | {"old": list(x["old"]) if x["old"] else None, "new": list(x["new"]) if x["new"] else None} for x in stored["diff"]]
    status = "pending" if res["status"] in ("PROPOSED", "NO_CHANGE_NEEDED") else "unresolvable"
    pid = store.x("INSERT INTO proposals(kind,created_by,status,payload,result,created) VALUES(?,?,?,?,?,?)",
                  (kind, user["username"], status, json.dumps({"changes": changes, "note": note}), json.dumps(stored), store.now()))
    store.audit(user["username"], f"{kind}.propose", {"id": pid, "result": res["status"]})
    return {"id": pid, "status": status, "result": stored}


@app.post("/disruptions")
def admin_disruption(b: ChangeIn, u=Depends(need("disruption.apply"))): return make_proposal("disruption", u, b.changes, b.note)
@app.post("/disruptions/sample")
def sample_disruption(u=Depends(need("disruption.apply"))):
    f = json.load(open(os.path.join(config.ROOT, "examples", "sample_disruption.json")))
    return make_proposal("disruption", u, f["changes"], "sample_disruption.json")


@app.post("/faculty/unavailability")
def mark_unavailable(b: ChangeIn, u=Depends(need("unavailability.mark"))):
    for c in b.changes:
        if c.get("type") != "faculty_unavailable" or c.get("faculty_id") != u["faculty_id"]:
            raise HTTPException(403, "Faculty may only mark their own unavailability")
    return make_proposal("unavailability", u, b.changes, b.note)
@app.post("/requests/extra-session")
def extra_session(b: ChangeIn, u=Depends(need("session.request_extra"))):
    for c in b.changes:
        if c.get("type") != "add_session" or c["session"].get("faculty_id") != u["faculty_id"]:
            raise HTTPException(403, "Faculty may only request extra sessions for themselves")
    return make_proposal("extra_session", u, b.changes, b.note)
@app.post("/requests/change")
def change_request(b: ChangeIn, u=Depends(need("change.request"))):
    d = get_data(); S = {s["id"]: s for s in d["sessions"]}; F = {f["id"]: f for f in d["faculty"]}
    for c in b.changes:
        if c.get("type") != "move_session": raise HTTPException(403, "Only move_session change requests are allowed here")
        s = S.get(c.get("session_id"))
        if not s: raise HTTPException(404, "Unknown session")
        if u["role"] == "FACULTY" and s["faculty_id"] != u["faculty_id"]: raise HTTPException(403, "Not your session")
        if u["role"] == "DEPARTMENT_COORDINATOR" and F[s["faculty_id"]]["department"] != u["department"]: raise HTTPException(403, "Not your department's session")
    return make_proposal("change", u, b.changes, b.note)


@app.get("/proposals")
def proposals(u=Depends(current_user)):
    rows = store.q("SELECT * FROM proposals ORDER BY id DESC")
    if not allowed(u, "*"): rows = [r for r in rows if r["created_by"] == u["username"]]
    return {"proposals": [r | {"payload": json.loads(r["payload"]), "result": json.loads(r["result"])} for r in rows]}


@app.post("/proposals/{pid}/approve")
def approve(pid: int, u=Depends(need("timetable.approve"))):
    rows = store.q("SELECT * FROM proposals WHERE id=?", (pid,))
    if not rows: raise HTTPException(404, "No such proposal")
    p = rows[0]
    if p["status"] != "pending": raise HTTPException(409, f"Proposal is {p['status']}")
    if p["created_by"] == u["username"] and p["kind"] != "disruption":
        raise HTTPException(403, "Nobody can approve their own request")
    payload, res = json.loads(p["payload"]), json.loads(p["result"])
    d = get_data()
    nd = disruption.apply_changes(d, payload["changes"])
    new = {k: tuple(v) for k, v in res["new_assign"].items()}
    viol = checker.timetable_violations(nd, new)       # deterministic re-check at approval time
    if viol: raise HTTPException(409, {"message": "Proposal no longer valid", "violations": [v["detail"] for v in viol[:20]]})
    if not store.kv_get("dataset_initial"): store.kv_set("dataset_initial", d)
    store.kv_set("dataset", nd); store.kv_set("timetable", {k: list(v) for k, v in new.items()}); store.kv_set("disrupted", True)
    store.x("UPDATE proposals SET status='approved', decided_by=? WHERE id=?", (u["username"], pid))
    store.audit(u["username"], "proposal.approve", {"id": pid, "moved": len(res.get("diff", []))})
    return {"status": "approved", "applied": len(res.get("diff", []))}


@app.post("/proposals/{pid}/reject")
def reject(pid: int, note: str = "", u=Depends(need("timetable.approve"))):
    store.x("UPDATE proposals SET status='rejected', decided_by=? WHERE id=? AND status='pending'", (u["username"], pid))
    store.audit(u["username"], "proposal.reject", {"id": pid, "note": note}); return {"status": "rejected"}


# ------------------------------------------------------------------ manual scheduling (cannot bypass hard constraints)
class Manual(BaseModel): session_id: str; day: str; start_period: int; room_id: str
@app.post("/admin/timetable/manual")
def manual(b: Manual, u=Depends(need("timetable.manual"))):
    d, a = get_data(), get_assign()
    if b.session_id not in a: raise HTTPException(404, "Session not in timetable")
    W = Week(d, a); W.drop(b.session_id)
    why = W.why_not(b.session_id, b.day, b.start_period, b.room_id) if b.room_id in W.rooms else "unknown room"
    if why is None and not W.fits(b.session_id, b.day, b.start_period, b.room_id): why = "violates a hard constraint"
    if why: raise HTTPException(409, {"message": "Manual move rejected: hard constraint violated", "reason": why})
    trial = dict(a); trial[b.session_id] = (b.day, b.start_period, b.room_id)
    viol = checker.timetable_violations(d, trial)
    if viol: raise HTTPException(409, {"message": "Manual move rejected by validator", "violations": [v["detail"] for v in viol[:10]]})
    store.kv_set("timetable", {k: list(v) for k, v in trial.items()}); store.audit(u["username"], "timetable.manual", b.model_dump())
    return {"ok": True}


# ------------------------------------------------------------------ admin: priority rules, users, audit
class Priority(BaseModel): order: List[str]
@app.put("/admin/priority")
def set_priority(b: Priority, u=Depends(need("priority.change"))):
    cur = get_data()["priority_order"]
    if sorted(b.order) != sorted(cur): raise HTTPException(422, f"Order must be a permutation of {cur}")
    store.kv_set("priority_order", b.order); store.audit(u["username"], "priority.change", b.order); return {"order": b.order}
class UserIn(BaseModel): username: str; password: str; role: str; department: Optional[str] = None; faculty_id: Optional[str] = None; org: Optional[str] = None; active: bool = True
@app.get("/admin/users")
def users(u=Depends(need("users.manage"))): return {"users": store.q("SELECT username,role,department,faculty_id,org,active FROM users")}
@app.post("/admin/users")
def upsert_user(b: UserIn, u=Depends(need("users.manage"))):
    if b.role not in auth.PERMS: raise HTTPException(422, f"role must be one of {list(auth.PERMS)}")
    store.x("INSERT INTO users VALUES(?,?,?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET pw=excluded.pw, role=excluded.role, department=excluded.department, faculty_id=excluded.faculty_id, org=excluded.org, active=excluded.active",
            (b.username, store.hash_pw(b.password), b.role, b.department, b.faculty_id, b.org, int(b.active)))
    store.audit(u["username"], "user.upsert", {"username": b.username, "role": b.role}); return {"ok": True}
@app.get("/audit")
def audit_log(limit: int = 100, u=Depends(need("audit.view"))): return {"events": store.q("SELECT * FROM audit ORDER BY id DESC LIMIT ?", (limit,))}


# ------------------------------------------------------------------ assistant
class Ask(BaseModel): message: str
@app.post("/assistant")
def ask(b: Ask, u=Depends(need_any("booking.create", "change.request", "timetable.view_own"))):
    rows = [booking_row(r) for r in store.q("SELECT * FROM bookings WHERE owner=?", (u["username"],))]
    return assistant.handle(b.message, u, get_data(), get_assign(), rows)
@app.get("/health")
def health():
    try: import ortools; solver = ortools.__version__
    except ImportError: solver = None
    return {"ok": True, "ortools": solver, "llm_configured": bool(config.ANTHROPIC_API_KEY)}

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CampusNx9 CIT Backend API",
        "health": "/health",
        "docs": "/docs"
    }
