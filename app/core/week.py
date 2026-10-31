"""Mutable occupancy view of a timetable; fast deterministic hard-constraint checks for single moves."""
from collections import defaultdict
LAST = 9


class Week:
    def __init__(self, data, assign):
        c = data["calendar"]
        self.days = c["days"]; self.lunch = c["lunch"]["after_period"]
        self.lab_starts = set(c["lab_start_periods"])
        self.rooms = {r["id"]: r for r in data["rooms"]}
        self.sess = {s["id"]: s for s in data["sessions"]}
        self.fac = {f["id"]: f for f in data["faculty"]}
        self.fac_un, self.room_un = defaultdict(set), defaultdict(set)
        for f in data["faculty"]:
            for u in f.get("unavailable", []):
                for p in u["periods"]:
                    self.fac_un[f["id"]].add((u["day"], p))
        for u in data.get("room_unavailability", []):
            for p in u["periods"]:
                self.room_un[u["room_id"]].add((u["day"], p))
        self.assign = {}
        self.room_busy, self.fac_busy = defaultdict(set), defaultdict(set)
        self.grp_busy = defaultdict(set)
        self.fac_hours = defaultdict(int)
        self.booked = defaultdict(set)      # (room,day,period) -> request ids
        for sid, sl in assign.items():
            if sid in self.sess:
                self.put(sid, *sl)

    def put(self, sid, d, p, r):
        s = self.sess[sid]; self.assign[sid] = (d, p, r)
        for q in range(p, p + s["duration"]):
            self.room_busy[r, d, q].add(sid); self.fac_busy[s["faculty_id"], d, q].add(sid)
            for g in s["groups"]:
                self.grp_busy[g, d, q].add(s.get("basket_slot") or sid)
        self.fac_hours[s["faculty_id"], d] += s["duration"]

    def drop(self, sid):
        s = self.sess[sid]; d, p, r = self.assign.pop(sid)
        for q in range(p, p + s["duration"]):
            self.room_busy[r, d, q].discard(sid); self.fac_busy[s["faculty_id"], d, q].discard(sid)
            for g in s["groups"]:
                key = s.get("basket_slot") or sid
                if s.get("basket_slot") and any(o != sid and self.sess[o].get("basket_slot") == key and
                        self.assign.get(o) and self.assign[o][0] == d and self.assign[o][1] <= q < self.assign[o][1] + self.sess[o]["duration"]
                        and g in self.sess[o]["groups"] for o in self.assign):
                    continue
                self.grp_busy[g, d, q].discard(key)
        self.fac_hours[s["faculty_id"], d] -= s["duration"]

    def fits(self, sid, d, p, r):
        """True iff placing sid at (d,p,r) breaks no hard rule (sid must not currently be placed)."""
        s, room = self.sess[sid], self.rooms.get(r)
        if room is None or d not in self.days or p < 1 or p + s["duration"] - 1 > LAST:
            return False
        per = range(p, p + s["duration"])
        if per[0] <= self.lunch < per[-1]:
            return False
        if s["kind"] == "lab" and p not in self.lab_starts:
            return False
        if room["type"] not in s["room_types"] or room["capacity"] < s["size"]:
            return False
        if s.get("needs_accessible") and not room["accessible"]:
            return False
        fx = s.get("fixed_slot")
        if fx and (fx["day"] != d or fx["start_period"] != p):
            return False
        f = s["faculty_id"]
        if self.fac_hours[f, d] + s["duration"] > self.fac[f].get("max_hours_per_day", 4):
            return False
        for q in per:
            if (d, q) in self.fac_un[f] or (d, q) in self.room_un[r]:
                return False
            if self.room_busy[r, d, q] or self.booked[r, d, q] or self.fac_busy[f, d, q]:
                return False
            for g in s["groups"]:
                if self.grp_busy[g, d, q] - {s.get("basket_slot")}:
                    return False
        return True

    def room_free(self, r, d, q):
        return not (self.room_busy[r, d, q] or self.booked[r, d, q] or (d, q) in self.room_un[r])

    def why_not(self, sid, d, p, r):
        """Human-readable reason this exact placement is invalid (None if valid). Uses real data only."""
        s, room = self.sess[sid], self.rooms.get(r)
        per = range(p, p + s["duration"])
        if p + s["duration"] - 1 > LAST: return "runs past P9"
        if per[0] <= self.lunch < per[-1]: return "would span lunch"
        if s["kind"] == "lab" and p not in self.lab_starts: return "labs start only at P2 or P6"
        if room["type"] not in s["room_types"]: return f"{r} is the wrong room type"
        if room["capacity"] < s["size"]: return f"{r} is too small ({room['capacity']} < {s['size']})"
        if s.get("needs_accessible") and not room["accessible"]: return f"{r} is not accessible"
        f = s["faculty_id"]
        for q in per:
            if (d, q) in self.fac_un[f]: return f"{f} is unavailable"
            if (d, q) in self.room_un[r]: return f"{r} is closed"
            if self.fac_busy[f, d, q] - {sid}: return f"{f} teaches {sorted(self.fac_busy[f, d, q] - {sid})[0]}"
            if self.room_busy[r, d, q] - {sid}: return f"{r} is used by {sorted(self.room_busy[r, d, q] - {sid})[0]}"
            if self.booked[r, d, q]: return f"{r} is booked for {sorted(self.booked[r, d, q])[0]}"
            for g in s["groups"]:
                other = self.grp_busy[g, d, q] - {sid, s.get("basket_slot")}
                if other: return f"group {g} has {sorted(other)[0]}"
        if self.fac_hours[f, d] - (s["duration"] if self.assign.get(sid, (None,))[0] == d else 0) + s["duration"] > self.fac[f].get("max_hours_per_day", 4):
            return f"{f} would exceed the daily limit"
        return None
