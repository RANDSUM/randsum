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
# The token is the `claude-git-pat` item, read with a 1Password service-account
# token: $OP_SERVICE_ACCOUNT_TOKEN when exported (cloud sessions set it as an
# environment variable, scoped to the `Randsum` vault), otherwise the copy
# cached in the macOS login keychain (security -s op-claude-agent, scoped to
# the `claude-agent` vault). Each account sees only its own vault, so both
# references are tried. An already-exported GITHUB_PAT wins, so a machine
# without `op` can still authenticate.
#
# Fails loudly: with no token it exits 1 instead of sending an empty Bearer,
# which looks configured and authenticates as nobody (#1188).
#
# No plaintext secret is ever stored on disk or committed.

set -euo pipefail

op_read() {
  # $1 = op:// secret reference. Empty output on any failure (no `op`, no token).
  # A GUI-launched Claude Code may not have Homebrew on PATH, hence the fallback.
  local op sa_token
  op="$(command -v op || echo /opt/homebrew/bin/op)"
  sa_token="${OP_SERVICE_ACCOUNT_TOKEN:-}"
  if [ -z "$sa_token" ] && command -v security >/dev/null 2>&1; then
    sa_token="$(security find-generic-password -s op-claude-agent -w 2>/dev/null || true)"
  fi
  [ -n "$sa_token" ] || return 0
  OP_SERVICE_ACCOUNT_TOKEN="$sa_token" "$op" read "$1" 2>/dev/null || true
}

case "${CLAUDE_CODE_MCP_SERVER_NAME:-}" in
  github)
    token="${GITHUB_PAT:-}"
    for ref in 'op://Randsum/claude-git-pat/credential' 'op://claude-agent/claude-git-pat/credential'; do
      [ -n "$token" ] || token="$(op_read "$ref")"
    done
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
