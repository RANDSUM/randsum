---
'@randsum/roller': minor
'@randsum/games': minor
'@randsum/mcp': minor
'@randsum/ui': minor
---

Explosion chains: the explode, compound, penetrate, explode-sequence and wild-die logs carry `explosions`, each die that exploded and the dice its chain rolled (and, for a compounding die, what it became), and `traceRoll` passes them to its steps. The roll steps in `@randsum/ui` (every roller size, the MCP App card and the native components) draw each chain as the die, then an arrow to each die it rolled.
