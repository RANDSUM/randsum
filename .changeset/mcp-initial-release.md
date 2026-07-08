---
"@randsum/mcp": minor
---

Initial release of `@randsum/mcp` — a Model Context Protocol stdio server that
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
