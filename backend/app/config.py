import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Load environment variables from both root .env and backend/.env
load_dotenv(os.path.join(ROOT, ".env"))
load_dotenv(os.path.join(ROOT, "backend", ".env"))

def resolve_path(env_val, fallback_rel):
    if env_val and not os.path.isabs(env_val):
        cand = os.path.abspath(os.path.join(ROOT, env_val))
        if os.path.exists(cand):
            return cand
    cand2 = os.path.abspath(os.path.join(ROOT, fallback_rel))
    if os.path.exists(cand2):
        return cand2
    alt = os.path.abspath(os.path.join(ROOT, os.path.basename(fallback_rel)))
    if os.path.exists(alt):
        return alt
    return cand2

# Database & Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")))
DATABASE_URL = os.environ.get("DATABASE_URL", "")

DB_PATH = resolve_path(os.environ.get("DB_PATH"), "cit.db")
DATASET_PATH = resolve_path(os.environ.get("DATASET_PATH"), os.path.join("data", "cit_public.json"))
EXPORT_DIR = resolve_path(os.environ.get("EXPORT_DIR"), "exports")
JWT_SECRET = os.environ.get("JWT_SECRET", "cit-campusnx9-secure-jwt-token-change-in-prod")
TEAM_NAME = os.environ.get("TEAM_NAME", "CampusNx9 CIT")
SOLVE_SECONDS = int(os.environ.get("SOLVE_SECONDS", "180"))
SOLVER_WORKERS = int(os.environ.get("SOLVER_WORKERS", "8"))
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-4-6")
CORS_ORIGINS = [x.strip() for x in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
