import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import pytest
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
@pytest.fixture(scope="session")
def data(): return json.load(open(os.path.join(ROOT, "data", "cit_public.json")))
@pytest.fixture(scope="session")
def base(data):
    from tests.greedy_fixture import greedy
    return greedy(data)
