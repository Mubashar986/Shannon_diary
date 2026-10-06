# Adopting Heisenberg OS in a Codebase

Heisenberg OS is a template repository. Install its policy layer into the
application repository you want an agent to work on; do not use this template
as the application workspace.

## Install

From a clone of this repository, preview the exact files first:

```text
python bin/init.py --target /path/to/application --host all
```

Apply only after reviewing the preview:

```text
python bin/init.py --target /path/to/application --host all --apply
```

The initializer does not overwrite existing files. `--force` makes a
`.heisenberg.bak` copy before it replaces a conflicting file.

Open the application repository in the coding agent, mark it trusted if the
host requires trust, then restart that agent. Project rules and hooks load when
the host starts or opens the trusted workspace.

## Files installed

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Shared, concise bootstrap and completion rules. |
| `CLAUDE.md` | Claude Code adapter. |
| `.cursor/rules/*.mdc` | Cursor adapters; the UI rule is path-scoped. |
| `.agents/rules/*` | Antigravity adapter. |
| `.cursor/hooks.json`, `.agents/hooks.json` | Host-native local policy hooks. |
| `.heisenberg/*` | The policy, task routing, schemas, templates, artifacts, and receipts. |
| `scripts/heisenberg_guard.py` | Dependency-free validation and hook implementation. |

## Start a task

Copy `.heisenberg/templates/task-manifest.json` to
`.heisenberg/tasks/TASK-<id>.json`, set the task type, then include the skills
required by `.heisenberg/skills.json`. List the planning gates in
`required_before_edit` and place artifacts at
`.heisenberg/artifacts/TASK-<id>/`.

For a UI task, the manifest requires Concept-to-Code Bridge, Codebase Design,
Picasso, Escher, Vermeer, and Testing & Verification. For algorithms,
concurrency, persistence, search, security protocols, networking, and
performance work, it also requires CS Domain Learning.

Use the guard before declaring completion:

```text
python scripts/heisenberg_guard.py validate --workspace .
```

The local hooks give fast feedback. The included GitHub Actions workflow is the
cross-agent enforcement point: protect the target branch and require its check
before merge.

## Optional GrapeRoot MCP

GrapeRoot is not assumed to exist on every agent host. Mark
`requires_graperoot` true only when graph evidence is essential, configure the
host-specific MCP server, then verify its reachable service and advertised
tools with `bin/doctor.py --json`. Do not treat a configuration file or open
port alone as proof that an active agent loaded the server.
