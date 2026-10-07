# Hackathon Workspace (heisenberg-lite)

Pre-built setup for a 2-hour hackathon where the idea is announced at entry.
Stack: **FastAPI + Supabase (Postgres/RLS) + Vite + React + TypeScript + Tailwind**.
`Shannons_diary/` is a working project name, not the product name.

## For AI agents

Read [`AGENTS.md`](AGENTS.md) first — it is the whole contract. Then
[`AGENT_RUNBOOK.md`](AGENT_RUNBOOK.md) for measured status, and
[`contracts/api.md`](contracts/api.md) before touching any request or response shape.

The workflow is a two-skill loop: **grill → `sprint.md` → build → `verify.md`**.
Nothing blocks an edit; the guard only refuses destructive git commands.

`Heisenberg OS/` is the full 30-skill governance library this workspace is built
from. It is opt-in reference, not loaded by default.

## Run it

```powershell
# backend
cd Shannons_diary\backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000        # docs at /docs, status at /health

# frontend
cd Shannons_diary\frontend
npm install
npm run dev                                       # http://localhost:5173
npm run build                                     # tsc -b AND vite build

# policy check (advisory, never blocks work)
python scripts/heisenberg_guard.py validate --workspace .
```

Copy `Shannons_diary/backend/.env.example` and `Shannons_diary/frontend/.env.example`
to `.env` and fill in your Supabase keys. Both are gitignored.
Apply `Shannons_diary/database/schema.sql` in the Supabase SQL Editor for a new project,
or `database/migrations/002_per_user_isolation.sql` to fix policies on an existing one.

## What is real and what is not

Every claim in the runbook carries a status: `VERIFIED` means it was executed in this
workspace, `INFERRED` means read from source, `UNKNOWN` means not checked.

Currently **not implemented**, despite the scaffolding: semantic/vector search (the
`embeddings` table is empty and nothing generates vectors) and multi-provider AI (Gemini
only, and it returns 503 unless `GEMINI_API_KEY` is set). Both are documented as
unavailable rather than faked — an agent invented them and labelled them "live and tested",
which is the failure mode this workspace is arranged to prevent.
