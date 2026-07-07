---
description: Run the gated planner→programmer→qa pipeline on a task.
argument-hint: <task description>
---

Invoke the **pm-workflow** skill as the PM and run the pipeline on this task:

$ARGUMENTS

If the project isn't scaffolded yet (`docs/roles.md` is absent), run **Phase A — Scaffold** first and write this task **verbatim** to `docs/.pm-handoff.md` so the fresh post-restart session resumes it. Otherwise run **Phase B**: triage the task size (offer the fast lane only for trivially small tasks), then planner → **Gate 1** → programmer → qa → **Gate 2**, honoring the project's recorded Gate 2 ship mode and model profile. Never skip the human gates; nothing bypasses QA or Gate 2.

If no task text was provided above, ask the human what they want built.
