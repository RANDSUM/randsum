# AGENTS.md

Instructions for coding agents working in this repository. Each package and app has its own `AGENTS.md` with the detail for that directory. Claude Code reads them through the `CLAUDE.md` beside each one.

## Architecture

Bun workspace monorepo for a dice rolling ecosystem targeting tabletop RPGs. All packages are TypeScript, published to npm under `@randsum`.

- **`@randsum/roller`** (`packages/roller/`): zero-dependency dice engine with built-in notation parsing and validation. Every other package depends on it via `workspace:~`.
- **`@randsum/games`** (`packages/games/`): code-generated game interpretations as subpath exports: `blades`, `daggerheart`, `fate`, `fifth` (D&D 5e), `pbta`, `root-rpg`, `salvageunion`, plus `schema` (the codegen/validation API).
- **`@randsum/mcp`** (`packages/mcp/`): MCP server exposing `roll`, `validate` and `roll_game`.
- **`@randsum/ui`** (`packages/ui/`): roller Web Components built with Lit, Shadow DOM, themed by `--rsui-*` tokens: `<randsum-roller size="mini|compact|max">` (`roller`) and every part as its own element (`scope`, `notation-field`, `key-pad`, `readout`, …), each its own subpath export, lodash style, plus thin wrappers under `react/` and `vue/`, Svelte types (`svelte`), server rendering (`ssr`), and `roller-state`, `keys`, `presets`, `check`. No root entry. Depends on roller and lit; React, Vue and Svelte are optional peers.
- **`@randsum/notation-spec`** (`packages/notation-spec/`): the RANDSUM Dice Notation spec, its conformance vectors (JSON) and the `rdn-conformance` runner. Source of truth for all three; mirrored to github.com/RANDSUM/notation-spec.
- **`@randsum/api`** (`apps/api/`, private): Cloudflare Worker at api.randsum.dev serving the `/v1` REST API and `/mcp`, the hosted `@randsum/mcp` behind the Claude connector.
- **`@randsum/discord-bot`** (`apps/discord-bot/`, private): Discord bot, a Cloudflare Worker at bot.randsum.dev.
- **`@randsum/site`** (`apps/site/`, private): Astro + Starlight docs site at randsum.dev. It also serves the notation spec at `/spec` and the installable Roller app at `/app`. Its rollers are `@randsum/ui` components, wrapped in `src/components/rollers/` and server-rendered by `ServerRoller.astro`.
- **Claude Code plugin** (`plugins/randsum/`): the `randsum` plugin that the root `.claude-plugin/marketplace.json` publishes. Four skills, a `/roll` mod in `hooks/` (it rolls with a committed bundle of roller's `roll()`, rebuilt by `bun run plugin:roller`), and its own `.mcp.json`, which connects only the hosted MCP at `https://api.randsum.dev/mcp`. The root `.mcp.json` holds the maintainers' ops servers and never ships.

Game packages never depend on each other, only on `@randsum/roller`.

Boundaries are enforced by tools, not review. Bun's isolated linker (`bunfig.toml`) lets a package import only what its own `package.json` declares. Biome's `noImportCycles` rejects import cycles, and `noRestrictedImports` rejects reach-ins to `@randsum/*/src` or `@randsum/*/dist`. Games are subpaths of one package, so the linker cannot keep them apart: a `biome.json` override bans `@randsum/games/<game>` imports (except `/schema`) in the hand-written `packages/games/src/**`, and `packages/games/__tests__/generated-imports.test.ts` holds each `*.generated.ts` entry to `@randsum/roller*`, `./types` and `./lib/**`. Biome excludes `*.generated.ts`, so `noImportCycles` does not see edges through them.

## Commands

```bash
bun install                              # Install dependencies (also installs the Lefthook hooks)
bun run build                            # Build all packages (bunup: ESM + DTS, no CJS)
bun run test                             # Run all tests (bun:test, recursive)
bun run typecheck                        # TypeScript strict check (packages + scripts/)
bun run knip                             # Find unused files, deps, and exports
bun run check                            # Repo gates + per-package build, typecheck, test
bun run fix:all                          # Auto-fix lint + format issues (Biome)

bun run --filter @randsum/roller test    # One package
bun test packages/roller/__tests__/roll/roll.test.ts   # One test file
bun run --filter @randsum/roller size    # Bundle size (size-limit); `bun run size` runs all
bun run site:dev                         # Astro dev server (localhost:4321)
bun run                                  # List every root script
```

Run `bun run check` before you push. `bun test` does not typecheck, so a passing test can still break `typecheck`.

## TypeScript Conventions

- Strict mode with `isolatedDeclarations`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- `const` only: `let` is banned by a Biome GritQL plugin
- `import type { X }` for type-only imports
- Explicit return types on exported functions
- PascalCase for types, interfaces and enums; UPPER_CASE for enum members
- No `any`: use `unknown` with type guards
- No `as unknown as T`: banned by a Biome GritQL plugin (plain and parenthesized forms)
- No semicolons, single quotes, no trailing commas (Biome formatter)
- Discriminated unions use `kind` or `type` as the discriminant
- `roll()` accepts plain numbers and notation strings, not branded or opaque types
- All errors extend `RandsumError`. Roller exports `NotationParseError`, `ModifierError`, `ValidationError` and `RollError` (`@randsum/roller/errors`); games exports `SchemaError`. `roll()` throws on invalid input.
- Game subpaths re-export `GameRollResult`, `RollRecord` and `SchemaError`. Internal types stay internal. Use `export type` for type-only re-exports.

## Testing

- `bun:test` (`import { describe, expect, test } from 'bun:test'`), in `__tests__/` directories
- Property-based tests use `fast-check` with a `.property.test.ts` suffix
- Stress tests use 9999 iterations
- Seeded random: `createSeededRandom(42)` from test-utils
- Coverage target: 80% project, 70% patch (Codecov)

## Build Output

Publishable packages produce ESM only: `dist/<entry>.js` plus `dist/<entry>.d.ts`, never `.cjs` or `.d.cts`. Game subpaths compile to `dist/<game>.generated.js`. Bundle size limits live only in each package's `size-limit` block in `package.json` (games: `.size-limit.ts`); never copy the figures into prose.

## Releases

Releases are automated with changesets and npm Trusted Publishing. Your part is one step: add a changeset with `bun run changeset` when a published package (`roller`, `games`, `mcp`, `ui`) changes. `roller` and `games` are linked and version together; `bun run check:changesets` fails when a changeset releases roller or games without also releasing mcp, which bundles them.

Never run `npm publish` or `bun publish` yourself: npm would ship the literal `workspace:~` range. Publishing goes only through `scripts/publish.ts`. The release workflow is described in `CONTRIBUTING.md`.

## Key Patterns

- **Code-generated games**: each game is a `.randsum.json` spec compiled by `packages/games/codegen.ts` into `packages/games/src/<game>.generated.ts`. Edit the spec, then `bun run --filter @randsum/games gen`; never edit generated files.
- **Modifier registry**: `MODIFIER_SCHEMAS` in `packages/roller/src/notation/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order. Each modifier is split into a schema (`src/notation/definitions/<mod>.ts`) and a behavior (`src/modifiers/<mod>.ts`). See `packages/roller/AGENTS.md`.
- **Notation spec**: https://notation.randsum.dev/ is the formal specification (taxonomy, pipeline, conformance, syntax). Its source is `packages/notation-spec/spec/`; the conformance vectors are `packages/notation-spec/vectors/`.

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

Key syntax: `NdS`, `+X`/`-X`, `L`/`H` (drop lowest/highest), `R{<3}` (reroll), `!` (explode), `!{condition}`, `U` (unique), `C{<1,>6}` (cap), `d%`, `dF`/`dF.2`, `W` (wild die), `F{N}` (count failures), `//N`, `%N`, `gN`, `DDN`, `xN` (repeat), `[text]` (annotation).

## Git Hooks (Lefthook)

- **pre-commit**: `bun install --frozen-lockfile`, then in parallel Biome (`check --write`), typecheck and `gen:check`.
- **pre-push**: build, then in parallel `gen:check`, tests and knip.

A failing step prints its own fix (`fail_text` in `lefthook.yml`). Do not `--no-verify` past a real failure. CI never installs the hooks.

## Troubleshooting

- **Biome**: the common failures are the `no-let` plugin, `useImportType`, the `as unknown as T` plugin, and the site's design-token plugins (`no-raw-color`, `no-raw-type`, `no-raw-shape`, `no-uppercase-labels`, `no-decorative-gradient`), which reject raw design values outside `apps/site/src/styles/theme.css` (see `apps/site/AGENTS.md`).
- **Types**: `isolatedDeclarations` wants explicit return types; `exactOptionalPropertyTypes` rejects assigning `undefined` to an optional property whose type lacks `| undefined`; `noUncheckedIndexedAccess` makes index access return `T | undefined`.
- **Bundle size**: usually a heavy import leaked into an entry. For roller's `dist/tokenize.js`, see `packages/roller/AGENTS.md`.
- **Codegen**: `bun run --filter @randsum/games gen:check` fails when a spec and its generated file disagree; regenerate with `gen`.

## Agent Docs

`AGENTS.md` files are the instructions every agent reads; each has a `CLAUDE.md` beside it that imports it for Claude Code. Edit the `AGENTS.md`, never the shim. `bun run check:doc-claims` fails when agent-facing prose names a script, path, import, notation or size figure the code does not have, or when an `AGENTS.md` loses its `CLAUDE.md` shim.
