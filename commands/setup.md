---
description: Scaffold the PM-orchestrated agent workflow in this project (planner/programmer/qa + gates).
---

Invoke the **pm-workflow** skill and run **Phase A — Scaffold** in the current project: detect the stack, ask (via AskUserQuestion) only what you can't detect — visibility, Gate 2 ship mode + target branch, **model profile** (`max`/`balanced`/`economy`), and Codex mode if the `codex` CLI is present — then copy the templates into place and **stop** with the copy-pasteable restart instructions. Do **not** run a task in this session; scaffolding ends by handing off to a fresh session so the named agents register.

If the project is already scaffolded (`docs/roles.md` exists), say so and point the human at `/pm-workflow:task` to run work, or `/pm-workflow:upgrade` to refresh the scaffold.
