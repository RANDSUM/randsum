---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
---

Reject notation the parser used to read only part of.

The notation spec forbids silently discarding any part of the input, but a few
forms parsed with one token thrown away: a repeated single-value modifier
(`2d6*2*3` multiplied by 2 only, `4d6V{1=6}V{2=6}` ignored the second replace),
a second annotation, a compound or penetrate depth written beside a condition
(`4d6!!2{>4}` dropped the 2), a zero-sided die in an explode sequence
(`2d6!s{0}`), and an empty custom face (`2d{a,}`). Each now throws a positioned
parse error. Repeats that add up still work: `+2+3`, `-1-1`, `ms{5}ms{2}`, `LL`
and `HH`, and a flag written twice (`4d6!L!`).
