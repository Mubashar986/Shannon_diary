# ⚗️ Heisenberg OS

> **A portable, artifact-gated AI engineering workflow for Cursor, Claude Code, Antigravity, and compatible agents.**  
> It combines focused skills, host-native rules and hooks, and repository validation.

---

## 1. Install into a Project

```bash
# Run from this Heisenberg OS repository. It previews changes by default.
python bin/init.py --target C:/path/to/your-project --host all

# Review the plan, then write only missing files.
python bin/init.py --target C:/path/to/your-project --host all --apply
```

Open the target repository—not this template—in your coding agent, trust the
workspace, and restart the agent so its project rules and hooks load. Run:

```bash
python scripts/heisenberg_guard.py validate --workspace .
```

`AGENTS.md` is the shared entrypoint. `CLAUDE.md`, Cursor `.mdc` rules, and
Antigravity `.agents` rules are thin host-specific adapters. The policy selects
only the skills relevant to a task; it does not load the whole skill library.
See [adoption instructions](docs/ADOPTION.md) for the target-repository layout,
task manifests, artifacts, and CI enforcement.

---

## 2. Enforcement Model

- **Advisory:** instructions and validation only, for unsupported hosts.
- **Guarded:** supported local hooks can block product edits without an active
  task manifest and planning artifact.
- **Enforced:** add the validator to protected CI before merge; this is the
  reliable cross-agent enforcement boundary.

GrapeRoot remains an optional capability by default. A task can explicitly
require it when graph evidence is essential; agents must never claim it was
available when it was not.

## 3. Day 1 Prompts (Cold-Start)

| Project State | Copy-Paste Initial Prompt |
|---|---|
| **Brand-New (Greenfield)** | `"Start a new project with Heisenberg: [describe idea]. Run cold-start genesis."` |
| **Existing Code (Brownfield)** | `"Onboard this codebase using Heisenberg. Run brownfield diagnostic."` |
| **Active Task** | `"Let's start Task [X.Y] from roadmap_wbs.md with Stage 1."` |

---

## 4. Daily Development Flow

Never let the agent jump straight into code. Guide it through these stage prompts:

| Stage | Prompt | Output Delivered |
|---|---|---|
| **0: Plan** | `"Run Stage 0 roadmap-wbs-planner for [feature]"` | `roadmap_wbs.md` (leaf tasks & criteria) |
| **1: Understand** | `"Start Task [X.Y] with Stage 1"` | `task_X_Y_understanding.md` (diagrams & analogies) |
| **Arch Review** | `"Analyze Task [X.Y] with Narrsistic Pluto"` | `task_X_Y_architect_analysis.md` (3-5 options & blast radius) |
| **2: Design** | `"Create Stage 2 design for Task [X.Y]"` | `task_X_Y_design.md` (`[NEW]`/`[MODIFY]` file blueprint) |
| **UI: Tokens** | `"Run picasso to set up design tokens"` | `tokens.json` & `DESIGN_SYSTEM.md` |
| **UI: Data** | `"Run escher to inspect backend schema"` | Real API AST wiring; logs gaps to `backend-requirements.md` |
| **UI: Visual** | `"Run vermeer to build [Component]"` | 100% token styling + 6 interactive states |
| **3: CS Domain** *(Required for algorithmic/system work)* | `"Run Stage 3 cs-domain-learning for Task [X.Y]"` | `cs-concepts.md` (first principles & analogies) |
| **Build** | `"Stage 2 approved. Implement Task [X.Y]"` | Surgical code edits strictly matching blueprint |
| **4: Verify** | `"Verify Task [X.Y]"` | Static AST audit + copy-paste terminal test commands |

---

## 5. Manual Testing Flaw Response

When you test a completed task and spot a bug, paste:

```text
"I tested Task [X.Y] manually and found a flaw:
Expected: [What should happen]
Actual: [What happened]
Steps: [1. Click X -> 2. See error Y]
Triage and fix."
```

*The agent automatically halts new edits, performs 5-Whys AST root-cause analysis, applies a 2-strike rollback if needed, and gives you the exact re-test command.*

---

## 6. Core Invariants

1. **Task-selected skills:** The task manifest selects the smallest relevant skill set and records its artifacts.
2. **Evidence over claims:** Optional MCP graph evidence is recorded when available; ordinary analysis remains available when it is not.
3. **Zero-silent-mocks:** The frontend never fakes backend responses; missing fields are logged to `backend-requirements.md`.
4. **Protected completion:** Local hooks assist, while CI should validate the same artifacts before merge.

---

## Deep Documentation
- [Universal DevCycle Runbook](core/workflows/devcycle.md)
- [Emergency Incident & RCA Runbook](core/workflows/incident-rca.md)
- [Core Operating Rules](core/rules/)
