'use strict';

/**
 * CLI-style dashboard rendering skill health with sparklines / panels.
 */

const { collectSkillHealth } = require('./health');

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the full skill-evolution dashboard.
 *
 * @param {object} options
 * @param {boolean} [options.verbose]
 * @param {string} [options.format] - "text" (default) | "json"
 * @returns {string}
 */
function renderDashboard(options = {}) {
  const { verbose = false, format = 'text' } = options;

  const health = collectSkillHealth();

  if (format === 'json') {
    return JSON.stringify(health, null, 2);
  }

  const lines = [];

  lines.push(renderHeader());
  lines.push('');
  lines.push(renderSummaryPanel(health));
  lines.push('');
  lines.push(renderSuccessRatePanel(health));
  lines.push('');
  lines.push(renderAmendmentPanel(health));

  if (verbose) {
    lines.push('');
    lines.push(renderSkillDetailPanel(health));
  }

  return lines.join('\n');
}

function renderHeader() {
  return '╔══════════════════════════════════════════════════╗\n' +
         '║        Skill Evolution Dashboard                 ║\n' +
         '╚══════════════════════════════════════════════════╝';
}

function renderSummaryPanel(health) {
  const total = health.skills.length;
  const healthy = health.skills.filter(s => s.status === 'healthy').length;
  const degraded = health.skills.filter(s => s.status === 'degraded').length;
  const dead = health.skills.filter(s => s.status === 'dead').length;

  return [
    '┌─ Summary ─────────────────────────────────────┐',
    `│  Total skills  : ${String(total).padEnd(28)}│`,
    `│  Healthy       : ${String(healthy).padEnd(28)}│`,
    `│  Degraded      : ${String(degraded).padEnd(28)}│`,
    `│  Dead          : ${String(dead).padEnd(28)}│`,
    '└──────────────────────────────────────────────┘',
  ].join('\n');
}

function renderSuccessRatePanel(health) {
  const lines = ['┌─ Success Rate (last 30 days) ─────────────────┐'];

  for (const skill of health.skills.slice(0, 10)) {
    const rate = skill.successRate;
    const bar = _sparkline(rate);
    const label = skill.skillId.slice(0, 30).padEnd(30);
    lines.push(`│ ${label} ${bar} ${rate}% │`);
  }

  lines.push('└──────────────────────────────────────────────┘');
  return lines.join('\n');
}

function renderAmendmentPanel(health) {
  const pending = health.skills.filter(s => s.pendingAmendments > 0);

  if (pending.length === 0) {
    return '┌─ Pending Amendments ────────────────────────────┐\n│  No pending amendments                              │\n└──────────────────────────────────────────────┘';
  }

  const lines = ['┌─ Pending Amendments ────────────────────────────┐'];

  for (const skill of pending.slice(0, 5)) {
    const label = skill.skillId.slice(0, 30).padEnd(30);
    lines.push(`│ ${label} ×${skill.pendingAmendments}  │`);
  }

  lines.push('└──────────────────────────────────────────────┘');
  return lines.join('\n');
}

function renderSkillDetailPanel(health) {
  const lines = ['┌─ Skill Detail (verbose) ───────────────────────┐'];

  for (const skill of health.skills) {
    lines.push(`│  ${skill.skillId}`);
    lines.push(`│    status   : ${skill.status}`);
    lines.push(`│    successRate: ${skill.successRate}%`);
    lines.push(`│    totalRuns: ${skill.totalRuns}`);
    lines.push(`│    pendingAmendments: ${skill.pendingAmendments}`);
    lines.push(`│    lastRunAt: ${skill.lastRunAt || 'never'}`);
    lines.push('│');
  }

  lines.push('└──────────────────────────────────────────────┘');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _sparkline(pct, width = 10) {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  renderDashboard,
  renderSuccessRatePanel,
  renderAmendmentPanel,
};
