# SPRINT SPRINT-1 — NovaWorks AI Project Manager CRM
## Loop
Admin pastes meeting transcript -> Gemini extracts projects/tasks against 10-person directory -> Supabase saves 3 projects and 12 tasks with role-restricted viewing.

## Win
Admin clicks "Create from Transcript" to see 3 projects (UrbanCart, QuickServe, HelpDeskPro) and 12 tasks appear. Judge switches to Manager Ayesha (sees only UrbanCart) and Agent Ali (sees only his 3 tasks).

## Chosen
FastAPI + Supabase PostgreSQL + React Tailwind + Gemini Flash.
Killed:
- Pure local SQLite (judges need a hosted backend or clean DB, Supabase is already configured).
- Full custom Auth0/GoTrue emails (the spec explicitly allows seeded demo accounts with Demo123!).

## Cut
- User registration / signup / password reset / user profile editing.
- Payment gateway, maps/tracking, inventory tasks (explicitly rejected in transcript).
- Progress monitoring, cost calculation, timesheets, and budgets.

## Invariants
- Admin sees all projects and tasks, and is the only role allowed to create from transcript.
- Manager sees only projects where manager_id == user.id and associated tasks.
- Agent sees only tasks assigned to them (assignee_id == user.id) and related project summaries.
- Database enforces atomic creation of projects and tasks.
- 10 fixed demo accounts with password Demo123!.

## Manifest
| File | Action | Lane |
| --- | --- | --- |
| `contracts/api.md` | MODIFY | Orchestrator |
| `.heisenberg/tasks/current.json` | MODIFY | Orchestrator |
| `Shannons_diary/database/schema_novaworks.sql` | NEW | Backend |
| `Shannons_diary/database/seed_novaworks_users.py` | NEW | Backend |
| `Shannons_diary/backend/app/schemas/novaworks.py` | NEW | Backend |
| `Shannons_diary/backend/app/routers/novaworks.py` | NEW | Backend |
| `Shannons_diary/backend/app/main.py` | MODIFY | Backend |
| `Shannons_diary/frontend/src/lib/novaworksApi.ts` | NEW | Frontend |
| `Shannons_diary/frontend/src/App.tsx` | MODIFY | Frontend |
| `README.md` | MODIFY | Orchestrator |

## Contract
- `POST /api/v1/auth/login` -> `{ token, user }`
- `GET /api/v1/team` -> `User[]`
- `GET /api/v1/projects` -> `Project[]` (role-filtered)
- `GET /api/v1/projects/{id}` -> `ProjectDetail`
- `GET /api/v1/tasks` -> `Task[]` (role-filtered)
- `POST /api/v1/projects/create-from-transcript` -> `{ message, projects: Project[] }`
- `POST /api/v1/projects/reset` -> `{ message }`

## Rollback
git checkout main && git clean -fd (or revert specific files).
