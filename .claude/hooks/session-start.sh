#!/bin/bash
# SessionStart: give a Claude Code on the web session the pinned Bun and the dependencies, so its
# first `bun run check` fails on the code rather than on a missing module. A laptop keeps its own
# toolchain: anywhere CLAUDE_CODE_REMOTE is not "true" this exits before doing anything.
#
# Bun comes from the npm registry, through npm. Every request leaves the session through an
# authenticating proxy; a Bun older than 1.4.0 encodes the proxy's credentials in the wrong base64
# alphabet (oven-sh/bun#31782) and gets a 401 for everything, itself included, and the proxy 403s
# release assets of repos not attached to the session, which rules out oven-sh/bun's releases.
# npm goes through the proxy, and the `bun` package on npm is the same binary.
#
# Dependencies install as CI and lefthook install them: `bun install --frozen-lockfile`, which never
# rewrites bun.lock. npm cannot stand in for that step: it rejects `workspace:~` and ignores bun.lock.
#
# A failure never blocks the session: it prints why, which the agent reads, and exits 0.
set -uo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = true ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

want=$(tr -d '[:space:]' < .bun-version)
if [ "$(bun --version 2> /dev/null)" != "$want" ]; then
  prefix="$HOME/.local/share/bun-$want"
  bin="$prefix/node_modules/.bin"
  if [ "$("$bin/bun" --version 2> /dev/null)" != "$want" ]; then
    log=$(timeout 120 npm install --prefix "$prefix" --no-save --no-audit --no-fund "bun@$want" 2>&1)
    if [ "$("$bin/bun" --version 2> /dev/null)" != "$want" ]; then
      echo "session-start: could not install Bun $want from the npm registry, so no bun script runs:"
      printf '%s\n' "$log" | tail -5
      exit 0
    fi
  fi
  export PATH="$bin:$PATH"
  echo "export PATH=\"$bin:\$PATH\"" >> "${CLAUDE_ENV_FILE:-/dev/null}"
fi

if log=$(timeout 300 bun install --frozen-lockfile 2>&1); then
  echo "session-start: Bun $want, and the dependencies in bun.lock are installed."
else
  echo "session-start: \`bun install --frozen-lockfile\` failed (exit $?; 124 is a hang past 300 s):"
  printf '%s\n' "$log" | tail -15
fi
exit 0
