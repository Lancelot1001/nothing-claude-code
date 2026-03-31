'use strict';

/**
 * JSON Schema validation for state store entities.
 */

const SCHEMAS = {
  session: {
    type: 'object',
    required: ['sessionId', 'startedAt'],
    properties: {
      sessionId: { type: 'string', minLength: 1 },
      startedAt: { type: 'string', format: 'date-time' },
      endedAt: { type: ['string', 'null'], format: 'date-time' },
      hostname: { type: 'string' },
      terminal: { type: 'string' },
      outcome: { type: ['string', 'null'] },
      agentId: { type: ['string', 'null'] },
      cwd: { type: ['string', 'null'] },
      commandCount: { type: 'integer', minimum: 0 },
      toolCount: { type: 'integer', minimum: 0 },
    },
  },

  skillRun: {
    type: 'object',
    required: ['skillId', 'skillDir', 'runId', 'outcome', 'startedAt'],
    properties: {
      skillId: { type: 'string', minLength: 1 },
      skillDir: { type: 'string', minLength: 1 },
      runId: { type: 'string', minLength: 1 },
      outcome: { type: 'string', enum: ['success', 'failure', 'partial'] },
      startedAt: { type: 'string', format: 'date-time' },
      endedAt: { type: 'string', format: 'date-time' },
      durationMs: { type: 'integer', minimum: 0 },
      errorClass: { type: ['string', 'null'] },
      errorMessage: { type: ['string', 'null'] },
      hostname: { type: 'string' },
    },
  },

  governanceEvent: {
    type: 'object',
    required: ['eventType', 'eventAt'],
    properties: {
      sessionId: { type: ['string', 'null'] },
      eventAt: { type: 'string', format: 'date-time' },
      eventType: { type: 'string', minLength: 1 },
      severity: { type: ['string', 'null'] },
      description: { type: ['string', 'null'] },
      actor: { type: ['string', 'null'] },
      target: { type: ['string', 'null'] },
      decisionId: { type: ['string', 'null'] },
      metadataJson: { type: ['object', 'null'] },
    },
  },
};

let Ajv;
try {
  Ajv = require('ajv');
} catch {
  Ajv = null;
}

/**
 * @param {string} entityName - "session" | "skillRun" | "governanceEvent"
 * @param {object} data
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
function validateEntity(entityName, data) {
  const schema = SCHEMAS[entityName];
  if (!schema) return { valid: false, errors: [`Unknown entity: ${entityName}`] };

  if (!Ajv) {
    // Fallback: basic structural check
    const required = schema.required || [];
    const missing = required.filter(k => !(k in data));
    return { valid: missing.length === 0, errors: missing.map(k => `missing required: ${k}`) };
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(data);

  return {
    valid: !!valid,
    errors: valid ? [] : validate.errors.map(e => `${e.instancePath} ${e.message}`),
  };
}

/**
 * Assert that `data` is valid for `entityName`. Throws on failure.
 *
 * @param {string} entityName
 * @param {object} data
 */
function assertValidEntity(entityName, data) {
  const result = validateEntity(entityName, data);
  if (!result.valid) {
    throw new Error(`Invalid ${entityName}: ${result.errors.join('; ')}`);
  }
}

module.exports = {
  validateEntity,
  assertValidEntity,
};
