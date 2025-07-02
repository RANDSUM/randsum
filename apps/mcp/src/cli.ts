export interface ServerOptions {
  transport: 'stdio' | 'http'
  port: number
  host: string
  verbose: boolean
}

export function parseArgs(): ServerOptions {
  const args = process.argv.slice(2)
  const options: ServerOptions = {
    transport: 'stdio',
    port: 3000,
    host: 'localhost',
    verbose: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--transport': {
        const transport = args[++i]
        if (!transport) {
          console.error('--transport requires a value (stdio or http)')
          process.exit(1)
        }
        if (transport === 'stdio' || transport === 'http') {
          options.transport = transport
        } else {
          console.error(
            `Invalid transport: ${transport}. Use 'stdio' or 'http'.`
          )
          process.exit(1)
        }
        break
      }
      case '--port': {
        const portStr = args[++i]
        if (!portStr) {
          console.error('--port requires a value')
          process.exit(1)
        }
        const port = parseInt(portStr, 10)
        if (isNaN(port) || port < 1 || port > 65535) {
          console.error(
            `Invalid port: ${portStr}. Must be between 1 and 65535.`
          )
          process.exit(1)
        }
        options.port = port
        break
      }
      case '--host': {
        const host = args[++i]
        if (!host) {
          console.error('--host requires a value')
          process.exit(1)
        }
        options.host = host
        break
      }
      case '--verbose':
        options.verbose = true
        break
      case '--help':
        console.log(`
RANDSUM MCP Server

Usage: randsum-mcp [options]

Options:
  --transport <stdio|http>  Transport type (default: stdio)
  --port <number>          HTTP port (default: 3000)
  --host <string>          HTTP host (default: localhost)
  --verbose                Enable verbose logging
  --help                   Show this help message

Examples:
  randsum-mcp                           # Run with stdio transport
  randsum-mcp --transport http          # Run with HTTP transport on port 3000
  randsum-mcp --transport http --port 8080 --host 0.0.0.0  # Custom HTTP config
`)
        process.exit(0)
      // eslint-disable-next-line no-fallthrough
      default:
        console.error(
          `Unknown option: ${String(arg)}. Use --help for usage information.`
        )
        process.exit(1)
    }
  }

  return options
}
