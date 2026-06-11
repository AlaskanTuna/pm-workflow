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
  const args = { target: null, path: null, yes: false, check: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--global' || a === '-g') args.target = 'global';
    else if (a === '--project' || a === '-p') args.target = 'project';
    else if (a === '--path') args.path = argv[++i];
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--check') args.check = true;
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
  console.log('  Use it:  open Claude Code in a project and run  /pm-workflow');
  console.log('  Update:  re-run  npx github:AlaskanTuna/pm-workflow#main\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
