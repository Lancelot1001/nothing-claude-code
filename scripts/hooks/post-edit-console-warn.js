'use strict';

/**
 * PostToolUse + Edit hook: warn about console.log statements with line numbers.
 *
 * Runs after Edit operations targeting JS/TS files.
 */

const path = require('path');

const CONSOLE_LOG_RE = /console\.(log|debug|info|warn|error)\s*\(/;

function handle({ input, output }) {
  const filePath = input?.file_path;
  if (!filePath) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) return;

  const edits = output?.content || '';
  const lines = edits.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (CONSOLE_LOG_RE.test(lines[i])) {
      process.stderr.write(
        `[post-edit-console-warn] ${path.basename(filePath)}:${i + 1} — console.* statement found\n`
      );
    }
  }
}

module.exports = { handle };
