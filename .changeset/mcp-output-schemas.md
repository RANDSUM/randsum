---
'@randsum/mcp': minor
---

The `roll`, `validate` and `roll_game` tools now declare an output schema, so
clients can rely on the shape of `structuredContent`. When a tool fails with a
RANDSUM error, the result carries a second text block with the error `code`, and
the `position` in the notation when there is one.
