---
'@randsum/ui': minor
---

First release of `@randsum/ui`: the RANDSUM roller as React components in three
sizes. `RollerMax` (`/roller-max`) is the full app with history, `RollerCompact`
(`/roller-compact`) is a landscape or portrait panel, and `RollerMini`
(`/roller-mini`) is a single row whose Roll button shows the English description.
Every size shows dice keys by default and takes an optional `presets` array.
`/keys` and `/presets` ship the default key set and each modifier's canonical
keys and examples, and `/styles.css` carries the styles as `--rsui-*` variables.
