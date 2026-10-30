# @randsum/api

The Cloudflare Worker behind **https://api.randsum.dev**: the public RANDSUM REST API at `/v1` and
the hosted RANDSUM MCP server at `/mcp`.

```bash
curl "https://api.randsum.dev/v1/roll?notation=4d6L"
curl "https://api.randsum.dev/v1/games/blades/roll?rating=3"
curl "https://api.randsum.dev/v1/random?min=1&max=6&count=3"
```

To use it from Claude, add a custom connector with the URL `https://api.randsum.dev/mcp`.

Docs: [HTTP API](https://randsum.dev/api/introduction/) · [MCP Server](https://randsum.dev/tools/mcp/)

Private and never published; see [`AGENTS.md`](./AGENTS.md) for development.
