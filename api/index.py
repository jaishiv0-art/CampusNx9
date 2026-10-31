import os
import sys

# Ensure repository root and backend directory are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from backend.app.main import app as backend_app

# Create root app that responds to both / and /api prefixes seamlessly
app = FastAPI(title="CampusNx9 CIT API Gateway")

# Mount backend_app to handle both /api/* and root routes
app.mount("/api", backend_app)
app.mount("", backend_app)

