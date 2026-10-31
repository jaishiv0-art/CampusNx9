import json, os
def build_schedule(team, data, assign, exams=None, fest_week=None):
    out = {"team": team, "dataset_id": data["dataset_id"],
           "sessions": [{"session_id": sid, "day": d, "start_period": p, "room_id": r}
                        for sid, (d, p, r) in sorted(assign.items())]}
    if fest_week is not None: out["fest_week"] = fest_week
    if exams is not None: out["exams"] = exams
    return out
def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, "w"), indent=2)
