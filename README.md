# pm-workflow

A **PM-orchestrated, role-based agent workflow** skill for [Claude Code](https://docs.claude.com/en/docs/claude-code).

Invoke `/pm-workflow` in any project and the current session becomes the **PM (orchestrator)**. It scaffolds the workflow, then sequences three subagents — each pinned to its own model and effort — with **human approval gates** after planning and after QA.

| Role | Model / Effort | Drives on |
| ---- | -------------- | --------- |
| **PL** Planner | Opus / max | `brainstorming`, `writing-plans` |
| **PG** Programmer | Sonnet / high | `test-driven-development`, `executing-plans` |
| **QA** Reviewer | Opus / high | `code-review`, `systematic-debugging` |
| **PM** Orchestrator | your session model (Opus / high recommended) | routes, holds the gates |
| **CX** Codex (optional) | OpenAI Codex CLI | read-only second opinion at QA, and/or PG-contract workers |

> The design: **spend reasoning at the bookends (plan + review), run cheap in the middle (implement).**

pm-workflow is **Claude Code-first**: the full experience — named subagents pinned to per-role model + effort, orchestrated by the PM session with the two human gates — runs on Claude Code. The scaffolded contract is nonetheless **portable**: the canonical project instructions live in a root `AGENTS.md` (the cross-tool standard, imported by a thin `CLAUDE.md` adapter), so other agentic tools (Codex, Antigravity, Cursor, …) opened at the project root can follow the same roles, docs, and gates in a single context. Codex delegation is **opt-in per project** (chosen at scaffold, only offered when the `codex` CLI is installed): a read-only second-opinion review alongside QA, a human-triggered blind peer consult at planning, Codex workers implementing tasks, or off.

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

1. **Scaffold** — in a new project, run `/pm-workflow` and answer the few setup questions (the **workflow visibility** first, then the **Gate 2 ship mode** below, and the **Codex mode** if the codex CLI is installed). It creates a root `AGENTS.md` (canonical instructions) + `CLAUDE.md` (thin adapter), `.claude/` (settings.local.json, `agents/{planner,programmer,qa}.md`) and `docs/` (roles, plan, progress, test). The scaffolded `AGENTS.md` embeds the full Karpathy coding guidelines, plus the complete RTK command reference if RTK is installed on the machine.
2. **Restart** — open a **brand-new session at the project root** (`/exit`, `cd` into the project, start `claude` again). This is required once so the new subagents register. Resuming the same chat will *not* pick them up. If you gave a task alongside the scaffold request, it's **queued in `docs/.pm-handoff.md`** and the fresh session resumes it automatically.
3. **Run tasks** — `/pm-workflow <task>`. The PM runs **plan → Gate 1 (you approve) → implement → QA → Gate 2 (ship)**. Every session after the first works with no restart.
   - **Fast lane:** for trivially small tasks (typo, one-liner, doc/config tweak) the PM offers to skip the planner and Gate 1 — you confirm, it supplies acceptance criteria itself, and QA + Gate 2 still always run.
   - **Loop cap:** after 2 consecutive QA rejects on a task, the PM stops and asks you — keep looping, escalate the fix to Opus, or take over.
   - **Parallel waves:** the planner annotates each task with its file scope and dependencies; independent tasks with disjoint scopes run as Gate-1-approved waves of up to 3 programmers (or Codex workers, in `executor` mode) concurrently. The PM does the plan/progress bookkeeping for wave tasks; the full test suite runs once, at QA.
   - **QA efficiency:** reject-loop re-reviews check the fixes + delta diff only, not the whole change again. In `second-opinion` mode, a read-only Codex review runs alongside QA and both verdicts reach Gate 2, disagreements highlighted.
   - **Blind peer consult** (`second-opinion` mode, high-stakes tasks, you trigger it): the planner and Codex get the same brief independently — neither sees the other's answer — and the planner synthesizes both into the plan, with the disagreement map shown at Gate 1.

**Workflow visibility** (asked first at scaffold): **private** (default) — every artifact (`AGENTS.md`, `CLAUDE.md`, `.claude/*`, `docs/*`) is excluded via `.git/info/exclude`, so your personal workflow leaves **zero trace** in a repo you're contributing to; if the repo already has tracked `AGENTS.md`/`CLAUDE.md`, they're left untouched and the workflow instructions go to `.claude/CLAUDE.md` instead. **shared** — artifacts are committed so every contributor runs the same workflow. Even in shared mode, `settings.local.json` and the transient task-handoff file stay local.

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
| `codex` CLI | PM (second opinions / workers) | [openai/codex](https://github.com/openai/codex) | Codex question skipped at scaffold; workflow runs Claude-only |

For the full experience, install the **superpowers** plugin (`/plugin` → `claude-plugins-official` marketplace), and for React projects, run `npx react-doctor@latest install`. The installer prints a status report of these assists after every install, so you can set them up before your first scaffold.

## Update

Re-run the installer — it overwrites the installed copy with the latest:

```bash
npx github:AlaskanTuna/pm-workflow#main
```

`npx` caches packages, so pin `#main` (or a release tag like `#vX.Y.Z`) to fetch a specific ref. Check what you have vs what's published:

```bash
npx github:AlaskanTuna/pm-workflow --check
```

Updating the skill does **not** rewrite projects you already scaffolded. To pull template fixes into a project, ask the PM to *upgrade the scaffold* — it diffs your `docs/roles.md`, `.claude/agents/*`, `settings.local.json`, and the `CLAUDE.md` adapter against the new templates, flags anything you customized, and refreshes only what you approve (your `AGENTS.md`, plan, progress, and test files are never touched). Projects on the older layout (full instructions in `.claude/CLAUDE.md`, no `AGENTS.md`) are offered a one-time migration.

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
  templates/            ← AGENTS.md, CLAUDE.md (adapter), roles/plan/progress/test, settings, agents/*
  update-check.js       ← daily auto-update check (SessionStart hook target)
bin/install.js          ← the npx installer (+ auto-update hook registration)
package.json
```

## License

MIT © Adam (AlaskanTuna)
