---
'@randsum/mcp': minor
'@randsum/ui': minor
---

The MCP server's `roll` and `roll_game` tools now come with an MCP App: in Claude and any other host that supports MCP Apps, a roll shows as a card with the total, every step of the dice and a Roll again button, themed to the host.

- **`@randsum/ui/mcp-app`**: `<randsum-mcp-app>`, which speaks the MCP Apps protocol to its host, shows the server's roll in the readout and asks the host to call the tool again for a reroll. It never rolls on its own.
- **`@randsum/ui/mcp-app-page`**: the element as one self-contained HTML page, exported as a string.
- **`@randsum/mcp`**: serves that page as the `ui://randsum/roll.html` resource and points `roll` and `roll_game` at it. Each roll's records travel in the result's `_meta` for the card; the structured result and text are unchanged.
