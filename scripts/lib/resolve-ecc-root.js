'use strict';

/**
 * Resolve the ECC source root from:
 *
 * 1. `CLAUDE_PLUGIN_ROOT` environment variable (explicit override, highest priority)
 * 2. Standard install: `{repoRoot}/scripts/lib/` → `{repoRoot}`
 * 3. Legacy plugin cache: `~/.claude/plugins/everything-claude-code/scripts/lib/` → plugin root
 * 4. Inline / embedded mode: caller is inside `scripts/lib/` and `repoRoot` is one level up
 *
 * Returns `null` if no valid ECC root is found.
 *
 * ## Inline resolve
 *
 * For hot-path callers that need the root synchronously without requiring
 * the full module-graph (which can trigger circular requires), the
 * `INLINE_RESOLVE` constant below contains a minimal inline implementation.
 * This is used by `hook-flags.js` to avoid the circular require problem.
 *
 * @returns {string | null}
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Inline resolve — works without requiring any other modules.
 * Mirrors the logic below but without the heavyweight helpers.
 *
 * @type {string | null}
 */
const INLINE_RESOLVE = (() => {
  // 1. Explicit override
  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  if (pluginRoot && fs.existsSync(pluginRoot)) {
    return pluginRoot;
  }

  // 2. Standard install: lib/ is one level below repoRoot
  const standard = path.join(__dirname, '../..');
  if (fs.existsSync(path.join(standard, 'package.json'))) {
    return standard;
  }

  // 3. Legacy plugin cache
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const legacy = path.join(home, '.claude/plugins/everything-claude-code');
    if (fs.existsSync(path.join(legacy, 'package.json'))) {
      return legacy;
    }
  }

  return null;
})();

// ---------------------------------------------------------------------------
// Full resolve (uses other lib modules)
// ---------------------------------------------------------------------------

function resolveEccRoot() {
  if (INLINE_RESOLVE) return INLINE_RESOLVE;

  // Fallback (should rarely be needed if INLINE_RESOLVE is set correctly)
  const standard = path.join(__dirname, '../..');
  if (fs.existsSync(path.join(standard, 'package.json'))) {
    return standard;
  }

  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const legacy = path.join(home, '.claude/plugins/everything-claude-code');
    if (fs.existsSync(path.join(legacy, 'package.json'))) {
      return legacy;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = { resolveEccRoot, INLINE_RESOLVE };
