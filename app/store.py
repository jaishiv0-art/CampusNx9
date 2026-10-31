import hashlib, json, os, secrets, sqlite3, threading, datetime as dt
from . import config
_lock = threading.RLock()
_conn = None


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
    return _conn


def now(): return dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).isoformat(timespec="seconds")
def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(8)
    return salt + "$" + hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()
def check_pw(pw, stored):
    salt = stored.split("$")[0]; return secrets.compare_digest(hash_pw(pw, salt), stored)


def kv_get(k, default=None):
    with _lock:
        r = conn().execute("SELECT v FROM kv WHERE k=?", (k,)).fetchone()
    return json.loads(r["v"]) if r else default
def kv_set(k, v):
    with _lock:
        conn().execute("INSERT INTO kv VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, json.dumps(v)))
        conn().commit()
def audit(actor, action, detail=None):
    with _lock:
        conn().execute("INSERT INTO audit(ts,actor,action,detail) VALUES(?,?,?,?)", (now(), actor, action, json.dumps(detail, default=str)))
        conn().commit()
def q(sql, args=()):
    with _lock: return [dict(r) for r in conn().execute(sql, args).fetchall()]
def x(sql, args=()):
    with _lock:
        cur = conn().execute(sql, args); conn().commit(); return cur.lastrowid


def seed_users(data):
    if q("SELECT 1 FROM users LIMIT 1"): return
    demo = [("admin", "admin123", "ADMIN", None, None, "Administration"),
            ("coord_cse", "coord123", "DEPARTMENT_COORDINATOR", "CSE", None, "CSE Department"),
            ("coord_ece", "coord123", "DEPARTMENT_COORDINATOR", "ECE", None, "ECE Department"),
            ("club_dramatics", "club123", "CLUB_REPRESENTATIVE", None, None, "Dramatics Society"),
            ("club_robotics", "club123", "CLUB_REPRESENTATIVE", None, None, "Robotics Club")]
    for f in data["faculty"]:
        demo.append((f"fac_{f['id'].lower()}", "faculty123", "FACULTY", f["department"], f["id"], f["name"]))
    for u in demo:
        x("INSERT INTO users(username,pw,role,department,faculty_id,org) VALUES(?,?,?,?,?,?)", (u[0], hash_pw(u[1]), u[2], u[3], u[4], u[5]))
