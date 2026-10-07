# Hackathon Runbook (heisenberg-lite)

**For every coding agent, read once before touching code.**
Entry point is [`AGENTS.md`](AGENTS.md) at this root. This file is the operational detail.

The build target is a **2-hour window starting when the idea is announced**.
Nothing below assumes the theme. `Shannons_diary/` is a placeholder project name; change
the display strings in `frontend/index.html` and `App.tsx` when the idea lands, keep the
folder name (renaming costs more than it buys).

---

## 1. State of the workspace — measured, not asserted

| Subsystem | Where | Status | Evidence |
| :--- | :--- | :--- | :--- |
| Supabase project | `xbdhcmkzfzifykkiyccb.supabase.co` | **VERIFIED** reachable | `GET /api/v1/entities` returned a live row; GoTrue v2.197.0 healthy |
| Google OAuth provider | Supabase dashboard | **ENABLED** (`google: true` in `/auth/v1/settings`) | **not** walked end-to-end in a browser yet |
| Email/password sign-in | Supabase dashboard | **ENABLED** (`email: true`, signup not disabled) | one full login pending the demo user |
| FastAPI backend | `Shannons_diary/backend` | **VERIFIED** boots, 3 routers mount | `TestClient` exercised all routes |
| Per-user auth | `app/auth.py`, `app/db.py` | **VERIFIED** for rejection paths | no token → 401; garbage token → 401 via GoTrue |
| Authenticated read/write | backend ↔ PostgREST | **PENDING** | needs a real session; see §5 step 1 |
| PostgREST query shapes | own-or-public, category, nested text search | **VERIFIED** against live data | returned correct rows and correct empty sets |
| RLS isolation | `database/migrations/002_per_user_isolation.sql` | **WRITTEN, NOT APPLIED** | run it before the demo (one-time, dashboard SQL editor) |
| Frontend build | `npm run build` (tsc -b + vite build) | **VERIFIED green** | 1610 modules, typecheck exit 0 |
| `embeddings` table + `match_embeddings` | Supabase | **EXISTS, UNUSED** | 0 rows; no code writes vectors; `/search` never calls it |
| AI copilot | `POST /api/v1/ai/complete` | **503 by design** | `GEMINI_API_KEY` is empty in `.env`; the old fake-success fallback is deleted |
| GrapeRoot / dual-graph | `~/.dual-graph/graperoot.CMD` | **NOT RUNNING** | `doctor.py --json` → `healthy: false`, port 8080 closed. Out of scope for this event |
| Git | local `main`, **no remote** | **UNBACKED UP** | add a remote and push before demo day |

Anything not marked VERIFIED was either not run or is known-broken. Do not treat it as
a capability, and do not demo it.

## 2. Two rules that were causing the damage

1. **The guard no longer blocks edits.** `.heisenberg/policy.json` is `mode: "advisory"`
   and `scripts/heisenberg_guard.py` reads it (it did not before — every write was denied).
   The one thing still refused is destructive git (`reset --hard`, `clean -fd`,
   `checkout --`, force push, `--no-verify`), because that gate is explicitly `true`.
2. **`Heisenberg OS/core/rules/01-graperoot-mandate.md` does not apply here.** It forbids
   any file edit until `doctor.py` reports healthy, which it cannot without the GrapeRoot
   daemon. That rule is enhanced-mode only. If an agent cites it, it is wrong for this
   workspace.

## 3. Skill load

Full-mode Heisenberg asks an agent to read ~60,000 tokens of skills and rules and write 7
artifacts before coding. Lite reads `AGENTS.md` + 2 short skills and writes **one** artifact.

| Skill | File | Produces | Timebox |
| :--- | --- | --- | --- |
| `sprint` | `.heisenberg/skills/sprint/SKILL.md` | `.heisenberg/artifacts/<task>/sprint.md` (≤60 lines) | 15 min |
| `verify` | `.heisenberg/skills/verify/SKILL.md` | `.heisenberg/artifacts/<task>/verify.md` | 20 min |

The 30 full-mode skills, the HCI set, The Muses, and the UI-taste profiles stay under
`Heisenberg OS/` as **opt-in reference**. Load one only when a human names it.

## 4. The 2-hour loop

| Clock | Stage | Owner | Output |
| :--- | --- | :--- | :--- |
| 0:00–0:10 | **Grill** — the 7 questions in the sprint skill | human answers, agent asks | answered ideas, no assumptions |
| 0:10–0:20 | **sprint.md** — 3 approaches, pick 1, invariants, file manifest, cut list | orchestrator | `artifacts/SPRINT-1/sprint.md` |
| 0:20–0:25 | **Contract freeze** — endpoints + fields written into `contracts/api.md` | orchestrator | frozen contract |
| 0:25–1:35 | **Build** — two agents in parallel, one lane each | frontend + backend | code |
| 1:35–1:55 | **verify.md** — boot, click golden path, 5 edge + 5 failure, contract audit | each agent owns its lane | verdict table |
| 1:55–2:00 | **Demo script** — 90-second narrative, one rehearsal | human | rehearsed flow |

Default cut list unless the idea demands otherwise: billing, teams/orgs, settings pages,
email, admin, mobile layout polish, tests beyond the verify gates.

## 5. Before the event starts (tonight)

1. **Apply the RLS migration.** Supabase dashboard → SQL Editor → paste
   `Shannons_diary/database/migrations/002_per_user_isolation.sql` → Run. Until this is in,
   any visitor can update or delete any row.
2. **Seed the demo account.** From `Shannons_diary/backend` with its venv active:
   `python ../database/seed_demo_user.py` → copy the two printed lines into
   `Shannons_diary/frontend/.env`. Judge Demo signs in for real; it used to fake a user
   object in React state.
3. **Decide on Gemini.** Put a key in `backend/.env` as `GEMINI_API_KEY`, or accept that
   the copilot panel shows a 503. Do not leave a mock reply in its place.
4. **Walk Google OAuth once** in the browser. Confirm `http://localhost:5173` is in
   Supabase → Authentication → URL Configuration → Redirect URLs.
5. **Add a git remote and push.** There is no backup of this work right now.
6. Boot both stacks and leave the terminals running (next section) so tomorrow is a
   refresh, not a first start.

## 6. Daily commands

```powershell
# backend
cd "C:\Users\Abdul Jabbar Metlo\Desktop\Hackathon\Shannons_diary\backend"
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# frontend
cd "C:\Users\Abdul Jabbar Metlo\Desktop\Hackathon\Shannons_diary\frontend"
npm run dev

# real build (vite build alone skips typechecking)
npm run build

# policy check, advisory only, never blocks work
cd "C:\Users\Abdul Jabbar Metlo\Desktop\Hackathon"
python scripts/heisenberg_guard.py validate --workspace .
```

Docs: `http://localhost:8000/docs` · Health: `http://localhost:8000/health`

## 7. Working rules for agents

- Stay in your lane (`contracts/api.md` §Lanes). Need the other side changed → REQUESTS,
  not an edit to their file.
- One branch (`main`), no PRs, commit named paths. Never `git add -A`, never `git stash`.
- Failures surface in the UI. No `catch` returning `[]`, no locally fabricated rows, no
  `if (list.length > 0)` that hides a genuinely empty backend.
- Report as VERIFIED / INFERRED / UNKNOWN. "Live and tested" requires having run it.
