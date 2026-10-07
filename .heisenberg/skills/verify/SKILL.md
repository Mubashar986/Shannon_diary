---
name: verify
description: heisenberg-lite active verification pass. Boots both stacks, walks the golden path, probes edge and failure cases, audits the FastAPI-to-TypeScript contract, and records only what was actually executed.
version: lite-1.0.0
timebox: 20 minutes
artifact: .heisenberg/artifacts/<task-id>/verify.md
---

# Verify Skill

Verification is execution, not description. Every line in `verify.md` must be a
command you ran or a screen you clicked in this session. Anything else is
recorded as `UNKNOWN`.

## Gate 0 — it must start

```
backend:   Shannons_diary/backend  -> .venv/Scripts/activate && uvicorn app.main:app --port 8000
frontend:  Shannons_diary/frontend -> npm run dev
```

Both must come up clean. A warning is not a failure; a traceback is.

## Gate 1 — it must build with types

```
cd Shannons_diary/frontend && npm run build      # tsc -b AND vite build, both must pass
cd Shannons_diary/backend  && python -c "import app.main"
```

`vite build` alone does not prove anything — it skips typechecking.

## Gate 2 — the golden path, clicked by hand

Walk the one loop from `sprint.md` end to end in the browser. For each step
record what the screen actually showed. This is the only gate that catches
"compiles but does nothing".

## Gate 3 — five edge cases, five failure cases

Edge (choose the 5 that apply): empty result set, first-ever user with zero rows,
duplicate submit, 500+ character input, unicode/emoji, whitespace-only, very large list.

Failure (choose the 5 that apply): backend stopped mid-session, expired or absent
token, Supabase unreachable, AI provider returns an error, malformed request body,
network drop between the two.

For each: **what you did → what happened → is that acceptable?** An acceptable
outcome is a visible error state. A spinner forever, a blank screen, or a fake
success row is a FAIL.

## Gate 4 — contract audit

Diff `contracts/api.md` against reality on both sides:
- every route the frontend calls exists on the backend
- every field in a Pydantic response exists in the matching TypeScript interface
- no field is invented client-side
- status codes match what the UI branches on (a 500 the UI treats as "empty" is a bug)

## Gate 5 — no lies in the product

Grep for the failure modes that ruin demos:
- `catch` returning `[]`, `null`, or a placeholder instead of surfacing an error
- locally fabricated rows that appear saved
- `if (list.length > 0)` style guards that hide a genuinely empty backend
- UI copy advertising a capability that has no working code behind it
- any endpoint returning a hardcoded value with a comment about wiring it later

Anything found is a defect even if the demo looks fine. Fix it or state plainly
that it is out of scope for the demo.

## Verdict

Write `verify.md` as a table: gate, command or action, result, status
(`PASS` / `FAIL` / `UNKNOWN`). Then a short list of what you fixed and what is
still unverified. Never write "all tests passed" over a table with UNKNOWN rows.
