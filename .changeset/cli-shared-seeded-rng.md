---
"@randsum/cli": patch
---

Use the new `@randsum/roller/random` `createSeededRandom` instead of a private
LCG copy. Seed sequences are unchanged for non-negative seeds (`--seed 42`
output is identical), so this is behavior-preserving.
