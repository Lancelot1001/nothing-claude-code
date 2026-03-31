'use strict';

/**
 * Track skill provenance metadata.
 *
 * Stores a `PROVENANCE` file next to each skill's `SKILL.md` that records
 * where the skill came from, who created it, and how it has evolved.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVENANCE_FILENAME = 'PROVENANCE.json';

const SKILL_TYPES = {
  CURATED: 'curated',        // Written by hand for this repo
  DERIVED: 'derived',         // Forked and modified from another skill
  GENERATED: 'generated',    // Produced by an LLM or automated tool
  IMPORTED: 'imported',       // Pulled in from external source
  LEARNED: 'learned',         // Discovered / accumulated during sessions
};

const SKILL_TYPE_LABELS = {
  [SKILL_TYPES.CURATED]:  'Curated — hand-written for this repo',
  [SKILL_TYPES.DERIVED]:  'Derived — forked and modified from another skill',
  [SKILL_TYPES.GENERATED]: 'Generated — produced by an LLM or automated tool',
  [SKILL_TYPES.IMPORTED]: 'Imported — pulled in from an external source',
  [SKILL_TYPES.LEARNED]:  'Learned — accumulated during Claude Code sessions',
};

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/**
 * @param {string} skillDir
 * @returns {object | null}
 */
function readProvenance(skillDir) {
  const p = path.join(skillDir, PROVENANCE_FILENAME);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} skillDir
 * @param {object} provenance
 */
function writeProvenance(skillDir, provenance) {
  const p = path.join(skillDir, PROVENANCE_FILENAME);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(provenance, null, 2), 'utf8');
}

/**
 * Classify a skill path into one of the SKILL_TYPES.
 *
 * @param {string} skillPath - absolute path to a skill directory
 * @returns {string}
 */
function classifySkillPath(skillPath) {
  // Inferred type from path structure
  if (skillPath.includes('/learned/') || skillPath.includes('\\learned\\')) {
    return SKILL_TYPES.LEARNED;
  }
  if (skillPath.includes('/imported/') || skillPath.includes('\\imported\\')) {
    return SKILL_TYPES.IMPORTED;
  }

  const prov = readProvenance(skillPath);
  if (prov && prov.type) return prov.type;

  return SKILL_TYPES.CURATED; // default
}

// ---------------------------------------------------------------------------
// Bootstrap provenance
// ---------------------------------------------------------------------------

/**
 * Create an initial provenance record for a new skill.
 *
 * @param {object} params
 * @param {string} params.skillId
 * @param {string} params.skillDir
 * @param {string} [params.author] - defaults to $USER or $USERNAME or "unknown"
 * @param {string} [params.type] - one of SKILL_TYPES values
 * @returns {object}
 */
function bootstrapProvenance({ skillId, skillDir, author, type = SKILL_TYPES.CURATED }) {
  const machineHostname = os.hostname();
  const user = author || process.env.USER || process.env.USERNAME || 'unknown';

  const provenance = {
    version: '1.0.0',
    skillId,
    type,
    createdAt: new Date().toISOString(),
    createdBy: user,
    createdOn: machineHostname,
    source: null,           // set for DERIVED / IMPORTED
    amendmentCount: 0,
    evolutionLog: [
      { event: 'created', at: new Date().toISOString(), by: user, on: machineHostname },
    ],
  };

  writeProvenance(skillDir, provenance);
  return provenance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  readProvenance,
  writeProvenance,
  classifySkillPath,
  bootstrapProvenance,
  SKILL_TYPES,
  SKILL_TYPE_LABELS,
};
