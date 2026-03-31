'use strict';

/**
 * PreToolUse + Write hook: warn when creating ad-hoc doc filenames
 * (NOTES, TODO, SCRATCH, etc.) outside structured directories.
 *
 * Does not block — only warns.
 */

const path = require('path');

const AD_HOC_PATTERNS = [
  /^NOTES/i,
  /^TODO/i,
  /^SCRATCH/i,
  /^TEMP/i,
  /^TMP/i,
  /^DRAFT/i,
  /^WIP/i,
];

const STRUCTURED_DIRS = [
  'docs/',
  'documents/',
  'notes/',
  '.claude/',
];

function isAdHocDoc(filePath) {
  const basename = path.basename(filePath);
  return AD_HOC_PATTERNS.some(p => p.test(basename));
}

function isInStructuredDir(filePath) {
  return STRUCTURED_DIRS.some(d => filePath.includes(d));
}

function handleWrite({ file_path }) {
  if (!file_path) return;
  if (!isAdHocDoc(file_path)) return;
  if (isInStructuredDir(file_path)) return;

  process.stderr.write(
    `[doc-file-warning] Creating ad-hoc doc file outside structured directories.\n` +
    `[doc-file-warning] Consider moving to docs/, notes/, or .claude/ instead.\n` +
    `[doc-file-warning] File: ${file_path}\n`
  );
}

module.exports = { isAdHocDoc, handleWrite };
