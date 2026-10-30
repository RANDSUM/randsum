---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
---

Parse `!R{...}` and `!ro{...}` as Explode followed by Reroll instead of rejecting them as a malformed Reduction (`!r`). `4d6!R{<3}` now explodes and rerolls results under 3.
