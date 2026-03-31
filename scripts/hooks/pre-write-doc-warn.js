'use strict';

/**
 * PreWrite hook: warn before writing to ad-hoc doc files outside structured dirs.
 * (same logic as doc-file-warning but fires on Write, not PreToolUse).
 */

const { isAdHocDoc, isInStructuredDir } = require('./doc-file-warning');
const path = require('path');

function handle({ file_path }) {
  if (!file_path) return;
  if (!isAdHocDoc(file_path)) return;
  if (isInStructuredDir(file_path)) return;

  process.stderr.write(
    `[pre-write-doc-warn] Writing ad-hoc doc file outside structured directories.\n` +
    `[pre-write-doc-warn] Consider: docs/, notes/, .claude/\n` +
    `[pre-write-doc-warn] File: ${file_path}\n`
  );
}

module.exports = { handle };
