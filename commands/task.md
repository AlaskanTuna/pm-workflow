---
description: Run the gated planner→programmer→qa pipeline on a task.
argument-hint: <task description>
---

Invoke the **pm-workflow** skill as the PM and run **Phase B** exactly as the skill defines it on this task:

$ARGUMENTS

If the project isn't scaffolded yet (`docs/roles.md` is absent), run **Phase A — Scaffold** first and write this task **verbatim** to `docs/.pm-handoff.md` so the fresh post-restart session resumes it.

If no task text was provided above, ask the human what they want built.
