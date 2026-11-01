# Third-Party Open Source Components & Licenses

The following open-source software libraries, packages, constraint solvers, and utilities are utilized within **CampusNx9**:

---

## 1. Constraint Satisfaction & Solvers

| Component | Version | License | Usage in CampusNx9 |
|---|---|---|---|
| **Google OR-Tools (CP-SAT)** | 9.15.x | Apache-2.0 | Core mathematical constraint solver for weekly timetable matrix generation, disruption repair, and exam scheduling. |
| **Official Competition Validator** | 1.0 (unmodified) | Organizers' License | Vendored unmodified in `backend/official/validator.py` as the independent checking authority. |

---

## 2. Backend & Server Runtime (Python)

| Package | License | Purpose |
|---|---|---|
| **FastAPI** | MIT | High-performance asynchronous REST API framework enforcing institutional RBAC. |
| **Starlette** | BSD-3-Clause | Underlying ASGI toolkit powering routing, request lifecycles, and CORS middleware. |
| **Uvicorn** | BSD-3-Clause | Production ASGI web server running the FastAPI application. |
| **Pydantic v2** | MIT | Data parsing, schema validation, and strict model typing. |
| **PyJWT** | MIT | Cryptographic encoding and verification of institutional session tokens. |
| **supabase (Python SDK)** | MIT | Cloud database client connecting the backend to Supabase PostgreSQL. |
| **python-dotenv** | BSD-3-Clause | Loads environment configurations from `.env`. |
| **python-multipart** | Apache-2.0 | Handles multipart form uploads for dataset imports. |
| **pytest & httpx** | MIT / BSD-3-Clause | Automated test runner and HTTP client for integration test execution. |
| **sqlite3** | Public Domain | Python standard library local database engine used for rapid offline fallbacks. |

---

## 3. Frontend & Client Application (TypeScript / React)

| Package | License | Purpose |
|---|---|---|
| **React 18 & React DOM** | MIT | Core UI component architecture and virtual DOM rendering. |
| **TypeScript** | Apache-2.0 | Static type safety across component interfaces and API payload definitions. |
| **Vite** | MIT | Next-generation frontend build tooling, HMR, and production bundler. |
| **@supabase/supabase-js** | MIT | Browser client for Supabase PostgreSQL queries, Auth, and session state. |
| **Tailwind CSS** | MIT | Utility-first CSS styling framework powering the institutional CIT aesthetic. |
| **PostCSS & Autoprefixer** | MIT | CSS transformations and cross-browser vendor prefixing. |
| **lucide-react** | ISC | Consistent, lightweight SVG icon system for UI controls and badges. |

---

## 4. Hosting, Infrastructure & Cloud Services

| Provider / Platform | License / Terms | Infrastructure Role |
|---|---|---|
| **Vercel** | Commercial Free Tier | Cloud deployment for frontend SPA assets and serverless backend API routing. |
| **Supabase Cloud** | Open-Core / Apache-2.0 | Managed PostgreSQL database, authentication services, and Row-Level Security. |
| **Google Cloud Identity** | Commercial Free Tier | Identity provider for OAuth authentication workflows. |
