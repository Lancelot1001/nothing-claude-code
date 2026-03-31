/**
 * Compress agent markdown files to catalog/summary entries for LLM context windows.
 *
 * ## Catalog format
 *
 * Each agent entry is a single paragraph containing:
 * - `// {name}` — header comment (always first, used by `loadAgents`)
 * - `description` — first non-empty line of the original file (without leading comment chars)
 * - `model` — frontmatter `model` value
 * - `tools` — frontmatter `tools` array (always `["claude"]` in this repo)
 * - `last modified` — mtime of the original file
 *
 * Catalog entries are never removed; dead agents accumulate with
 * `status: missing` so废墟 archaeology remains possible.
 *
 * ## Lazy loading
 *
 * The catalog is a global singleton. Call `buildAgentCatalog()` to (re)scan
 * the agents directory. After that, `lazyLoadAgent(name)` returns the full
 * markdown text on demand — callers that only need metadata should read the
 * catalog and avoid loading any `.md` files.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** @type {Map<string, {summary: string, lastModified: number, filePath: string}>} */
const _catalog = new Map();

const AGENTS_DIR = path.join(__dirname, '../../agents');

// ---------------------------------------------------------------------------
// Frontmatter helpers
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from agent markdown.
 * Returns `{key: value}` map or `null` when no frontmatter block is present.
 *
 * Supports:
 * - `key: value` lines
 * - List values `key: [a, b, c]` (single-line array notation)
 * - Block scalars `key: |` / `key: >` (first line only, no body parsing)
 *
 * Excludes the leading `---` / closing `---` lines themselves.
 */
function parseFrontmatter(rawText) {
  // Strip UTF-8 BOM to avoid corrupting YAML parsing on Windows-created files
  const text = rawText.replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  /** @type {Record<string, string>} */
  const result = {};

  for (const line of match[1].split(/\r?\n/)) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Block scalars: capture first line, discard body
    const blockMatch = line.match(/^(\w+):\s*[>|]/);
    if (blockMatch) {
      result[blockMatch[1]] = blockMatch[0];
      continue;
    }

    // Inline arrays: `key: [a, b, c]`
    const arrMatch = line.match(/^(\w+):\s*\[(.+)\]\s*$/);
    if (arrMatch) {
      result[arrMatch[1]] = arrMatch[2]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      continue;
    }

    // `key: value`
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      result[kvMatch[1]] = kvMatch[2].trim();
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Agent metadata extraction
// ---------------------------------------------------------------------------

/**
 * Extract a short description from agent markdown.
 * Returns the first non-empty, non-frontmatter, non-comment line.
 */
function _extractDescription(lines) {
  let found = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') {
      if (trimmed === '---') {
        if (!found) {
          found = true; // start reading after frontmatter
        } else {
          break; // end of frontmatter
        }
      }
      continue; // skip empty lines
    }
    if (trimmed.startsWith('//')) continue;   // skip comment lines
    if (trimmed.startsWith('#')) continue;     // skip markdown headings
    return trimmed;
  }
  return '';
}

/**
 * Build the agent catalog map.
 *
 * Scans `AGENTS_DIR` for `*.md` files and builds a summary entry for each
 * one. Files that cannot be read are recorded with `status: missing`.
 *
 * @returns {Map<string, {summary: string, lastModified: number, filePath: string, status?: string}>}
 */
function buildAgentCatalog() {
  _catalog.clear();

  if (!fs.existsSync(AGENTS_DIR)) {
    return _catalog; // empty
  }

  const entries = fs.readdirSync(AGENTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const filePath = path.join(AGENTS_DIR, entry.name);
    const name = entry.name.replace(/\.md$/, '');

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      _catalog.set(name, { summary: '', lastModified: 0, filePath, status: 'missing' });
      continue;
    }

    let rawText;
    try {
      rawText = fs.readFileSync(filePath, 'utf8');
    } catch {
      _catalog.set(name, { summary: '', lastModified: stat.mtimeMs, filePath, status: 'missing' });
      continue;
    }

    const fm = parseFrontmatter(rawText);
    const lines = rawText.split(/\r?\n/);
    const description = _extractDescription(lines);
    const model = fm && fm.model ? fm.model : '';
    const tools = fm && fm.tools ? fm.tools : [];

    _catalog.set(name, {
      summary: description,
      model,
      tools,
      lastModified: stat.mtimeMs,
      filePath,
    });
  }

  return _catalog;
}

/**
 * Load every agent file in the catalog and return a list of full texts.
 * Skips agents with `status: missing`.
 *
 * @returns {Array<{name: string, text: string, model: string, tools: string[]}>}
 */
function loadAgents() {
  const agents = [];

  for (const [name, meta] of _catalog.entries()) {
    if (meta.status === 'missing') continue;

    let text;
    try {
      text = fs.readFileSync(meta.filePath, 'utf8');
    } catch {
      continue;
    }

    agents.push({
      name,
      text,
      model: meta.model || '',
      tools: meta.tools || [],
    });
  }

  return agents;
}

/**
 * Lazily load the full markdown text for a named agent.
 *
 * Throws if the agent is not found or cannot be read.
 *
 * @param {string} name - Agent name (without `.md`)
 * @returns {string}
 */
function lazyLoadAgent(name) {
  const meta = _catalog.get(name);
  if (!meta) {
    throw new Error(`agent "${name}" not found in catalog (did you call buildAgentCatalog first?)`);
  }
  if (meta.status === 'missing') {
    throw new Error(`agent "${name}" is marked as missing from the catalog`);
  }

  return fs.readFileSync(meta.filePath, 'utf8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  buildAgentCatalog,
  loadAgents,
  lazyLoadAgent,
  parseFrontmatter,
};
