import { createServer } from 'http'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const sseTransports: Record<string, SSEServerTransport> = {}

export function runSseTransport(server: McpServer, port: number): void {
  const httpServer = createServer()

  httpServer.on('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url?.startsWith('/sse')) {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const sessionId = url.searchParams.get('sessionId')

      if (!sessionId) {
        res.writeHead(400)
        res.end('Missing sessionId parameter')
        return
      }

      const transport = new SSEServerTransport('/sse', res)
      sseTransports[sessionId] = transport

      server.connect(transport).catch((error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Transport connection error'
        console.error('SSE transport error:', errorMessage)
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sseTransports[sessionId]
      })

      req.on('close', () => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sseTransports[sessionId]
      })
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  httpServer.listen(port, () => {
    console.error(`RANDSUM MCP server (SSE) running on http://localhost:${port}`)
  })
}
