'use strict';

/**
 * Parse CLI args and normalise install requests.
 */

const LEGACY_INSTALL_TARGETS = [
  'claude-home',
  'codex-home',
  'opencode-home',
  'cursor-project',
  'antigravity-project',
];

const VALID_PROFILES = ['core', 'developer', 'security', 'research', 'full'];

/**
 * @param {string[]} [args] - defaults to process.argv.slice(2)
 * @returns {{ target?: string, profile?: string, mode: string, dryRun: boolean, force: boolean }}
 */
function parseInstallArgs(args) {
  const argv = args || process.argv.slice(2);

  /** @type {object} */
  const request = { mode: 'legacy', dryRun: false, force: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run' || arg === '-n') {
      request.dryRun = true;
      continue;
    }

    if (arg === '--force' || arg === '-f') {
      request.force = true;
      continue;
    }

    if (arg === '--manifest' || arg === '--profile') {
      request.mode = 'manifest';
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        request.profile = argv[++i];
      }
      continue;
    }

    if (arg === '--target' || arg === '-t') {
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        request.target = argv[++i];
      }
      continue;
    }

    if (!arg.startsWith('-')) {
      if (LEGACY_INSTALL_TARGETS.includes(arg)) {
        request.target = arg;
        request.mode = 'legacy';
      } else if (VALID_PROFILES.includes(arg)) {
        request.profile = arg;
        request.mode = 'manifest';
      }
    }
  }

  return request;
}

/**
 * Normalise an install request to a canonical form.
 *
 * @param {object} raw
 * @returns {{ target: string | null, profile: string | null, mode: string, dryRun: boolean, force: boolean }}
 */
function normalizeInstallRequest(raw) {
  const mode = raw.mode || (raw.profile ? 'manifest' : 'legacy');

  if (mode === 'manifest') {
    const profile = raw.profile || 'core';
    if (!VALID_PROFILES.includes(profile)) {
      throw new Error(`Invalid profile "${profile}". Valid: ${VALID_PROFILES.join(', ')}`);
    }
    return { target: null, profile, mode: 'manifest', dryRun: !!raw.dryRun, force: !!raw.force };
  }

  // Legacy
  const target = raw.target || 'claude-home';
  if (!LEGACY_INSTALL_TARGETS.includes(target)) {
    throw new Error(`Invalid target "${target}". Valid: ${LEGACY_INSTALL_TARGETS.join(', ')}`);
  }
  return { target, profile: null, mode: 'legacy', dryRun: !!raw.dryRun, force: !!raw.force };
}

module.exports = {
  parseInstallArgs,
  normalizeInstallRequest,
  LEGACY_INSTALL_TARGETS,
  VALID_PROFILES,
};
