'use strict';

/**
 * PostBash hook: log GitHub PR creation and review commands.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PR_LOG = path.join(os.homedir(), '.claude/metrics/prs.jsonl');

const PR_PATTERNS = [
  { regex: /gh pr (create|close|merge)/i, type: 'pr-management' },
  { regex: /gh pr (review|comment)/i, type: 'pr-review' },
  { regex: /gh issue create/i, type: 'issue-creation' },
];

function handle({ command, exit_code }) {
  if (!command) return;

  const matched = PR_PATTERNS.find(p => p.regex.test(command));
  if (!matched) return;

  if (exit_code !== 0) return; // only log successful commands

  const entry = {
    recordedAt: new Date().toISOString(),
    hostname: os.hostname(),
    command: command.slice(0, 200),
    type: matched.type,
    exitCode: exit_code,
  };

  fs.mkdirSync(path.dirname(PR_LOG), { recursive: true });
  fs.appendFileSync(PR_LOG, JSON.stringify(entry) + '\n', 'utf8');
}

module.exports = { handle };
