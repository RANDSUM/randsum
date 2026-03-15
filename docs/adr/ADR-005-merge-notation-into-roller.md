# ADR-005: Merge @randsum/notation back into @randsum/roller

## Status
Proposed

## Context

`@randsum/notation` was extracted from `@randsum/roller` to allow notation parsing, validation, and types to be consumed independently. In practice, this split has not delivered the expected benefits:

- **No independent consumers**: Only 2 files outside of roller import from notation directly (both in `@randsum/component-library` for `tokenize`). All other packages go through roller.
- **31 cross-package imports**: Roller imports heavily from notation and re-exports most of its API for backward compatibility.
- **Two build steps**: Notation must build before roller, creating CI friction and worktree issues (agents frequently hit "dist not built" errors).
- **Version coordination overhead**: Bumping notation requires bumping roller's dependency.
- **Modifier definition split**: Every modifier has its schema in notation and behavior in roller. Adding a modifier touches both packages — the modifier count grew from 14 to 19 in one session, each requiring changes in both packages.
- **Type duplication**: `ModifierOptions` in notation, `ModifierOptionTypes` mirrored in roller's schema.ts.
- **DSL evolution blocked**: The notation system is converging toward a full DSL (tokenizer, parser, type system, evaluator, validator, serializer are all present). Splitting the parser and evaluator across packages creates artificial boundaries that fight DSL cohesion.

## Decision

Merge `@randsum/notation` back into `@randsum/roller`. Use subpath exports to preserve the ability to import validation and tokenization without the rolling engine.

## Consequences

### Positive
- Eliminates 31 cross-package imports (become internal module paths)
- Removes a build dependency (single build step)
- Simplifies modifier development (schema + behavior in one package)
- Unblocks DSL evolution (tokenizer/parser/evaluator co-located)
- Reduces version coordination overhead
- Eliminates re-export boilerplate in roller

### Negative
- Slightly larger package for consumers who only need validation (mitigated by subpath exports and tree-shaking)
- Breaking change for the 2 files importing directly from `@randsum/notation` (component-library switches to `@randsum/roller/tokenize`)
- `@randsum/notation` package must be deprecated on npm

### Subpath Export Strategy
```jsonc
// @randsum/roller package.json exports
{
  ".": "./dist/index.js",
  "./validate": "./dist/validate.js",
  "./tokenize": "./dist/tokenize.js",
  "./types": "./dist/types.js"
}
```

### Migration Path
1. Move all notation source files into roller's source tree
2. Update all internal imports (31 cross-package → relative)
3. Add subpath exports to roller's package.json
4. Update component-library imports (2 files)
5. Publish new roller version with notation included
6. Deprecate `@randsum/notation` on npm with deprecation message pointing to roller
7. Remove `packages/notation/` directory

## References
- ADR-003: Notation as Separate Package (this reverses that decision based on new evidence)
- Current notation consumers: roller (31 imports), component-library (2 imports for tokenize)
- Bundle sizes: notation 180K dist, roller 244K dist
