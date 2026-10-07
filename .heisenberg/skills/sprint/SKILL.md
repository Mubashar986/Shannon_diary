---
name: sprint
description: heisenberg-lite single design pass. Grills the idea, picks an approach, records invariants and file ownership, and emits one 60-line sprint.md. Replaces full-mode understanding, codebase-design, architecture-analysis, and cs-domain-learning.
version: lite-1.0.0
timebox: 15 minutes
artifact: .heisenberg/artifacts/<task-id>/sprint.md
---

# Sprint Skill

One artifact instead of four. The goal is a plan a second agent can execute
without asking you a question. If a section cannot be written in the timebox,
write `UNKNOWN` rather than inventing depth.

## Pass 1 — Grill (talk to the human, 7 questions, max 2 minutes each)

Ask them in one message. Do not start Pass 2 until every answer lands.

1. **Who and what pain** — one sentence. Not the audience, the *specific acute pain*.
2. **The aha loop** — what the user does (input) → what the system computes (process)
   → what lands on screen (output). One line each.
3. **The winning visual** — the single screen moment a judge remembers. Describe it.
4. **Data that must persist** — what survives a page refresh, and what may live only
   in memory for the demo.
5. **Multi-user or single workspace?** — decides auth and RLS before anyone codes.
6. **The cut list** — name out loud what we are deliberately NOT building
   (billing, orgs, settings, admin, email, production hardening).
7. **Definition of "wow"** — the two features that must work. Everything else is a bonus.

If the human answers vaguely, ask once more with a concrete option. Never fill
their silence with your assumption — that is how fake pgvector endpoints get built.

## Pass 2 — Choose (3 options, not 6)

Propose three genuinely different builds. For each: one line on how it works,
one line on the risk, one line on minutes. Kill two with an explicit reason.
The human picks. Record the rejection reason — it stops the next agent from
re-litigating the same dead end.

## Pass 3 — Invariants and CS notes (the compressed cs-concepts)

Answer only what applies. This section exists so the builder does not discover
the hard part at minute 100.

- **Data shape truth** — exact field names and types at every boundary. Call out
  where Postgres, Pydantic, and TypeScript must agree.
- **Identity** — whose data is this? Where does `user_id` come from, and who
  enforces it? State the mechanism, not the intention.
- **Boundary conditions** — empty list, zero results, duplicate submit,
  stale token, unicode, very long strings. Name the ones that actually apply.
- **Failure semantics** — if the AI provider / DB / network dies mid-request,
  what does the user see? "Error state" is an answer; "it handles it" is not.
- **Cost of the happy path** — only if there is a loop, a join, or an N+1.
  One line. No Big-O theater.

## Pass 4 — Manifest and ownership

Every file as `[NEW]` or `[MODIFY]`, with the owning agent lane. Update
`.heisenberg/tasks/current.json` `files_in_scope` with the same list.

## Output — sprint.md (60 lines max)

```
# SPRINT <task-id> — <one-line idea>
## Loop         input -> process -> output (3 lines)
## Win          the judge-visible moment (1 line)
## Chosen       approach + why the other two died (4 lines)
## Cut          explicit non-goals (bullets)
## Invariants   Pass 3 answers that applied (10 lines max)
## Manifest     [NEW]/[MODIFY] + lane (table)
## Contract     endpoint/field deltas pushed into contracts/api.md (list)
## Rollback     git revert <sha> + the 60-second recovery (2 lines)
```

## Rules

- Under 60 lines. A longer plan is a stalled build.
- No section may be padded to look rigorous. `UNKNOWN` is a legal answer.
- Do not write product code in this pass.
- If the idea changes mid-build, edit `sprint.md` in place and say so in chat.
  Never accumulate a second planning document.
