---
'@randsum/games': minor
'@randsum/mcp': patch
'@randsum/ui': patch
---

Labelled dice show their label in roll results.

- **Games label their pools.** Each named dice pool and conditional pool in a game spec now rolls with its name as the record's `label`, so Daggerheart's records read `Hope`, `Fear`, and `Advantage` or `Disadvantage`.
- **The roll steps name a pool by its label.** In a multi-pool roll, a pool with a label (from a game, or `[fire]` in notation) shows the label in plain text where it showed the notation; a pool without one keeps its notation in code. The same goes for the native components and the MCP App card, whose title for a game roll now reads `Hope + Fear`.
