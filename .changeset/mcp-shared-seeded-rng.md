---
"@randsum/mcp": patch
---

Replace the local seeded LCG in `src/rng.ts` with a re-export of
`createSeededRandom` from `@randsum/roller/random`. The roller factory carries
the same negative-seed normalization the MCP copy had, so seed sequences
(including negative seeds) are unchanged.
