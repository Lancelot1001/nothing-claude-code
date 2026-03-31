'use strict';

/**
 * PreToolUse + PostToolUse hook: detect secrets, policy violations,
 * and approval requests, recording governance events.
 *
 * Fires for every tool invocation and captures:
 * - Secret/intent detection (e.g. hardcoded API keys, passwords)
 * - Permission elevation requests
 * - Policy violations flagged by the session
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GOVERNANCE_DIR = path.join(os.homedir(), '.claude/governance');

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----/,
  /(?i)\b(api[_-]?key|secret|password|token)\b\s*[:=]\s*['"][^'"]{8,}['"]/,
];

function detectSecrets(text) {
  if (!text) return [];
  return SECRET_PATTERNS.filter(p => p.test(text))
    .map(p => p.toString());
}

function recordGovernanceEvent(event) {
  fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });

  const eventFile = path.join(GOVERNANCE_DIR, 'events.jsonl');
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    recordedAt: new Date().toISOString(),
    hostname: os.hostname(),
    ...event,
  };

  fs.appendFileSync(eventFile, JSON.stringify(entry) + '\n', 'utf8');
}

function handlePreToolUse({ tool_name, tool_input }) {
  // Check tool inputs for secrets
  const inputStr = JSON.stringify(tool_input || {});
  const found = detectSecrets(inputStr);

  if (found.length > 0) {
    recordGovernanceEvent({
      eventType: 'secret-detected',
      severity: 'high',
      tool: tool_name,
      description: `Potential secret pattern detected in ${tool_name} input`,
      actor: process.env.USER || 'unknown',
      target: tool_input?.file_path || null,
    });
  }

  // Detect permission elevation
  if (tool_name === 'Bash' && tool_input?.command) {
    const cmd = tool_input.command;
    if (/sudo|chmod 777|apt-get install|kubernetes/.test(cmd)) {
      recordGovernanceEvent({
        eventType: 'privilege-escalation',
        severity: 'medium',
        description: `Privileged command: ${cmd.slice(0, 80)}`,
        actor: process.env.USER || 'unknown',
      });
    }
  }
}

function handlePostToolUse({ tool_name, tool_output }) {
  // Detect approval requests in PostToolUse output
  if (tool_output && tool_output.content) {
    const contentStr = typeof tool_output.content === 'string'
      ? tool_output.content
      : JSON.stringify(tool_output.content);

    if (/approval|confirm|proceed\?|wait for/i.test(contentStr)) {
      recordGovernanceEvent({
        eventType: 'approval-request',
        severity: 'low',
        tool: tool_name,
        description: 'Tool output contains approval request',
      });
    }
  }
}

module.exports = { detectSecrets, recordGovernanceEvent, handlePreToolUse, handlePostToolUse };
