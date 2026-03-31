#!/usr/bin/env bash
# Shell wrapper for run-with-flags.js
# Provides ECC_DISABLED_HOOKS and ECC_HOOK_PROFILE to the Node.js script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXECFILE="${1:-}"
shift

if [[ -z "$EXECFILE" ]]; then
  echo "Usage: run-with-flags-shell.sh <exec-file> [args...]" >&2
  exit 1
fi

ECC_DISABLED_HOOKS="${ECC_DISABLED_HOOKS:-}" \
ECC_HOOK_PROFILE="${ECC_HOOK_PROFILE:-standard}" \
node "$SCRIPT_DIR/run-with-flags.js" "$EXECFILE" "$@"
