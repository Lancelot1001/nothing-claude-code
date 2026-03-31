'use strict';

/**
 * PreToolUse + Write hook: block modifications to ESLint / Prettier / Biome / Ruff
 * configuration files.
 *
 * Exit code 2 signals "block this operation" in the Claude Code hook protocol.
 */

const path = require('path');
const fs = require('fs');

const PROTECTED_PATTERNS = [
  /\.eslintrc/,
  /eslint\.config\./,
  /\.prettierrc/,
  /prettier\.config\./,
  /biome\.json/,
  /ruff\.toml/,
  /\.ruffrc/,
];

function isProtected(filePath) {
  if (!filePath) return false;
  const basename = path.basename(filePath);
  return PROTECTED_PATTERNS.some(p => p.test(basename));
}

function handleToolUse({ tool_name, tool_input }) {
  if (tool_name !== 'Write' && tool_name !== 'Edit') return;

  const filePath = tool_input?.file_path || tool_input?.path;
  if (!isProtected(filePath)) return;

  process.stderr.write(
    `[config-protection] BLOCKED: writing to a config file is not permitted.\n` +
    `[config-protection] File: ${filePath}\n` +
    `[config-protection] Modify the config through the project maintainer's preferred workflow.\n`
  );

  process.exit(2);
}

function handleWrite({ file_path }) {
  if (!isProtected(file_path)) return;

  process.stderr.write(
    `[config-protection] BLOCKED: writing to a config file is not permitted.\n` +
    `[config-protection] File: ${file_path}\n`
  );

  process.exit(2);
}

module.exports = { isProtected, handleToolUse, handleWrite };
