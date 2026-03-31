'use strict';

/**
 * PostBash hook: log build completion.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const BUILD_LOG = path.join(os.homedir(), '.claude/metrics/builds.jsonl');

const BUILD_SUCCESS_PATTERNS = [
  /build succeeded/i,
  /✓ built/i,
  /build complete/i,
  /Compilation successful/i,
];

const BUILD_FAILURE_PATTERNS = [
  /build failed/i,
  /✗ build/i,
  /build error/i,
  /Compilation failed/i,
];

function handle({ command, exit_code, stdout, stderr }) {
  const combined = `${stdout}\n${stderr}`;
  let outcome = 'unknown';

  if (BUILD_SUCCESS_PATTERNS.some(p => p.test(combined))) outcome = 'success';
  else if (BUILD_FAILURE_PATTERNS.some(p => p.test(combined))) outcome = 'failure';

  if (outcome === 'unknown' && command) {
    // Infer from exit code
    if (exit_code === 0) outcome = 'success';
    else if (exit_code !== null && exit_code !== undefined) outcome = 'failure';
  }

  if (outcome === 'unknown') return; // not a build command

  const entry = {
    recordedAt: new Date().toISOString(),
    hostname: os.hostname(),
    command: command ? command.slice(0, 120) : null,
    outcome,
    exitCode: exit_code,
  };

  fs.mkdirSync(path.dirname(BUILD_LOG), { recursive: true });
  fs.appendFileSync(BUILD_LOG, JSON.stringify(entry) + '\n', 'utf8');
}

module.exports = { handle };
