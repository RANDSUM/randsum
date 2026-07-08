---
"@randsum/roller": major
---

Prune dead registry helpers and leaked internal exports from the public surface.

**Breaking — the following were removed from the `@randsum/roller` main barrel.**
They were never part of the documented public API; each is either fully internal
now or gone entirely. If you imported any of them from `@randsum/roller`, switch
to the documented API (`notationToOptions`, `optionsToNotation`,
`optionsToDescription`, `modifiersToNotation`, `modifiersToDescription`,
`validateNotation`, `isDiceNotation`, `suggestNotationFix`).

Removed barrel exports:

- `optionsToSidesFaces` — now internal to `src/notation/transformers/`
- `listOfNotations` — now internal to `src/notation/parse/`
- `coreNotationPattern` — now internal to `src/notation/`
- `formatHumanList` — now internal to `src/notation/`
- `TTRPG_STANDARD_DIE_SET` — now internal to `src/notation/constants`
- `parseComparisonNotation` — now internal to `src/notation/comparison/`
- `hasConditions` — now internal to `src/notation/comparison/`
- `formatComparisonNotation` — now internal to `src/notation/comparison/`
- `formatComparisonDescription` — now internal to `src/notation/comparison/`
- `TokenType` type alias (was `= string`) — removed from the barrel and the
  `./tokenize` subpath; use `Token['key']` / `TokenCategory` instead

Removed dead registry helpers (`src/modifiers/registry.ts`), which duplicated
`src/notation/transformers/modifiersToStrings.ts` and had no production
consumers: `getModifier`, `hasModifier`, `getAllModifiers`,
`processModifierNotations`, `processModifierDescriptions`, `modifierToNotation`,
`modifierToDescription`.
