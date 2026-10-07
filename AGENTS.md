# Hackathon Agent Contract (heisenberg-lite)

This is the simplified, non-blocking profile of Heisenberg OS for a 2-hour build.
The full library lives in `Heisenberg OS/` as read-only reference. Do not load it.
Nothing in this file blocks an edit. Advisory mode means: advise, verify, ship.

## Bootstrap (do this once, silently)

1. Read `.heisenberg/policy.json` and `.heisenberg/tasks/current.json`.
2. Read `.heisenberg/skills/sprint/SKILL.md` and the current `sprint.md` artifact.
3. Read `contracts/api.md` before touching any request or response shape.
4. Confirm your ownership lane in `tasks/current.json`. Never edit outside it.

## The loop

| Stage | Skill | Output | Budget |
|---|---|---|---|
| Grill + design | `sprint` | `.heisenberg/artifacts/<task-id>/sprint.md` | 15 min |
| Build | — | code only, contract-first | 75 min |
| Verify | `verify` | `.heisenberg/artifacts/<task-id>/verify.md` | 20 min |

`sprint.md` replaces the full-mode understanding, codebase-design, architecture
analysis, and cs-domain-learning artifacts. Write it once, keep it under 60 lines,
and update it instead of producing a new document when the plan changes.

## Never-block rules (parallel agents)

1. **One lane each.** Frontend agent owns `Shannons_diary/frontend/src/**`.
   Backend agent owns `Shannons_diary/backend/app/**` and `Shannons_diary/database/**`.
2. **Never edit another lane's file.** Append what you need to the `REQUESTS`
   section of `contracts/api.md` and tell the human to ping that agent.
3. **Contract before code.** Endpoint paths, request bodies, and response shapes
   live in `contracts/api.md`. Changing one is a coordinated edit, not a silent fix.
4. **Single branch, explicit staging.** Stay on `main`. No PRs, no branches.
   Commit with named paths (`git add Shannons_diary/backend/app/routers/entities.py`).
   Never `git add -A`, `git add .`, or `git stash` — you would commit another
   agent's half-finished work.
5. **No destructive git.** `reset --hard`, `clean -fd`, `checkout --`, force push,
   and `--no-verify` are forbidden. The guard denies them on purpose. Ask the human.

## Evidence rules

- State a capability as `VERIFIED` (you ran it), `INFERRED` (you read it), or
  `UNKNOWN` (you did not check). Never write "live and tested" for something you
  did not run in this session.
- A failing build, boot, or request must be visible in the UI. Silent fallbacks,
  mocked rows, and swallowed exceptions are defects, not convenience.
- GrapeRoot, the 5-stage runbook, design tokens, and the HCI/Muse skill sets are
  out of scope for this event. If a file references them, ignore the reference.

## Completion

Run `python scripts/heisenberg_guard.py validate --workspace .`, refresh
`verify.md` with what you actually executed, then report changed files, the exact
commands you ran, and anything still `UNKNOWN`.
