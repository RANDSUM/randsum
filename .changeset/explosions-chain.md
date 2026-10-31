---
'@randsum/roller': minor
'@randsum/games': minor
'@randsum/mcp': minor
---

Explosions chain, and `ro{..}` rerolls every matching die once.

- `!` now explodes again when a new die also triggers, up to 1000 new dice per
  die, as Roll20, Foundry and most dice tools do. It used to stop after one wave.
- Bare `!!` and `!p` (and `!!{..}`, `!p{..}`) keep adding while the added roll
  triggers, up to 1000 rolls, instead of adding one roll. `!!N` and `!pN` still
  stop at N.
- `!p` subtracts 1 from each added roll with no floor, so an added 1 adds
  nothing (Hackmaster). It used to add at least 1.
- `ro{..}` rerolls each matching die once and keeps the new result. It used to
  reroll only the first matching die, and keep rerolling it while it matched.
  The options form is `reroll: { ..., once: true }`; `max: 1` keeps its meaning
  of "at most one die rerolled".
