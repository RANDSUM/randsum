---
"@randsum/games": major
---

Remove the runtime spec interpreter (`loadSpec`/`loadSpecAsync`) from the public `@randsum/games/schema` export. Spec semantics now live solely in the code generator; the interpreter duplicated codegen logic and has been retired. Use the generated subpath exports (e.g. `import { roll } from '@randsum/games/blades'`) or `generateCode` from `@randsum/games/schema` to work with specs programmatically.
