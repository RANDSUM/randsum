---
'@randsum/roller': patch
---

`validateNotation` no longer throws when a repeat operator exceeds its limits (`1d6x5000`, or more than ten nested `xN`). It returns `valid: false` with the limit in `error.message` and the operator's `error.position`, as it does for every other invalid input. The MCP `validate` tool inherits the fix.
