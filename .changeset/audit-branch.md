---
"@randsum/roller": minor
"@randsum/games": minor
"@randsum/cli": minor
"@randsum/dice-ui": major
---

Audit pass: 30 prioritized improvements landed across the ecosystem.

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
