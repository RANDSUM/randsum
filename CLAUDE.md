# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Bun workspace monorepo for a dice rolling ecosystem targeting tabletop RPGs. All packages are TypeScript, published to npm under `@randsum`.

**Core**: `@randsum/roller` — zero-dependency dice engine with built-in notation parsing and validation. Every other package depends on it via `workspace:~`.

**Game packages** live in `packages/games/` — each wraps roller with game-specific interpretation, accessed via subpath exports:
`blades` (Blades in the Dark), `daggerheart`, `fate` (Fate Core), `fifth` (D&D 5e), `root-rpg`, `salvageunion`, `pbta` (Powered by the Apocalypse). A `schema` subpath exports the codegen/validation API.

**Apps**: `@randsum/cli` (published npm CLI), `@randsum/discord-bot` (private Discord bot, deployed as a Render worker), `@randsum/site` (Astro + Starlight docs site at randsum.dev, private), `@randsum/rdn` (notation spec site at notation.randsum.dev, private)

**UI**: `@randsum/dice-ui` in `packages/dice-ui/` — private, web-only React component library (notation input with token overlay, roll step visualizer, combined roller) consumed by `apps/site`. Never published to npm; depends only on `@randsum/roller`.

Game packages never depend on each other — only on `@randsum/roller`.

## Commands

```bash
bun install                              # Install all dependencies
bun run build                            # Build all packages (bunup: ESM + DTS, no CJS)
bun run test                             # Run all tests (bun:test, recursive)
bun run lint                             # ESLint all packages
bun run format                           # Prettier all packages
bun run typecheck                        # TypeScript strict check
bun run knip                             # Find unused files, deps, and exports
bun run check:all                        # Per-package check chain (build, typecheck, format:check, lint, test)
bun run fix:all                          # Auto-fix lint + format issues

# Single package
bun run --filter @randsum/roller test    # Test one package
bun run --filter @randsum/games build    # Build one package

# Single test file
bun test packages/roller/__tests__/roll/roll.test.ts

# Other
bun run --filter @randsum/roller size    # Bundle size checks (size-limit; per-package, no root script)
bun run bench                            # Performance benchmarks (mitata)
bun run site:dev                         # Astro dev server (localhost:4321)
bun run help                             # Quick command reference
```

## TypeScript Conventions

- Strict mode with `isolatedDeclarations`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- `const` only — `let` is banned by ESLint
- `import type { X }` enforced (`consistent-type-imports`)
- Explicit return types on exported functions
- PascalCase for types/interfaces/enums, UPPER_CASE for enum members
- No `any` — use `unknown` with type guards
- No `as unknown as T` — banned by ESLint AST selector
- `prefer-readonly` enabled
- No semicolons, single quotes, no trailing commas (Prettier)
- Discriminated unions use `kind` or `type` as the discriminant field (e.g., `CollectedResults` with `kind: 'union' | 'numeric' | 'opaque' | 'result-mapping'`)
- Literal types for API inputs: `roll()` accepts plain numbers and notation strings, not branded/opaque types
- Error hierarchy: all errors extend `RandsumError`. roller exports `NotationParseError`, `ModifierError`, `ValidationError`, and `RollError` (`@randsum/roller/errors`); games exports `SchemaError`. Use `instanceof RandsumError` to catch all RANDSUM errors, or catch them individually for specific handling
- Re-export conventions: game subpaths re-export `GameRollResult`, `RollRecord`, and `SchemaError`. Internal types stay internal. Use `export type` for type-only re-exports

## Testing

- Framework: `bun:test` (`import { describe, expect, test } from 'bun:test'`)
- Tests live in `__tests__/` directories
- Property-based tests use `fast-check` with `.property.test.ts` suffix
- Stress tests use 9999 iterations for boundary validation
- Seeded random available: `createSeededRandom(42)` from test-utils
- Coverage target: 80% project, 70% patch (Codecov)

## Package Build Output

All publishable packages produce ESM only:

- `dist/index.js` (ESM)
- `dist/index.d.ts` (TypeScript declarations)
- Subpath exports follow the same pattern: `dist/<subpath>.js`, `dist/<subpath>.d.ts`. The game subpaths in `@randsum/games` are code-generated, so each compiles to `dist/<game>.generated.js` / `dist/<game>.generated.d.ts` (e.g. `./fifth` → `dist/fifth.generated.js`); the `schema` subpath is `dist/schema.js`.
- No `.cjs`, `.d.cts`, or `dist/cjs/` variants are produced
- Bundle size limits enforced (per-package `size-limit`): roller main `dist/index.js` 16KB (notation included; `docs` subpath 20KB, `tokenize` 6.75KB, `trace` 5KB), game packages 15KB (daggerheart and pbta 16KB), salvageunion 33KB

CJS consumers must use a bundler (esbuild, rollup, webpack 5+) that translates ESM to CJS. Direct `require()` of an `@randsum/*` package without a bundler is not supported.

## Publishing

Releases are **automated via [changesets](https://github.com/changesets/changesets) + npm OIDC Trusted Publishing** — you do not run a publish command by hand in the normal flow.

1. Add a changeset with your change: `bun run changeset` (writes a markdown file under `.changeset/`).
2. On merge to `main`, the `Release` workflow (`.github/workflows/publish.yml`) runs after CI succeeds. The `changesets/action` either opens/updates a `chore: version packages` PR (applying `bun changeset version` to bump versions and roll per-package `CHANGELOG.md` entries) or, when that version PR is merged, publishes the changed packages.
3. Publishing itself runs `bun scripts/publish.ts`, which packs each package with `bun pm pack` (resolving `workspace:~` to a real semver range at pack time) and then publishes the resulting tarball with `npm publish`. In CI, auth is npm Trusted Publishing (OIDC — no `NPM_TOKEN`) and `--provenance` is added to attest the build.

**`workspace:~` warning:** never run a bare `npm publish` from a package directory — `npm` ships the literal `workspace:~` string, which is unresolvable for consumers. The pack step in `scripts/publish.ts` (`bun pm pack`) is what resolves it, so publishing always goes through that script (or `bun publish`), never `npm publish` on the raw source tree.

**Local fallback (rare):** `bun scripts/publish.ts` can publish from a workstation. Pass `--otp=<CODE>` (the npm account has 2FA set to `auth-and-writes`) and optionally `--dry-run`. Local runs omit `--provenance`. Publish order is fixed topologically in the script: `@randsum/roller` → `@randsum/games` → `@randsum/cli`.

## Versioning

`@randsum/roller`, `@randsum/games`, `@randsum/cli`, and `@randsum/dice-ui` are **linked** in `.changeset/config.json`, so changesets bumps them together to a shared version whenever any of them changes. `updateInternalDependencies` is set to `minor`, so a bump to a dependency updates dependents' internal `workspace:~` ranges. In practice: a minor or major bump to core ripples across the linked ecosystem automatically; patch bumps stay local to the changed package. `@randsum/site` and `@randsum/discord-bot` are in the changesets `ignore` list (private, not versioned this way).

## Key Patterns

### Code-Generated Game Packages

Game packages are generated from `.randsum.json` specs via the codegen pipeline in `packages/games/codegen.ts`. Each spec defines dice pools, modifiers, outcome tables, and input validation. The generated TypeScript calls `roll()` from `@randsum/roller` directly.

### Error Handling

`roll()` throws on invalid input. Wrap calls in try/catch: `try { roll(...) } catch (e) { ... }`

### Modifier Registry

The `RANDSUM_MODIFIERS` array in `packages/roller/src/modifiers/definitions.ts` (re-exported from `src/modifiers/index.ts`) is the single source of truth for which modifiers exist and their execution order. Each modifier is a single co-located file in `packages/roller/src/modifiers/` that exports both a `*Schema` (notation pattern, parse/format logic) and a `*Modifier` (full definition with dice pool behavior).

See https://notation.randsum.dev for the formal specification including faceted classification, conformance levels, and execution pipeline contracts.

### `roll()` Argument Types

```typescript
roll(20) // Number: 1d20
roll("4d6L") // Notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }) // Options object
roll("1d20+5", "2d6") // Multiple arguments combined
roll("d%") // Percentile: 1d100
roll("4dF") // Fate Core: 4 Fate dice (-4 to +4)
roll("dF.2") // Extended Fudge die (-2 to +2)
roll("5d6W") // D6 System wild die
roll("g6") // Geometric die (reroll while max; sum all rolls)
roll("3DD6") // Draw die (no replacement)
roll("4d6Lx6") // Repeat operator (6 ability scores)
roll("2d6+3[fire]") // Annotation/label
roll("4d6//2") // Integer division
roll("5d10F{3}") // Count failures <= 3
```

## Git Hooks (Lefthook)

**pre-commit** (parallel): `bun install --frozen-lockfile` (priority 1), then ESLint `--fix`, Prettier, typecheck, and codegen check (`gen:check`)
**pre-push**: build (priority 1), then codegen check, conformance check (`@randsum/rdn conformance:check`), tests, security audit (`bun audit --audit-level=high`), SCA scan (`scripts/sca-scan.sh` — OSV-Scanner, mirrors the CI `sca` job; soft-skips if `osv-scanner`/Docker absent), knip, and arch check (`arch:check`)

If hooks fail, run `bun run fix:all`.

## Development Guidelines

Per-package `CLAUDE.md` files exist in each `packages/*/`, `games/*/`, and `apps/*/` directory for detailed guidance on each component.

## Debugging & Troubleshooting

**Test failures**: Isolate with `bun test packages/roller/__tests__/roll/roll.test.ts`. Use `--bail` to stop on the first failure: `bun test --bail`. Filter by package: `bun run --filter @randsum/roller test`.

**ESLint failures**: Common violations: `no-let` (use `const`), `consistent-type-imports` (use `import type`), `prefer-readonly`, and the AST selector banning `as unknown as T`. Auto-fix with `bun run fix:all` or target lint only: `bun run lint -- --fix`.

**Type errors**: Run `bun run typecheck`. Common strict-mode issues:

- `isolatedDeclarations` — exported functions need explicit return types
- `exactOptionalPropertyTypes` — optional properties cannot be assigned `undefined` explicitly unless the type includes `| undefined`
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`, requires narrowing

**Bundle size failures**: Each publishable package defines `size-limit` in its own `package.json`. There is no root `size` script — check per-package: `bun run --filter @randsum/roller size`. Common cause: accidentally importing a heavy dependency into a game package (limit: 15KB; daggerheart and pbta 16KB; salvageunion 33KB).

**Codegen issues**: Game packages are generated from `.randsum.json` specs. Generated files live at `packages/games/src/*.generated.ts`. Regenerate with `bun run --filter @randsum/games gen`. Verify generated output matches specs: `bun run --filter @randsum/games gen:check`.

**Hook failures**: Pre-commit runs install, lint --fix, format, typecheck, and codegen check (`gen:check`) in parallel. Pre-push runs build (priority 1), then codegen check, conformance check, test, `bun audit --audit-level=high`, SCA scan (`scripts/sca-scan.sh`), knip, and arch check. Recovery: `bun run fix:all`, then retry. See `lefthook.yml` for full config.

## Dice Notation Reference

Full spec: https://notation.randsum.dev (taxonomy, pipeline, conformance, syntax)

Key syntax: `NdS` (basic), `+X`/`-X` (arithmetic), `L`/`H` (drop lowest/highest), `R{<3}` (reroll), `!` (explode), `!{condition}` (conditional explode), `U` (unique), `C{<1,>6}` (cap), `d%` (percentile), `dF`/`dF.2` (Fate/Fudge), `W` (wild die), `F{N}` (count failures), `//N` (integer divide), `%N` (modulo), `gN` (geometric die), `DDN` (draw die), `xN` (repeat), `[text]` (annotation)

## MCP Servers

`.mcp.json` (project-scoped, committed) declares the official MCP servers for
this repo's deploy/host stack. Each maps to a real workspace target:

| Server   | Transport | Backs                              | Auth                            |
| -------- | --------- | ---------------------------------- | ------------------------------- |
| `render` | http      | `apps/discord-bot` (Render worker) | 1Password PAT (`headersHelper`) |
| `github` | http      | repo host (issues, PRs, releases)  | 1Password PAT (`headersHelper`) |

Secrets are **never** committed. The `github` and `render` (http) servers
resolve their fine-grained PATs at connect time via `scripts/mcp-1password-headers.sh`,
wired through each server's `headersHelper`. Claude Code runs that script outside
the bash sandbox, so it can read the token from the 1Password `claude-agent`
vault (service-account token in the macOS keychain) — the same convention as the
Spacebase MCP. The script expects these vault items:

```
op://claude-agent/GitHub PAT/credential      # github
op://claude-agent/Render API Key/credential  # render
```

An already-exported env var wins over `op`, so CI / fresh checkouts without
1Password can still authenticate by exporting `GITHUB_PAT` / `RENDER_API_KEY`
before launch.

Run `/mcp` in Claude Code to check connection status. Netlify is **not** a
project-scoped server here — use the account-level claude.ai Netlify connector
(already connected) for `apps/site` / `apps/rdn`.
