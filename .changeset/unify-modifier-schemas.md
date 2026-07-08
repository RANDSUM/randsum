---
"@randsum/roller": patch
---

Unify the duplicated modifier schemas into a single source (internal refactor; no
public API change).

Every modifier previously had its notation schema implemented **twice** — once in
`src/modifiers/<mod>.ts` (schema + behavior + docs, driving `roll()`) and once in
`src/notation/definitions/<mod>.ts` (schema-only, driving parse/validate/
tokenize). The two had drifted, and the main bundle shipped both copies.

- `src/notation/definitions/<mod>.ts` is now the single canonical source of each
  modifier's `pattern`/`parse`/`toNotation`/`toDescription`. Each
  `src/modifiers/<mod>.ts` imports its schema and attaches only dice-pool
  behavior (`apply`/`validate`).
- Static notation docs moved to a dedicated pure-data module
  (`src/docs/modifierDocData.ts`), so `dist/docs/index.js` is now self-contained
  and pulls in zero roll-engine code (the package's "pure static data" claim is
  now literally true), and the tokenize path stays schema-only.

Net effect: `dist/index.js` shrinks ~15.7 → 11.5 KB and `dist/docs/index.js`
~10 → 4.5 KB (brotli); size-limit budgets tightened accordingly. The public
surface is unchanged.
