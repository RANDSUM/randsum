# @randsum/api — api.randsum.dev

## Overview

Private Cloudflare Worker serving `https://api.randsum.dev`. Never published to npm. Two surfaces:

- **`/v1/*`**: the public, keyless REST API. Dice notation (`/v1/roll`, `/v1/validate`), game rolls
  (`/v1/games`, `/v1/games/{game}/roll`) and uniform random integers (`/v1/random`). GET takes
  query parameters; POST takes the same fields as a JSON object.
- **`/mcp`**: the `@randsum/mcp` server over Streamable HTTP, stateless, JSON responses. This is the
  URL behind the Claude custom connector and the plugin's `.mcp.json`.

There is one MCP server, not two. `/mcp` imports `handleMcpRequest` from `@randsum/mcp/remote`,
and `/v1` calls the same tool handlers (`rollNotation`, `validateNotationInput`, `rollGame`), so a
REST roll and an MCP tool call return the same shapes from the same code.

## Structure

```
apps/api/
  src/
    index.ts   # Worker entry: CORS, rate limit, body decoding, /mcp and /v1 dispatch
    v1.ts      # handleV1(): decoded request -> { status, body }. Pure, never throws.
    random.ts  # Unbiased crypto integers (rejection sampling); injectable word source for tests
    longform.ts  # roll() options object (dotted/bracketed query keys) -> notation for /v1
  __tests__/   # v1 routes, random, and the Worker end to end (MCP included)
  wrangler.jsonc
```

## Commands

```bash
bun run dev        # wrangler dev on localhost:8787 (build workspace deps first)
bun run deploy     # wrangler deploy (CI does this: deploy-cloudflare.yml `api` job)
bun run test       # bun test
bun run typecheck  # tsc --noEmit
bun run check      # typecheck + test
```

`@randsum/roller`, `@randsum/games` and `@randsum/mcp` resolve to their `dist/`, so run the root
`bun run build` first.

## Notes

- **No `build` script.** Wrangler compiles `src/index.ts` at deploy time; the app is in
  `BUILD_EXEMPT` in `scripts/check-workspace-scripts.ts`, like the bot.
- **Custom domain** `api.randsum.dev` is declared in `wrangler.jsonc`, so the first deploy creates
  its DNS record and certificate. `workers_dev` and preview URLs are off.
- **Rate limit**: the `RATE_LIMITER` binding (120 requests / 60 s per `CF-Connecting-IP`).
  Cloudflare counts per location, so it is a brake, not a quota. `Env.RATE_LIMITER` is optional so
  tests run without it.
- **Caching**: `/v1` and `/v1/games` are cacheable for 5 minutes; everything that rolls or draws
  is `no-store`.
- **Dice randomness** is the roller's default (`Math.random`); `/v1/random` uses
  `crypto.getRandomValues`.
- Adding a route: extend `handleV1` and the `index()` listing in `v1.ts`, test it in
  `__tests__/v1.test.ts`, and document it under `apps/site/src/content/docs/api/` and
  the `dice-rolling` skill.
