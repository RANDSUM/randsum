#!/usr/bin/env bash
#
# mcp-1password-headers.sh — resolve auth headers for HTTP MCP servers.
#
# Wired into .mcp.json via each server's `headersHelper`. Claude Code runs this
# at MCP connect time (outside the bash sandbox), passing the server name in
# $CLAUDE_CODE_MCP_SERVER_NAME, and reads a JSON header object from stdout.
#
# Secret resolution mirrors the Spacebase MCP convention: tokens live in the
# 1Password `claude-agent` vault, read via the service-account token cached in
# the macOS login keychain (security -s op-claude-agent). An already-exported
# env var wins, so CI / fresh checkouts without `op` can still authenticate by
# exporting GITHUB_PAT / RENDER_API_KEY / SUPABASE_ACCESS_TOKEN (per CLAUDE.md).
#
# No plaintext secret is ever stored on disk or committed.

set -euo pipefail

op_read() {
  # $1 = op:// secret reference. Empty output on any failure (no `op`, no token).
  OP_SERVICE_ACCOUNT_TOKEN="$(security find-generic-password -s op-claude-agent -w 2>/dev/null)" \
    /opt/homebrew/bin/op read "$1" 2>/dev/null || true
}

resolve() {
  # $1 = pre-exported env value (may be empty); $2 = op:// reference.
  if [ -n "${1:-}" ]; then
    printf '%s' "$1"
  else
    op_read "$2"
  fi
}

case "${CLAUDE_CODE_MCP_SERVER_NAME:-}" in
  github)
    token="$(resolve "${GITHUB_PAT:-}" 'op://claude-agent/GitHub PAT/credential')"
    printf '{"Authorization":"Bearer %s"}' "$token"
    ;;
  render)
    token="$(resolve "${RENDER_API_KEY:-}" 'op://claude-agent/Render API Key/credential')"
    printf '{"Authorization":"Bearer %s"}' "$token"
    ;;
  supabase)
    token="$(resolve "${SUPABASE_ACCESS_TOKEN:-}" 'op://claude-agent/Supabase PAT/credential')"
    printf '{"Authorization":"Bearer %s"}' "$token"
    ;;
  *)
    printf '{}'
    ;;
esac
