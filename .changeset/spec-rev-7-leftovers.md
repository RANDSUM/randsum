---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
'@randsum/notation-spec': patch
---

RDN 0.9.0 revision 7, closing what the revision 6 audit left open.

- `validateNotation().notation` keeps the die and the annotation it was given: `z6` is echoed as `1z6`, `d{a,b}` as `1d{a,b}`, `2d6+3[fire]` with its label. It used to hand back `1d6`, which rolls a different die.
- A roll whose pool value or total passes `Number.MAX_SAFE_INTEGER` throws `RollError` in place of returning a rounded or infinite number.
- Count's deduct mode rejects every pair of conditions that would make one value both a success and a failure, such as `#{>=3,<8}`, not only `>=` with `<=`.
- Cap describes `C{>=5}` as "No Rolls greater than 5", which is what it does.
- The conformance vectors cover the repeat operator: a vector's `expectedResults` and an adapter's `results` hold the pool and total of each evaluation (vectors 106 and 107).
