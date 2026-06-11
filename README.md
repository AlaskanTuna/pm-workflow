# pm-workflow

A **PM-orchestrated, role-based agent workflow** skill for [Claude Code](https://docs.claude.com/en/docs/claude-code).

Invoke `/pm-workflow` in any project and the current session becomes the **PM (orchestrator)**. It scaffolds the workflow, then sequences three subagents — each pinned to its own model and effort — with **human approval gates** after planning and after QA.

| Role | Model / Effort | Drives on |
| ---- | -------------- | --------- |
| **PL** Planner | Opus / max | `brainstorming`, `writing-plans` |
| **PG** Programmer | Sonnet / high | `test-driven-development`, `executing-plans` |
| **QA** Reviewer | Opus / high | `code-review`, `systematic-debugging` |
| **PM** Orchestrator | your session model | routes, holds the gates |

> The design: **spend reasoning at the bookends (plan + review), run cheap in the middle (implement).**

---

## Install

Requires [Node.js](https://nodejs.org) ≥ 16.7 (only to run the installer) and Claude Code.

```bash
# Global install — available in every project (default)
npx github:AlaskanTuna/pm-workflow

# Or scope it to the current project only
npx github:AlaskanTuna/pm-workflow --project

# Or a custom skills directory
npx github:AlaskanTuna/pm-workflow --path /path/to/.claude/skills
```

This copies the skill into `~/.claude/skills/pm-workflow` (global) or `./.claude/skills/pm-workflow` (project).

---

## Use

1. **Scaffold** — in a new project, run `/pm-workflow` and answer the few setup questions. It creates `.claude/` (CLAUDE.md, settings.local.json, `agents/{planner,programmer,qa}.md`) and `docs/` (roles, plan, progress, test).
2. **Restart** — open a **brand-new session at the project root** (`/exit`, `cd` into the project, start `claude` again). This is required once so the new subagents register. Resuming the same chat will *not* pick them up.
3. **Run tasks** — `/pm-workflow <task>`. The PM runs **plan → Gate 1 (you approve) → implement → QA → Gate 2 (you authorize commit/push)**. Every session after the first works with no restart.

---

## Dependencies

The workflow runs **standalone** — the skills below are *optional assists* the subagents use **if present** and degrade gracefully if not. On first scaffold, `/pm-workflow` checks what's installed and tells you what's missing (it cannot install plugins for you — that's a human action).

| Skill | Used by | Source | If missing |
| ----- | ------- | ------ | ---------- |
| `brainstorming`, `writing-plans` | planner | `superpowers` plugin | planner reasons through it inline |
| `test-driven-development`, `executing-plans` | programmer | `superpowers` plugin | programmer follows TDD by hand |
| `systematic-debugging` | qa | `superpowers` plugin | qa debugs methodically by hand |
| `code-review` | qa | built into Claude Code | always available |
| `react-doctor` | programmer (frontend) | custom / not distributed | skipped |

For the full experience, install the **superpowers** plugin: run `/plugin` in Claude Code and add it from the `claude-plugins-official` marketplace.

## Update

Re-run the installer — it overwrites the installed copy with the latest:

```bash
npx github:AlaskanTuna/pm-workflow#main
```

`npx` caches packages, so pin `#main` (or a release tag like `#v1.1.0`) to fetch a specific ref. Check what you have vs what's published:

```bash
npx github:AlaskanTuna/pm-workflow --check
```

---

## Uninstall

```bash
rm -rf ~/.claude/skills/pm-workflow     # global
rm -rf ./.claude/skills/pm-workflow     # project
```

---

## Repo layout

```
pm-workflow/            ← the skill payload (copied verbatim on install)
  SKILL.md
  templates/            ← CLAUDE.md, roles/plan/progress/test, settings, agents/*
bin/install.js          ← the npx installer
package.json
```

## License

MIT © Adam (AlaskanTuna)
