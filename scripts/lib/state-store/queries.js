'use strict';

/**
 * Full query API for the ECC state store.
 *
 * Each method returns plain JS objects (not sql.js result rows).
 */

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * @param {object} db - sql.js database handle
 * @returns {object}
 */
function createQueryApi(db) {
  return {
    sessions: _createSessionQueries(db),
    skillRuns: _createSkillRunQueries(db),
    skillVersions: _createSkillVersionQueries(db),
    installState: _createInstallStateQueries(db),
    governance: _createGovernanceQueries(db),
  };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function _createSessionQueries(db) {
  return {
    insert(session) {
      const id = session.id || _uuid();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO sessions (id, session_id, started_at, ended_at, hostname, terminal, outcome, agent_id, cwd, command_count, tool_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        session.sessionId || id,
        session.startedAt || now,
        session.endedAt || null,
        session.hostname || null,
        session.terminal || null,
        session.outcome || null,
        session.agentId || null,
        session.cwd || null,
        session.commandCount || 0,
        session.toolCount || 0,
        now,
      ]);
      return id;
    },

    findBySessionId(sessionId) {
      const result = db.exec('SELECT * FROM sessions WHERE session_id = ?', [sessionId]);
      return result.length > 0 ? _rowToObject(result[0].columns, result[0].values[0]) : null;
    },

    listRecent(limit = 20) {
      const result = db.exec(`SELECT * FROM sessions ORDER BY started_at DESC LIMIT ${Number(limit)}`);
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },

    updateOutcome(sessionId, outcome) {
      db.run('UPDATE sessions SET outcome = ?, ended_at = ? WHERE session_id = ?', [
        outcome,
        new Date().toISOString(),
        sessionId,
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Skill runs
// ---------------------------------------------------------------------------

function _createSkillRunQueries(db) {
  return {
    insert(run) {
      const id = run.id || _uuid();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO skill_runs (id, skill_id, skill_dir, run_id, outcome, started_at, ended_at, duration_ms, error_class, error_msg, hostname, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        run.skillId,
        run.skillDir,
        run.runId || id,
        run.outcome,
        run.startedAt || now,
        run.endedAt || now,
        run.durationMs || 0,
        run.errorClass || null,
        run.errorMessage || null,
        run.hostname || null,
        now,
      ]);
      return id;
    },

    findByRunId(runId) {
      const result = db.exec('SELECT * FROM skill_runs WHERE run_id = ?', [runId]);
      return result.length > 0 ? _rowToObject(result[0].columns, result[0].values[0]) : null;
    },

    listBySkillId(skillId, limit = 50) {
      const result = db.exec(`SELECT * FROM skill_runs WHERE skill_id = ? ORDER BY started_at DESC LIMIT ${Number(limit)}`, [skillId]);
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },
  };
}

// ---------------------------------------------------------------------------
// Skill versions
// ---------------------------------------------------------------------------

function _createSkillVersionQueries(db) {
  return {
    insert(version) {
      const id = version.id || _uuid();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO skill_versions (id, skill_id, skill_dir, version_id, label, snapshot_path, created_at, created_by, hostname)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        version.skillId,
        version.skillDir,
        version.versionId || id,
        version.label || null,
        version.snapshotPath || null,
        now,
        version.createdBy || null,
        version.hostname || null,
      ]);
      return id;
    },

    listBySkillId(skillId) {
      const result = db.exec('SELECT * FROM skill_versions WHERE skill_id = ? ORDER BY created_at DESC', [skillId]);
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },
  };
}

// ---------------------------------------------------------------------------
// Install state
// ---------------------------------------------------------------------------

function _createInstallStateQueries(db) {
  return {
    insert(state) {
      const id = state.id || _uuid();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO install_state (id, target, mode, installed_at, state_path, tracked_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        state.target,
        state.mode,
        state.installedAt || now,
        state.statePath || null,
        state.trackedCount || 0,
        now,
      ]);
      return id;
    },

    findByTarget(target) {
      const result = db.exec('SELECT * FROM install_state WHERE target = ? ORDER BY created_at DESC LIMIT 1', [target]);
      return result.length > 0 ? _rowToObject(result[0].columns, result[0].values[0]) : null;
    },

    listAll() {
      const result = db.exec('SELECT * FROM install_state ORDER BY created_at DESC');
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },
  };
}

// ---------------------------------------------------------------------------
// Governance
// ---------------------------------------------------------------------------

function _createGovernanceQueries(db) {
  return {
    insert(event) {
      const id = event.id || _uuid();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO governance_events (id, session_id, event_at, event_type, severity, description, actor, target, decision_id, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        event.sessionId || null,
        event.eventAt || now,
        event.eventType,
        event.severity || null,
        event.description || null,
        event.actor || null,
        event.target || null,
        event.decisionId || null,
        event.metadataJson ? JSON.stringify(event.metadataJson) : null,
        now,
      ]);
      return id;
    },

    listRecent(limit = 100) {
      const result = db.exec(`SELECT * FROM governance_events ORDER BY event_at DESC LIMIT ${Number(limit)}`);
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },

    listBySessionId(sessionId) {
      const result = db.exec('SELECT * FROM governance_events WHERE session_id = ? ORDER BY event_at DESC', [sessionId]);
      if (!result.length) return [];
      return result[0].values.map(row => _rowToObject(result[0].columns, row));
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _uuid() {
  return crypto.randomUUID();
}

function _rowToObject(columns, values) {
  const obj = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = values[i];
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = { createQueryApi };
