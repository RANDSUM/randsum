---
'@randsum/roller': patch
'@randsum/mcp': patch
---

Rename the roll path's internal lexer identifiers from "token" to "lexeme". No public API changes: `tokenize`, `Token` and `TokenCategory` are unchanged.
