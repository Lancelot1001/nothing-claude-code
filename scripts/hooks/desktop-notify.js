'use strict';

/**
 * Stop hook: send native desktop notifications (macOS via osascript,
 * Linux via notify-send, Windows via PowerShell BurntToast).
 */

const { spawn } = require('child_process');
const path = require('path');

const PLATFORM = process.platform;

function notify({ title = 'Claude Code', body = 'Session ended' }) {
  if (PLATFORM === 'darwin') {
    // macOS
    spawn('osascript', ['-e', `display notification "${body}" with title "${title}"`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else if (PLATFORM === 'linux') {
    // Linux (notify-send)
    spawn('notify-send', [title, body], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else if (PLATFORM === 'win32') {
    // Windows (PowerShell BurntToast)
    const script = `
      $params = @{
        Text = "${body}"
        Title = "${title}"
      }
      try {
        BurntToast.Notification @params
      } catch {
        # BurntToast not installed — silent fail
      }
    `;
    spawn('powershell.exe', ['-NoProfile', '-Command', script], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  }
}

function handle(params) {
  const body = params?.session_id
    ? `Session ${params.session_id} ended`
    : 'Session ended';

  notify({ title: 'Claude Code', body });
}

module.exports = { notify, handle };
