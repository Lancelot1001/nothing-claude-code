#!/usr/bin/env python3
"""
Insaits Security Monitor — Python PreToolUse hook.
Detects security anomalies using the insa-its SDK.
"""

import json
import sys
import os

try:
    from insa_its import SecurityMonitor
except ImportError:
    print("[insaits] insa_its SDK not installed — security monitoring disabled", file=sys.stderr)
    sys.exit(0)


def main():
    # Read hook input from stdin
    raw = sys.stdin.read()
    if not raw:
        # No input — allow
        sys.exit(0)

    try:
        params = json.loads(raw)
    except json.JSONDecodeError:
        # Cannot parse — allow
        sys.exit(0)

    tool_name = params.get("tool_name", "")
    tool_input = params.get("tool_input", {})
    session_id = params.get("session_id", "unknown")

    # Skip monitoring for allowed tools
    allowed_tools = {"Read", "Glob", "Grep", "Bash", "WebSearch", "WebFetch"}
    if tool_name in allowed_tools:
        sys.exit(0)

    monitor = SecurityMonitor(session_id=session_id)

    try:
        result = monitor.check(tool_name, tool_input)
        if result and result.get("blocked"):
            print(f"[insaits] BLOCKED: {result.get('reason', 'security policy')}", file=sys.stderr)
            sys.exit(2)  # 2 = block in Claude Code hook protocol
    except Exception as e:
        # Monitoring failed — do not block, just log
        print(f"[insaits] monitoring error: {e}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
