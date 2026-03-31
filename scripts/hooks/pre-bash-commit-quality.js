'use strict';

/**
 * PreBash hook: enforce commit quality gate.
 *
 * Intercepts `git commit` commands and checks:
 * - Commit message is not empty
 * - Commit message matches conventional commits format (if configured)
 * - No large files are being committed (warn if > 5MB)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const CONVENTIONAL_COMMITS_PATTERN = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?!?: .+/;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function handle({ command }) {
  if (!command) return;
  if (!command.includes('git commit')) return;

  const trimmed = command.trim();

  // Extract commit message (handle -m flag)
  const msgMatch = trimmed.match(/git commit(?:\s+-[am]| --message=|-m\s+)['"](.+)['"]/);
  const commitMsg = msgMatch ? msgMatch[1] : null;

  if (!commitMsg) {
    process.stderr.write('[pre-bash-commit-quality] No commit message provided. Use -m "message"\n');
    process.exit(1);
  }

  if (commitMsg.length < 10) {
    process.stderr.write('[pre-bash-commit-quality] Commit message too short (min 10 chars)\n');
    process.exit(1);
  }

  // Check conventional commits if conventional-commits config is present
  const eccRoot = process.env['ECC_ROOT'] || process.cwd();
  const ccConfig = path.join(eccRoot, '.ecc-conventional-commits');
  if (fs.existsSync(ccConfig)) {
    if (!CONVENTIONAL_COMMITS_PATTERN.test(commitMsg)) {
      process.stderr.write(
        '[pre-bash-commit-quality] Commit message does not follow conventional commits format.\n' +
        '[pre-bash-commit-quality] Format: type(scope): description\n' +
        '[pre-bash-commit-quality] Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert\n'
      );
      process.exit(1);
    }
  }

  // Check staged file sizes
  try {
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      timeout: 5000,
    }).trim().split('\n').filter(Boolean);

    let hasOversize = false;
    for (const file of stagedFiles) {
      try {
        const stat = execSync(`git ls-files -s ${file}`, { encoding: 'utf8', timeout: 3000 });
        const size = parseInt(stat.split('\t')[0], 10) * 4; // approximate uncompressed size
        if (size > MAX_FILE_SIZE_BYTES) {
          process.stderr.write(`[pre-bash-commit-quality] WARNING: ${file} is ${(size / 1024 / 1024).toFixed(1)}MB (> 5MB limit)\n`);
          hasOversize = true;
        }
      } catch { /* ignore */ }
    }

    if (hasOversize) {
      process.stderr.write('[pre-bash-commit-quality] Consider using git-lfs for large files.\n');
    }
  } catch { /* ignore git errors */ }
}

module.exports = { handle };
