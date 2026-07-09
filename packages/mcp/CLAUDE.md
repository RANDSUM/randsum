# @randsum/mcp - MCP Dice Server

## Overview

Published (`@randsum/mcp`, public) Model Context Protocol **stdio** server that exposes the
RANDSUM ecosystem to AI agents. Bin name `randsum-mcp`. Built on
`@modelcontextprotocol/sdk` (`McpServer` + `StdioServerTransport`).

Three tools, each backed by a pure, directly-testable handler:

- `roll` — `{ notation, seed? }` → total, per-pool rolls, description (`@randsum/roller`)
- `validate` — `{ notation }` → valid, description, suggestion (`validateNotation` + `suggestNotationFix`)
- `roll_game` — `{ game, params }` → game-interpreted result (`@randsum/games` subpaths)

## Structure

- `src/index.ts` — Entry: creates the server, connects `StdioServerTransport`, `main()`
- `src/server.ts` — `createServer()`: registers the three tools; owns the Zod input schemas
- `src/tools/roll.ts` — `rollNotation()` pure handler
- `src/tools/validate.ts` — `validateNotationInput()` pure handler
- `src/tools/rollGame.ts` — `rollGame()` pure handler + local `AVAILABLE_GAMES`
- `src/rng.ts` — `createSeededRandom()` LCG for deterministic seeded rolls

Zod schemas live in `server.ts` (not the tool files): `isolatedDeclarations` forbids exporting a
Zod raw shape without an explicit type annotation, so the shapes stay module-local and the tool
handlers take plain explicit-interface inputs.

## Commands

```bash
bun run dev                    # Run the server from source over stdio
bun run build                  # bunup → dist/index.js (ESM), then chmod +x
bun run test                   # bun test (calls tool handlers directly)
bun run typecheck              # tsc --noEmit
bun run lint                   # ESLint
bun run format                 # Biome
bun run check                  # build + typecheck + format:check + lint + test
```

Smoke-test the live server by piping a JSON-RPC `initialize` message to `bun src/index.ts`.

## Build / Dependencies

- `@modelcontextprotocol/sdk` (exact-pinned) and `zod` (its required peer, exact-pinned) are
  **regular runtime dependencies** — external, NOT bundled.
- `@randsum/roller` and `@randsum/games` are **dev dependencies** (`workspace:~`), bundled into
  `dist/index.js` via bunup `noExternal: [/^@randsum\//]` (same pattern as `apps/cli`). This keeps
  the published surface to just the SDK + zod.
- `AVAILABLE_GAMES` is duplicated locally in `rollGame.ts` rather than imported from
  `@randsum/games` at runtime: the games built barrel (`dist/index.js`) currently has a bunup
  code-splitting bug that drops the chunk imports backing that export. The per-game subpaths are
  self-contained and unaffected. Correctness is still compile-time enforced (see the comment there).

## Publishing

Always `bun publish`. Never `npm publish` (see root `CLAUDE.md` — resolves `workspace:~`).
`prepublishOnly` runs `bun run build`. `build` chmods `dist/index.js` so the `randsum-mcp` bin is
executable.

**First release note:** npm OIDC trusted publishing cannot create a brand-new scoped package that
does not yet exist on the registry. The first `@randsum/mcp` publish likely needs one manual
`bun scripts/publish.ts` run with an npm token / OTP; subsequent releases go through OIDC as usual.
