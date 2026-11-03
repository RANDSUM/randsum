# @randsum/mcp - MCP Dice Server

## Overview

Published (`@randsum/mcp`, public) Model Context Protocol server that exposes the RANDSUM
ecosystem to AI agents. It runs over stdio (bin `randsum-mcp`) or statelessly over Streamable HTTP
through the `./remote` export, which `apps/api` serves at `https://api.randsum.dev/mcp`. Built on
`@modelcontextprotocol/sdk` (`McpServer`).

Three tools, each backed by a pure, directly-testable handler:

- `roll` — `{ notation, seed? }` → total, per-pool rolls, description (`@randsum/roller`)
- `validate` — `{ notation }` → valid, description, suggestion (`validateNotation` + `suggestNotationFix`)
- `roll_game` — `{ game, params }` → game-interpreted result (`@randsum/games` subpaths)

## MCP App (`ui://` view)

`roll` and `roll_game` carry `_meta.ui.resourceUri` (plus the older flat `ui/resourceUri`), pointing
at the resource `ui://randsum/roll.html` (`text/html;profile=mcp-app`). Hosts that support MCP Apps
(Claude among them) render it in a sandboxed frame; other clients ignore it. The page is
`<randsum-mcp-app>` from `@randsum/ui`, imported as one string from `@randsum/ui/mcp-app-page` and
inlined into `dist` at build time, so nothing is fetched at run time. Each roll's `RollRecord`s go
in the result's `_meta['randsum/records']` for the view to draw the steps; `structuredContent`, the
model's text and the REST API are unchanged (`rollNotationWithRecords` and `rollGameWithRecords`
wrap the plain handlers).

## Structure

- `src/index.ts` — Bin entry: creates the server, connects `StdioServerTransport`, `main()`
- `src/remote.ts` — The `./remote` export (the package's only importable entry): `handleMcpRequest()`
  serves the same server statelessly over Streamable HTTP, and re-exports the tool handlers. Used by
  `apps/api` (api.randsum.dev `/mcp` and `/v1`). There is no `.` export: importing the bin would
  start a stdio server.
- `src/server.ts` — `createServer()`: registers the three tools and the view resource; owns the Zod
  input and output schemas
- `src/tools/roll.ts` — `rollNotation()` pure handler
- `src/tools/validate.ts` — `validateNotationInput()` pure handler
- `src/tools/rollGame.ts` — `rollGame()` pure handler

Zod schemas live in `server.ts` (not the tool files): `isolatedDeclarations` forbids exporting a
Zod raw shape without an explicit type annotation, so the shapes stay module-local and the tool
handlers take plain explicit-interface inputs. The `roll_game` `params` schema is built from each
game's generated `inputs` export (`GAME_INPUTS` in `tools/rollGame.ts`); never hand-write a range.

## Commands

```bash
bun run dev                    # Run the server from source over stdio
bun run build                  # bunup → dist/index.js + dist/remote.js (ESM), then chmod +x
bun run test                   # bun test (calls tool handlers directly)
bun run typecheck              # tsc --noEmit
bun run check                  # build + typecheck + test
```

Smoke-test the live server by piping a JSON-RPC `initialize` message to `bun src/index.ts`.

## Build / Dependencies

- `@modelcontextprotocol/sdk` (exact-pinned) and `zod` (its required peer, exact-pinned) are
  **regular runtime dependencies** — external, NOT bundled.
- `@randsum/roller`, `@randsum/games` and `@randsum/ui` (only for the view page) are **dev dependencies** (`workspace:~`), bundled into
  `dist/index.js` and `dist/remote.js` via bunup `noExternal: [/^@randsum\//]`. This keeps
  the published surface to just the SDK + zod.
