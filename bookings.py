"""Deterministic venue-booking engine. No LLM involved: priority, feasibility and explanations all
come from dataset rules and actual occupancy."""
import copy
from functools import cmp_to_key
from .week import Week
from . import checker
V = checker.V
MAXP = 13


def eff_cat(data, req):
    return V.effective_category(data, req)


def rank(data, req):
    return data["priority_order"].index(eff_cat(data, req))


def sort_requests(data, reqs):
    def cmp(a, b):
        if a is b: return 0
        return -1 if V.outranks(data, a, b) else 1
    return sorted(reqs, key=cmp_to_key(cmp))


def room_ok(room, req):
    feats = set(room["features"]) | ({"accessible"} if room["accessible"] else set())
    return ("event" in room["allowed_uses"] and room["type"] in req["room_types"]
            and room["capacity"] >= req["attendance"] and not (set(req["needs"]) - feats))


class BookingEngine:
    def __init__(self, data, assign):
        self.data, self.base = data, assign
        self.week = Week(data, assign)
        self.decisions, self.overrides, self.holder = {}, [], {}

    # ---- candidate generation -------------------------------------------------
    def _rooms(self, req):
        rs = [r for r in self.data["rooms"] if room_ok(r, req)]
        want = req.get("requested_room")
        return sorted(rs, key=lambda r: (r["id"] != want, r["capacity"], r["id"]))

    def _slots(self, req, windows):
        d = req["duration_periods"]
        for w in windows:
            for st in range(w["from_period"], w["to_period"] - d + 2):
                if st + d - 1 <= MAXP:
                    yield w["day"], st, st + d - 1

    def _blockers(self, req, room, day, a, b):
        """Return (hard_blocked, sessions_in_way, bookings_in_way)."""
        W, hard, ss, bk = self.week, False, set(), set()
        for q in range(a, b + 1):
            if (day, q) in W.room_un[room["id"]]: hard = True
            ss |= W.room_busy[room["id"], day, q]; bk |= W.booked[room["id"], day, q]
            for g in req["mandatory_for_groups"]:
                if W.grp_busy[g, day, q]: hard = True
        return hard, ss, bk

    def _find_free(self, req, windows):
        for room in self._rooms(req):
            for day, a, b in self._slots(req, windows):
                hard, ss, bk = self._blockers(req, room, day, a, b)
                if not hard and not ss and not bk:
                    return room, day, a, b
        return None

    # ---- institute event: displace regular sessions (moved, never dropped) ------
    def _relocate(self, sid, avoid):
        W, s = self.week, self.week.sess[sid]
        od, op, _ = W.assign[sid]
        W.drop(sid)
        order = []
        for d in W.days:
            for p in range(1, 10):
                order.append((d != od, abs(W.days.index(d) - W.days.index(od)), abs(p - op), d, p))
        for _, _, _, d, p in sorted(order):
            for r in sorted(W.rooms, key=lambda x: (W.rooms[x]["capacity"], x)):
                if (d, p, r) not in avoid and W.fits(sid, d, p, r):
                    return d, p, r
        return None

    def _try_displace(self, req, windows):
        W = self.week
        for room in self._rooms(req):
            for day, a, b in self._slots(req, windows):
                hard, ss, bk = self._blockers(req, room, day, a, b)
                if hard or bk or not ss:
                    continue
                if any(W.sess[x].get("basket_slot") for x in ss):
                    continue
                snapshot = {sid: W.assign[sid] for sid in ss}
                for q in range(a, b + 1):
                    W.booked[room["id"], day, q].add(req["id"])
                for sid in ss: W.assign  # noqa
                moves, ok = {}, True
                for sid in sorted(ss):
                    new = self._relocate(sid, set())
                    if new is None: ok = False; break
                    W.put(sid, *new); moves[sid] = new
                if ok:
                    return room, day, a, b, snapshot, moves
                for sid in list(moves): W.drop(sid)
                for sid, sl in snapshot.items():
                    if sid not in W.assign: W.put(sid, *sl)
                for q in range(a, b + 1):
                    W.booked[room["id"], day, q].discard(req["id"])
        return None

    # ---- diagnosis (from real data only) -----------------------------------------
    def _why_not(self, req, windows):
        data = self.data
        typed = [r for r in data["rooms"] if "event" in r["allowed_uses"] and r["type"] in req["room_types"]]
        if not typed:
            return f"No event-capable room of type {req['room_types']} exists."
        big = max(typed, key=lambda r: r["capacity"])
        fit = [r for r in typed if r["capacity"] >= req["attendance"]]
        if not fit:
            return (f"No venue of the requested type seats {req['attendance']} "
                    f"(largest eligible: {big['id']} with {big['capacity']}).")
        ok = [r for r in fit if room_ok(r, req)]
        if not ok:
            miss = sorted({n for r in fit for n in set(req["needs"]) - (set(r["features"]) | ({"accessible"} if r["accessible"] else set()))})
            return f"Rooms big enough ({', '.join(r['id'] for r in fit)}) lack required facilities: {miss}."
        parts = []
        for room in ok:
            for day, a, b in self._slots(req, windows):
                hard, ss, bk = self._blockers(req, room, day, a, b)
                who = sorted(bk) + sorted(ss)
                if hard: who.append("closure/mandatory-group class")
                parts.append(f"{room['id']} {day} P{a}-{b}: {', '.join(who) or 'free'}")
        if not parts:
            return "The requested window is shorter than the requested duration."
        return "Every eligible room/time in the window is taken - " + "; ".join(parts[:6]) + ("; ..." if len(parts) > 6 else "")

    def _alternative(self, req):
        W = self.week
        wins = req["windows"]
        days_pref = [w["day"] for w in wins] + [d for d in W.days if d not in {w["day"] for w in wins}]
        allw = [{"day": d, "from_period": 1, "to_period": MAXP} for d in days_pref]
        first_from = wins[0]["from_period"] if wins else 10
        best = None
        for room in self._rooms(req):
            for day, a, b in self._slots(req, allw):
                hard, ss, bk = self._blockers(req, room, day, a, b)
                if hard or ss or bk: continue
                key = (days_pref.index(day), abs(a - first_from), room["id"] != req.get("requested_room"), room["capacity"])
                if best is None or key < best[0]: best = (key, room, day, a, b)
        return best[1:] if best else None

    # ---- main API ------------------------------------------------------------------
    def decide(self, req, cancelled=False):
        data, W = self.data, self.week
        rid, cat = req["id"], eff_cat(data, req)
        if cancelled:
            dec = {"request_id": rid, "status": "rejected", "reason": "Request was cancelled by the requester; never approved."}
            self.decisions[rid] = dec; return dec
        notes = []
        if cat != req["requested_category"]:
            notes.append(f"Category capped by role '{req['role']}': {req['requested_category']} -> {cat}.")
        want = req.get("requested_room")
        if want and want not in W.rooms:
            notes.append(f"Requested room '{want}' does not exist on campus; treated as a wish only.")
        found = self._find_free(req, req["windows"])
        disp = None
        if not found and rank(data, req) <= data["priority_order"].index("institute_event"):
            disp = self._try_displace(req, req["windows"])
            if disp: found = disp[:4]
        if found:
            room, day, a, b = found
            for q in range(a, b + 1): W.booked[room["id"], day, q].add(rid)
            why = (f"{room['name']} ({room['id']}) seats {room['capacity']} (need {req['attendance']}), has "
                   f"{sorted(req['needs']) or 'no special'} facilities, is free {day} P{a}-P{b} inside the requested window.")
            if want and room["id"] != want and want in W.rooms:
                why += f" Requested {want} was not usable here: {self._why_room(req, W.rooms[want], req['windows'])}"
            if disp:
                _, _, _, _, snap, moves = disp
                for sid, (nd, np_, nr) in moves.items():
                    self.overrides.append({"session_id": sid, "day": nd, "start_period": np_, "room_id": nr, "displaced_by": rid})
                why += (" Institute event outranks regular sessions: " + ", ".join(
                    f"{sid} moved {snap[sid][0]} P{snap[sid][1]} {snap[sid][2]} -> {m[0]} P{m[1]} {m[2]}" for sid, m in moves.items()) + ".")
            dec = {"request_id": rid, "status": "approved", "day": day, "start_period": a, "end_period": b,
                   "room_id": room["id"], "reason": " ".join(notes + [why])}
            self.holder[rid] = (room["id"], day, a, b)
        else:
            alt = self._alternative(req)
            why = self._why_not(req, req["windows"])
            if alt:
                room, day, a, b = alt
                for q in range(a, b + 1): W.booked[room["id"], day, q].add(rid)
                dec = {"request_id": rid, "status": "alternative_offered", "day": day, "start_period": a,
                       "end_period": b, "room_id": room["id"],
                       "reason": " ".join(notes + [f"Requested slot unavailable: {why}", f"Offered {room['id']} {day} P{a}-P{b} which meets capacity and needs."])}
                self.holder[rid] = (room["id"], day, a, b)
            else:
                dec = {"request_id": rid, "status": "rejected", "reason": " ".join(notes + [why, "No alternative venue/time satisfies the requirements."])}
        self.decisions[rid] = dec
        return dec

    def _why_room(self, req, room, windows):
        if not room_ok(room, req):
            if room["capacity"] < req["attendance"]: return f"capacity {room['capacity']} < {req['attendance']}."
            miss = set(req["needs"]) - (set(room["features"]) | ({"accessible"} if room["accessible"] else set()))
            if miss: return f"it lacks {sorted(miss)}."
            return "its type is not acceptable for this request."
        for day, a, b in self._slots(req, windows):
            _, ss, bk = self._blockers(req, room, day, a, b)
            if bk: return f"already booked by {sorted(bk)} ({day} P{a}-P{b})."
            if ss: return f"occupied by regular sessions {sorted(ss)}."
        return "not free in the window."

    def decide_all(self):
        cancelled = {c["request_id"] for c in self.data.get("cancellations", [])}
        for req in sort_requests(self.data, self.data["booking_requests"]):
            self.decide(req, req["id"] in cancelled)
        order = [r["id"] for r in self.data["booking_requests"]]
        return {"bookings": [self.decisions[i] for i in order], "session_overrides": self.overrides}


def engine_from_state(data, assign, decisions, overrides):
    """Rebuild occupancy from persisted state: apply week overrides, then hold approved/alternative bookings."""
    e = BookingEngine(data, assign)
    for o in overrides:
        if o["session_id"] in e.week.assign:
            e.week.drop(o["session_id"]); e.week.put(o["session_id"], o["day"], o["start_period"], o["room_id"])
    for d in decisions:
        if d.get("status") in ("approved", "alternative_offered") and d.get("room_id"):
            for q in range(d["start_period"], d["end_period"] + 1):
                e.week.booked[d["room_id"], d["day"], q].add(d["request_id"])
            e.decisions[d["request_id"]] = d
    return e
