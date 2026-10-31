import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import pytest
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
@pytest.fixture(scope="session")
def data():
    cand = os.path.join(ROOT, "data", "cit_public.json")
    if not os.path.exists(cand):
        cand = os.path.join(ROOT, "backend", "data", "cit_public.json")
    return json.load(open(cand, encoding="utf-8"))
@pytest.fixture(scope="session")
def base(data):
    from tests.greedy_fixture import greedy
    return greedy(data)
