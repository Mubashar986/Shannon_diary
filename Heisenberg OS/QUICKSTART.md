# ⚡ Heisenberg OS — Quickstart & Prompt Cheat Sheet

> **The 1-Page Developer Reference for Driving AI Agents via Heisenberg OS.**  
> Compatible with Cursor, Windsurf, Claude Code, Cline, Roo Code, Antigravity, and Zed.

---

## 1. 30-Second Setup

Install the policy layer into the project root, then open that project in the
coding agent:

```bash
# First preview, then apply. Existing files are never overwritten unless --force is used.
python bin/init.py --target C:/path/to/project --host all
python bin/init.py --target C:/path/to/project --host all --apply
```

Restart the agent after installation. In the target repository, verify the
portable layer with `python scripts/heisenberg_guard.py validate --workspace .`.
Use `bin/doctor.py --json` for the optional GrapeRoot/MCP health checks.

---

## 2. Initial Prompts (Day 1 Cold-Start)

What to copy-paste into chat when opening your project:

- **Scenario A: Brand-New Project from Scratch (Greenfield)**
  > `"Let's start a new project with Heisenberg. I want to build [describe idea in 1-2 sentences]. Run cold-start genesis."`  
  *Agent runs the 4-Vector Genesis Interview, generates `ADR-0001`, and scaffolds `roadmap_wbs.md`.*

- **Scenario B: Existing Codebase (Brownfield / Legacy)**
  > `"Onboard this codebase using Heisenberg. Run brownfield diagnostic."`  
  *Agent performs a silent GrapeRoot AST scan and presents the Doctor's Diagnostic Card.*

- **Scenario C: Active Project (Next WBS Task)**
  > `"Let's start Task [X.Y] from roadmap_wbs.md. Run Stage 1 concept-to-code-bridge."`  
  *Agent verifies dependencies and builds the mental model & diagram before touching code.*

---

## 3. The 5-Stage Agent Prompt Runbook

Speak to your AI agent using these exact trigger phrases:

| Stage | What You Say to the Agent | What the Agent Delivers |
|---|---|---|
| **0: Planning** | `"I want to build [feature/project]. Run Stage 0 roadmap-wbs-planner."` | `roadmap_wbs.md` with numbered leaf tasks & acceptance criteria. |
| **1: Mental Model** | `"Start Task [X.Y]. Run Stage 1 concept-to-code-bridge."` | `task_X_Y_understanding.md` with Mermaid diagrams & physical analogies. |
| **Architect Review** *(Optional)* | `"Analyze Task [X.Y] with Narrsistic Pluto. Compare 3-5 approaches."` | `task_X_Y_architect_analysis.md` with web research & blast radius. |
| **2: Blueprint** | `"Create Stage 2 codebase-design for Task [X.Y]."` | `task_X_Y_design.md` with exact `[NEW]`/`[MODIFY]` file list & rollback plan. |
| **UI: Tokens** *(Frontend)* | `"Run picasso to define design tokens for our app."` | `tokens.json` & `DESIGN_SYSTEM.md` (zero raw hex codes). |
| **UI: Backend** *(Frontend)* | `"Run escher to inspect backend schema for [Component]."` | Real AST API contract wiring; flags gaps in `backend-requirements.md`. |
| **UI: Visuals** *(Frontend)* | `"Run vermeer to build [Component] using tokens."` | Token-pure component with 6 interactive states & double-bezel cards. |
| **UI: HCI Usability** *(Frontend)* | `"Run hci-usability-principles for [Component/Flow]."` | `hci-interaction-spec.md` with Norman's 6, 4-stage feedback & constraints. |
| **UI: Usability Audit** *(Audit/Redesign)* | `"Run heuristic-evaluation-audit on [Screen]."` | `heuristic-audit.md` with Nielsen's 10 heuristics & 0–4 severity fixes. |
| **UI: Learnability** *(Onboarding/Wizard)* | `"Run cognitive-walkthrough-evaluator on [Flow]."` | `cognitive-walkthrough.md` answering Wharton's 4 questions per step. |
| **UI: Efficiency** *(Power-User/Forms)* | `"Run task-modeling-goms-klm on [Workflow]."` | `task-model-goms.md` with KLM timings, homing cuts & shortcut keys. |
| **3: CS Domain** *(MANDATORY for all tasks)* | `"Run Stage 3 cs-domain-learning for Task [X.Y]."` | `cs-concepts.md` with first principles, data structures, invariants & kernel traces. |
| **Implementation** | `"Stage 2 approved. Implement Task [X.Y]."` | Surgical code edits strictly matching the approved design. |
| **4: Verification** | `"Run Stage 4 testing-verification for Task [X.Y]."` | Static AST check + copy-paste terminal verification commands. |

---

## 4. How to Report Flaws After Manual Testing

When you manually test a completed task and find an issue, simply paste your observation:

```text
"I tested Task [X.Y] manually and found a flaw:
Expected: [What should happen]
Actual: [What actually happened]
Steps to reproduce: [1. Click X -> 2. See error Y]
Triage and fix."
```

### What the Agent Automatically Executes:
1. **Execution Freeze:** Halts all new code generation immediately.
2. **Severity Triage:**
   - **Minor (Bug/Edge-case):** Surgical fix within existing branch.
   - **Major (Architecture flaw):** Narrsistic Pluto 5-Whys Root Cause Analysis.
   - **Scope Delta (New requirement):** Scope-Creep Hard-Stop; updates WBS instead of silently hacking.
3. **GrapeRoot AST Diagnosis:** Uses `graph_impact` and symbol lookups to isolate root cause.
4. **2-Strike Rollback Trigger:** If two consecutive patch attempts fail, cleanly rolls back working tree.
5. **Re-Verification Command:** Outputs copy-paste terminal commands for you to re-verify.
6. **Memory Vaccine:** Saves the defect pattern to GrapeRoot memory so it is never repeated.

---

## 5. The 3 Immutable Golden Rules

1. **Zero Terminal Testing Policy:** The agent will **never** run automated test suites (`pytest`, `npm test`, `playwright`) unsolicited. It verifies code via static AST graph analysis and hands you the copy-paste verification command.
2. **Dual-Graph Symbol Lookups:** The agent reads surgical symbols (`file::symbol`) via GrapeRoot rather than dumping 1,000-line files into context.
3. **Zero-Silent-Mocks:** The frontend never invents fake backend data. Missing fields are logged to `backend-requirements.md`.
