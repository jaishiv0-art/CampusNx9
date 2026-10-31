import hashlib, json, os, secrets, sqlite3, threading, datetime as dt
from . import config

_lock = threading.RLock()
_conn = None
_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    if config.SUPABASE_URL and config.SUPABASE_KEY:
        try:
            from supabase import create_client
            _supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
            return _supabase_client
        except Exception as e:
            print(f"[Supabase] Initialization note: {e}")
            return None
    return None

def is_supabase_connected():
    sb = get_supabase_client()
    if not sb:
        return False
    try:
        # Quick ping query
        sb.table("system_state").select("key").limit(1).execute()
        return True
    except Exception:
        return False

def conn():
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(config.DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.executescript("""
        CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT);
        CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, pw TEXT, role TEXT, department TEXT, faculty_id TEXT, org TEXT, active INTEGER DEFAULT 1);
        CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, owner TEXT, status TEXT, request TEXT, recommended TEXT, decision TEXT, decided_by TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS proposals(id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, created_by TEXT, status TEXT, payload TEXT, result TEXT, decided_by TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, actor TEXT, action TEXT, detail TEXT);
        """)

        # Ensure default institutional accounts are always seeded
        try:
            cur = _conn.execute("SELECT 1 FROM users LIMIT 1")
            if not cur.fetchone():
                demo = [
                    ("admin", "admin123", "ADMIN", None, None, "Administration"),
                    ("dean.office", "admin123", "ADMIN", None, None, "Dean's Office"),
                    ("coord_cse", "coord123", "DEPARTMENT_COORDINATOR", "CSE", None, "CSE Department"),
                    ("coord_ece", "coord123", "DEPARTMENT_COORDINATOR", "ECE", None, "ECE Department"),
                    ("coord_me", "coord123", "DEPARTMENT_COORDINATOR", "ME", None, "ME Department"),
                    ("coord_ce", "coord123", "DEPARTMENT_COORDINATOR", "CE", None, "CE Department"),
                    ("coord_ee", "coord123", "DEPARTMENT_COORDINATOR", "EE", None, "EE Department"),
                    ("club_dramatics", "club123", "CLUB_REPRESENTATIVE", None, None, "Dramatics Society"),
                    ("club_robotics", "club123", "CLUB_REPRESENTATIVE", None, None, "Robotics Club"),
                    ("club_music", "club123", "CLUB_REPRESENTATIVE", None, None, "Music Club"),
                ]
                try:
                    ds_path = config.resolve_path(getattr(config, "DATASET_PATH", None), "cit_public.json")
                    if os.path.exists(ds_path):
                        with open(ds_path, encoding="utf-8") as f:
                            d = json.load(f)
                            for fac in d.get("faculty", []):
                                demo.append((f"fac_{fac['id'].lower()}", "faculty123", "FACULTY", fac.get("department"), fac.get("id"), fac.get("name")))
                except Exception:
                    pass
                for u in demo:
                    _conn.execute("INSERT OR IGNORE INTO users(username,pw,role,department,faculty_id,org,active) VALUES(?,?,?,?,?,?,1)",
                                  (u[0], hash_pw(u[1]), u[2], u[3], u[4], u[5]))
                _conn.commit()
        except Exception as e:
            print(f"[Store Auto-Seed Note] {e}")
    return _conn

def now():
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).isoformat(timespec="seconds")

def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(8)
    return salt + "$" + hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()

def check_pw(pw, stored):
    salt = stored.split("$")[0]
    return secrets.compare_digest(hash_pw(pw, salt), stored)

def kv_get(k, default=None):
    with _lock:
        r = conn().execute("SELECT v FROM kv WHERE k=?", (k,)).fetchone()
    if r:
        return json.loads(r["v"])

    # Fallback to Supabase system_state if present
    sb = get_supabase_client()
    if sb:
        try:
            res = sb.table("system_state").select("value").eq("key", k).execute()
            if res.data and len(res.data) > 0:
                val = res.data[0]["value"]
                # Cache locally in SQLite
                conn().execute("INSERT INTO kv VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, json.dumps(val)))
                conn().commit()
                return val
        except Exception:
            pass

    return default

def kv_set(k, v):
    val_json = json.dumps(v)
    with _lock:
        conn().execute("INSERT INTO kv VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, val_json))
        conn().commit()

    # Sync to Supabase system_state
    sb = get_supabase_client()
    if sb:
        try:
            sb.table("system_state").upsert({
                "key": k,
                "value": v,
                "updated_at": now()
            }).execute()
        except Exception as e:
            # Non-blocking log
            pass

def audit(actor, action, detail=None):
    ts = now()
    detail_str = json.dumps(detail, default=str)
    with _lock:
        conn().execute("INSERT INTO audit(ts,actor,action,detail) VALUES(?,?,?,?)", (ts, actor, action, detail_str))
        conn().commit()

    # Sync to Supabase audit
    sb = get_supabase_client()
    if sb:
        try:
            sb.table("audit").insert({
                "ts": ts,
                "actor": actor,
                "action": action,
                "detail": detail
            }).execute()
        except Exception:
            pass

def q(sql, args=()):
    with _lock:
        return [dict(r) for r in conn().execute(sql, args).fetchall()]

def x(sql, args=()):
    with _lock:
        cur = conn().execute(sql, args)
        conn().commit()
        last_id = cur.lastrowid
        return last_id

def seed_users(data=None):
    demo = [
        ("admin", "admin123", "ADMIN", None, None, "Administration"),
        ("coord_cse", "coord123", "DEPARTMENT_COORDINATOR", "CSE", None, "CSE Department"),
        ("coord_ece", "coord123", "DEPARTMENT_COORDINATOR", "ECE", None, "ECE Department"),
        ("club_dramatics", "club123", "CLUB_REPRESENTATIVE", None, None, "Dramatics Society"),
        ("club_robotics", "club123", "CLUB_REPRESENTATIVE", None, None, "Robotics Club")
    ]
    if data and isinstance(data, dict) and "faculty" in data:
        for f in data["faculty"]:
            demo.append((f"fac_{f['id'].lower()}", "faculty123", "FACULTY", f.get("department"), f.get("id"), f.get("name")))
    with _lock:
        for u in demo:
            conn().execute(
                "INSERT INTO users(username,pw,role,department,faculty_id,org,active) VALUES(?,?,?,?,?,?,1) "
                "ON CONFLICT(username) DO NOTHING",
                (u[0], hash_pw(u[1]), u[2], u[3], u[4], u[5])
            )
        conn().commit()
