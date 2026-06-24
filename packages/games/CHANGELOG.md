# @randsum/games

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
