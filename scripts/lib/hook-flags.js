'use strict';

/**
 * Shared hook enable/disable controls.
 *
 * Profile-based flagging lets entire hook groups be toggled without
 * enumerating every hook ID individually.
 *
 * Two environment variables drive this module:
 *
 * | Variable            | Type   | Default   | Description                               |
 * |---------------------|--------|-----------|-------------------------------------------|
 * | `ECC_HOOK_PROFILE`  | string | `standard`| One of: `minimal`, `standard`, `strict`   |
 * | `ECC_DISABLED_HOOKS`| string | `""`      | Comma-separated hook IDs to disable       |
 *
 * Profile meanings:
 * - **minimal** — only the most conservative checks run (currently: hook-enabled)
 * - **standard** — default ECC safety checks without gratuitous friction
 * - **strict**   — every ECC safety and governance hook fires
 */

const HOOK_PROFILES = {
  minimal: new Set(['check-hook-enabled']),
  standard: new Set([
    'check-hook-enabled',
    'config-protection',
    'session-start',
    'session-end',
    'session-end-marker',
    'pre-compact',
    'suggest-compact',
    'evaluate-session',
    'auto-tmux-dev',
    'pre-bash-dev-server-block',
    'pre-bash-commit-quality',
    'pre-bash-tmux-reminder',
    'pre-bash-git-push-reminder',
    'post-bash-build-complete',
    'post-bash-pr-created',
    'post-edit-format',
    'post-edit-typecheck',
    'post-edit-console-warn',
    'check-console-log',
    'mcp-health-check',
    'governance-capture',
    'pre-write-doc-warn',
    'doc-file-warning',
    'cost-tracker',
    'desktop-notify',
  ]),
  strict: new Set([
    'check-hook-enabled',
    'config-protection',
    'session-start',
    'session-end',
    'session-end-marker',
    'pre-compact',
    'suggest-compact',
    'evaluate-session',
    'auto-tmux-dev',
    'pre-bash-dev-server-block',
    'pre-bash-commit-quality',
    'pre-bash-tmux-reminder',
    'pre-bash-git-push-reminder',
    'post-bash-build-complete',
    'post-bash-pr-created',
    'post-edit-format',
    'post-edit-typecheck',
    'post-edit-console-warn',
    'check-console-log',
    'mcp-health-check',
    'governance-capture',
    'pre-write-doc-warn',
    'doc-file-warning',
    'cost-tracker',
    'desktop-notify',
    'insaits-security-monitor',
    'insaits-security-wrapper',
    'quality-gate',
  ]),
};

// Lazily parsed (available before any hook code runs)
let _disabledHooks = null;  // Set<string>
let _hookProfile = null;    // string

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse ECC_DISABLED_HOOKS once and cache the result. */
function getDisabledHookIds() {
  if (_disabledHooks === null) {
    const raw = process.env['ECC_DISABLED_HOOKS'] || '';
    _disabledHooks = new Set(
      raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    );
  }
  return _disabledHooks;
}

/** Return the active hook profile name, defaulting to 'standard'. */
function getHookProfile() {
  if (_hookProfile === null) {
    _hookProfile = process.env['ECC_HOOK_PROFILE'] || 'standard';
  }
  return _hookProfile;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return `true` if the given hook `id` should fire, `false` if it is
 * disabled by profile or by `ECC_DISABLED_HOOKS`.
 *
 * @param {string} hookId - Canonical hook identifier (without path prefix)
 * @returns {boolean}
 */
function isHookEnabled(hookId) {
  const disabled = getDisabledHookIds();
  if (disabled.has(hookId)) return false;

  const profileName = getHookProfile();
  const allowed = HOOK_PROFILES[profileName];
  if (!allowed) {
    // Unknown profile — allow everything
    return true;
  }
  return allowed.has(hookId);
}

module.exports = {
  isHookEnabled,
  getHookProfile,
  getDisabledHookIds,
};
