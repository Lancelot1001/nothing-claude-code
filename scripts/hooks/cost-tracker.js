'use strict';

/**
 * Stop hook: append session usage metrics to ~/.claude/metrics/costs.jsonl.
 *
 * Runs at the very end of a session (Stop event) to record:
 * - Total tokens used (input + output)
 * - Model used
 * - Session duration
 * - Timestamp
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const METRICS_DIR = path.join(os.homedir(), '.claude/metrics');
const METRICS_FILE = path.join(METRICS_DIR, 'costs.jsonl');

function handle({ session_id, tokens_used, model, session_duration_ms }) {
  fs.mkdirSync(METRICS_DIR, { recursive: true });

  const entry = {
    sessionId: session_id || 'unknown',
    recordedAt: new Date().toISOString(),
    model: model || 'unknown',
    tokensUsed: tokens_used || { input_tokens: 0, output_tokens: 0 },
    sessionDurationMs: session_duration_ms || 0,
    hostname: os.hostname(),
  };

  fs.appendFileSync(METRICS_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

module.exports = { handle };
