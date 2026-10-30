---
'@randsum/mcp': minor
---

Add a `@randsum/mcp/remote` export: `handleMcpRequest(request)` answers an MCP
Streamable HTTP request statelessly with JSON, for hosting the server on a
Worker or any Fetch-API runtime, alongside the tool handlers it wraps. The
`randsum-mcp` stdio bin is unchanged. The same server is now hosted at
`https://api.randsum.dev/mcp`.

The package now declares `exports`, and the root `@randsum/mcp` is not one of
them: importing it only ever started a stdio server on the importing process.
Run the server through the `randsum-mcp` bin (`npx @randsum/mcp`) as before.
