# API Contract

Single source of truth between the FastAPI backend and the React frontend.
**Backend and frontend agents do not change a shape here silently.** Edit this file
first, then implement it in your own lane. Anything you need from the other lane goes
under REQUESTS.

Base URL: `http://localhost:8000/api/v1` · OpenAPI: `http://localhost:8000/docs`

## Authentication

Every endpoint under `/api/v1` requires `Authorization: Bearer <supabase access token>`.
The token comes from `supabase.auth.getSession()` on the client. There is no anonymous
mode: the backend forwards this token to PostgREST, so **Postgres RLS decides which rows
exist for a request**, not Python. A forgotten filter degrades to an empty result, never
to another user's data.

| Response | Meaning | Frontend action |
| --- | --- | --- |
| `401 Missing bearer token` | No session | Show sign-in (Google or Judge Demo) |
| `401 Invalid or expired session` | Token rejected by GoTrue | Force sign-out, then sign in again |
| `404 Entity not found` | Wrong id, or a row you cannot see | Toast, refresh list |
| `422` | Body or path failed Pydantic validation | Do not retry unchanged |
| `502` / `503` | Supabase or the AI provider failed | Show the message; do not fake success |

In `development` the backend passes Supabase's own message through as `detail`.
Set `ENVIRONMENT=production` to replace it with a generic string.

## Entities

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/entities` | query `category?`, `limit` 1-100 (20), `offset` >= 0 | `Entity[]`, newest first, own rows + public rows |
| `GET` | `/entities/{id}` | `id` must be a UUID | `Entity` or `404` |
| `POST` | `/entities` | `EntityCreate` | `Entity`, `201` |
| `PATCH` | `/entities/{id}` | `EntityUpdate` | `Entity`, `404` if not yours |
| `DELETE` | `/entities/{id}` | — | empty, `204` |

```ts
interface Entity {
  id: string;
  user_id?: string;          // server-set; sending it in a request is ignored
  title: string;             // 1-255
  content?: string | null;
  category?: string;         // <=64, default "general"
  status?: string;           // <=32, default "active"
  metadata?: Record<string, unknown>;   // default {}
  is_public?: boolean;       // default false
  created_at?: string;       // ISO
  updated_at?: string;       // ISO, maintained by trigger
}
```

`POST` accepts `title`, `content`, `category`, `status`, `metadata`, `is_public`.
**`user_id` is not an input.** It is taken from the verified token.

## Search

`POST /search` with `{ "query": string(1-200), "category"?: string, "limit"?: 1-50 }`
returns `Entity[]` matching title or content, scoped to own + public rows.
`(`, `)`, `,`, `%`, `"` and `'` are stripped from the term because PostgREST reads them
as filter syntax.

There is **no vector search**. `/search` does not call `match_embeddings`, the
`embeddings` table is empty, and nothing generates vectors. The SQL for it exists
(`schema.sql` §4-5) for the day an idea actually needs semantic similarity.

## AI

`POST /ai/complete` with `{ "prompt": string(1-8000), "model"?: string,
"system_instruction"?: string, "temperature"?: 0-2, "max_tokens"?: 1-8192 }`
returns `{ "model": string, "result": string, "usage": { "total_tokens": number } }`.

- Only Gemini is implemented. Allowed models: `gemini-2.5-flash` (default),
  `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-2.5-flash-lite`.
- Anything else is `400`, because the model string is interpolated into the provider URL.
- Empty `GEMINI_API_KEY` returns `503`, not a fake answer. Check `/health` → `ai_configured`.
- OpenAI and Qwen keys exist in `.env` but **no code uses them**.

## Unauthenticated

`GET /health` → `{ status, environment, supabase_configured, ai_configured, auth_required }`
`GET /` → service banner.

## Frontend helper surface (`src/lib/api.ts`)

`fetchEntities(category?, limit)` · `createEntity(data)` · `updateEntity(id, data)` ·
`deleteEntity(id)` · `askAI(prompt, model?)` · `getSessionToken()` · `ApiError(message, status)`

All of them **throw** `ApiError` on failure. No function returns `[]` or a placeholder to
hide an outage.

## Lanes

- frontend agent: `Shannons_diary/frontend/src/**`
- backend agent: `Shannons_diary/backend/app/**`, `Shannons_diary/database/**`
- orchestrator: this file, `.heisenberg/tasks/current.json`

## REQUESTS

Nothing open. Add `YYYY-MM-DD HH:MM — from <lane> to <lane>: <need>` lines here.

## Verified / unverified as of 2026-10-07

Verified against the live project: health, 401 gating on all six routes, garbage-token
rejection, PostgREST query shapes for owner-or-public select, category filter, and the
nested text-search filter.
**Still unverified:** an authenticated end-to-end read/write. That needs a real user
session, which needs `database/seed_demo_user.py` run once against Supabase and the two
`VITE_DEMO_*` lines added to `frontend/.env`.
