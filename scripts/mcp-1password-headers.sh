#!/usr/bin/env bash
#
# mcp-1password-headers.sh — resolve the auth header for the github MCP server.
#
# Wired into .mcp.json as the server's `headersHelper`, by a path relative to
# the repo root: Claude Code runs a project helper in the declaring project
# directory, and does not set $CLAUDE_PROJECT_DIR for it. It passes the server
# name in $CLAUDE_CODE_MCP_SERVER_NAME and reads a JSON header object from
# stdout.
#
# The token lives in the 1Password `claude-agent` vault, read via the
# service-account token cached in the macOS login keychain
# (security -s op-claude-agent). An already-exported GITHUB_PAT wins, so a
# machine without `op` can still authenticate.
#
# Fails loudly: with no token it exits 1 instead of sending an empty Bearer,
# which looks configured and authenticates as nobody (#1188).
#
# No plaintext secret is ever stored on disk or committed.

set -euo pipefail

op_read() {
  # $1 = op:// secret reference. Empty output on any failure (no `op`, no token).
  # A GUI-launched Claude Code may not have Homebrew on PATH, hence the fallback.
  local op
  op="$(command -v op || echo /opt/homebrew/bin/op)"
  OP_SERVICE_ACCOUNT_TOKEN="$(security find-generic-password -s op-claude-agent -w 2>/dev/null)" \
    "$op" read "$1" 2>/dev/null || true
}

case "${CLAUDE_CODE_MCP_SERVER_NAME:-}" in
  github)
    token="${GITHUB_PAT:-}"
    [ -n "$token" ] || token="$(op_read 'op://claude-agent/claude-git-pat/credential')"
    if [ -z "$token" ]; then
      echo 'github: no GITHUB_PAT and op read failed' >&2
      exit 1
    fi
    printf '{"Authorization":"Bearer %s"}' "$token"
    ;;
  *)
    printf '{}'
    ;;
esac
