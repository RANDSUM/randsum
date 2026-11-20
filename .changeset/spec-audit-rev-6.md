---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
'@randsum/notation-spec': patch
---

RDN 0.9.0 revision 6, and the roller brought into line with it.

An audit of the notation spec against its grammar, vectors and the roller found places where the roller dropped part of a notation without a word, or disagreed with the text. The roller now does what the spec says:

- **Drop keeps pool order.** `4d6L` on [6, 1, 3, 2] gives [6, 3, 2], as `4d6K3` always did; it used to sort the survivors. Among equal values the earliest die is removed, for `L`, `H`, `K` and `kl` alike.
- **Rejected instead of half-read:** a count on Reroll Once (`4d6ro{1}2`), a zero Reroll count (`4d6R{1}0`), Keep highest with Keep lowest (`4d6K2kl`), zero or zero-padded sides on special dice (`z0`, `g0`, `DD0`, `z06`), junk in `U{...}` and `!s{...}` (`4d6U{a}`, `4d6!s{4,}`), `KM0`, `K03`, and an operand too large to hold exactly.
- **Accepted, as the grammar reads:** `4d6!!!` (Compound then Explode), `4d6!sa` (Explode then Sort), a Count modifier in each pool (`2d6S{3}+2d6S{3}`), and reroll low or high (`4d6R{<2,>5}`), which used to throw "Impossible comparison".
- **Condition lists are alternatives.** An operator written twice keeps the wider bound (`D{>2,>4}` drops everything above 2) instead of the last one written.
- **Reroll's limit counts dice rerolled**, so `max: 1` with `once` rerolls one die. Its description reads "(up to 2 dice)".
- **Unique** examines its last allowed reroll before giving up.
- **Repeats** are limited by their product: `1d6x1000x1000` is rejected.
- Options with Explode beside Compound, Penetrate or a sequence render notation that reads back (`4d6!!!p!`); they used to throw "Generated notation is invalid".

`@randsum/notation-spec` gains vectors 62 to 105 (several pools, whitespace, conditional Drop and Explode, counts and depths, Wild Die, Inflation and Reduction, negative totals, modifier order against notation order). A response answers several pools as one pool in notation order. The runner now fails an `error` that arrives with a result or with an empty message, and a total on string faces.
