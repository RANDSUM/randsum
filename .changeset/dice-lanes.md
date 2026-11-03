---
'@randsum/ui': minor
'@randsum/mcp': patch
---

Roll steps follow each die. `<randsum-readout>` and `<randsum-roll-steps>` (and the React, Vue, Svelte and native components) take a `layout`: `lanes` (the default; Max and the MCP App card) gives each die a column that carries it down until a step changes it, with explosions branching into new lanes and a Result row; `stacks` (Compact and Mini) keeps one row of the final dice with what each changed die was stacked above it. Step names and pips take their modifier's ink through new `--rsui-ink-*` tokens (`--rsui-line` for the lanes), plus and minus show as green and red cells, and the native theme gains the same colours.
