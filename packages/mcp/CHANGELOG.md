# @randsum/mcp

## 0.1.0

### Minor Changes

- [#1152](https://github.com/RANDSUM/randsum/pull/1152) [`2110e9b`](https://github.com/RANDSUM/randsum/commit/2110e9b3e4630bb88ce8868951d45401422eea84) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Initial release of `@randsum/mcp` — a Model Context Protocol stdio server that
  exposes the RANDSUM dice ecosystem to AI agents. Ships the `randsum-mcp` binary
  and three tools:

  - **`roll`** — roll RANDSUM notation (e.g. `4d6L`, `2d20+5`) with an optional
    `seed` for deterministic results; returns the total, per-pool rolls, and a
    description.
  - **`validate`** — validate dice notation, returning a description when valid and
    a suggested fix when not.
  - **`roll_game`** — roll for a specific game system (`blades`, `daggerheart`,
    `fate`, `fifth`, `pbta`, `root-rpg`, `salvageunion`), interpreting the dice per
    that game.

### Patch Changes

- [#1158](https://github.com/RANDSUM/randsum/pull/1158) [`cba0564`](https://github.com/RANDSUM/randsum/commit/cba05643b8cc9c1fb4d0f97bf5ac70f66f369d3b) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Replace the local seeded LCG in `src/rng.ts` with a re-export of
  `createSeededRandom` from `@randsum/roller/random`. The roller factory carries
  the same negative-seed normalization the MCP copy had, so seed sequences
  (including negative seeds) are unchanged.
