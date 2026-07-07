---
description: Refresh an existing pm-workflow scaffold (templates, agents, model profile, decision log) against the installed skill.
---

Invoke the **pm-workflow** skill and run **Phase A′ — Upgrade an existing scaffold** in this project: diff the upgrade-candidate files (`docs/roles.md`, `.claude/agents/*.md`, `.claude/settings.local.json`, root `CLAUDE.md`) against the current templates, offer to switch the **model profile**, offer to add `docs/decisions.md` if it's missing, migrate the older `.claude/CLAUDE.md` layout if present, and refresh only what the human approves.

Never touch `AGENTS.md` (beyond its single `Model profile:` line on a profile switch), `docs/plan.md`, `docs/progress.md`, `docs/test.md`, or `docs/decisions.md` — they hold project/user content. Remind the human that agent-model changes take effect only after a session restart.

Run this only on an already-scaffolded project. If `docs/roles.md` is absent, point them at `/pm-workflow:setup` instead.
