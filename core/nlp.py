"""Deterministic English/Hinglish booking-request parser (works with NO API key).
An optional LLM (see llm.py) may improve extraction, but its output is only ever a *draft* that the
user edits and confirms; feasibility is decided by bookings.py."""
import datetime as dt, re

DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
DAY_WORDS = {
    "MON": ["monday", "mon", "somvar", "somwar", "somvaar"], "TUE": ["tuesday", "tue", "tues", "mangalvar", "mangalwar"],
    "WED": ["wednesday", "wed", "budhvar", "budhwar"], "THU": ["thursday", "thu", "thur", "thurs", "guruvar", "brihaspativar", "veervar"],
    "FRI": ["friday", "fri", "shukravar", "shukrawar"], "SAT": ["saturday", "sat", "shanivar", "shaniwar"],
    "SUN": ["sunday", "sun", "ravivar", "itwar", "ravivaar"]}
NEEDS = {"projector": r"projector|proj\b|big screen|screening|\bscreen\b", "pa_system": r"\bmic\b|\bsound\b|microphone|\bpa\b|pa system|sound system|speaker|loudspeaker",
         "stage": r"\bstage\b", "computers": r"computers?|laptops?|coding|\bpcs?\b", "accessible": r"wheelchair|accessible|handicap|disabled",
         "power_benches": r"power bench", "ac": r"\bac\b|air.?condition"}
DEPT_WORDS = {"CSE": ["cse", "computer science"], "ECE": ["ece", "electronics"], "ME": ["mechanical", "mech", "me "],
              "CE": ["civil"], "EE": ["electrical", "eee"]}
YEAR_WORDS = {1: ["first year", "1st year", "year 1", "freshers"], 2: ["second year", "2nd year", "year 2", "sophomore"],
              3: ["third year", "3rd year", "year 3", "final year"]}


def hour_to_period(h):
    if 8 <= h <= 12: return h - 7
    if h == 13: return 6
    if 14 <= h <= 22: return h - 8
    return None


def _num(s):
    return int(s.replace(",", ""))


def parse_booking(text, data, role="club", today=None, requester=None):
    t = " " + text.lower().replace("’", "'") + " "
    today = today or dt.date.today()
    out = {"title": None, "requester": requester, "role": role, "requested_category": None, "attendance": None,
           "duration_periods": None, "windows": [], "room_types": [], "needs": [], "requested_room": None,
           "mandatory_for_groups": [], "raw_text": text, "follow_up": None, "assumptions": [], "warnings": [], "suggestions": []}
    A = out["assumptions"]
    # ---- days ------------------------------------------------------------------
    days, date = [], None
    for code, words in DAY_WORDS.items():
        if any(re.search(rf"\b{w}\b", t) for w in words):
            days.append(code)
    rel = None
    if re.search(r"\b(kal|tomorrow|tmrw|tmr)\b", t): rel = 1      # 'kal' in a booking = tomorrow
    elif re.search(r"\b(parso|day after tomorrow)\b", t): rel = 2
    elif re.search(r"\b(aaj|today)\b", t): rel = 0
    if rel is not None and not days:
        date = today + dt.timedelta(days=rel)
        code = DAYS[date.weekday()]
        if code in ("SAT", "SUN"): out["warnings"].append(f"{date} is a weekend; bookable days are MON-FRI.")
        else: days.append(code)
        if rel == 1 and re.search(r"\bkal\b", t): A.append("'kal' interpreted as tomorrow.")
    recurring = bool(re.search(r"every|each|har |weekly|daily", t))
    if re.search(r"all (of )?(fest|spectra) week|daily", t) and not days: days = DAYS[:5]; recurring = True
    # ---- attendance --------------------------------------------------------------
    m = (re.search(r"(\d[\d,]*)\s*(?:\+\s*)?(people|persons?|log|students?|participants?|dancers?|members?|attendees|audience|spectators?|guests?|pax|seats?)", t)
         or re.search(r"(?:around|about|approx\w*|roughly|~|maybe|for|lagbhag|kareeb)\s*(\d[\d,]*)\b(?!\s*(?:am|pm|baje|hours?|hrs?|ghante))", t))
    if m: out["attendance"] = _num(m.group(1))
    # ---- duration / time -----------------------------------------------------------
    dur = None
    m = re.search(r"(\d+)\s*[- ]?(?:hours?|hrs?|hr|ghante|ghanta|घंटे)", t)
    if m: dur = int(m.group(1))
    elif re.search(r"\bhalf an hour|30 min", t): dur = 1
    sp = ep = None
    mer = "pm" if re.search(r"shaam|sham|evening|raat|night|\bpm\b|p\.m", t) else ("am" if re.search(r"subah|morning|\bam\b|a\.m", t) else None)
    def to24(h, m_explicit):
        mm = m_explicit or mer
        if mm == "pm" and h < 12: return h + 12
        if mm == "am": return h
        if h == 12: return 12
        if h <= 7: A.append(f"No am/pm for '{h}': assumed {h+12}:00."); return h + 12
        return h
    rng = re.search(r"(\d{1,2})(?::\d\d)?\s*(am|pm)?\s*(?:to|se|-|–|till|until)\s*(\d{1,2})(?::\d\d)?\s*(am|pm)?(?!\d)", t)
    single = re.search(r"(?:at|from|@)?\s*\b(\d{1,2})(?::\d\d)?\s*(am|pm|baje|bje|o'clock)\b", t) or re.search(r"\bat (\d{1,2})\b", t)
    if rng and not re.search(rng.group(0).strip() + r"\s*(people|log|students|participants)", t):
        h1, m1, h2, m2 = int(rng.group(1)), rng.group(2), int(rng.group(3)), rng.group(4)
        mer_r = m2 or m1
        a, b = to24(h1, m1 or mer_r), to24(h2, m2 or mer_r)
        if b <= a and b + 12 <= 22: b += 12
        if b > 22 or b <= 0:
            out["warnings"].append("Requested end time is after 22:00; only periods up to P13 (22:00) can be booked."); b = 22
        sp, ep = hour_to_period(a), (hour_to_period(b) - 1 if hour_to_period(b) else None)
        if sp and ep and dur is None: dur = ep - sp + 1
    elif single:
        h = int(single.group(1)); mm = single.group(2) if single.group(2) in ("am", "pm") else None
        sp = hour_to_period(to24(h, mm))
    else:
        if re.search(r"after lunch|lunch ke baad", t): sp, ep = 6, 9; A.append("'after lunch' mapped to P6-P9 (14:00-18:00).")
        elif re.search(r"afternoon|dopahar", t): sp, ep = 6, 9; A.append("'afternoon' mapped to P6-P9.")
        elif re.search(r"evening|shaam|sham|night|raat", t): sp, ep = 10, 13; A.append("'evening/night' mapped to P10-P13 (18:00-22:00).")
        elif re.search(r"morning|subah", t): sp, ep = 1, 5; A.append("'morning' mapped to P1-P5.")
    if dur is None and sp is not None and ep is not None and ep >= sp and not rng:
        pass
    if dur is None:
        dur = 2 if sp is not None and re.search(r"farewell|contest|seminar|talk|event|session|workshop|evening|shaam|night|show|fest", t) else 1
        if sp is not None or ep is not None:
            A.append(f"Duration not stated; assumed {dur} period(s) - please confirm.")
    out["duration_periods"] = dur
    if sp is not None:
        to = ep if (ep is not None and ep >= sp + dur - 1) else min(13, sp + dur - 1)
        if ep is None and re.search(r"(evening|shaam)", t) and not single: to = 13
        win_days = days or []
        out["windows"] = [{"day": d, "from_period": sp, "to_period": to} for d in win_days]
        if not win_days: out["windows"] = []
    # ---- needs / room types ----------------------------------------------------------
    out["needs"] = [k for k, rx in NEEDS.items() if re.search(rx, t)]
    ids = {r["id"].lower().replace("-", ""): r["id"] for r in data["rooms"]}
    for m in re.finditer(r"\b([a-z]{2,5}[- ]?\d?[- ]?\d?)\b", t):
        k = m.group(1).replace("-", "").replace(" ", "")
        if k in ids and (k.isalpha() is False or k in ("aud", "oat")):
            out["requested_room"] = ids[k]; break
    m = re.search(r"\b(lh|cr|sh|cs[- ]?lab|elec[- ]?lab)[- ]?(\d{1,3})\b", t)
    if m and not out["requested_room"]:
        cand = (m.group(1).replace(" ", "").replace("-", "") + m.group(2)).upper()
        out["requested_room"] = next((r["id"] for r in data["rooms"] if r["id"].replace("-", "") == cand), m.group(0).upper())
        if out["requested_room"] not in {r["id"] for r in data["rooms"]}:
            out["warnings"].append(f"Room '{out['requested_room']}' does not exist; ignoring it.")
            out["requested_room"] = None
    rt = []
    if re.search(r"auditorium|\baud\b", t): rt += ["auditorium"]
    if re.search(r"seminar|\bsh-?\d", t): rt += ["seminar_hall"]
    if re.search(r"open.?air|outdoor|\boat\b|ground", t): rt += ["outdoor"]
    if re.search(r"\blab\b|laboratory", t):
        rt += ["lab_cs"] if "computers" in out["needs"] else (["lab_phy"] if "physics" in t else ["lab_cs", "lab_elec", "lab_phy", "lab_civil", "workshop"])
    if re.search(r"lecture hall|\blh\b", t): rt += ["lecture_hall"]
    if re.search(r"classroom|class room|small room|\bcr-?\d", t): rt += ["classroom"]
    if not rt and re.search(r"\broom\b|\bhall\b|somewhere|venue|jagah|kamra", t):
        rt = ["classroom", "lecture_hall", "seminar_hall"]
        A.append("No room type stated; any classroom, lecture hall or seminar hall.")
    out["room_types"] = list(dict.fromkeys(rt))
    # ---- mandatory groups ----------------------------------------------------------------
    if re.search(r"compulsory|mandatory|must attend|zaroori|compulsary|required for", t):
        yrs = [y for y, ws in YEAR_WORDS.items() if any(w in t for w in ws)]
        depts = [d for d, ws in DEPT_WORDS.items() if any(re.search(rf"\b{w.strip()}\b", t) for w in ws)]
        for g in data["student_groups"]:
            gd = g["department"]
            if (not yrs or g["year"] in yrs) and (not depts or any(gd.startswith(d) for d in depts)):
                if yrs or depts: out["mandatory_for_groups"].append(g["id"])
        if not out["mandatory_for_groups"]:
            out["follow_up"] = "Which student groups must attend (department and year)?"
    if out["attendance"] is None and out["mandatory_for_groups"]:
        sz = {g["id"]: g["size"] for g in data["student_groups"]}
        out["attendance"] = sum(sz[g] for g in out["mandatory_for_groups"])
        A.append(f"Attendance not stated; set to total size of mandatory groups ({out['attendance']}).")
    # ---- title / org / category -------------------------------------------------------------
    m = re.search(r"([a-z0-9' ]{2,40}?)\s+(?:ke liye|ka|ki)\b", text, re.I)
    if m: out["title"] = m.group(1).strip().title()
    m2 = re.search(r"for (?:the |our |a |an )?([A-Za-z0-9' ]{3,50}?)(?:,| on | at | in | this | next |\.|$| around| about)", text)
    if not out["title"] and m2: out["title"] = m2.group(1).strip()
    if not out["title"]:
        out["title"] = re.sub(r"\s+", " ", re.sub(r"[.]", "", text))[:60]
    org = re.search(r"\b([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)? (?:Club|Society|Team|Department|Cell))\b", text)
    if org: out["requester"] = out["requester"] or org.group(1)
    if re.search(r"guest|speaker|industry|visiting|expert", t): cat = "guest_lecture"
    elif re.search(r"inaugur|institute|convocation|fest ", t): cat = "institute_event"
    elif re.search(r"department|dept|farewell|seminar|workshop", t) and role in ("department_coordinator", "admin"): cat = "department_event"
    elif role == "faculty": cat = "guest_lecture"
    elif role == "department_coordinator": cat = "department_event"
    elif role == "admin": cat = "institute_event"
    else: cat = "club_event"
    out["requested_category"] = cat
    # ---- room/need conflicts (real room data) ------------------------------------------------
    rooms = {r["id"]: r for r in data["rooms"]}
    rr = out["requested_room"]
    if rr and rr in rooms:
        r = rooms[rr]; feats = set(r["features"]) | ({"accessible"} if r["accessible"] else set())
        miss = [n for n in out["needs"] if n not in feats]
        if miss or (out["attendance"] and r["capacity"] < out["attendance"]):
            alts = [x["id"] for x in data["rooms"] if "event" in x["allowed_uses"] and x["id"] != rr
                    and x["type"] == r["type"] and (not out["attendance"] or x["capacity"] >= out["attendance"])
                    and not [n for n in out["needs"] if n not in (set(x["features"]) | ({"accessible"} if x["accessible"] else set()))]]
            out["warnings"].append(f"{rr} " + (f"lacks {miss}" if miss else f"seats only {r['capacity']}") + "." + (f" Suggested instead: {', '.join(alts)}." if alts else ""))
            out["suggestions"] = alts
            if alts: out["requested_room"] = alts[0]; A.append(f"Requested {rr} replaced by {alts[0]} because of the conflict above.")
        if not out["room_types"]: out["room_types"] = [r["type"]]
    # ---- follow-up questions (never invent essentials) -----------------------------------------
    if not out["follow_up"]:
        if not days: out["follow_up"] = "Which day do you need the venue?"
        elif sp is None: out["follow_up"] = "What time should it start (and how long)?"
        elif out["attendance"] is None: out["follow_up"] = "Roughly how many people will attend?"
    if recurring and len(days) > 1: out["series_id"] = "SER-" + re.sub(r"\W+", "", (out["title"] or "REQ").upper())[:12]
    return out
