'use strict';

/**
 * PostToolUse hook: warn if a JS/TS file was edited and console.log
 * statements were introduced.
 *
 * Fires after Edit and Write tools targeting *.js / *.ts / *.jsx / *.tsx files.
 * Logs a warning but never blocks the operation.
 */

const path = require('path');

const CONSOLE_LOG_RE = /console\.(log|debug|info|warn|error)\s*\(/g;

function handle({ input, output }) {
  const filePath = input.file_path || input.target?.file_path;
  if (!filePath) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) return;

  if (!output || !output.content) return;

  const matches = [];
  for (const line of output.content.split('\n')) {
    if (CONSOLE_LOG_RE.test(line)) {
      matches.push(line.trim());
    }
  }

  if (matches.length > 0) {
    process.stderr.write(`[check-console-log] WARNING: console.* call(s) found in ${path.basename(filePath)}:\n`);
    for (const m of matches.slice(0, 5)) {
      process.stderr.write(`  ${m}\n`);
    }
  }
}

module.exports = { handle };
