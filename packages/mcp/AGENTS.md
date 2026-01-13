# @randsum/mcp - Model Context Protocol Server

## Overview

MCP server exposing RANDSUM dice rolling capabilities to AI agents (Claude, ChatGPT, etc.)

## MCP SDK Patterns

Uses `@modelcontextprotocol/sdk`:

- `McpServer` - Main server class
- `StdioServerTransport` - Default transport (stdin/stdout)
- `StreamableHTTPServerTransport` - HTTP transport
- `SSEServerTransport` - Server-Sent Events transport

## Tool Registration

Tools are registered with `server.tool()`:

```typescript
server.tool('tool-name', 'description', schema.shape, async handler)
```

Tools use Zod schemas for validation. Schemas should:

- Use `.describe()` for parameter documentation
- Include examples in descriptions
- Validate input types strictly

## Transport Modes

Three transport modes supported (via CLI flag `--transport`):

- `stdio` (default) - Standard input/output
- `http` - HTTP server (port 3000 default)
- `sse` - Server-Sent Events (port 3000 default)

## Current Tools

1. **roll** - Execute dice rolls with RANDSUM notation
   - Parameter: `notation` (string, validated with diceNotationSchema)
   - Returns: Formatted roll result with breakdown

2. **validate-notation** - Validate dice notation syntax
   - Parameter: `notation` (string)
   - Returns: Validation result with parsing details or error

## Server Instructions

Server instructions are defined in `createServerInstance()`. They provide:

- Overview of capabilities
- Tool descriptions
- Notation examples
- Gaming applications

See `docs/server-instructions.md` for the full instruction text.

## Version Management

Version is read from `package.json` at runtime via `getPackageVersion()`:

- In development: reads from source `package.json`
- In production: reads from built `dist/../package.json`

## CLI Usage

```bash
npx @randsum/mcp                    # stdio transport (default)
npx @randsum/mcp --transport http   # HTTP transport
npx @randsum/mcp --transport sse --port 3001  # SSE on custom port
```

