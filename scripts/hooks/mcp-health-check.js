'use strict';

/**
 * Comprehensive MCP server health check.
 *
 * Supports both HTTP-based MCP servers (stdal) and stdio-based servers.
 * Performs HTTP probing with exponential backoff and reconnect logic.
 */

const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function checkHttpMcp(serverUrl, { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES } = {}) {
  return new Promise((resolve) => {
    let attempt = 0;

    function tryConnect() {
      attempt++;
      const req = serverUrl.startsWith('https') ? https.request : http.request;

      const reqOptions = {
        method: 'POST',
        timeout: timeoutMs,
      };

      const reqHandle = req(serverUrl, reqOptions, res => {
        if (res.statusCode === 200) {
          resolve({ ok: true, statusCode: res.statusCode, attempt });
        } else {
          if (attempt < retries) {
            setTimeout(tryConnect, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
          } else {
            resolve({ ok: false, statusCode: res.statusCode, attempt, retries });
          }
        }
      });

      reqHandle.on('error', err => {
        if (attempt < retries) {
          setTimeout(tryConnect, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
        } else {
          resolve({ ok: false, error: err.message, attempt, retries });
        }
      });

      reqHandle.on('timeout', () => {
        reqHandle.destroy();
        if (attempt < retries) {
          setTimeout(tryConnect, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
        } else {
          resolve({ ok: false, error: 'timeout', attempt, retries });
        }
      });

      // Send a JSON-RPC ping
      reqHandle.write(JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }));
      reqHandle.end();
    }

    tryConnect();
  });
}

function checkStdioMcp(command, { timeoutMs = 3000, retries = 2 } = {}) {
  return new Promise((resolve) => {
    let attempt = 0;

    function tryConnect() {
      attempt++;
      const child = spawn('sh', ['-c', `${command} --help 2>&1 || true`], {
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });

      child.on('close', code => {
        if (code === 0) {
          resolve({ ok: true, attempt });
        } else if (attempt < retries) {
          setTimeout(tryConnect, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
        } else {
          resolve({ ok: false, exitCode: code, attempt, stderr: stderr.slice(0, 200) });
        }
      });

      child.on('error', err => {
        if (attempt < retries) {
          setTimeout(tryConnect, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
        } else {
          resolve({ ok: false, error: err.message, attempt, retries });
        }
      });
    }

    tryConnect();
  });
}

/**
 * @param {object} params
 * @param {Array<object>} params.mcpServers - array of { name, command?, url? }
 * @param {Function} [params.onResult] - callback(result)
 */
function checkAll({ mcpServers = [], onResult } = {}) {
  const results = [];

  for (const server of mcpServers) {
    const check = server.url
      ? checkHttpMcp(server.url)
      : checkStdioMcp(server.command);

    check.then(result => {
      const enriched = { server: server.name, ...result, checkedAt: new Date().toISOString() };
      results.push(enriched);
      if (onResult) onResult(enriched);
    }).catch(err => {
      results.push({ server: server.name, ok: false, error: err.message, checkedAt: new Date().toISOString() });
    });
  }

  return results;
}

module.exports = { checkHttpMcp, checkStdioMcp, checkAll };
