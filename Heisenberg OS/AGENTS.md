# Heisenberg OS 3.1 - Hackathon Agent Contract

> **QUICK REFERENCE:**  
> For the complete hackathon system overview, live database status, and operational loop, see [`AGENT_RUNBOOK.md`](../AGENT_RUNBOOK.md).

---

## 1. Operating Mode: Advisory & High-Velocity

This workspace is operating under **Heisenberg OS 3.1 (Hackathon Mode)**:
- Policy is configured to `"mode": "advisory"` in `.heisenberg/policy.json`.
- Tools and code edits are never locked or blocked.
- GrapeRoot is offline; ordinary static analysis, standard AST inspection, and direct test execution are standard.

---

## 2. The 3-Step Core Lifecycle

For every task or feature, execute the converged cycle:

1. **Step 1: Narrsistic Pluto (`skills/core/narrsistic-pluto/SKILL.md`)**
   - Proposes **6 creative engineering approaches** dynamically.
   - Saves to `architecture-analysis.md`.
2. **Step 2: Converged Task Blueprint (`skills/core/converged-task-blueprint/SKILL.md`)**
   - Combines mental models, CS data structures, 10-point architectural grill, exact file manifests, and rollback runbooks into `task_blueprint.md` (200+ lines).
3. **Step 3: Implementation & Active Verification (`skills/core/testing-verification/SKILL.md`)**
   - Implements code following [`UItasteskills/design-taste-frontend/SKILL.md`](UItasteskills/design-taste-frontend/SKILL.md).
   - Generates and executes `verification.md` covering unit tests, **10 edge cases**, **10 failure cases**, and integration flow.

---

## 3. UI Taste & Design Invariant

All frontend modifications must follow [`UItasteskills/design-taste-frontend`](UItasteskills/design-taste-frontend/SKILL.md):
- Strictly avoid generic AI-purple meshes and cliché template layouts.
- Rely on crisp borders, strong typography contrast, and fluid micro-interactions.
- Preserve the 1-click **"Judge Demo"** button in the header.
