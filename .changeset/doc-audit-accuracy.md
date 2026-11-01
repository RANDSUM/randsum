---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
'@randsum/ui': patch
---

Correct documentation and descriptions found in a doc accuracy audit. Geometric dice (`gN`) now describe themselves as rolling again on each maximum face and summing every roll, which is what they do, instead of "roll until 1". The `!i` and `!r` modifier docs list the right size sequences, the reroll docs say `max` caps how many dice are rerolled, the games README and schema descriptions match the current API, and the UI README and roller header describe the current mini and compact layouts.
