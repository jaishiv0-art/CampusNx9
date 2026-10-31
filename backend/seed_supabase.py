"""
CampusNx9 Database Seeder
Seeds CIT dataset (cit_public.json) and baseline timetable into PostgreSQL / Supabase
Can run directly with Supabase client or generate seed_cit_public.sql.
"""

import os
import json
import datetime
from pathlib import Path

def sql_escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        s = json.dumps(val).replace("'", "''")
        return f"'{s}'::jsonb"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def sql_array(arr):
    if not arr:
        return "'{}'::text[]"
    escaped = [f'"{x}"' if ',' in str(x) or ' ' in str(x) else str(x) for x in arr]
    inner = ",".join(escaped)
    return f"ARRAY[{', '.join([sql_escape(x) for x in arr])}]::text[]"

def generate_sql_seed(data_path: str, schedule_path: str, out_sql_path: str):
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    schedule = {}
    if os.path.exists(schedule_path):
        with open(schedule_path, "r", encoding="utf-8") as f:
            sched_data = json.load(f)
            for s in sched_data.get("sessions", []):
                schedule[s["session_id"]] = (s["day"], s["start_period"], s["room_id"])

    lines = []
    lines.append("-- Auto-generated seed file for Chilika Institute of Technology (CampusNx9)")
    lines.append("BEGIN;\n")

    # 1. Rooms
    lines.append("-- 1. Seed Rooms")
    for r in data["rooms"]:
        features = sql_array(r.get("features", []))
        allowed_uses = sql_array(r.get("allowed_uses", []))
        lines.append(
            f"INSERT INTO rooms (id, name, building, type, capacity, features, accessible, allowed_uses) "
            f"VALUES ({sql_escape(r['id'])}, {sql_escape(r['name'])}, {sql_escape(r['building'])}, {sql_escape(r['type'])}, "
            f"{r['capacity']}, {features}, {sql_escape(r.get('accessible', False))}, {allowed_uses}) "
            f"ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, capacity=EXCLUDED.capacity;\n"
        )

    # 2. Room Unavailability
    lines.append("\n-- 2. Seed Room Unavailability")
    for u in data.get("room_unavailability", []):
        periods = f"ARRAY[{', '.join(map(str, u['periods']))}]::integer[]"
        lines.append(
            f"INSERT INTO room_unavailability (room_id, day, periods, reason) "
            f"VALUES ({sql_escape(u['room_id'])}, {sql_escape(u['day'])}, {periods}, {sql_escape(u.get('reason'))});\n"
        )

    # 3. Faculty
    lines.append("\n-- 3. Seed Faculty")
    for fc in data["faculty"]:
        lines.append(
            f"INSERT INTO faculty (id, name, department, max_hours_per_day, needs_accessible, unavailable, preferences) "
            f"VALUES ({sql_escape(fc['id'])}, {sql_escape(fc['name'])}, {sql_escape(fc['department'])}, "
            f"{fc.get('max_hours_per_day', 4)}, {sql_escape(fc.get('needs_accessible', False))}, "
            f"{sql_escape(fc.get('unavailable', []))}, {sql_escape(fc.get('preferences', []))}) "
            f"ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;\n"
        )

    # 4. Student Groups
    lines.append("\n-- 4. Seed Student Groups")
    for g in data["student_groups"]:
        lines.append(
            f"INSERT INTO student_groups (id, name, year, department, size, needs_accessible) "
            f"VALUES ({sql_escape(g['id'])}, {sql_escape(g['name'])}, {g['year']}, {sql_escape(g['department'])}, "
            f"{g['size']}, {sql_escape(g.get('needs_accessible', False))}) "
            f"ON CONFLICT (id) DO UPDATE SET size=EXCLUDED.size;\n"
        )

    # 5. Courses
    lines.append("\n-- 5. Seed Courses")
    for c in data["courses"]:
        lines.append(
            f"INSERT INTO courses (id, title, department, year, lecture_hours, tutorial_hours, lab_blocks) "
            f"VALUES ({sql_escape(c['id'])}, {sql_escape(c['title'])}, {sql_escape(c['department'])}, {c['year']}, "
            f"{c.get('lecture_hours', 0)}, {c.get('tutorial_hours', 0)}, {c.get('lab_blocks', 0)}) "
            f"ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title;\n"
        )

    # 6. Sessions
    lines.append("\n-- 6. Seed Sessions")
    for s in data["sessions"]:
        grps = sql_array(s["groups"])
        rtypes = sql_array(s.get("room_types", []))
        assigned = schedule.get(s["id"])
        day = sql_escape(assigned[0]) if assigned else "NULL"
        sp = str(assigned[1]) if assigned else "NULL"
        rid = sql_escape(assigned[2]) if assigned else "NULL"

        lines.append(
            f"INSERT INTO sessions (id, course_id, kind, groups, faculty_id, size, duration, room_types, needs_accessible, basket_slot, fixed_slot, day, start_period, room_id) "
            f"VALUES ({sql_escape(s['id'])}, {sql_escape(s['course_id'])}, {sql_escape(s['kind'])}, {grps}, "
            f"{sql_escape(s['faculty_id'])}, {s['size']}, {s.get('duration', 1)}, {rtypes}, "
            f"{sql_escape(s.get('needs_accessible', False))}, {sql_escape(s.get('basket_slot'))}, "
            f"{sql_escape(s.get('fixed_slot'))}, {day}, {sp}, {rid}) "
            f"ON CONFLICT (id) DO UPDATE SET day=EXCLUDED.day, start_period=EXCLUDED.start_period, room_id=EXCLUDED.room_id;\n"
        )

    # 7. Booking Requests
    lines.append("\n-- 7. Seed Booking Requests")
    for b in data.get("booking_requests", []):
        rtypes = sql_array(b.get("room_types", []))
        needs = sql_array(b.get("needs", []))
        m_groups = sql_array(b.get("mandatory_for_groups", []))
        lines.append(
            f"INSERT INTO booking_requests (id, submitted_at, requester, role, department, requested_category, title, attendance, duration_periods, windows, room_types, needs, requested_room, mandatory_for_groups, series_id, raw_text, status) "
            f"VALUES ({sql_escape(b['id'])}, {sql_escape(b['submitted_at'])}, {sql_escape(b['requester'])}, {sql_escape(b['role'])}, "
            f"{sql_escape(b.get('department'))}, {sql_escape(b['requested_category'])}, {sql_escape(b['title'])}, "
            f"{b['attendance']}, {b['duration_periods']}, {sql_escape(b['windows'])}, {rtypes}, {needs}, "
            f"{sql_escape(b.get('requested_room'))}, {m_groups}, {sql_escape(b.get('series_id'))}, {sql_escape(b.get('raw_text'))}, 'pending') "
            f"ON CONFLICT (id) DO NOTHING;\n"
        )

    # 8. Cancellations
    lines.append("\n-- 8. Seed Cancellations")
    for cn in data.get("cancellations", []):
        lines.append(
            f"INSERT INTO cancellations (request_id, cancelled_at, reason) "
            f"VALUES ({sql_escape(cn['request_id'])}, {sql_escape(cn.get('cancelled_at', datetime.datetime.now().isoformat()))}, {sql_escape(cn.get('reason'))}) "
            f"ON CONFLICT (request_id) DO NOTHING;\n"
        )
        lines.append(f"UPDATE booking_requests SET status='cancelled' WHERE id={sql_escape(cn['request_id'])};\n")

    # 9. Exams
    lines.append("\n-- 9. Seed Midsem Exams")
    for ex in data.get("exams", []):
        cids = sql_array(ex["course_ids"])
        grps = sql_array(ex["groups"])
        lines.append(
            f"INSERT INTO exams (id, course_ids, groups, size, duration_hours) "
            f"VALUES ({sql_escape(ex['id'])}, {cids}, {grps}, {ex['size']}, {ex.get('duration_hours', 2)}) "
            f"ON CONFLICT (id) DO NOTHING;\n"
        )

    # 10. Default System Users
    lines.append("\n-- 10. Seed Default Accounts")
    # Default password hashes: 'admin123', 'coord123', 'faculty123', 'club123'
    # Uses PBKDF2 standard salt format compatible with store.py
    import secrets, hashlib
    def mk_hash(pw):
        salt = secrets.token_hex(8)
        return salt + "$" + hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()

    users = [
        ("admin", mk_hash("admin123"), "ADMIN", None, None, "Dean's Office (Administration)"),
        ("coord_cse", mk_hash("coord123"), "DEPARTMENT_COORDINATOR", "CSE", None, "CSE Department"),
        ("coord_ece", mk_hash("coord123"), "DEPARTMENT_COORDINATOR", "ECE", None, "ECE Department"),
        ("coord_me", mk_hash("coord123"), "DEPARTMENT_COORDINATOR", "ME", None, "ME Department"),
        ("coord_ce", mk_hash("coord123"), "DEPARTMENT_COORDINATOR", "CE", None, "CE Department"),
        ("coord_ee", mk_hash("coord123"), "DEPARTMENT_COORDINATOR", "EE", None, "EE Department"),
        ("club_dramatics", mk_hash("club123"), "CLUB_REPRESENTATIVE", None, None, "Dramatics Society"),
        ("club_robotics", mk_hash("club123"), "CLUB_REPRESENTATIVE", None, None, "Robotics Club"),
        ("club_music", mk_hash("club123"), "CLUB_REPRESENTATIVE", None, None, "Music Club"),
    ]
    for fc in data["faculty"]:
        users.append((f"fac_{fc['id'].lower()}", mk_hash("faculty123"), "FACULTY", fc["department"], fc["id"], fc["name"]))

    for u in users:
        dept = sql_escape(u[3])
        fid = sql_escape(u[4])
        org = sql_escape(u[5])
        lines.append(
            f"INSERT INTO users (username, pw, role, department, faculty_id, org, active) "
            f"VALUES ({sql_escape(u[0])}, {sql_escape(u[1])}, {sql_escape(u[2])}, {dept}, {fid}, {org}, 1) "
            f"ON CONFLICT (username) DO NOTHING;\n"
        )

    lines.append("\nCOMMIT;\n")

    os.makedirs(os.path.dirname(out_sql_path), exist_ok=True)
    with open(out_sql_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"Generated complete Supabase SQL seed file: {out_sql_path} ({len(lines)} lines)")

    generate_sql_seed(data_file, schedule_file, out_file)

    # Optional: Direct API push if Supabase credentials are configured
    from app import config
    if config.SUPABASE_URL and config.SUPABASE_KEY and not "your-project-id" in config.SUPABASE_URL:
        print(f"Connecting to Supabase at {config.SUPABASE_URL} to push seed data...")
        try:
            from supabase import create_client
            sb = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
            with open(data_file, "r", encoding="utf-8") as f:
                d = json.load(f)
            # Push rooms
            for r in d["rooms"]:
                sb.table("rooms").upsert({
                    "id": r["id"], "name": r["name"], "building": r["building"],
                    "type": r["type"], "capacity": r["capacity"], "features": r.get("features", []),
                    "accessible": r.get("accessible", False), "allowed_uses": r.get("allowed_uses", [])
                }).execute()
            print("Successfully pushed rooms to Supabase!")
        except Exception as e:
            print(f"Direct push notice: {e}. You can also run supabase/seed_cit_public.sql in the Supabase SQL editor.")
