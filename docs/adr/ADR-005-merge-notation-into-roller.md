# ADR-005: Merge @randsum/notation back into @randsum/roller

## Status

Accepted

## Context

`@randsum/notation` was extracted from `@randsum/roller` to allow notation parsing, validation, and types to be consumed independently. In practice, this split has not delivered the expected benefits:

- **Minimal independent consumers**: Only 2 packages outside of roller import from notation directly — `@randsum/component-library` (1 source file + 1 test, both using `tokenize`) and `apps/cli` (8 files, all using `tokenize` or `Token` types). All other packages go through roller.
- **33 cross-package imports across 30 files**: Roller imports heavily from notation and re-exports most of its API for backward compatibility.
- **Two build steps**: Notation must build before roller, creating CI friction and worktree issues (agents frequently hit "dist not built" errors).
- **Version coordination overhead**: Bumping notation requires bumping roller's dependency.
- **Modifier definition split**: Every modifier has its schema in notation and behavior in roller. Adding a modifier touches both packages — the modifier count grew from 14 to 19 in one session, each requiring changes in both packages.
- **Type duplication**: `ModifierOptions` in notation, `ModifierOptionTypes` mirrored in roller's schema.ts.
- **DSL evolution blocked**: The notation system is converging toward a full DSL (tokenizer, parser, type system, evaluator, validator, serializer are all present). Splitting the parser and evaluator across packages creates artificial boundaries that fight DSL cohesion.

## Decision

Merge `@randsum/notation` back into `@randsum/roller`. All notation source files move to `packages/roller/src/notation/`. Subpath exports on roller (`./tokenize`, `./comparison`) preserve independent consumption of notation utilities without the rolling engine.

`packages/notation/` is deleted. `@randsum/notation` is deprecated on npm with a pointer to `@randsum/roller`.

See `docs/specs/MERGE-NOTATION-INTO-ROLLER.md` for the full implementation spec.

## Consequences

### Positive
- Eliminates 33 cross-package imports across 30 files (become internal relative paths)
- Removes a build dependency (single build step, no "dist not built" errors in worktrees)
- Simplifies modifier development — schema and behavior are co-located in the same package
- Unblocks DSL evolution — tokenizer, parser, and evaluator are co-located
- Reduces version coordination overhead
- Eliminates re-export boilerplate in roller
- Roller becomes zero-dependency

### Negative
- Slightly larger package for consumers who only need validation (mitigated by subpath exports and tree-shaking)
- Breaking change for consumers importing directly from `@randsum/notation` (migrate to `@randsum/roller` or `@randsum/roller/tokenize`)
- `@randsum/notation` must be deprecated on npm

### Subpath Export Strategy

The two notation subpaths with independent utility become roller subpaths:

```jsonc
// @randsum/roller package.json exports (added)
"./tokenize": {
  "import": {
    "types": "./dist/notation/tokenize.d.ts",
    "default": "./dist/notation/tokenize.js"
  }
},
"./comparison": {
  "import": {
    "types": "./dist/notation/comparison/index.d.ts",
    "default": "./dist/notation/comparison/index.js"
  }
}
```

The `./validateNotation` subpath from notation is not replicated — validation is already available via `@randsum/roller` main barrel and `@randsum/roller/validate`.

### Migration Path

1. Move all notation source files into `packages/roller/src/notation/`
2. Update all internal imports (33 cross-package → relative paths)
3. Add `./tokenize` and `./comparison` subpath exports to roller's package.json
4. Remove `@randsum/notation` from roller's dependencies
5. Update component-library and CLI imports (`from '@randsum/notation'` → `from '@randsum/roller/tokenize'`)
6. Publish new roller version
7. Deprecate `@randsum/notation` on npm
8. Delete `packages/notation/`

## Reversal Context (2026-03-16)

This ADR was previously rejected based on the four-panel audit of 2026-03-14, which concluded that the notation split was "architecturally correct." Three of four auditors endorsed maintaining `@randsum/notation` as a separate zero-dependency package. ADR-003 was identified as the governing decision.

The rejection is reversed for the following reasons:

1. **The independent-consumption benefit never emerged.** In the months since the audit, zero external consumers of `@randsum/notation` appeared outside the monorepo itself. The only internal consumers (`apps/cli` and `@randsum/component-library`) both use only `tokenize` and `Token` types, which are trivially migrated to `@randsum/roller/tokenize`.

2. **The build friction is higher than estimated.** Multi-agent development sessions consistently hit "dist not built" errors because notation must build before roller. This is not theoretical — it actively slows development work.

3. **Modifier development ergonomics are worse than expected.** Every new modifier requires parallel edits in two packages. With the modifier count growing (14 → 19+), the overhead is compounding. Co-location would have saved significant work.

4. **Subpath exports fully solve the original concern.** The reason notation was extracted (independent consumption without the roll engine) is satisfied by `@randsum/roller/tokenize` and `@randsum/roller/comparison`. Consumers get isolation without a separate package.

5. **ADR-006 establishes the notation scope boundary without requiring a separate package.** The concerns about DSL scope creep are now governed by a separate decision record, not by package boundaries.

ADR-003 is superseded by this reversal. The governing decision for notation is now this ADR-005 (Accepted).

## References
- ADR-003: Notation as Separate Package (superseded by this decision)
- ADR-006: Notation Scope Boundary (governs what belongs in notation/roller vs. game packages)
- `docs/specs/MERGE-NOTATION-INTO-ROLLER.md` — implementation spec
- Issue #1000: chore: merge @randsum/notation back into @randsum/roller
