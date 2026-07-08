---
"@randsum/games": major
---

Unify every enum-like `result` string to `snake_case` across all seven games, plus spec-ergonomics and hermetic-codegen improvements.

**Breaking — result strings changed.** Previously each game used its own casing convention (blades lowercase, pbta already snake_case, root-rpg Title-Case-with-spaces, fate Title-Case ladder, daggerheart an embedded space). They are now uniformly `snake_case`. Switch on these machine-friendly values and derive human-readable labels at your display layer. Free-text strings from data tables (e.g. Salvage Union's `remoteTableLookup` result text) are data, not enums, and are unchanged.

Full old → new mapping (only changed values are listed; games/values not listed were already `snake_case` or single lowercase words and are unchanged):

| Game           | Old result                                     | New result                         |
| -------------- | ---------------------------------------------- | ---------------------------------- |
| `daggerheart`  | `critical hope`                                | `critical_hope`                    |
| `daggerheart`  | `hope`                                         | `hope` (unchanged)                 |
| `daggerheart`  | `fear`                                         | `fear` (unchanged)                 |
| `fate`         | `Legendary`                                    | `legendary`                        |
| `fate`         | `Epic`                                         | `epic`                             |
| `fate`         | `Fantastic`                                    | `fantastic`                        |
| `fate`         | `Superb`                                       | `superb`                           |
| `fate`         | `Great`                                        | `great`                            |
| `fate`         | `Good`                                         | `good`                             |
| `fate`         | `Fair`                                         | `fair`                             |
| `fate`         | `Average`                                      | `average`                          |
| `fate`         | `Mediocre`                                     | `mediocre`                         |
| `fate`         | `Poor`                                         | `poor`                             |
| `fate`         | `Terrible`                                     | `terrible`                         |
| `root-rpg`     | `Strong Hit`                                   | `strong_hit`                       |
| `root-rpg`     | `Weak Hit`                                     | `weak_hit`                         |
| `root-rpg`     | `Miss`                                         | `miss`                             |
| `pbta`         | `strong_hit`                                   | `strong_hit` (unchanged)           |
| `pbta`         | `weak_hit`                                     | `weak_hit` (unchanged)             |
| `pbta`         | `miss`                                         | `miss` (unchanged)                 |
| `blades`       | `critical` / `success` / `partial` / `failure` | unchanged (already lowercase)      |
| `fifth`        | —                                              | no enum result strings (unchanged) |
| `salvageunion` | remote-table result text                       | unchanged (data, not an enum)      |

The exported result-type unions change accordingly, e.g. `DaggerheartRollResult` is now `'critical_hope' | 'hope' | 'fear'`, `FateRollResult` is the lowercase ladder, and `RootRpgRollResult` is `'strong_hit' | 'weak_hit' | 'miss'`.

**Non-breaking internals bundled in this release:**

- **Open-ended outcome ranges.** pbta and root-rpg replaced hand-computed outcome bounds (`{ min: -11, max: 27 }` / `{ min: -18, max: 32 }`) with the schema's open-ended `min`-only / `max`-only ranges, so the ladders no longer carry brittle magic numbers.
- **Hermetic codegen.** `bun run gen` no longer hits the network: remote table data (Salvage Union) is read from the checked-in `__fixtures__/<shortcode>-tables.json` snapshot. Pass `--refresh-remote` to explicitly refetch and rewrite the snapshot. Running `gen` twice in a row leaves the tree clean.
- **`./schema` subpath.** `generateCode` now exposes its `GenerateCodeOptions` second parameter to external consumers, so a caller can inject its own `remoteDataCache`.
- **ajv strict-mode warning removed** from the validator (`allowUnionTypes: true`).
