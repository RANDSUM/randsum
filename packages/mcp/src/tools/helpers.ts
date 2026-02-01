import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { z } from 'zod'

/**
 * Type for Zod schema shape (what the MCP SDK expects)
 */
type ZodRawShape = Record<string, z.ZodTypeAny>

/**
 * Type for tool handler return value
 */
export interface ToolResponse {
  content: { type: 'text'; text: string }[]
}

/**
 * Interface that extends McpServer with a properly typed tool method.
 *
 * The MCP SDK's McpServer.tool() method has complex generic types that cause
 * TypeScript's "excessively deep type instantiation" error when used with
 * Zod schemas directly. This interface provides a simplified but correct
 * type signature that matches the runtime behavior.
 *
 * The type assertion from McpServer to TypedMcpServer in registerTool() is
 * UNAVOIDABLE due to this external SDK limitation. It is safe because:
 * 1. TypedMcpServer's tool signature matches McpServer's runtime behavior
 * 2. We only add constraints, not remove them
 * 3. The handler types ensure type-safe tool implementations
 */
interface TypedMcpServer extends Omit<McpServer, 'tool'> {
  tool<TParams extends ZodRawShape>(
    name: string,
    description: string,
    paramsSchema: TParams,
    handler: (args: { [K in keyof TParams]: z.infer<TParams[K]> }) =>
      | ToolResponse
      | Promise<ToolResponse>
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
 * @param handler - Tool handler function (can be sync or async)
 */
export function registerTool<TParams extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  schemaShape: TParams,
  handler: (args: {
    [K in keyof TParams]: z.infer<TParams[K]>
  }) => ToolResponse | Promise<ToolResponse>
): void {
  const typedServer = server as TypedMcpServer
  typedServer.tool(name, description, schemaShape, handler)
}
