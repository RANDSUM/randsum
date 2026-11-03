---
'@randsum/mcp': patch
---

`roll` and `roll_game` results now include `initialRolls`, every die as first rolled before modifiers, so a model reading the result sees the dice that were dropped as well as the ones that count. The server instructions also say plainly to roll through the tools, never with code.
