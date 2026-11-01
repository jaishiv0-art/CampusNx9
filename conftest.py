import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import pytest

@pytest.fixture(scope="session")
def data():
    for p in [
        os.path.join(os.path.dirname(__file__), "data", "cit_public.json"),
        os.path.join(os.path.dirname(__file__), "backend", "data", "cit_public.json"),
        os.path.join(os.path.dirname(__file__), "cit_public.json"),
    ]:
        if os.path.exists(p):
            return json.load(open(p, encoding="utf-8"))
    raise FileNotFoundError("cit_public.json not found")

@pytest.fixture(scope="session")
def base(data):
    try:
        from tests.greedy_fixture import greedy
    except ImportError:
        from greedy_fixture import greedy
    return greedy(data)
