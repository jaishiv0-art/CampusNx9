"""TEST FIXTURE ONLY (not used by the product): quick greedy timetable so booking/RBAC tests can run
without OR-Tools. It is NOT the scheduling engine."""
import itertools
from app.core.week import Week


def greedy(data):
    W = Week(data, {})
    sess = data["sessions"]
    baskets = {}
    for s in sess:
        if s.get("basket_slot"): baskets.setdefault(s["basket_slot"], []).append(s["id"])
    done = set()
    order = sorted(sess, key=lambda s: (-s["duration"], -s["size"]))
    rooms = sorted(W.rooms, key=lambda r: W.rooms[r]["capacity"])
    for s in order:
        sid = s["id"]
        if sid in done: continue
        group = baskets.get(s.get("basket_slot"), [sid])
        placed = False
        for d in W.days:
            for p in range(1, 10):
                put = []
                for x in group:
                    ok = False
                    for r in rooms:
                        if W.fits(x, d, p, r):
                            W.put(x, d, p, r); put.append(x); ok = True; break
                    if not ok: break
                if len(put) == len(group): placed = True; break
                for x in put: W.drop(x)
            if placed: break
        if not placed: raise RuntimeError(f"greedy could not place {sid}")
        done.update(group)
    return dict(W.assign)
