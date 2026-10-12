---
'@randsum/games': minor
'@randsum/mcp': patch
---

Each game subpath now exports `inputs`, the spec's input declarations
(type, minimum, maximum, default, enum, optional, description) as a const
object, so a consumer can build a form or schema from the same ranges `roll()`
validates against:

```ts
import { inputs } from '@randsum/games/blades'
inputs.rating.maximum // 10
```

The MCP `roll_game` tool now builds its `params` schema from those exports.
Clients see one object schema per game with integer types, bounds, enums and
the spec's descriptions, and `params` is checked against the chosen game. The
old hand-written schema said the Blades rating was 0-4 (the spec allows 0-10),
described the 5e `crit` flag as doubling dice (it checks for natural 1 and 20),
and accepted fractional or unbounded numbers for `modifier` and `stat`.
