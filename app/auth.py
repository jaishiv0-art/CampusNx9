import time, jwt
from fastapi import Depends, HTTPException, Header
from . import config, store

PERMS = {
    "ADMIN": {"*"},
    "DEPARTMENT_COORDINATOR": {"timetable.view_dept", "change.request", "booking.create", "booking.view_dept", "booking.approve_dept_lab", "booking.cancel_own", "booking.view_own"},
    "FACULTY": {"timetable.view_own", "unavailability.mark", "session.request_extra", "change.request", "booking.create", "booking.cancel_own", "booking.view_own"},
    "CLUB_REPRESENTATIVE": {"booking.create", "booking.cancel_own", "booking.view_own"},
}
ROLE_KEY = {"ADMIN": "admin", "DEPARTMENT_COORDINATOR": "department_coordinator", "FACULTY": "faculty", "CLUB_REPRESENTATIVE": "club"}


def make_token(u):
    return jwt.encode({"sub": u["username"], "exp": int(time.time()) + 8 * 3600}, config.JWT_SECRET, algorithm="HS256")


def current_user(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "): raise HTTPException(401, "Missing bearer token")
    try: sub = jwt.decode(authorization[7:], config.JWT_SECRET, algorithms=["HS256"])["sub"]
    except Exception: raise HTTPException(401, "Invalid or expired token")
    rows = store.q("SELECT * FROM users WHERE username=? AND active=1", (sub,))
    if not rows: raise HTTPException(401, "Unknown or disabled user")
    return rows[0]


def allowed(user, perm):
    p = PERMS.get(user["role"], set())
    return "*" in p or perm in p


def need(perm):
    def dep(user=Depends(current_user)):
        if not allowed(user, perm): raise HTTPException(403, f"Role {user['role']} lacks permission '{perm}'")
        return user
    return dep


def need_any(*perms):
    def dep(user=Depends(current_user)):
        if not any(allowed(user, p) for p in perms): raise HTTPException(403, f"Role {user['role']} lacks any of {perms}")
        return user
    return dep
