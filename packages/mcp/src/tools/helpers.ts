import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { z } from 'zod'

/**
 * Type for Zod schema shape (what the MCP SDK expects)
 */
type ZodRawShape = Record<string, z.ZodTypeAny>

/**
 * Type for tool handler return value
 */
interface ToolResponse {
  content: { type: 'text'; text: string }[]
}

/**
 * Interface that extends McpServer with a properly typed tool method
 * This allows us to call server.tool without type assertions
 */
interface TypedMcpServer extends Omit<McpServer, 'tool'> {
  tool<TParams extends ZodRawShape>(
    name: string,
    description: string,
    paramsSchema: TParams,
    handler: (args: { [K in keyof TParams]: z.infer<TParams[K]> }) => ToolResponse
  ): void
}

/**
 * Helper function to register MCP tools with proper typing.
 *
 * This function works around TypeScript's "excessively deep type instantiation"
 * error that occurs when using Zod schemas directly with the MCP SDK's tool method.
 *
 * @param server - The MCP server instance
 * @param name - Tool name
 * @param description - Tool description
 * @param schemaShape - Zod schema shape object
 * @param handler - Tool handler function
 */
export function registerTool<TParams extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  schemaShape: TParams,
  handler: (args: {
    [K in keyof TParams]: z.infer<TParams[K]>
  }) => ToolResponse
): void {
  // Cast server to our typed interface which properly types the tool method
  // This avoids both 'any' and 'unknown' by using a specific interface
  const typedServer = server as TypedMcpServer
  typedServer.tool(name, description, schemaShape, handler)
}
