---
'@randsum/games': major
'@randsum/mcp': patch
---

5.0.0 starts a fresh release line for `@randsum/roller` and `@randsum/games` (linked), with no compatibility aliases carried over.

Rename the `ValidationError` type exported from `@randsum/games/schema` to `SpecValidationIssue`, with no alias. It is the `{ path, message }` item of `validateSpec`'s `errors`, and its old name collided with `@randsum/roller`'s `ValidationError` error class.

Migration: replace `import type { ValidationError } from '@randsum/games/schema'` with `import type { SpecValidationIssue } from '@randsum/games/schema'`.
