# @randsum/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) stdio server
that exposes the RANDSUM dice-rolling ecosystem to AI agents. It wraps
[`@randsum/roller`](../roller) and [`@randsum/games`](../games) so an assistant
can roll dice, validate notation, and roll for specific tabletop game systems.

The server speaks MCP over stdio and is published as a CLI binary
(`randsum-mcp`), so any MCP client can launch it with `bunx`/`npx`.

## Tools

| Tool        | Input                                     | Returns                                                              |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `roll`      | `{ notation: string, seed?: number }`     | `total`, per-pool `rolls`, and a human-readable `description`        |
| `validate`  | `{ notation: string }`                    | `valid`, `description` (when valid), `suggestion`/`error` (when not) |
| `roll_game` | `{ game: GameShortcode, params: object }` | game-interpreted `total`, `result`, `details`, and raw `rolls`       |

### `roll`

Rolls [RANDSUM dice notation](https://notation.randsum.dev) (e.g. `4d6L`,
`2d20+5`, `1d100`). Pass an integer `seed` for a deterministic, reproducible
roll.

```json
{ "notation": "4d6L", "seed": 42 }
```

### `validate`

Checks whether a notation string is valid, returning a description when it is
and a suggested fix when it is not (e.g. `d20` → `1d20`).

### `roll_game`

Rolls for one game system and interprets the dice per that game. `game` is one
of `blades`, `daggerheart`, `fate`, `fifth`, `pbta`, `root-rpg`,
`salvageunion`. Only the `params` fields relevant to the chosen game are read:

| Game           | Relevant `params`                                       |
| -------------- | ------------------------------------------------------- |
| `blades`       | `rating`                                                |
| `daggerheart`  | `modifier`, `amplifyHope`, `amplifyFear`, `rollingWith` |
| `fate`         | `modifier`                                              |
| `fifth`        | `modifier`, `rollingWith`, `crit`                       |
| `pbta`         | `stat` (required), `forward`, `ongoing`, `rollingWith`  |
| `root-rpg`     | `bonus` (required), `rollingWith`                       |
| `salvageunion` | `tableName` (required)                                  |

`rollingWith` is `"Advantage"` or `"Disadvantage"`.

```json
{ "game": "fifth", "params": { "modifier": 3, "rollingWith": "Advantage" } }
```

## Configuration

### Claude Code

```bash
claude mcp add randsum -- bunx -y @randsum/mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "randsum": {
      "command": "bunx",
      "args": ["-y", "@randsum/mcp"]
    }
  }
}
```

Any MCP client that can spawn a stdio server works — point it at the
`randsum-mcp` binary (or `bunx @randsum/mcp` / `npx @randsum/mcp`).

## Development

```bash
bun run dev     # run the server from source over stdio
bun run build   # bundle to dist/ (ESM, @randsum/* inlined, SDK external)
bun run test    # unit tests for each tool handler
bun run check   # build + typecheck + format + lint + test
```

To smoke-test the server manually, pipe a JSON-RPC `initialize` message in:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' \
  | bun src/index.ts
```

## License

MIT
