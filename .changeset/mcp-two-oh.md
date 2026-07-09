---
'@randsum/mcp': major
---

Re-release of `@randsum/mcp` as a complete rewrite, superseding the pre-audit 1.x line already on npm. The server now exposes `roll`, `validate`, and `roll_game` tools built on `@randsum/roller` 4.x and `@randsum/games` 4.x (snake_case result strings), with seeded reproducibility via `@randsum/roller/random`. The package version is aligned above the existing 1.1.0 so `latest` moves forward, not backward.
