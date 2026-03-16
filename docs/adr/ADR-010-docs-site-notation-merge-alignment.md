# ADR-010: Documentation Site Alignment with Notation-into-Roller Merge

## Status

Accepted

## Context

ADR-005 (merged commit `e9f7533e`) eliminated `@randsum/notation` as a separate package by merging all notation source into `@randsum/roller`. After the merge, `@randsum/roller` is zero-dependency and exports all notation functions natively — validation, parsing, transformation, tokenization, and comparison utilities are all available directly from roller subpaths and the roller main barrel.

The documentation site (`apps/site/`) was authored before ADR-005 executed. At the time of the notation merge, the site contained approximately 15 files that treated `@randsum/notation` as a live, separately-installable package:

- **Ecosystem overview** (`welcome/ecosystem-overview.mdx`): Shows `@randsum/notation` as the foundation layer of the dependency diagram. Describes it as a standalone package with its own `bun add @randsum/notation` install instruction. Calls roller a package that "depends on notation" and states it "re-exports three notation functions."
- **Notation introduction** (`notation/introduction.mdx`): Page title is `@randsum/notation`. Imports reference `@randsum/notation`. Describes the package as zero-dependency and lists it as a separate npm package.
- **Notation getting started** (`notation/getting-started.mdx`): Install instructions install `@randsum/notation`. Tips direct users to install notation separately from roller.
- **Notation API reference** (`notation/api-reference.mdx`): Lead paragraph states that three functions "require importing from `@randsum/notation` directly."
- **Notation validation-and-parsing** (`notation/validation-and-parsing.mdx`): Imports in examples reference `@randsum/notation`.
- **Design principles in ecosystem overview**: States "`@randsum/notation` has no runtime dependencies; `@randsum/roller` depends only on notation."
- **Bundle size claim**: Lists roller under 10 KB, notation under 13 KB as separate entries.
- **Component-library tool page** (`tools/component-library.mdx`): Lists notation as a peer dependency.

The mismatch between the live implementation and the documentation site creates two concrete problems:

1. Developers reading the docs and following install instructions will install a deprecated package (`@randsum/notation`) instead of the live one.
2. The ecosystem dependency diagram incorrectly depicts the package graph, which is now `@randsum/roller (zero deps) → @randsum/games`.

## Decision

Update all documentation site content to reflect the merged state of the codebase. The governing principles for this update are:

### 1. `@randsum/notation` is not a package consumers install

Remove all `bun add @randsum/notation` / `npm install @randsum/notation` install instructions. Remove all references to `@randsum/notation` as an npm package. The package is deprecated on npm; directing users to it creates a dead-end install experience.

### 2. All notation imports reference `@randsum/roller`

Every code example in the notation section that currently imports from `@randsum/notation` is updated to import from `@randsum/roller` or `@randsum/roller/tokenize`. The import path determines what a developer copies and runs. Wrong import paths are the highest-severity documentation error in a code-focused reference site.

The mapping is:

| Old import | New import |
|---|---|
| `from '@randsum/notation'` | `from '@randsum/roller'` |
| `from '@randsum/notation'` (tokenize/Token) | `from '@randsum/roller/tokenize'` |
| `from '@randsum/notation'` (comparison utils) | `from '@randsum/roller'` |

### 3. The `/notation/` URL path is preserved

The URL paths `randsum.dev/notation/*` stay in place. They document dice notation as a feature area of `@randsum/roller` — the notation syntax spec, validation API, parsing API, and tokenizer. Notation is a first-class concept worth dedicated documentation pages. Removing the pages or redirecting them would lose that structure.

The page titles and descriptions are updated to frame the section as "Dice Notation" or "Notation in roller" rather than "`@randsum/notation` package."

### 4. Roller is described as zero-dependency

The ecosystem overview, roller introduction, and design-principles section are updated to state that `@randsum/roller` has zero runtime dependencies and includes notation parsing natively. The previous formulation ("depends on notation") is removed.

### 5. "Re-export" language is removed

The current docs describe roller as re-exporting three notation functions. This language is incorrect post-merge: roller does not re-export — it exports these functions directly. All "re-exports" phrasing is replaced with "includes" or "exports."

### 6. The dependency diagram is corrected

The ecosystem overview dependency diagram is updated to:

```
@randsum/roller              (zero dependencies — includes notation)
  |
  +-- @randsum/games         (TTRPG game packages)
  |     +-- /blades
  |     +-- /daggerheart
  |     +-- /fifth
  |     +-- /pbta
  |     +-- /root-rpg
  |     +-- /salvageunion
  |
  +-- @randsum/display-utils (UI helpers, peers on roller)
        |
        +-- @randsum/component-library (React components, peers on roller + react)
```

### 7. Bundle size claims are consolidated

Size references that previously listed notation (13 KB) and roller (10 KB) separately are updated to reflect the current combined limit (roller 20 KB, which includes notation). Claims of "ESM + CJS" output are corrected to "ESM only."

### 8. What remains a "notation-only use case"

The original rationale for a separate notation package was: consumers who want validation without rolling. That use case still exists and is still served — by `@randsum/roller/tokenize` for tokenization, and by the main roller barrel for validation functions. The getting-started guide updates the install-for-validation-only use case to: "install `@randsum/roller` and use the validation functions without calling `roll()`."

## Consequences

### Positive

- Developer-facing documentation is accurate. No developer will follow a `bun add @randsum/notation` install instruction and arrive at a deprecated package.
- The ecosystem overview correctly represents the two-package consumer model: `@randsum/roller` for rolling (includes notation) and `@randsum/games` for game-specific mechanics.
- The notation documentation section gains a longer useful life — it is now documentation for a feature of a maintained package, not a deprecated standalone package.
- Import examples throughout the notation section are copy-paste correct.

### Negative

- The `/notation/introduction/` page no longer has an npm link at the bottom. Users who look for an npm badge or install command will not find one in the notation section (they find it in the roller section). This is a deliberate trade-off against the alternative of linking to the deprecated `@randsum/notation` npm page.
- Developers who bookmarked or linked to notation page content expecting `@randsum/notation` install instructions will need to update their references to roller. The transition is eased by leaving a deprecation note on the `@randsum/notation` npm page pointing to roller.
- The "notation as a separate install for lighter weight" use case disappears from the docs. This was a legitimate use case in ADR-003 but never materialized in practice (zero known external `@randsum/notation`-only consumers). Developers who need notation-only without the full roller are directed to `@randsum/roller/tokenize` or the main barrel, which tree-shakes cleanly.

## Files Updated

The following `apps/site/src/content/docs/` files require content changes to reflect this decision:

| File | Change summary |
|---|---|
| `welcome/ecosystem-overview.mdx` | Dependency diagram, foundation-layer card, design principles, bundle size claims, install table |
| `welcome/introduction.mdx` | Any reference to notation as a separate package |
| `notation/introduction.mdx` | Page title, description, all import examples, npm link section |
| `notation/getting-started.mdx` | Install commands, tips about notation vs roller, import examples |
| `notation/api-reference.mdx` | Lead paragraph ("require importing from @randsum/notation directly"), all import examples |
| `notation/validation-and-parsing.mdx` | All import examples |
| `notation/randsum-dice-notation.mdx` | Any package-attribution language |
| `roller/introduction.mdx` | Remove "depends on notation" / "re-exports" language; add "includes notation natively" |
| `roller/getting-started.mdx` | Confirm no outdated notation install instructions |
| `tools/component-library.mdx` | Remove notation from peer dependencies list if present |

## References

- ADR-003: Notation as Separate Package (superseded by ADR-005)
- ADR-005: Merge @randsum/notation back into @randsum/roller (the implementation decision that necessitates this docs update)
- Commit `e9f7533e`: refactor: merge notation into roller, streamline modifier system
- `apps/site/src/content/docs/` — site content directory
- `packages/roller/RANDSUM_DICE_NOTATION.md` — authoritative notation spec (source of truth for the notation reference pages)
