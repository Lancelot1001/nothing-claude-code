'use strict';

/**
 * Shared formatter resolution (Biome / Prettier).
 *
 * Searches the file-system upward from `startDir` for:
 * 1. `biome.json` or `biome.jsonc` → Biome is configured
 * 2. `.prettierrc*` / `prettier.config.*` / `package.json#prettier` → Prettier is configured
 *
 * Caches results per root to avoid repeated filesystem walks.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** @type {Map<string, {formatter: "biome"|"prettier"|null, configPath: string|null}>} */
const _cache = new Map();

function clearCaches() {
  _cache.clear();
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

const BIOME_CONFIGS = ['biome.json', 'biome.jsonc'];
const PRETTIER_CONFIGS = [
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
];

function hasConfig(dir, filenames) {
  return filenames.some(f => fs.existsSync(path.join(dir, f)));
}

function findRoot(startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (hasConfig(dir, [...BIOME_CONFIGS, ...PRETTIER_CONFIGS])) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

/**
 * @param {string} startDir
 * @returns {{formatter: "biome"|"prettier"|null, configPath: string|null}}
 */
function detectFormatter(startDir) {
  const absDir = path.resolve(startDir);

  if (_cache.has(absDir)) {
    return _cache.get(absDir);
  }

  const root = findRoot(absDir);
  if (!root) {
    const result = { formatter: null, configPath: null };
    _cache.set(absDir, result);
    return result;
  }

  for (const f of BIOME_CONFIGS) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      const res = { formatter: 'biome', configPath: p };
      _cache.set(absDir, res);
      return res;
    }
  }

  for (const f of PRETTIER_CONFIGS) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      const res = { formatter: 'prettier', configPath: p };
      _cache.set(absDir, res);
      return res;
    }
  }

  // package.json#prettier
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.prettier) {
        const res = { formatter: 'prettier', configPath: pkgPath };
        _cache.set(absDir, res);
        return res;
      }
    } catch { /* ignore */ }
  }

  const result = { formatter: null, configPath: null };
  _cache.set(absDir, result);
  return result;
}

/**
 * @param {string} formatter "biome" | "prettier"
 * @param {string} startDir
 * @returns {string | null} — absolute path to the formatter binary, or null if not found
 */
function resolveFormatterBin(formatter, startDir) {
  if (formatter === 'biome') {
    // Prefer local node_modules/.bin, then $PATH biome
    const localBiome = path.join(startDir, 'node_modules', '.bin', 'biome');
    if (fs.existsSync(localBiome)) return localBiome;
    return 'biome'; // hope it's on PATH
  }

  if (formatter === 'prettier') {
    const localPrettier = path.join(startDir, 'node_modules', '.bin', 'prettier');
    if (fs.existsSync(localPrettier)) return localPrettier;
    return 'prettier';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  findProjectRoot: findRoot,
  detectFormatter,
  resolveFormatterBin,
  clearCaches,
};
