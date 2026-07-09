# @randsum/cli

## 4.0.0

### Minor Changes

- [#1133](https://github.com/RANDSUM/randsum/pull/1133) [`b03e630`](https://github.com/RANDSUM/randsum/commit/b03e6302d70f00436d70bb96a909549f1b7952e1) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Add scripting-friendly flags and clearer error handling to the CLI:

  - **Unknown-flag detection** — an unrecognized `-`/`--` argument (e.g. `--jsn`)
    now prints a clear `Unknown flag` message and exits 1 instead of being treated
    as dice notation and producing a confusing parse error.
  - **Did-you-mean suggestions** — invalid notation errors now append roller's
    `suggestNotationFix` hint (e.g. `Did you mean \`1d20\`?`), matching the Discord bot.
  - **`-t`, `--total`** — print only the numeric total per roll (one per line),
    for scripting. Composes with `-r`; cannot be combined with `--json`.

### Patch Changes

- [#1158](https://github.com/RANDSUM/randsum/pull/1158) [`cba0564`](https://github.com/RANDSUM/randsum/commit/cba05643b8cc9c1fb4d0f97bf5ac70f66f369d3b) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Use the new `@randsum/roller/random` `createSeededRandom` instead of a private
  LCG copy. Seed sequences are unchanged for non-negative seeds (`--seed 42`
  output is identical), so this is behavior-preserving.

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

## 1.3.0

### Minor Changes

- [#1018](https://github.com/RANDSUM/randsum/pull/1018) [`fd52c31`](https://github.com/RANDSUM/randsum/commit/fd52c3109c583b835ff7edf35bcff2a79099970a) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Testing changes for 2.0.0 release
