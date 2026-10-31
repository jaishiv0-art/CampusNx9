import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from app.main import app as backend_app
from app import store, main as backend_main

# Initialize database and ensure default accounts are seeded on cold start
try:
    store.conn()
    store.seed_users(backend_main.get_data())
except Exception as e:
    print(f"[Init Warning] {e}")

app = FastAPI(title="CampusNx9 CIT API Gateway")
app.mount("/api", backend_app)
app.mount("", backend_app)
