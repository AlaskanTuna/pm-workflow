#!/usr/bin/env node
'use strict';

/**
 * pm-workflow skill installer.
 * Copies the skill payload (../pm-workflow) into a Claude Code skills directory.
 * Re-running it updates an existing install in place.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const SKILL_NAME = 'pm-workflow';
const SRC = path.join(__dirname, '..', SKILL_NAME);

function version() {
  try {
    return require(path.join(__dirname, '..', 'package.json')).version;
  } catch {
    return 'unknown';
  }
}

function parseArgs(argv) {
  const args = { target: null, path: null, yes: false, check: false, help: false, autoUpdate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--global' || a === '-g') args.target = 'global';
    else if (a === '--project' || a === '-p') args.target = 'project';
    else if (a === '--path') args.path = argv[++i];
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--check') args.check = true;
    else if (a === '--with-auto-update') args.autoUpdate = true;
    else if (a === '--no-auto-update') args.autoUpdate = false;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function resolveSkillsDir(args, answer) {
  if (args.path) return path.resolve(args.path);
  const choice = args.target || answer;
  if (choice === 'project') return path.join(process.cwd(), '.claude', 'skills');
  return path.join(os.homedir(), '.claude', 'skills'); // default: global
}

function installedVersion(dest) {
  try {
    return fs.readFileSync(path.join(dest, '.version'), 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

// Registers a SessionStart hook in ~/.claude/settings.json. Idempotent and safe:
// never overwrites an unparseable settings file, and preserves all existing keys/hooks.
function enableAutoUpdate(dest) {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const cmd = `node "${path.join(dest, 'update-check.js')}"`;
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    let raw;
    try { raw = fs.readFileSync(settingsPath, 'utf8'); } catch { return 'error'; }
    try { settings = JSON.parse(raw); } catch { return 'invalid'; }
  }
  settings.hooks = settings.hooks || {};
  settings.hooks.SessionStart = settings.hooks.SessionStart || [];
  if (JSON.stringify(settings.hooks.SessionStart).includes('update-check.js')) return 'already';
  settings.hooks.SessionStart.push({ hooks: [{ type: 'command', command: cmd }] });
  try { fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n'); } catch { return 'error'; }
  return 'enabled';
}

// Reports whether the optional assist skills the agents use are present, so the
// user can install them BEFORE the first scaffold (which otherwise pauses to ask).
// Informational only and fail-silent — the workflow degrades gracefully without them.
function reportDeps() {
  try {
    const home = os.homedir();
    const superpowersSkills = ['brainstorming', 'writing-plans', 'test-driven-development', 'executing-plans', 'systematic-debugging'];
    let pluginEnabled = false;
    try {
      const settings = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
      const plugins = settings.enabledPlugins || {};
      pluginEnabled = Object.keys(plugins).some((k) => k.startsWith('superpowers@') && plugins[k]);
    } catch {}
    const hasSkill = (name) =>
      pluginEnabled ||
      fs.existsSync(path.join(home, '.claude', 'skills', name, 'SKILL.md')) ||
      fs.existsSync(path.join(process.cwd(), '.claude', 'skills', name, 'SKILL.md'));
    const missing = superpowersSkills.filter((s) => !hasSkill(s));
    console.log('  Optional assists (used by the agents if present; everything degrades gracefully):');
    if (missing.length === 0) {
      console.log('    ✓ superpowers skills — all found');
    } else {
      console.log(`    ✗ missing: ${missing.join(', ')}`);
      console.log('      Install the superpowers plugin in Claude Code:  /plugin  →  claude-plugins-official');
    }
    console.log('    ℹ react-doctor (React projects only):  npx react-doctor@latest install');
    console.log('');
  } catch {}
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const v = version();

  if (args.help) {
    console.log(`pm-workflow installer v${v}

Usage:  npx github:AlaskanTuna/pm-workflow [options]

  -g, --global       Install to ~/.claude/skills   (default)
  -p, --project      Install to ./.claude/skills    (current project)
      --path <dir>   Install into a custom skills directory
  -y, --yes          No prompts; use defaults/flags
      --with-auto-update  Enable the daily auto-update SessionStart hook (global only)
      --no-auto-update    Skip the auto-update hook
      --check        Report installed vs available version, then exit
  -h, --help         Show this help`);
    return;
  }

  if (!fs.existsSync(SRC)) {
    console.error(`[pm-workflow] skill payload not found at ${SRC}`);
    process.exit(1);
  }

  let answer = 'global';
  if (!args.target && !args.path && !args.yes && !args.check) {
    console.log(`\n  pm-workflow skill installer (v${v})\n`);
    const a = await ask(
      '  Install where?\n    [1] global  ~/.claude/skills        (all projects)\n    [2] project ./.claude/skills         (this repo only)\n  Choose [1]: '
    );
    answer = a === '2' ? 'project' : 'global';
  }

  const skillsDir = resolveSkillsDir(args, answer);
  const dest = path.join(skillsDir, SKILL_NAME);

  if (args.check) {
    const inst = installedVersion(dest);
    console.log(`pm-workflow — installed: ${inst || 'not installed'} | available: ${v}`);
    return;
  }

  const existed = fs.existsSync(dest);
  fs.mkdirSync(skillsDir, { recursive: true });
  if (existed) fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(SRC, dest, { recursive: true });
  fs.writeFileSync(path.join(dest, '.version'), v + '\n');

  console.log(`\n  ${existed ? '✓ Updated' : '✓ Installed'} pm-workflow v${v}`);
  console.log(`    → ${dest}\n`);

  reportDeps();

  // Auto-update SessionStart hook — global installs only.
  const isGlobal = skillsDir === path.join(os.homedir(), '.claude', 'skills');
  let wantAuto = args.autoUpdate;
  if (isGlobal && wantAuto === null && !args.yes) {
    const a = await ask('  Enable auto-update? Adds a SessionStart hook that checks GitHub ~daily and updates this skill. [y/N]: ');
    wantAuto = /^y(es)?$/i.test(a);
  }
  if (wantAuto === true && isGlobal) {
    const r = enableAutoUpdate(dest);
    const msg = {
      enabled: '  Auto-update:  ✓ SessionStart hook installed (checks ~daily).',
      already: '  Auto-update:  already enabled.',
      invalid: '  Auto-update:  skipped — ~/.claude/settings.json is not valid JSON; add the hook manually.',
      error:   '  Auto-update:  skipped — could not write settings.json; add the hook manually.',
    }[r];
    console.log(msg);
  } else if (wantAuto === true && !isGlobal) {
    console.log('  Auto-update:  only supported for global installs; skipped.');
  }

  console.log('\n  Use it:  open Claude Code in a project and run  /pm-workflow');
  console.log('  Update:  re-run  npx github:AlaskanTuna/pm-workflow#main\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
