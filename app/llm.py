"""OPTIONAL LLM layer. It may only (1) classify intent / extract fields and (2) rephrase explanations.
It never validates, approves, or writes schedules. Every failure path returns None so the
deterministic fallback in assistant.py handles the request."""
import json
from . import config

INTENTS = {"booking", "move_session", "resource_unavailable", "find_room", "why_rejected", "why_slot", "unknown"}
SYSTEM = ("You extract structured intent from campus-scheduling messages (English/Hinglish). Reply with ONE JSON object: "
          '{"intent": one of booking|move_session|resource_unavailable|find_room|why_rejected|why_slot|unknown, '
          '"course_hint": str|null, "day": MON..FRI|null, "target_day": MON..FRI|null, "resource": str|null, '
          '"relative_date": "today"|"tomorrow"|null, "clarification": str|null}. '
          "Do not decide feasibility. Do not invent rooms, times or ids.")


def classify(message):
    if not config.ANTHROPIC_API_KEY: return None
    try:
        import requests
        r = requests.post("https://api.anthropic.com/v1/messages", timeout=15,
                          headers={"x-api-key": config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                          json={"model": config.LLM_MODEL, "max_tokens": 300, "system": SYSTEM, "messages": [{"role": "user", "content": message}]})
        r.raise_for_status()
        txt = "".join(b.get("text", "") for b in r.json()["content"] if b.get("type") == "text")
        obj = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
        if obj.get("intent") not in INTENTS: return None
        return obj
    except Exception:
        return None
