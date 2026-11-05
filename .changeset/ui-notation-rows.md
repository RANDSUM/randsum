---
'@randsum/ui': minor
---

Each roll step row now shows the notation that made it (`4d6`, `R{1}`, `!`, `L`, `+2`) in its modifier's ink, with the description (`Reroll Exactly 1`) on hover and as its accessible name, in every roller size, the MCP app card and the native components. `TimelineRow` gains `notation`; its `label` is the description, and the initial row's is the core roll's (`Roll 4 6-sided dice`). The notation input colours each modifier in the same ink as its step row, on the web and React Native.
