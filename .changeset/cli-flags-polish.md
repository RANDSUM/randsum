---
"@randsum/cli": minor
---

Add scripting-friendly flags and clearer error handling to the CLI:

- **Unknown-flag detection** — an unrecognized `-`/`--` argument (e.g. `--jsn`)
  now prints a clear `Unknown flag` message and exits 1 instead of being treated
  as dice notation and producing a confusing parse error.
- **Did-you-mean suggestions** — invalid notation errors now append roller's
  `suggestNotationFix` hint (e.g. `Did you mean \`1d20\`?`), matching the Discord bot.
- **`-t`, `--total`** — print only the numeric total per roll (one per line),
  for scripting. Composes with `-r`; cannot be combined with `--json`.
