#!/usr/bin/env bash
# One-command check of the zip: installs deps, runs tests, generates both exports with the real solver,
# runs the OFFICIAL validator on them, and smoke-tests the API.   Usage: bash scripts/verify.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT/backend"
python3 -m venv .venv && . .venv/bin/activate
pip install -q -r requirements.txt
echo "== 1/5 unit + solver + API tests =="; python -m pytest -q tests
echo "== 2/5 generate exports with the solver (can take a few minutes) =="; python generate.py
echo "== 3/5 OFFICIAL validator: schedule.json =="
python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule.json --quiet
echo "== 4/5 OFFICIAL validator: schedule_after.json =="
python official/validator.py --data ../data/cit_public.json --schedule ../exports/schedule_after.json \
  --disruption ../examples/sample_disruption.json --baseline ../exports/schedule.json --quiet
echo "== 5/5 API boot + health =="
(uvicorn app.main:app --port 8765 >/tmp/cit_api.log 2>&1 & echo $! >/tmp/cit_api.pid); sleep 4
curl -fsS localhost:8765/health; echo; kill "$(cat /tmp/cit_api.pid)"
echo "ALL CHECKS RAN - confirm 'Hard violations: 0' for both validator runs above."
