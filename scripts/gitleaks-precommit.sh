#!/usr/bin/env bash
# Pre-commit committed-secret scan (audit item N3).
#
# Resolution order for the gitleaks engine:
#   1. `gitleaks` on PATH (brew / mise / go install / release binary)
#   2. docker image `zricethezav/gitleaks` (if docker is available)
#   3. neither present -> LOUD warning + install hint, exit 0 (do not hard-block
#      a contributor who hasn't installed it; CI is the authoritative gate that
#      cannot be bypassed with `git commit --no-verify`).
#
# When gitleaks IS available, a finding fails the commit (exit non-zero) and
# cannot be silently skipped.
set -euo pipefail

CONFIG=".gitleaks.toml"
COMMON_ARGS=(git --staged --no-banner --redact --config "$CONFIG")

if command -v gitleaks >/dev/null 2>&1; then
  exec gitleaks "${COMMON_ARGS[@]}"
fi

if command -v docker >/dev/null 2>&1; then
  exec docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:latest "${COMMON_ARGS[@]}"
fi

cat >&2 <<'EOF'
================================================================================
  WARNING: gitleaks is not installed — committed-secret scan was SKIPPED locally.
  Your commit was NOT scanned for secrets on this machine.

  Install it so this guard runs on every commit:
    brew install gitleaks                 # macOS / Linuxbrew
    mise use -g gitleaks@latest           # mise
    go install github.com/gitleaks/gitleaks/v8@latest
    # or grab a release binary: https://github.com/gitleaks/gitleaks/releases

  CI runs gitleaks on every push/PR and WILL block a leaked secret regardless,
  so this is a defense-in-depth gap, not a bypass.
================================================================================
EOF
exit 0
