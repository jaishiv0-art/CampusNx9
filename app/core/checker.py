"""Deterministic validation. Thin wrapper over the OFFICIAL validator (vendored, unmodified)."""
import copy, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "official"))
import validator as V  # noqa: E402


def apply_disruption(data, dis):
    return V.apply_disruption(data, dis)


def validate(data, schedule, baseline=None):
    """Returns the official report dict (hard_violations, soft_penalties, stability...)."""
    return V.run(data, schedule, baseline)


def timetable_violations(data, assign):
    """assign: sid -> (day,start,room). Returns list of violation dicts (official rules H1-H14)."""
    ctx = V.Ctx(data)
    viol, _ = V.check_timetable(ctx, assign, "timetable")
    return viol


def can_place(data, assign, sid, day, start, room):
    """Would moving `sid` to this slot keep the timetable free of hard violations?
    Used to gate manual edits and AI proposals - nothing bypasses this."""
    trial = dict(assign)
    trial[sid] = (day, start, room)
    return [v for v in timetable_violations(data, trial)
            if sid in v["detail"]]
