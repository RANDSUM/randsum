# Domain Ontology

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Source of truth

There is no database — this is a stateless library ecosystem, so the domain
model lives entirely in **TypeScript type definitions** and the declarative
**`.randsum.json` game specs**. The two authoritative sources are:

- `packages/roller/src/types/` (+ `src/notation/types.ts`, `src/errors.ts`) —
  the dice-engine domain: rolls, results, modifiers, notation, errors.
- `packages/games/src/lib/types.ts` and the `*.randsum.json` spec files —
  the game-interpretation domain: pools, tables, outcomes, typed inputs.

Where the two disagree, the roller types are canonical for dice mechanics and
the spec/meta-schema (`packages/games/randsum.json`, `$id`
`https://randsum.dev/schemas/v1/randsum.json`) is canonical for game
definitions. The formal notation grammar is specified externally at
https://notation.randsum.dev (the `apps/rdn` site).

## Entities

### Roll (the `roll()` operation)

- **Purpose:** A request to roll one or more dice pools and combine them into a
  single total. The central verb of the engine; accepts a number (`roll(20)` =
  1d20), a notation string (`roll("4d6L")`), an options object, or several of
  these combined.
- **Key attributes (input):** `RollArgument` — one of `RollOptions`,
  `DiceNotation`, or a special-die notation literal (`PercentileDie`,
  `FateDieNotation`, `ZeroBiasNotation`, `CustomFacesNotation`,
  `DrawDieNotation`, `GeometricDieNotation`), or a bare `number`.
- **Source:** `packages/roller/src/types/core.ts:107` (`RollArgument`);
  entry at `packages/roller/src/roll/`.

### RollOptions

- **Purpose:** The structured form of a single dice pool to roll — sides,
  quantity, how it combines arithmetically, and which modifiers apply.
- **Key attributes:** `sides` (number or custom-face array), `quantity`,
  `arithmetic` (`'add' | 'subtract'`), `modifiers` (`ModifierOptions`), `key`.
- **Source:** `packages/roller/src/notation/types.ts:136`.

### RollParams

- **Purpose:** A fully resolved roll specification — every option materialized
  to concrete values, ready to execute and describe. Bridges parsed notation
  and execution.
- **Key attributes:** `sides`, `quantity`, `faces`/`numericFaces` (custom or
  Fate/zero-bias dice), `draw`, `geometric`, `notation`, `description`,
  `label`.
- **Source:** `packages/roller/src/types/results.ts:11`.

### RollRecord

- **Purpose:** The complete audit trail of one executed dice pool — what was
  rolled, every modifier that touched it, and the final total. The unit of roll
  history.
- **Key attributes:** `notation`, `parameters`, `rolls` (post-modifier),
  `initialRolls` (raw), `modifierLogs`, `appliedTotal`, `customResults`,
  `label`, `total`.
- **Source:** `packages/roller/src/types/results.ts:40`.

### RollerRollResult

- **Purpose:** The full return value of `roll()` — the combined total across
  all pools, the flat list of die values, and the per-pool records.
- **Key attributes:** `total`, `values` (`T[]`), `rolls` (`RollRecord[]`).
- **Source:** `packages/roller/src/types/results.ts:93` (extends the generic
  `RollResult` at `:71`).

### ModifierDefinition / Modifier

- **Purpose:** A transformation applied to a dice pool — drop, reroll, explode,
  cap, count, arithmetic, etc. The `RANDSUM_MODIFIERS` registry is the single
  source of truth for which modifiers exist and the priority order in which
  they run (19 modifiers).
- **Key attributes:** notation regex/parse-format logic (the `*Schema` half),
  dice-pool behavior (the `*Modifier` half), priority. Options shapes:
  `DropOptions`, `KeepOptions`, `RerollOptions`, `ReplaceOptions`,
  `UniqueOptions`, `CountOptions`, `ComparisonOptions`.
- **Source:** registry at `packages/roller/src/modifiers/definitions.ts`;
  one co-located file per modifier in `packages/roller/src/modifiers/`;
  option types at `packages/roller/src/notation/types.ts:1-106`.

### ModifierLog

- **Purpose:** A record of one modifier's effect on a pool — the frequency
  delta of values added/removed, plus any 1:1 replacements.
- **Key attributes:** `modifier` (name), `options`, `added[]`, `removed[]`,
  `replacements[]`.
- **Source:** `packages/roller/src/types/modifiers.ts:35`.

### DiceNotation / Notation

- **Purpose:** The string DSL for expressing a roll (`NdS` plus modifier
  suffixes). Parsed natively in the roller — there is no separate notation
  package (merged in per ADR-005).
- **Key attributes:** template-literal type `${number}d${number}${suffix}`;
  parsed into `ParsedNotationOptions` (`quantity`, `arithmetic`, `sides`,
  `modifiers`, `label`).
- **Source:** `DiceNotation` `packages/roller/src/notation/types.ts:129`;
  `ParsedNotationOptions` `:113`.

### Token

- **Purpose:** A lexical unit of a notation string, produced by the
  tokenize-only path (UI-safe, no roll behavior). Powers notation builders.
- **Key attributes:** `Token`, `TokenType`, `TokenCategory`.
- **Source:** `packages/roller/src/tokenize.ts` (`./tokenize` subpath);
  notation definitions under `packages/roller/src/notation/definitions/`.

### NotationDoc

- **Purpose:** Static, display-only documentation for each dice type and
  modifier — derived from the schema registries, safe for any bundling context
  (no engine).
- **Key attributes:** keyed by canonical shorthand (`'xDN'`, `'d%'`, `'L'`,
  `'!'`, …); subsets `MODIFIER_DOCS` / `DICE_DOCS`; `ModifierCategory`.
- **Source:** `packages/roller/src/docs/modifierDocs.ts` (`./docs` subpath).

### RollTraceStep

- **Purpose:** One ordered display step when walking a `RollRecord`'s modifier
  history for visualization. Discriminated union on `kind`.
- **Key attributes:** `kind: 'rolls' | 'divider' | 'arithmetic' | 'finalRolls'`.
- **Source:** `packages/roller/src/trace/` (`./trace` subpath).

### RandsumError (and subclasses)

- **Purpose:** The error hierarchy. All engine and game failures extend a
  single base, so callers can catch `RandsumError` broadly or each subtype
  specifically.
- **Key attributes:** `code: ErrorCode`, optional `context`. Subclasses:
  `NotationParseError` (carries `suggestion`), `ModifierError`,
  `ValidationError`, `RollError` (roller); `SchemaError` (games).
- **Source:** `packages/roller/src/errors.ts:50` (base + 4 subclasses);
  `packages/games/src/lib/errors.ts:12` (`SchemaError`).

### GameRollResult

- **Purpose:** A game-interpreted roll outcome — wraps the raw total/rolls with
  a typed, game-specific `result` (e.g. `'critical' | 'success' | 'partial' |
'failure'`) and optional structured `details`.
- **Key attributes:** `result` (`TResult`), `total`, `rolls`, optional
  `details` (`TDetails`). Conditional type: `details` is present only when
  `TDetails` is concrete.
- **Source:** `packages/games/src/types.ts:10`.

### RandSumSpec (`.randsum.json`)

- **Purpose:** The declarative definition of a single game's dice mechanics.
  Code-generated into a typed `roll()` per game. Defines a four-stage pipeline:
  **Dice → Modify → Resolve → Outcome**.
- **Key attributes:** `name`, `shortcode`, `game_url`, `srd_url`, `pools`,
  `tables`, `outcomes`, and either one `roll` or many named `rolls`.
- **Source:** `packages/games/src/lib/types.ts:200` (`RandSumSpec`);
  meta-schema `packages/games/randsum.json`; instances `*.randsum.json`.

### RollDefinition

- **Purpose:** One named roll within a spec — its inputs, dice pools, modifier
  chain, resolution strategy, outcome table, and conditional overrides.
- **Key attributes:** `inputs`, `dice`/`dicePools`/`conditionalPools`,
  `modify`, `resolve` (`'sum' | 'faces' | countMatching | tableLookup |
comparePool* | remoteTableLookup`), `outcome`, `when` (conditional cases),
  `details`.
- **Source:** `packages/games/src/lib/types.ts:187`.

### PoolDefinition

- **Purpose:** A named dice pool in a spec — sides (or custom faces) and
  quantity, either of which may bind to a user input.
- **Key attributes:** `sides` (`IntegerOrInput`), `faces` (numeric or
  string/"table die"), `quantity`.
- **Source:** `packages/games/src/lib/types.ts:7`.

### TableDefinition / TableRange / Outcome

- **Purpose:** Outcome resolution — maps a resolved roll value (or pool
  condition) to a labeled result. The bridge from "raw number" to "game means
  X".
- **Key attributes:** `ranges[]` (each `min`/`max`/`exact`/`poolCondition` →
  `result`); outcomes via `tableLookup`, inline `ranges`, `degreeOfSuccess`, or
  `remoteTableLookup`; `resultShape: 'numeric' | 'label'`.
- **Source:** `packages/games/src/lib/types.ts:24` (`TableRange`), `:31`
  (`TableDefinition`), `:124` (`OutcomeOperation`).

### InputDeclaration

- **Purpose:** A typed, validated user input to a game roll (e.g. Blades'
  `rating`, a D&D ability modifier).
- **Key attributes:** `type` (`'integer' | 'string' | 'boolean'`), `minimum`,
  `maximum`, `default`, `enum`, `optional`, `description`.
- **Source:** `packages/games/src/lib/types.ts:148`.

### NormalizedSpec (codegen IR)

- **Purpose:** The intermediate representation the codegen pipeline produces by
  resolving every `$ref`/`$input` in a `RandSumSpec` into a flat, concrete
  form before emitting TypeScript. Internal, not a published type.
- **Key attributes:** `rolls` keyed by name, each a `NormalizedRollDefinition`
  with ref-free pools, resolve, outcome, and `kind`-discriminated `details`
  fields (`'leaf' | 'nested' | 'conditional'`).
- **Source:** `packages/games/src/lib/normalizedTypes.ts:124` (`NormalizedSpec`),
  `:109` (`NormalizedRollDefinition`).

## Relationships

| From                                                             | To                                                  | Type                                   | Evidence                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Roll (`roll()`)                                                  | RollerRollResult                                    | produces                               | `packages/roller/src/types/results.ts:93`                        |
| RollerRollResult                                                 | RollRecord                                          | has-many (`rolls`)                     | `packages/roller/src/types/results.ts:71,93`                     |
| RollRecord                                                       | RollParams                                          | has-one (`parameters`)                 | `packages/roller/src/types/results.ts:48`                        |
| RollRecord                                                       | ModifierLog                                         | has-many (`modifierLogs`)              | `packages/roller/src/types/results.ts:54`                        |
| RollOptions                                                      | ModifierOptions                                     | has-one (`modifiers`)                  | `packages/roller/src/notation/types.ts:143`                      |
| ModifierOptions                                                  | DropOptions / KeepOptions / RerollOptions / …       | composed-of                            | `packages/roller/src/notation/types.ts:67-106`                   |
| RANDSUM_MODIFIERS                                                | ModifierDefinition                                  | has-many (registry)                    | `packages/roller/src/modifiers/definitions.ts`                   |
| DiceNotation                                                     | ParsedNotationOptions                               | parsed-into                            | `packages/roller/src/notation/types.ts:113,129`                  |
| RollTraceStep                                                    | RollRecord                                          | derived-from (`traceRoll`)             | `packages/roller/src/trace/`                                     |
| NotationDoc                                                      | ModifierDefinition / DiceSchema                     | derived-from                           | `packages/roller/src/docs/modifierDocs.ts`                       |
| NotationParseError / ModifierError / ValidationError / RollError | RandsumError                                        | extends                                | `packages/roller/src/errors.ts:65-94`                            |
| SchemaError                                                      | RandsumError                                        | extends                                | `packages/games/src/lib/errors.ts:12`                            |
| Game `roll()`                                                    | GameRollResult                                      | produces                               | `packages/games/src/types.ts:10`                                 |
| GameRollResult                                                   | RollRecord (roller)                                 | has-many (`rolls`)                     | `packages/games/src/types.ts:15`                                 |
| RandSumSpec                                                      | RollDefinition                                      | has-one/has-many (`roll` / `rolls`)    | `packages/games/src/lib/types.ts:210,216`                        |
| RandSumSpec                                                      | PoolDefinition / TableDefinition / OutcomeOperation | has-many (`pools`/`tables`/`outcomes`) | `packages/games/src/lib/types.ts:207-209`                        |
| RollDefinition                                                   | InputDeclaration                                    | has-many (`inputs`)                    | `packages/games/src/lib/types.ts:188`                            |
| RollDefinition                                                   | PoolDefinition                                      | references (`dice.pool`, via `$ref`)   | `packages/games/src/lib/types.ts:40,189`                         |
| RollDefinition                                                   | OutcomeOperation / TableDefinition                  | references (`outcome`, via `$ref`)     | `packages/games/src/lib/types.ts:195`                            |
| RandSumSpec                                                      | NormalizedSpec                                      | normalized-into (codegen)              | `packages/games/src/lib/normalizer.ts`, `normalizedTypes.ts:124` |
| NormalizedSpec                                                   | Generated `roll()`                                  | emitted-into (codegen)                 | `packages/games/src/*.generated.ts`                              |
| Generated game `roll()`                                          | roller `roll()`                                     | calls                                  | `packages/games/CLAUDE.md` (imports `@randsum/roller/roll`)      |
| Game packages                                                    | each other                                          | none (forbidden)                       | root `CLAUDE.md`; games depend only on roller                    |

Spec-internal references are **string `$ref` / `$input` pointers**
(`{ "$ref": "#/tables/coreMechanic" }`, `{ "$input": "rating" }`), resolved at
codegen time — implicit, not type-level, relationships. See Confidence.

## Glossary

| Term                              | Definition                                                                                                            | Where it appears                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Notation                          | The string DSL for a roll: `NdS` plus modifier suffixes (`4d6L`, `2d6+3[fire]`). Parsed natively by the roller.       | `packages/roller/src/notation/types.ts:129`; https://notation.randsum.dev                                 |
| Dice pool                         | A group of like dice rolled together (`quantity` × `sides`).                                                          | `packages/roller/src/notation/types.ts:136`; `packages/games/src/lib/types.ts:7`                          |
| Modifier                          | A transformation on a pool's results (drop/reroll/explode/etc.); 19 exist, run in fixed priority order.               | `packages/roller/src/modifiers/definitions.ts`                                                            |
| Drop / Keep (`L`/`H`)             | Remove (drop) or retain (keep) the lowest/highest dice before totaling.                                               | `packages/roller/src/notation/types.ts:14,21`; `drop.ts`/`keep.ts`                                        |
| Reroll (`R{..}`)                  | Reroll dice matching a condition, up to an optional max.                                                              | `packages/roller/src/notation/types.ts:28`; `reroll.ts`                                                   |
| Explode (`!`)                     | On a triggering value, roll an extra die and add it (single pass). Variants: compound, penetrate, explodeSequence.    | `packages/roller/src/notation/types.ts:80-105`; `explode.ts`                                              |
| Unique (`U`)                      | Force all kept dice to distinct values, except listed `notUnique`.                                                    | `packages/roller/src/notation/types.ts:40`; `unique.ts`                                                   |
| Cap (`C{..}`)                     | Clamp rolled values into a comparison range.                                                                          | `packages/roller/src/notation/types.ts:68`; `cap.ts`                                                      |
| Count failures/successes (`F{N}`) | Count dice matching a condition instead of summing; `deduct` subtracts below-threshold from above.                    | `packages/roller/src/notation/types.ts:47`; `count.ts`                                                    |
| Wild die (`W`)                    | D6-System wild die: compounds on max, removes wild + highest on a 1.                                                  | `packages/roller/src/notation/types.ts:100`; `wildDie.ts`                                                 |
| Percentile die (`d%`)             | Equivalent to 1d100.                                                                                                  | `packages/roller/src/types/core.ts:19` (`PercentileDie`)                                                  |
| Fate / Fudge die (`dF`, `dF.2`)   | Faces `[-1,0,1]` (standard) or `[-2..2]` (extended); sum as signed values.                                            | `packages/roller/src/types/core.ts:29-47`; `packages/games/fate.randsum.json`                             |
| Zero-bias die (`zN`)              | A dN with faces `0..N-1` instead of `1..N`.                                                                           | `packages/roller/src/types/core.ts:56`                                                                    |
| Custom-faces die (`d{a,b,c}`)     | Die with explicit numeric or string faces; string faces form a "table die".                                           | `packages/roller/src/types/core.ts:68`; `packages/games/src/lib/types.ts:9`                               |
| Draw die (`DDN`)                  | Sampling without replacement — no repeats until the pool is exhausted.                                                | `packages/roller/src/types/core.ts:77`                                                                    |
| Geometric die (`gN`)              | Roll a dN until the first 1; result is the attempt count.                                                             | `packages/roller/src/types/core.ts:88`                                                                    |
| Annotation / label (`[fire]`)     | A free-text tag attached to a roll, carried through to results.                                                       | `packages/roller/src/types/results.ts:28`; `notation/types.ts:123`                                        |
| Pool condition                    | A success test on a pool ("at least 2 dice show 6"), used in outcome tables.                                          | `packages/games/src/lib/types.ts:17` (`PoolCondition`)                                                    |
| Outcome table                     | A range/exact/condition lookup mapping a resolved value to a labeled result.                                          | `packages/games/src/lib/types.ts:31`; `packages/games/blades.randsum.json`                                |
| Degree of success                 | Outcome resolution by thresholds: critical-success/success/failure/critical-failure.                                  | `packages/games/src/lib/types.ts` (`DegreeOfSuccessOperation`)                                            |
| Resolve strategy                  | How a pool collapses to a value: `sum`, `faces`, `countMatching`, `tableLookup`, `comparePool*`, `remoteTableLookup`. | `packages/games/src/lib/types.ts:124` (`ResolveOperation`)                                                |
| Remote table lookup               | A resolve strategy that fetches an external table at codegen time and bakes it in (e.g. Salvage Union).               | `packages/games/src/lib/types.ts` (`RemoteTableLookupOperation`); `__fixtures__/salvageunion-tables.json` |
| Shortcode                         | A game's stable identifier and subpath name (`blades`, `fifth`, …).                                                   | `packages/games/src/availableGames.generated.ts` (`GameShortcode`, `AVAILABLE_GAMES`)                     |
| Codegen                           | The pipeline that resolves a `.randsum.json` spec to a `NormalizedSpec` and emits a typed `*.generated.ts`.           | `packages/games/codegen.ts`; `src/lib/codegen.ts`                                                         |
| `$ref` / `$input`                 | Spec-internal pointers to a shared section (`#/tables/x`) or a declared user input.                                   | `packages/games/blades.randsum.json`; `src/lib/refResolver.ts`                                            |
| TTRPG standard die set            | The conventional polyhedral set: d4/d6/d8/d10/d12/d20/d100.                                                           | `packages/roller/src/notation/constants.ts:5`                                                             |

## Contexts

The monorepo splits cleanly into four bounded contexts along package
boundaries, with a strict dependency direction (everything flows toward the
roller engine).

### Roller Engine (`packages/roller`)

The zero-dependency dice core: notation parsing/validation/tokenization, the
19-modifier pipeline, RNG, roll execution, static docs, and trace
visualization. Owns all dice mechanics; knows nothing about games.

- Roll, RollOptions, RollParams, RollRecord, RollerRollResult, RollResult
- ModifierDefinition, ModifierOptions, ModifierLog (+ per-modifier option types)
- DiceNotation, ParsedNotationOptions, Token, NotationDoc, RollTraceStep
- RandsumError, NotationParseError, ModifierError, ValidationError, RollError

### Game Interpretation (`packages/games`)

Wraps the roller with game-specific meaning. Declarative `.randsum.json` specs
are code-generated into typed `roll()`s. Depends only on the roller; games
never depend on each other.

- RandSumSpec, RollDefinition, PoolDefinition, PoolCondition
- TableDefinition, TableRange, OutcomeOperation, InputDeclaration
- ResolveOperation, RemoteTableLookupOperation, GameRollResult
- NormalizedSpec / NormalizedRollDefinition (codegen IR), SchemaError
- Games: blades, daggerheart, fate, fifth, pbta, root-rpg, salvageunion

### Notation Specification (`apps/rdn` → notation.randsum.dev)

The formal, external specification of the notation grammar — taxonomy,
faceted classification, conformance levels, and the execution-pipeline
contract. The authoritative reference the engine conforms to (pre-push runs an
`@randsum/rdn conformance:check`).

- Notation grammar, modifier taxonomy, conformance levels (documentation
  context, not runtime entities)

### Consumer Apps (`apps/cli`, `apps/discord-bot`, `apps/site`, `apps/expo`, `packages/dice-ui`)

Surfaces that consume the engine and games: the published CLI, the Discord
bot (Render worker), the docs site (randsum.dev), the Expo dice playground, and
the `dice-ui` React Native component library. These introduce
presentation-layer types (e.g. `dice-ui`'s `kind`-tagged notation-builder
fragments) but no new domain entities.

## Confidence

- **Directly observable:** All roller entities and relationships are read
  straight from exported TypeScript interfaces with explicit return types
  (`isolatedDeclarations` forces this), so they are high-confidence. The error
  hierarchy, modifier registry, and the four bounded contexts map 1:1 to
  package boundaries and are unambiguous (not invented).
- **Spec / game entities** are high-confidence from `packages/games/src/lib/types.ts`
  and the meta-schema, cross-checked against a real spec
  (`blades.randsum.json`). The four-stage pipeline (Dice → Modify → Resolve →
  Outcome) is documented in `packages/games/CLAUDE.md` and reflected in the
  types.
- **Spec-internal relationships are implicit string pointers.** `$ref`
  (`#/tables/...`) and `$input` references are plain strings resolved at codegen
  time by `refResolver.ts` / `externalRefResolver.ts`, not type-level links —
  flagged per the skill's "implicit reference" guidance. The `NormalizedSpec`
  IR is where they become concrete.
- **Correction to the audit brief:** the task context referenced a
  `CollectedResults` discriminated union with `kind: 'union' | 'numeric' |
'opaque' | 'result-mapping'`. **No such type exists in the codebase.** The
  real roller result type is `RollerRollResult`/`RollResult` (not a `kind`
  union). The `kind`-discriminated unions that do exist are `RollTraceStep`
  (`'rolls' | 'divider' | 'arithmetic' | 'finalRolls'`) in roller and the
  codegen IR's `NormalizedDetailsFieldDef` (`'leaf' | 'nested' | 'conditional'`)
  in games; `'result-mapping'` appears only as a codegen emit-helper internal
  label (`packages/games/__tests__/lib/emitUnit.test.ts:302`), and `ResultShape`
  carries the `'numeric' | 'label'` literals. The brief's union appears to be
  stale or from a different revision.
- **`GameRollResult.details` shape** is a conditional/generic type
  (`TDetails extends undefined ? … : …`), so per-game `details` structures are
  defined in each spec rather than as a shared entity — captured at the type
  level only.
- **No persistence layer exists** — there are no migrations, ORM models, or
  database schema. The ontology is derived entirely from types and specs, which
  for this library ecosystem _are_ the source of truth.
