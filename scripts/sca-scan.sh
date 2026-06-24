#!/usr/bin/env bash
#
# sca-scan.sh — local mirror of the CI `sca` job (OSV-Scanner).
#
# Runs the same scan as .github/workflows/ci.yml (osv-scanner-action v2.3.8)
# against bun.lock, honouring osv-scanner.toml's IgnoredVulns. Wired into the
# pre-push hook (lefthook.yml) so SCA findings surface locally before a push,
# matching the CI gate.
#
# Tool resolution, in order:
#   1. a local `osv-scanner` binary (brew install osv-scanner)
#   2. the same Docker image CI uses, if Docker is running
#   3. neither available -> skip with an install hint (non-blocking, mirroring
#      the CI job's continue-on-error posture)
#
# When the scanner DOES run, its exit code is propagated: a real finding fails
# the push. Only the tool-absent case is a soft skip.

set -euo pipefail

OSV_IMAGE="ghcr.io/google/osv-scanner-action:v2.3.8"
ARGS=(--config=osv-scanner.toml --recursive ./)

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if command -v osv-scanner >/dev/null 2>&1; then
  exec osv-scanner "${ARGS[@]}"
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  exec docker run --rm -v "$repo_root":/src -w /src "$OSV_IMAGE" "${ARGS[@]}"
fi

echo "sca: osv-scanner not found and Docker unavailable — skipping local SCA scan."
echo "     Install for CI parity: brew install osv-scanner   (or start Docker)."
echo "     The CI 'sca' job still runs on push."
exit 0
