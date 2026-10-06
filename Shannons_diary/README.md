# Shannon's Diary - Rapid Hackathon Workspace (Heisenberg OS 3.1)

Welcome to the **Shannon's Diary** pre-configured hackathon repository.
This template is **100% idea-agnostic**, model-agnostic, and optimized for rapid 3-hour iteration.

---

## 🚀 Quick Start (Pre-Flight Run)

### 1. Backend (FastAPI + Supabase + Pydantic v2)
```bash
cd backend
# Activate virtual environment
.venv\Scripts\activate
# Start FastAPI dev server with auto-reload
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend (Vite + React + Tailwind + Lucide)
```bash
cd frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Supabase Credentials Setup

Open `backend/.env` and `frontend/.env` and fill in your Supabase project keys:

```ini
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

### Apply Database Schema
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project **Shannons_diary**
3. Navigate to **SQL Editor**
4. Paste the entire content of [`database/schema.sql`](file:///c:/Users/Abdul%20Jabbar%20Metlo/Desktop/Hackathon/Shannons_diary/database/schema.sql)
5. Click **Run** (Enables `pgvector`, creates profiles, entities, embeddings with HNSW index, and RPC match function)

---

## 🛡️ Hackathon 3-Step Heisenberg OS Loop

During the hackathon, follow this streamlined cycle:

1. **Phase 1: 6 Creative Approaches (`architecture-analysis.md`)**
   - Model proposes 6 distinct engineering approaches dynamically tailored to the hackathon idea.
   - Evaluates complexity, trade-offs, rejection rationale, and blast radius.
2. **Phase 2: Master Blueprint (`task_blueprint.md`)**
   - 200+ line specification combining mental models, data invariants, 10-point architectural grill, exact file manifests, and rollback commands.
3. **Phase 3: Active Rigorous Verification (`verification.md`)**
   - Active execution of Unit tests, 10 Edge cases, 10 Failure cases, Integration flow, Contract audits, and self-healing.
