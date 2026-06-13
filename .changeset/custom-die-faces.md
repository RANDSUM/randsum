---
"@randsum/games": minor
---

Add custom die faces to the spec format. A pool may now declare `faces` instead of `sides`:

- **Numeric faces** (e.g. `{ "faces": [-1, 0, 1] }` for a Fate/Fudge die) roll and sum as their values and feed outcome ranges — unblocks Fate-style games (#940).
- **String faces** (e.g. `{ "faces": ["hit", "miss", "crit"] }`, a "table die") with `resolve: "faces"` resolve to the rolled label, generating a face-label result union type.

Codegen emits `<quantity>d{...}` notation for faces pools. Faces are not yet supported inside multi-pool (`dicePools`) or conditional pools.
