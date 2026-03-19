# ADR-013: Biome Migration Evaluation

## Status

Accepted (deferred migration)

## Date

2026-03-19

## Context

The RANDSUM monorepo uses ESLint 10 (flat config) + Prettier 3.8 + typescript-eslint 8.57 for linting and formatting. The toolchain consists of 9 devDependencies, 42 configured rules (including type-aware rules and custom AST selectors), and is deeply integrated into lefthook hooks and CI.

A `flatted` transitive dependency vulnerability (GHSA-rf6f-7fwh-wjgh) was blocking the pre-push audit hook. This prompted an evaluation of whether to migrate to Biome.

A 5-agent SCRAMstorm was conducted with agents researching rule coverage, dependency topology, migration effort, long-term architectural health, and toolchain DX.

## Decision

**Stay on ESLint + Prettier. Fix the flatted vulnerability independently. Revisit when Biome reaches type-aware rule parity.**

The flatted vulnerability was resolved by updating the override from 3.4.1 (the vulnerable version) to 3.4.2 — a one-line fix that was incorrectly pinning TO the vulnerable version.

## Biome v2 Assessment (March 2026)

### What Biome v2 CAN replace

| ESLint Rule | Biome Equivalent | Status |
|---|---|---|
| `consistent-type-imports` | `useImportType` | Direct match |
| `no-restricted-imports` | `noRestrictedImports` | Direct match |
| `no-var` | `noVar` | Direct match |
| `prefer-const` | `useConst` (partial) | Only flags unnecessary `let` |
| `object-shorthand` | `useShorthandAssign` | Direct match |
| `no-eval` / `no-implied-eval` | `noGlobalEval` | Direct match |
| Sort imports | `organizeImports` (formatter) | Behavioral difference |
| All Prettier formatting | Biome formatter | Direct match for TS/JS/JSON |

### What Biome v2 CANNOT replace

| ESLint Rule | Gap | Impact |
|---|---|---|
| `strictTypeChecked` (~30 rules) | Biome has 1 type-aware rule (`noFloatingPromises` at ~75% coverage). No `noUnsafeAssignment`, `noUnsafeCall`, `noUnsafeReturn`, `noMisusedPromises`, `noUnnecessaryCondition`, etc. | **Critical** — half the enforcement surface |
| `no-restricted-syntax: TSAsExpression > TSUnknownKeyword` | No built-in equivalent. GritQL plugin may work (see below) | **Critical** — documented CLAUDE.md invariant |
| `no-restricted-syntax: VariableDeclaration[kind="let"]` | `useConst` only flags `let` when never reassigned. Intentional reassignment passes silently. Not a categorical ban. | **High** — project policy is stricter than Biome's rule |
| `prefer-readonly` | No equivalent (requires type-aware analysis) | **Medium** — RollPipeline relies on this |
| `explicit-member-accessibility` | No equivalent | **Medium** |
| `explicit-function-return-type` (with options) | `useExplicitType` exists but coarser — applies to all functions, not just exported ones with the specific exception flags | **Low** — close but not equivalent |
| `naming-convention` (enum members UPPER_CASE) | `useNamingConvention` exists but enum member granularity needs verification | **Low** |

### GritQL Plugin System (new in v2)

Biome v2 introduced [GritQL-based linter plugins](https://biomejs.dev/linter/plugins/) that allow custom pattern-matching rules. This is the closest equivalent to ESLint's `no-restricted-syntax`:

```grit
`$expr as unknown as $type` where {
  register_diagnostic(
    span = $expr,
    message = "Avoid `as unknown as T`. Use type guards instead.",
    severity = "error"
  )
}
```

**Current limitations:**
- Diagnostic-only (no auto-fix)
- TypeScript AST node matching is limited vs ESLint's selector system
- Plugin ecosystem is very young — production stability unclear
- Only supports JavaScript and CSS as target languages (TypeScript implied via JS superlanguage)

**Verdict:** GritQL is the most promising path for the `as unknown as T` ban and potentially a categorical `let` ban. Worth a spike to test, but not production-ready for load-bearing invariants.

### Type-Aware Linting ("Biotype")

Biome v2 ships its own TypeScript type checker implemented in Rust (not using tsc). Currently only `noFloatingPromises` is available, detecting ~75% of what typescript-eslint catches for that specific rule. The [2026 roadmap](https://biomejs.dev/blog/roadmap-2026/) mentions expanding type-aware rules but provides no committed timeline for parity with typescript-eslint's `strictTypeChecked` suite.

### Additional Findings

- **Astro formatting is already non-functional.** `.prettierignore` excludes `*.astro` despite `prettier-plugin-astro` being installed. The "Biome can't format Astro" concern is moot.
- **`packages/games` Prettier dep survives any migration.** Codegen uses Prettier programmatically — this is independent of the lint/format toolchain.
- **CI workflows need zero file changes.** They call package scripts, not tools directly. Only `package.json` script content changes.
- **Biome's config discovery is cleaner.** A root `biome.json` replaces the `../../eslint.config.js` relative path pattern.
- **Speed gain is negligible at this scale.** ~100 source files means the absolute difference is <1 second.

## Revisit Criteria

Re-evaluate the Biome migration when **any two** of these conditions are met:

1. Biome ships `noUnsafeAssignment` and `noUnsafeCall` (the most impactful type-aware rules)
2. Biome's type-aware rule count reaches 10+ rules from the `strictTypeChecked` set
3. GritQL plugins reach stable status with confirmed TypeScript AST node support
4. A categorical `let` ban is available (not just `useConst`)

**Track:** [biomejs/biome#3187](https://github.com/biomejs/biome/issues/3187) (type-aware linter umbrella issue)

## Alternatives Considered

| Option | Support | Verdict |
|---|---|---|
| Fix flatted + write ADR (this option) | 5/5 unanimous | **Accepted** |
| Full Biome migration (accept rule losses) | 1/5 | Rejected — loses ~30 type-aware rules and documented invariants |
| Hybrid (Biome formatter + ESLint linter) | 4/5 | Deferred — lateral tool-count move with modest benefit. Viable future path. |
| Biome for new packages only | 0/5 | Rejected — two parallel lint configs creates more complexity than it resolves |

## Consequences

- The `flatted` vulnerability is resolved independently (override updated to 3.4.2)
- All 42 ESLint rules remain enforced, including type-aware and custom AST selectors
- The 9 lint/format devDependencies remain — acceptable given full rule preservation
- Future migration path is documented with clear, measurable revisit criteria
- The hybrid option (Biome formatter + ESLint linter) remains available as a future improvement

## References

- SCRAMstorm workspace: `~/.scram/brainstorm--RANDSUM--biome-migration--20260319-162343/`
- [Biome v2 announcement](https://biomejs.dev/blog/biome-v2/)
- [Biome 2026 roadmap](https://biomejs.dev/blog/roadmap-2026/)
- [Biome linter plugins (GritQL)](https://biomejs.dev/linter/plugins/)
- [Type-aware linter umbrella issue](https://github.com/biomejs/biome/issues/3187)
- [flatted vulnerability GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh)
