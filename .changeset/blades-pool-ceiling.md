---
'@randsum/games': minor
---

Raise the Blades in the Dark pool ceiling from 6 to 10.

A Blades action roll routinely exceeds six dice at the table: an action rating
of 3 plus two assists, a push, and a Devil's bargain is a legal ten-dice pool.
The spec capped `rating` at 6, so those rolls threw a validation error instead
of rolling.

The zero-dice description also said "desperate", which named the wrong thing —
Desperate is a *position* in Blades, and you can roll zero dice from any
position. It now describes what the branch actually does: roll two, take the
worst.
