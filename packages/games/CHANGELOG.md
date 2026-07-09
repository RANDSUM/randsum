# @randsum/games

## 4.0.0

### Major Changes

- [#1150](https://github.com/RANDSUM/randsum/pull/1150) [`6dc2cf6`](https://github.com/RANDSUM/randsum/commit/6dc2cf6c3ed4489733364a12567211dd9b161117) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Unify every enum-like `result` string to `snake_case` across all seven games, plus spec-ergonomics and hermetic-codegen improvements.

  **Breaking — result strings changed.** Previously each game used its own casing convention (blades lowercase, pbta already snake_case, root-rpg Title-Case-with-spaces, fate Title-Case ladder, daggerheart an embedded space). They are now uniformly `snake_case`. Switch on these machine-friendly values and derive human-readable labels at your display layer. Free-text strings from data tables (e.g. Salvage Union's `remoteTableLookup` result text) are data, not enums, and are unchanged.

  Full old → new mapping (only changed values are listed; games/values not listed were already `snake_case` or single lowercase words and are unchanged):

  | Game           | Old result                                     | New result                         |
  | -------------- | ---------------------------------------------- | ---------------------------------- |
  | `daggerheart`  | `critical hope`                                | `critical_hope`                    |
  | `daggerheart`  | `hope`                                         | `hope` (unchanged)                 |
  | `daggerheart`  | `fear`                                         | `fear` (unchanged)                 |
  | `fate`         | `Legendary`                                    | `legendary`                        |
  | `fate`         | `Epic`                                         | `epic`                             |
  | `fate`         | `Fantastic`                                    | `fantastic`                        |
  | `fate`         | `Superb`                                       | `superb`                           |
  | `fate`         | `Great`                                        | `great`                            |
  | `fate`         | `Good`                                         | `good`                             |
  | `fate`         | `Fair`                                         | `fair`                             |
  | `fate`         | `Average`                                      | `average`                          |
  | `fate`         | `Mediocre`                                     | `mediocre`                         |
  | `fate`         | `Poor`                                         | `poor`                             |
  | `fate`         | `Terrible`                                     | `terrible`                         |
  | `root-rpg`     | `Strong Hit`                                   | `strong_hit`                       |
  | `root-rpg`     | `Weak Hit`                                     | `weak_hit`                         |
  | `root-rpg`     | `Miss`                                         | `miss`                             |
  | `pbta`         | `strong_hit`                                   | `strong_hit` (unchanged)           |
  | `pbta`         | `weak_hit`                                     | `weak_hit` (unchanged)             |
  | `pbta`         | `miss`                                         | `miss` (unchanged)                 |
  | `blades`       | `critical` / `success` / `partial` / `failure` | unchanged (already lowercase)      |
  | `fifth`        | —                                              | no enum result strings (unchanged) |
  | `salvageunion` | remote-table result text                       | unchanged (data, not an enum)      |

  The exported result-type unions change accordingly, e.g. `DaggerheartRollResult` is now `'critical_hope' | 'hope' | 'fear'`, `FateRollResult` is the lowercase ladder, and `RootRpgRollResult` is `'strong_hit' | 'weak_hit' | 'miss'`.

  **Non-breaking internals bundled in this release:**

  - **Open-ended outcome ranges.** pbta and root-rpg replaced hand-computed outcome bounds (`{ min: -11, max: 27 }` / `{ min: -18, max: 32 }`) with the schema's open-ended `min`-only / `max`-only ranges, so the ladders no longer carry brittle magic numbers.
  - **Hermetic codegen.** `bun run gen` no longer hits the network: remote table data (Salvage Union) is read from the checked-in `__fixtures__/<shortcode>-tables.json` snapshot. Pass `--refresh-remote` to explicitly refetch and rewrite the snapshot. Running `gen` twice in a row leaves the tree clean.
  - **`./schema` subpath.** `generateCode` now exposes its `GenerateCodeOptions` second parameter to external consumers, so a caller can inject its own `remoteDataCache`.
  - **ajv strict-mode warning removed** from the validator (`allowUnionTypes: true`).

### Patch Changes

- Updated dependencies [[`47a37fe`](https://github.com/RANDSUM/randsum/commit/47a37fe5b460d93bdf9b77f5e8249f7ad5d4eed9), [`cba0564`](https://github.com/RANDSUM/randsum/commit/cba05643b8cc9c1fb4d0f97bf5ac70f66f369d3b), [`c32837d`](https://github.com/RANDSUM/randsum/commit/c32837d722cf737e2b400585a7632d9330bfc24d), [`8fcab44`](https://github.com/RANDSUM/randsum/commit/8fcab447ad14cb01eaf0c05415347be51601a5f3)]:
  - @randsum/roller@4.0.0

## 3.0.1

### Patch Changes

- [#1088](https://github.com/RANDSUM/randsum/pull/1088) [`7faf232`](https://github.com/RANDSUM/randsum/commit/7faf232d94dc7b7a46a07abd55813e786d536572) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Verify the npm OIDC Trusted Publishing release pipeline end-to-end. No functional or API change — release-infrastructure smoke test only.

## 3.0.0

### Major Changes

- [`64b6b93`](https://github.com/RANDSUM/randsum/commit/64b6b93d06f5b5acd777aa1bc020699e514c5f31) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Remove the runtime spec interpreter (`loadSpec`/`loadSpecAsync`) from the public `@randsum/games/schema` export. Spec semantics now live solely in the code generator; the interpreter duplicated codegen logic and has been retired. Use the generated subpath exports (e.g. `import { roll } from '@randsum/games/blades'`) or `generateCode` from `@randsum/games/schema` to work with specs programmatically.

### Minor Changes

- [`5f67558`](https://github.com/RANDSUM/randsum/commit/5f675587e42761190a2df403802956dbbd237f6e) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Add custom die faces to the spec format. A pool may now declare `faces` instead of `sides`:

  - **Numeric faces** (e.g. `{ "faces": [-1, 0, 1] }` for a Fate/Fudge die) roll and sum as their values and feed outcome ranges — unblocks Fate-style games ([#940](https://github.com/RANDSUM/randsum/issues/940)).
  - **String faces** (e.g. `{ "faces": ["hit", "miss", "crit"] }`, a "table die") with `resolve: "faces"` resolve to the rolled label, generating a face-label result union type.

  Codegen emits `<quantity>d{...}` notation for faces pools. Faces are not yet supported inside multi-pool (`dicePools`) or conditional pools.

- [`911bc20`](https://github.com/RANDSUM/randsum/commit/911bc205d22ad9cd325ea8a8a870c9b9f7f5ba33) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Add the Fate Core game package (`@randsum/games/fate`, [#940](https://github.com/RANDSUM/randsum/issues/940)), unblocked by the custom-die-faces feature. `roll()` throws four Fate dice (`faces: [-1, 0, 1]`), applies an optional `modifier` (the skill rating, an integer in `[-2, 4]`, default `0`), and maps the total to the Fate ladder adjective rungs (Legendary down through Terrible), clamping the open ends.

  Also hardens the codegen string-literal interpolation: author-supplied strings (result labels, descriptions, enum values, error templates) are now escaped before being emitted into generated TypeScript, so a quote, backslash, or newline can no longer break or inject into the generated module.

  > Note: the Fate ladder rung names and the modifier range deserve a human TTRPG-accuracy review before release.

## 2.0.0

### Minor Changes

- [#1056](https://github.com/RANDSUM/randsum/pull/1056) [`6cf8b29`](https://github.com/RANDSUM/randsum/commit/6cf8b298a04d5aa2f6b7ca2ab8815bf2ebb01afb) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Audit pass: 30 prioritized improvements landed across the ecosystem.

  **@randsum/roller**

  - Fix `explodeSequence` requiring `randomFn` without declaring it (raw `Error` → proper `ModifierError`)
  - Add `integerDivide` and `modulo` to `traceRoll` arithmetic step types
  - Remove `registry.parseModifiers` dead-code parser (production uses `MODIFIER_SCHEMAS`)
  - Correct `!` modifier description (single-wave behavior, not chained)
  - Restore tree-shaking: `sideEffects: false`

  **@randsum/games**

  - Fix D&D 5e nat 1/20 inversion under advantage/disadvantage (read kept die, not RNG-order initial)
  - Add Root RPG mastery / helping (3d6 keep highest 2) via `rollingWith: Advantage/Disadvantage`

  **@randsum/cli**

  - stdin / pipe support and non-zero exit on error
  - Remove Ink TUI; CLI is now a thin one-shot binary (drops `-i`/`--interactive`)

  **@randsum/dice-ui** (BREAKING)

  - Remove `./ink` subpath export and all Ink-based components. Consumers that imported from `@randsum/dice-ui/ink` should pin the prior version or fork. Web (`.tsx`) and native (`.native.tsx`) entrypoints unchanged.

  **Repo-wide**

  - CI now uploads coverage to Codecov, runs bench regression gate, includes expo in the test matrix, and serializes `bun install` before parallel pre-commit steps
  - Discord bot: ephemeral roll option (`hidden: boolean`)
  - TS consolidated on `catalog:` (6.0.2 everywhere)
  - SECURITY.md rewritten for scoped packages; bug report + PR templates updated
  - Phantom Railway docs stripped; RDN version claims rolled back to match shipped spec
  - `check:all` script added; docs aligned

### Patch Changes

- Updated dependencies [[`6cf8b29`](https://github.com/RANDSUM/randsum/commit/6cf8b298a04d5aa2f6b7ca2ab8815bf2ebb01afb)]:
  - @randsum/roller@2.0.0

## 1.3.0

### Minor Changes

- [#1018](https://github.com/RANDSUM/randsum/pull/1018) [`fd52c31`](https://github.com/RANDSUM/randsum/commit/fd52c3109c583b835ff7edf35bcff2a79099970a) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Testing changes for 2.0.0 release

### Patch Changes

- Updated dependencies [[`fd52c31`](https://github.com/RANDSUM/randsum/commit/fd52c3109c583b835ff7edf35bcff2a79099970a)]:
  - @randsum/roller@1.3.0
