import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from './server'

/**
 * The surface a hosted RANDSUM endpoint needs: the MCP server over Streamable
 * HTTP, plus the plain tool handlers it wraps, so a REST route and an MCP tool
 * call return the same shapes from the same code. `@randsum/api` (the Worker at
 * api.randsum.dev) is the consumer; the stdio bin in `index.ts` does not use it.
 */
export { GAME_INPUTS, isRequiredInput, rollGame } from './tools/rollGame'
export type { GameInputs, GameParams, RollGameToolResult } from './tools/rollGame'
export { rollNotation } from './tools/roll'
export type { RollPoolResult, RollToolInput, RollToolResult } from './tools/roll'
export { validateNotationInput } from './tools/validate'
export type { ValidateToolInput, ValidateToolResult } from './tools/validate'

/**
 * Answers one MCP Streamable HTTP request with a fresh server, statelessly.
 *
 * Every tool is a pure function of its arguments, so there is no session to
 * keep: no `Mcp-Session-Id` is issued, and each POST gets one JSON response
 * instead of an SSE stream. That is what lets this run on a Worker, where no
 * two requests are guaranteed to reach the same isolate.
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })
  await server.connect(transport)
  return transport.handleRequest(request)
}
