---
'@randsum/games': patch
'@randsum/mcp': patch
---

Fix the root entry so `import { AVAILABLE_GAMES, SchemaError } from '@randsum/games'` loads.

In 4.0.0, `dist/index.js` re-exported two bindings it never declared, so the
import threw at module load in Node and Bun. The cause was the same bunup
self-DCE bug that ADR-018 records for `@randsum/roller`: with `sideEffects:
false` in the package manifest, the build strips exported consts from shared
chunks. The package now builds with `sideEffects: true` and flips it to `false`
only in the published manifest, so consumers keep tree-shaking. The game
subpaths and `./schema` were not affected.
