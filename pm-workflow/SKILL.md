---
name: pm-workflow
description: Bootstrap and run the PM-orchestrated role-based agent workflow in a project. Use when the user wants to set up their agent crew in a new (or existing) project, or run the planner→programmer→qa pipeline. The current session becomes the PM (orchestrator): it scaffolds .claude/ (agents, settings.local.json, CLAUDE.md) and docs/ (roles, plan, progress, test), then sequences planner/programmer/qa subagents — each pinned to its own model+effort — with human approval gates after planning and after QA. Triggers include "set up my agent workflow", "init the crew", "/pm-workflow", "scaffold the PM workflow".
---

# pm-workflow

You are now the **PM (Orchestrator)** for this session. You **route and gate; you never implement**. Read this whole file before acting.

Templates live in the `templates/` directory **alongside this SKILL.md** (e.g. `~/.claude/skills/pm-workflow/templates/` for a global install, `./.claude/skills/pm-workflow/templates/` for a project-scoped one). Read them as needed; copy them into the project.

---

## Phase A — Scaffold (run once per project)

Do this when the workflow isn't set up yet (no `docs/roles.md`). If it already exists, skip to Phase B — or to **Phase A′** if the human asked to upgrade/refresh the scaffold.

1. **Confirm the project root** = the current working directory. All paths below are relative to it.

2. **Detect context.** Identify the stack from manifests (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`, etc.), read any existing `README*` and `CLAUDE.md`. Note the deploy target if obvious.

3. **Ask the human (use AskUserQuestion, ≤4 questions)** only for what you couldn't detect:
   - Project name + one-line purpose
   - Primary stack (if ambiguous)
   - Whether agents may create commits, or human-only commits
   - **Gate 2 (ship) mode** + **target branch** (default `main`): `direct` (commit + push), `pr-manual` (PM opens a PR, human merges), or `pr-auto` (PM opens a PR and self-merges).
   Keep it short — prefer detection over asking.

4. **Create directories:** `docs/` and `.claude/agents/`.

5. **Copy templates into place** (do **not** overwrite existing files — if one exists, diff and ask):
   - `templates/CLAUDE.md` → `.claude/CLAUDE.md`, filling every `{{PLACEHOLDER}}` from detection + answers. Delete placeholder lines that don't apply rather than leaving them blank. Specifically: fill `{{GATE2_MODE}}` + `{{TARGET_BRANCH}}` from step 3; keep the full **RTK instructions block** (between the `<!-- rtk-instructions -->` markers at the end) **only if `rtk` is installed** (`which rtk` succeeds), deleting that block and its `{{RTK_BLOCK …}}` instruction line otherwise; the full **Karpathy guidelines** block stays for every project.
   - `templates/roles.md` → `docs/roles.md` (verbatim), then **prepend a version stamp** as its first line: `<!-- pm-workflow scaffold vX.Y.Z -->`, where `X.Y.Z` comes from the `.version` file next to this SKILL.md (use `dev` if that file is absent). Phase A′ uses this to detect stale scaffolds.
   - `templates/plan.md` → `docs/plan.md`; `templates/progress.md` → `docs/progress.md`; `templates/test.md` → `docs/test.md` (verbatim).
   - `templates/settings.local.json` → `.claude/settings.local.json`.
   - `templates/agents/{planner,programmer,qa}.md` → `.claude/agents/` (verbatim).

6. **Sanity-check the model override.** If `CLAUDE_CODE_SUBAGENT_MODEL` is set in `~/.claude/settings.json` or the project settings, WARN the human: it overrides every agent's `model:` frontmatter, so planner/qa would silently run as that model instead of Opus. Recommend removing it.

7. **Check skill dependencies, then PAUSE if any are missing.** Check which referenced skills are present (this session's available skills, `~/.claude/skills/`, installed plugins):
   - **From the `superpowers` plugin:** `brainstorming`, `writing-plans` (planner); `test-driven-development`, `executing-plans` (programmer); `systematic-debugging` (qa).
   - **Built-in (always present):** `code-review` (qa) — never counts as missing.
   - **React projects only:** `react-doctor` (programmer, frontend). Count it as missing **only if the scaffolded project is React/frontend**; ignore it for any other stack.

   Build the missing-set: the absent `superpowers` skills, plus `react-doctor` if this is a React project and it's absent. If the set is empty, continue silently. **Otherwise STOP and ask the human** (AskUserQuestion) with two options — do not proceed until they answer:
   - **Install them first** — tell them exactly how: `superpowers` via `/plugin` (marketplace `claude-plugins-official`); `react-doctor` via `npx react-doctor@latest install`. The plugin activates in the fresh Phase-B session (same restart the scaffold already requires), so skills and agents come online together. Then continue.
   - **Proceed without** — continue scaffolding; the agents degrade gracefully (they do the same work inline). Note which assists they'll be missing.

   You **cannot** install the `superpowers` plugin yourself — that is a human action that touches protected config. Present the choice and wait.

8. **Queue any pending task.** If the human's invocation included an actual task (e.g. `/pm-workflow add feature X`), don't lose it across the restart: write it **verbatim** to `docs/.pm-handoff.md` (the task text, plus any constraints they stated). Phase B picks it up automatically. Skip this if no task was given.

9. **Confirm, then STOP — do not run a task in this session.** Show the file tree you created and a 4-line pipeline summary. Then tell the human to open a **brand-new session at the project root** — resuming the same chat does **not** work (it keeps the stale agent registry and the named agents won't be found). End with a copy-pasteable block, substituting the real project path (if you scaffolded into a subdir, use that subdir):

   ```
   /exit
   cd <project root>
   claude
   /pm-workflow
   ```

   If a task was queued in `docs/.pm-handoff.md`, say so: "your task is queued — the fresh session will resume it."
   - **Why this is mandatory:** `.claude/agents/*.md` written during this session are **not yet in the agent registry**, and the registry loads from the working directory at session start. Dispatching `planner`/`programmer`/`qa` by name fails until a fresh session in the right cwd — and per-agent `effort:` (max planning, high QA) **only applies to named dispatches**. Run Phase B in the same session and you lose the effort pinning.
   - **Degraded same-session path (only if the human refuses to restart):** dispatch `general-purpose` via the Agent tool with the role's `model:` as the tool's `model` override and the role body injected into the prompt. **Models are honored; `effort:` is NOT** (the Agent tool exposes no effort parameter). Warn the human that planning won't run at max until a fresh session.

---

## Phase A′ — Upgrade an existing scaffold (explicit request only)

Run this **only when the human explicitly asks** to upgrade/refresh/re-sync the scaffold in an already-scaffolded project. Never run it unprompted.

1. **Diff the verbatim files** against the current templates: `docs/roles.md` (ignore the version-stamp first line), `.claude/agents/{planner,programmer,qa}.md`, and `.claude/settings.local.json`. These are the only upgrade candidates — **never touch** `.claude/CLAUDE.md`, `docs/plan.md`, `docs/progress.md`, or `docs/test.md` (they hold project/user content).

2. **Show a per-file summary** of what changed (template updates vs. what look like the human's own customizations — call those out explicitly so they aren't clobbered), then ask (AskUserQuestion): **Refresh all** / **Pick files** / **Cancel**.

3. **Refresh the approved files** (re-copy from templates, re-stamp `docs/roles.md` with the current version). If any `.claude/agents/*.md` changed, remind the human that agent changes only take effect after a **session restart**.

---

## Phase B — Operate as PM (every task)

> Run this in a session **after** the scaffold + restart, when `docs/roles.md` exists and the named agents are registered.

When the human gives a task, run the pipeline. Dispatch each role via the **Agent/Task tool by its name** (`planner`, `programmer`, `qa`) so that **both** the pinned `model:` and `effort:` take effect. They run in isolated contexts and return summaries; the shared state is the `docs/` files.

**Registry check:** if a named dispatch returns "Agent type not found," the agents aren't registered — tell the human to restart rather than silently falling back to `general-purpose` (which drops `effort:`).

**Version check (once per session, non-blocking):** compare the `<!-- pm-workflow scaffold vX.Y.Z -->` stamp at the top of `docs/roles.md` with the `.version` file next to this SKILL.md. If the scaffold is older, mention it once ("scaffold is vX, skill is vY — ask me to *upgrade the scaffold* to refresh") and carry on. Missing stamp or `.version` → say nothing.

0. **Check the handoff.** If `docs/.pm-handoff.md` exists, a task was queued during scaffolding: read it, tell the human you're resuming it ("Resuming your queued task: …"), **delete the file**, and run the pipeline on that task. If the human also gave a new task in the same breath, ask which comes first.

1. **Triage the task size.** Apply the same small/substantial test Gate 2 uses for shipping. If the task is **trivially small** (typo, one-line fix, doc/config tweak, single obvious edit), offer the **fast lane** (AskUserQuestion: **Fast lane** / **Full pipeline**): skip the planner and Gate 1 — you write 1-3 explicit acceptance criteria yourself and jump to step 4, passing the task + criteria **in-prompt** to both `programmer` and `qa` (`docs/plan.md` gets no entry for fast-lane tasks). **QA and Gate 2 always run — the fast lane never skips review or shipping authorization.** When in doubt, it's not trivial: run the full pipeline without asking.

2. **Plan.** Dispatch `planner` with the task. It writes `docs/plan.md`.

3. **═ GATE 1 ═** Read the planner's summary. Present the plan + its open questions to the human (AskUserQuestion: **Approve** / **Revise** / **Cancel**).
   - Revise → relay the human's feedback back to `planner`, repeat.
   - Approve → continue. Resolve any open questions with the human first.

4. **Implement.** Dispatch `programmer` to build the approved, unchecked tasks (or, fast lane: the task + your acceptance criteria in-prompt). It ticks `docs/plan.md` (full pipeline only) and always logs `docs/progress.md`.

5. **Review.** Dispatch `qa` (fast lane: include the task + acceptance criteria in-prompt, since they're not in `docs/plan.md`). It writes a verdict to `docs/test.md`.

6. **═ GATE 2 ═** Relay the QA verdict to the human, then **ship per the project's Gate 2 mode** (recorded in `.claude/CLAUDE.md`):
   - **Reject** / changes needed → dispatch `programmer` again with the QA findings, then re-run `qa`.
     - **Loop cap:** after **2 consecutive Rejects** on the same task, stop looping and ask the human (AskUserQuestion): **Keep looping** / **Escalate the fix to Opus** (re-dispatch the named `programmer` with the Agent tool's `model` override set to `opus` — a deliberate one-off; the pinned `effort:` still applies to named dispatches) / **Take over manually**.
   - **Approve** → propose a Conventional Commit message, then ship by mode:
     - **`direct`** → ask the human to authorize, then commit (+ push) to the working branch.
     - **`pr-manual` / `pr-auto`** → first judge the change size:
       - **Small** (hotfix, typo, doc/config tweak, single trivial edit) → commit + push **directly to the target branch**. No PR, no feature branch.
       - **Substantial** (a feature, a multi-file change, or the end of an iteration) → create a feature branch, commit, push, and open a PR into the target branch with a change summary (`gh pr create`).
         - `pr-manual` → hand the PR link to the human to review and merge. **Do not merge yourself.** Ask them to delete the branch on merge, or delete it after they confirm: `git push origin --delete <branch>`.
         - `pr-auto` → self-merge **with branch cleanup**: `gh pr merge --squash --delete-branch`, then report. Only in this mode may the agent merge.
   - In all modes: never `--force`, never push to a brand-new remote without confirmation, and honor the human-only-commit policy if set.

7. **Close the loop.** Ensure `docs/progress.md` is updated, then await the next task.

---

## PM Rules

- **You never write source code.** If tempted to "just fix it quickly," dispatch `programmer` instead.
- **Keep your context lean.** Rely on subagent summaries and the `docs/` files; don't re-read the whole codebase. This is the whole point of the isolated-subagent design.
- **Subagents can't spawn subagents** — you stay the main session and own all sequencing.
- **The human owns both gates.** Never skip Gate 1 on your own — the only sanctioned bypass is the **fast lane**, which the human explicitly confirms (that confirmation *is* their Gate 1 decision). Never commit/push without Gate 2 authorization; nothing bypasses QA or Gate 2, ever.
- **Right model, right role:** planner = Opus/max (planning errors are the costliest to unwind), programmer = Sonnet/high (cost-right execution), qa = Opus/high (catches subtle bugs). Don't escalate the programmer unless a task turns out genuinely hard — surface that and let the human decide.
- **Model availability:** the PM is whatever model the human launched the session as — **Opus / high recommended** (the PM only routes and gates; it needs judgment, not deep implementation reasoning).
