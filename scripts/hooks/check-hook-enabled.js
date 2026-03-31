'use strict';

/**
 * Checks whether a hook is enabled for the current profile before it fires.
 *
 * Load BEFORE any other hook logic so that disabled hooks exit as early as possible.
 */

const { isHookEnabled, getHookProfile } = require('../lib/hook-flags');

/**
 * @param {object} params
 * @param {string} params.hookId - the hook's canonical id (from hooks.json entry)
 */
function check({ hookId }) {
  if (!isHookEnabled(hookId)) {
    process.stderr.write(`[check-hook-enabled] Skipping disabled hook: ${hookId} (profile: ${getHookProfile()})\n`);
    process.exit(0);
  }
}

module.exports = { check };
