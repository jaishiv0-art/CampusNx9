import time, jwt
from fastapi import Depends, HTTPException, Header
try:
    from . import config, store
except ImportError:
    import config, store

PERMS = {
    "ADMIN": {"*"},
    "DEPARTMENT_COORDINATOR": {
        "timetable.generate",
        "timetable.view_dept",
        "timetable.view_own",
        "change.request",
        "booking.create",
        "booking.view_dept",
        "booking.approve_dept_lab",
        "booking.cancel_own",
        "booking.view_own",
    },
    "FACULTY": {
        "timetable.generate",
        "timetable.view_dept",
        "timetable.view_own",
        "unavailability.mark",
        "session.request_extra",
        "change.request",
        "booking.create",
        "booking.cancel_own",
        "booking.view_own",
    },
    "CLUB_REPRESENTATIVE": {
        "booking.create",
        "booking.cancel_own",
        "booking.view_own",
    },
}

ROLE_KEY = {
    "ADMIN": "admin",
    "DEPARTMENT_COORDINATOR": "department_coordinator",
    "FACULTY": "faculty",
    "CLUB_REPRESENTATIVE": "club",
}


def make_token(u):
    return jwt.encode(
        {"sub": u["username"], "exp": int(time.time()) + 8 * 3600},
        config.JWT_SECRET,
        algorithm="HS256",
    )


def current_user(authorization: str = Header(default="")):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")

    token_str = authorization[7:].strip()
    if not token_str:
        raise HTTPException(401, "Empty bearer token")

    # 1. Attempt verification as a Supabase Auth access token
    sb = getattr(store, "get_supabase_client", lambda: None)()
    if sb:
        # Pre-check token claims to distinguish Supabase JWT from local HS256 tokens
        is_supabase_token = False
        try:
            unverified = jwt.decode(token_str, options={"verify_signature": False})
            iss = unverified.get("iss", "")
            if "supabase" in iss or unverified.get("aud") == "authenticated":
                is_supabase_token = True
        except Exception:
            pass

        if is_supabase_token:
            try:
                res = sb.auth.get_user(token_str)
                if res and res.user:
                    sb_user = res.user
                    uid = sb_user.id

                    # Enforce institutional email verification check
                    if not sb_user.email_confirmed_at and not getattr(sb_user, "confirmed_at", None):
                        raise HTTPException(
                            403,
                            "Institutional email address is not verified. Please check your inbox and confirm your email.",
                        )

                    # Look up institutional profile in public.profiles with metadata fallback
                    prof = None
                    try:
                        prof_res = (
                            sb.table("profiles")
                            .select("*")
                            .or_(f"user_id.eq.{uid},id.eq.{uid}")
                            .execute()
                        )
                        if prof_res.data and len(prof_res.data) > 0:
                            prof = prof_res.data[0]
                    except Exception:
                        pass

                    if not prof:
                        meta = getattr(sb_user, "user_metadata", None) or {}
                        prof = {
                            "username": meta.get("username") or (sb_user.email or "").split("@")[0] or "user",
                            "full_name": meta.get("full_name") or "",
                            "role": meta.get("role") or "FACULTY",
                            "department": meta.get("department"),
                            "faculty_id": meta.get("faculty_id"),
                            "org": meta.get("org"),
                            "approval_status": meta.get("approval_status", "pending"),
                            "active": meta.get("active", True),
                            "email": sb_user.email,
                        }

                    # Enforce approval status check
                    approval_status = prof.get("approval_status", "pending")
                    if approval_status == "rejected":
                        raise HTTPException(
                            403,
                            "Institutional account rejected. Your registration request was declined by the Dean's Office.",
                        )
                    elif approval_status != "approved":
                        raise HTTPException(
                            403,
                            f"Account pending institutional approval (status: {approval_status}). Please wait for Dean's Office authorization.",
                        )

                    # Enforce active account check
                    if not prof.get("active", True):
                        raise HTTPException(
                            403,
                            "Account has been deactivated. Please contact the Administrator.",
                        )

                    role = prof.get("role", "FACULTY")
                    if role not in PERMS:
                        role = "FACULTY"

                    username = prof.get("username") or (sb_user.email or "").split("@")[0] or "user"
                    dept = prof.get("department")
                    fid = prof.get("faculty_id")
                    org = prof.get("org")

                    # Synchronize into local SQLite store so foreign key relations & joins stay valid
                    try:
                        store.x(
                            "INSERT INTO users(username,pw,role,department,faculty_id,org,active) "
                            "VALUES(?,?,?,?,?,?,1) "
                            "ON CONFLICT(username) DO UPDATE SET "
                            "role=excluded.role, department=excluded.department, "
                            "faculty_id=excluded.faculty_id, org=excluded.org, active=1",
                            (username, "supabase_managed", role, dept, fid, org),
                        )
                    except Exception:
                        pass

                    return {
                        "username": username,
                        "role": role,
                        "department": dept,
                        "faculty_id": fid,
                        "org": org,
                        "active": 1,
                        "email": prof.get("email") or sb_user.email,
                        "auth_provider": "supabase",
                    }
            except HTTPException:
                raise
            except Exception as e:
                # Supabase token rejected or verification failed
                raise HTTPException(401, f"Supabase authorization failed: {str(e)}")

    # 2. Fallback: Local HS256 JWT decode (for instant demo accounts & local tests)
    try:
        payload = jwt.decode(
            token_str, config.JWT_SECRET, algorithms=["HS256"]
        )
        sub = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or expired authorization token")

    rows = store.q(
        "SELECT * FROM users WHERE (username=? OR username=?) AND active=1",
        (sub, sub.lower()),
    )
    if not rows:
        raise HTTPException(401, "Unknown or disabled user account")

    return dict(rows[0])


def allowed(user, perm):
    p = PERMS.get(user["role"], set())
    return "*" in p or perm in p


def need(perm):
    def dep(user=Depends(current_user)):
        if not allowed(user, perm):
            raise HTTPException(
                403, f"Role {user['role']} lacks permission '{perm}'"
            )
        return user

    return dep


def need_any(*perms):
    def dep(user=Depends(current_user)):
        if not any(allowed(user, p) for p in perms):
            raise HTTPException(
                403, f"Role {user['role']} lacks any of {perms}"
            )
        return user

    return dep
