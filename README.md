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

# Enable auto-update at install time (daily SessionStart check; global installs)
npx github:AlaskanTuna/pm-workflow --with-auto-update
```

This copies the skill into `~/.claude/skills/pm-workflow` (global) or `./.claude/skills/pm-workflow` (project).

---

## Use

1. **Scaffold** — in a new project, run `/pm-workflow` and answer the few setup questions (including the **Gate 2 ship mode**, below). It creates `.claude/` (CLAUDE.md, settings.local.json, `agents/{planner,programmer,qa}.md`) and `docs/` (roles, plan, progress, test). The scaffolded `CLAUDE.md` embeds the full Karpathy coding guidelines, plus the complete RTK command reference if RTK is installed on the machine.
2. **Restart** — open a **brand-new session at the project root** (`/exit`, `cd` into the project, start `claude` again). This is required once so the new subagents register. Resuming the same chat will *not* pick them up.
3. **Run tasks** — `/pm-workflow <task>`. The PM runs **plan → Gate 1 (you approve) → implement → QA → Gate 2 (ship)**. Every session after the first works with no restart.

**Gate 2 ship modes** (chosen per project at scaffold time):
- **direct** — commit + push to the working branch.
- **pr-manual** — PM opens a PR into the target branch; you review and merge.
- **pr-auto** — PM opens a PR and self-merges into the target branch.

In the PR modes, a PR is opened **only for substantial changes / the end of an iteration** — small hotfixes and minor edits are committed straight to the target branch. Merged PR branches are deleted (`--delete-branch`), so no stale branches pile up.

---

## Dependencies

The workflow runs **standalone** — the skills below are *optional assists* the subagents use **if present** and degrade gracefully if not. On first scaffold, `/pm-workflow` checks what's installed and, if any `superpowers` skills (or `react-doctor`, on React projects) are missing, **pauses and asks** whether to install them first or proceed without (it can't install the plugin for you — that's a human action).

| Skill | Used by | Source | If missing |
| ----- | ------- | ------ | ---------- |
| `brainstorming`, `writing-plans` | planner | `superpowers` plugin | planner reasons through it inline |
| `test-driven-development`, `executing-plans` | programmer | `superpowers` plugin | programmer follows TDD by hand |
| `systematic-debugging` | qa | `superpowers` plugin | qa debugs methodically by hand |
| `code-review` | qa | built into Claude Code | always available |
| `react-doctor` | programmer (React projects) | `npx react-doctor@latest install` | skipped on non-React projects, or if absent |

For the full experience, install the **superpowers** plugin (`/plugin` → `claude-plugins-official` marketplace), and for React projects, run `npx react-doctor@latest install`.

## Update

Re-run the installer — it overwrites the installed copy with the latest:

```bash
npx github:AlaskanTuna/pm-workflow#main
```

`npx` caches packages, so pin `#main` (or a release tag like `#v1.1.0`) to fetch a specific ref. Check what you have vs what's published:

```bash
npx github:AlaskanTuna/pm-workflow --check
```

### Automatic updates (opt-in)

Install with `--with-auto-update` (or answer **y** at the prompt) to register a **SessionStart hook** that checks GitHub at most once per day and updates the skill when a newer version ships. It's throttled, fail-silent, and never blocks session start — real (npx) installs auto-reinstall; symlink/dev installs are notify-only. To disable, remove the `update-check.js` entry from `hooks.SessionStart` in `~/.claude/settings.json`.

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
  update-check.js       ← daily auto-update check (SessionStart hook target)
bin/install.js          ← the npx installer (+ auto-update hook registration)
package.json
```

## License

MIT © Adam (AlaskanTuna)
