'use strict';

/**
 * Validate, read, and write install-state JSON files.
 *
 * ## Install state shape
 *
 * ```json
 * {
 *   "version": "1.0.0",
 *   "mode": "legacy | manifest | legacy-compat",
 *   "installedAt": "ISO-8601",
 *   "tracked": {
 *     "relative/path": { "mtime": 1234567890, "size": 1234 }
 *   }
 * }
 * ```
 *
 * ## Schema validation
 *
 * When `ajv` is available it is used for full JSON-Schema validation.
 * When ajv is absent, a lightweight structural check is applied instead,
 * so this module works in minimal environments without a full dev install.
 */

let Ajv;
try {
  Ajv = require('ajv');
} catch {
  // ajv not installed — use fallback validation
  Ajv = null;
}

// ---------------------------------------------------------------------------
// Schema (used when ajv is available)
// ---------------------------------------------------------------------------

const INSTALL_STATE_SCHEMA = {
  type: 'object',
  required: ['version', 'mode', 'installedAt', 'tracked'],
  properties: {
    version: { type: 'string' },
    mode: { type: 'string', enum: ['legacy', 'manifest', 'legacy-compat'] },
    installedAt: { type: 'string' },
    tracked: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['mtime'],
        properties: {
          mtime: { type: 'number' },
          size: { type: 'number' },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Fallback structural check (no ajv)
// ---------------------------------------------------------------------------

/**
 * @param {unknown} data
 * @returns {boolean}
 */
function _structuralCheck(data) {
  if (typeof data !== 'object' || data === null) return false;
  const obj = /** @type {Record<string, unknown>} */ (data);
  if (typeof obj.version !== 'string') return false;
  if (!['legacy', 'manifest', 'legacy-compat'].includes(obj.mode)) return false;
  if (typeof obj.installedAt !== 'string') return false;
  if (typeof obj.tracked !== 'object' || obj.tracked === null) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * @param {string} statePath
 * @returns {object}
 */
function readInstallState(statePath) {
  const raw = fs.readFileSync(statePath, 'utf8');
  const data = JSON.parse(raw);

  if (Ajv) {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(INSTALL_STATE_SCHEMA);
    if (!validate(data)) {
      const msgs = validate.errors.map(e => `${e.instancePath} ${e.message}`).join('; ');
      throw new Error(`Invalid install state: ${msgs}`);
    }
  } else if (!_structuralCheck(data)) {
    throw new Error('Invalid install state structure');
  }

  return data;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Write an install state file, first validating it.
 *
 * @param {string} statePath
 * @param {object} state
 */
function writeInstallState(statePath, state) {
  if (Ajv) {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(INSTALL_STATE_SCHEMA);
    if (!validate(state)) {
      const msgs = validate.errors.map(e => `${e.instancePath} ${e.message}`).join('; ');
      throw new Error(`Invalid install state: ${msgs}`);
    }
  } else if (!_structuralCheck(state)) {
    throw new Error('Invalid install state structure');
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Create fresh state
// ---------------------------------------------------------------------------

/**
 * @param {object} params
 * @param {string} params.mode
 * @returns {object}
 */
function createInstallState({ mode }) {
  return {
    version: '1.0.0',
    mode,
    installedAt: new Date().toISOString(),
    tracked: {},
  };
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * @param {unknown} data
 * @returns {boolean}
 */
function validateInstallState(data) {
  if (Ajv) {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(INSTALL_STATE_SCHEMA);
    return validate(data);
  }
  return _structuralCheck(data);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  createInstallState,
  readInstallState,
  writeInstallState,
  validateInstallState,
};
