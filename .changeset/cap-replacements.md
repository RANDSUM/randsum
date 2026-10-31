---
'@randsum/roller': patch
'@randsum/mcp': patch
---

Cap (`C{..}`) now logs each clamped die as a one-for-one replacement in `modifierLogs[].replacements`, like reroll, unique and replace, so `traceRoll` shows `8 → 7` instead of a removed die beside an added one.
