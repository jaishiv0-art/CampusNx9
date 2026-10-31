import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from app.main import app as backend_app

app = FastAPI(title="CampusNx9 CIT Backend")
app.mount("/api", backend_app)
app.mount("", backend_app)

