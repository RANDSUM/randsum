# @randsum/roller — Core Dice Engine

The `roll()` function, native notation parsing, validation, tokenization, and the modifier roll pipeline. Every other package depends on this one. Zero runtime dependencies, ESM-only output.

Notation parsing lives in this package (`src/notation/`). There is no separate `@randsum/notation` package; it was merged in (ADR-005), so any reference to it is stale. The lexer's internals are in `src/notation/AGENTS.md`.

## What belongs here

Everything dice-notation and dice-rolling: notation parsing, validation, formatting and tokenization; modifier schemas and behaviors; RNG; roll execution; static notation docs; roll-result traces.

Game-specific interpretation (outcome tables, pool conditions, critical thresholds) belongs in `packages/games/`. Evaluate any new notation primitive against ADR-006 (Notation Scope Boundary) first.

## Public API

- `roll(...args)` accepts a number (`roll(20)`), a notation string (`roll("4d6L")`), an options object, or several combined into one total (`roll("1d20+5", "2d6")`). An optional `RollConfig` (`{ randomFn }`) goes **last**; placed earlier it is treated as a roll argument and fails validation. Returns `{ total, values, rolls }`. Throws on invalid input.
- Subpaths are declared in `package.json` `exports`: `.`, `./roll`, `./errors`, `./validate`, `./tokenize`, `./docs`, `./trace`, `./random`. There is **no `./comparison` subpath**: the comparison helpers in `src/notation/comparison/` are internal.
- `./docs` is pure static `NotationDoc` data and pulls in no roll-engine or parse code. Keys are case-sensitive canonical shorthand (`'L'`, not `'l'`), even though the parser is case-insensitive.
- `./trace` (`traceRoll`, `formatAsMath`) uses no Node-specific APIs and works in browsers.
- Errors (`./errors`): `RandsumError` and its subclasses `NotationParseError` (with optional `suggestion`), `ModifierError`, `ValidationError`, `RollError`. There is **no `SchemaError`** here; it lives in `@randsum/games`.
- All type exports use `export type`. Shared types live in `src/types/`; `NotationSchema` in `src/notation/schema.ts`.

## Modifier system

`MODIFIER_SCHEMAS` in `src/notation/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order: a record keyed by option name (so a missing modifier is a type error), sorted by each schema's `priority`. The lexer specs, `modifiersToNotation` / `modifiersToDescription` and `RANDSUM_MODIFIERS` in `src/modifiers/definitions.ts` all derive from it.

Each modifier is single-sourced across two files, which keeps the tokenize path free of roll-engine code:

- **`<mod>Schema`** in `src/notation/definitions/<mod>.ts`: the behavior-free pattern, `parse`, `toNotation` and `toDescription`. The parse, validate and tokenize paths import it through `MODIFIER_SCHEMAS`.
- **`<mod>Modifier`** in `src/modifiers/<mod>.ts`: imports `<mod>Schema`, spreads it, and adds only the dice-pool behavior (`apply`, `validate`, `requires*`, `mutatesRolls`). Only the roll path uses it.

Never copy schema fields into the modifier file. Static notation docs are pure data in `src/docs/modifierDocData.ts`, grouped per modifier and linked by `MODIFIER_DOCS_BY_NAME`; they are never carried on schema or modifier objects.

Adding a modifier touches the schema, the behavior, the doc data and the spec. Follow `.claude/skills/add-modifier/SKILL.md` (in Claude Code, `/add-modifier`), which lists every file and the tests that guard each step.

### Tokenize isolation invariant

The `./tokenize` subpath must never pull in modifier behaviors. Isolation rests on directory boundaries plus ESM tree-shaking:

- The tokenize path imports schemas only from `src/notation/definitions/`, never from `src/modifiers/`.
- A `notation/definitions/<mod>.ts` schema must not import anything from `src/modifiers/**` or the roll pipeline. The `no-tokenize-modifier-import` Biome plugin enforces this.
- Doc data must stay in `src/docs/modifierDocData.ts`. Attaching a `docs` array to a schema puts the whole doc dataset into `dist/tokenize.js`.

The `size-limit` gate on `dist/tokenize.js` is the backstop. After any modifier change, run `bun run --filter @randsum/roller size`. A jump in `dist/tokenize.js` means a behavior leaked into the tokenize path: trace the import graph from `src/tokenize.ts`.

## Bundle size limits

The `size-limit` block in `package.json` is the only copy of the budgets, one per JS entry. There is no `.d.ts` entry: size-limit runs files through esbuild, which strips types, so a declaration entry could never fail.

## Plugin bundle

The Claude Code plugin's `/roll` mod rolls with `plugins/randsum/hooks/roller.generated.js`, a bundle of `src/roll/index.ts`. After changing anything under `src/`, run `bun run plugin:roller` from the repo root and commit the result; `bun run check:plugin-roller` fails in CI otherwise.

## Conformance vectors

The RDN conformance vectors live in `packages/notation-spec/vectors/` and run against roller in `packages/notation-spec/__tests__/runner.test.ts`; a roller change that breaks one fails there. notation.randsum.dev/conformance/ serves them. `__tests__/spec/` holds roller's own tests for spec sections 6, 9 and 10.

## Commands

```bash
bun run test        # bun:test, writes coverage/lcov.info
bun run build       # bunup: ESM + DTS
bun run typecheck   # tsc --noEmit
bun run size        # size-limit
bun run check       # build + typecheck + test
```

From the repo root: `bun run --filter @randsum/roller <script>`.

## Publishing

In-repo `sideEffects` stays `true` (bunup self-DCE otherwise breaks the dist); that script flips it to `false` in the tarball. See ADR-018.
