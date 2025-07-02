import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'
import { createServer } from '../server.js'
import { setupToolHandlers } from '../tools/index.js'
import { setupResourceHandlers } from '../resources/index.js'
import { log } from '../tools/log.js'
import type { ServerOptions } from '../cli.js'

export function startHttpServer(options: ServerOptions): void {
  const server = createServer()
  setupToolHandlers(server)
  setupResourceHandlers(server)

  const app = express()

  // To support multiple simultaneous connections we have a lookup object from
  // sessionId to transport
  const transports: Record<string, SSEServerTransport> = {}

  app.use(express.json())

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
    } else {
      next()
    }
  })

  // Endpoint for the client to use for sending messages
  const POST_ENDPOINT = '/message'

  app.post(POST_ENDPOINT, async (req, res) => {
    log('Message request received', options.verbose)

    // When client sends messages with SSEClientTransport,
    // the sessionId will be automatically set as query parameter
    const sessionId = req.query['sessionId']

    if (typeof sessionId !== 'string') {
      res.status(400).send({ message: 'Bad session id.' })
      return
    }

    const transport = transports[sessionId]
    if (!transport) {
      res.status(400).send({ message: 'No transport found for sessionId.' })
      return
    }

    // IMPORTANT: Pass req.body explicitly to avoid stream errors
    await transport.handlePostMessage(req, res, req.body)
  })

  // Initialization endpoint: create a new transport to connect and
  // send an endpoint event containing a URI for the client to use for sending messages
  app.get('/connect', async (_req, res) => {
    log('Connection request received', options.verbose)

    // Tell the client to send messages to the POST_ENDPOINT
    const transport = new SSEServerTransport(POST_ENDPOINT, res)
    log(
      `New transport created with session id: ${transport.sessionId}`,
      options.verbose
    )

    transports[transport.sessionId] = transport

    res.on('close', () => {
      log('SSE connection closed', options.verbose)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete transports[transport.sessionId]
    })

    await server.connect(transport)
    log('Server connected to transport', options.verbose)
  })

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'randsum-mcp-server',
      version: '0.1.0',
      timestamp: new Date().toISOString()
    })
  })

  app.get('/', (_req, res) => {
    res.json({
      name: 'RANDSUM MCP Server',
      version: '0.1.0',
      description:
        'Model Context Protocol server for RANDSUM dice rolling and game mechanics',
      endpoints: {
        health: '/health',
        connect: '/connect',
        message: '/message'
      },
      capabilities: {
        tools: ['roll', 'validate-notation', 'analyze-roll'],
        resources: ['dice-notation-docs']
      }
    })
  })

  const httpServer = app.listen(options.port, options.host, () => {
    log(
      `RANDSUM MCP Server running on http://${options.host}:${String(options.port)}`,
      true
    )
    log(
      `Health check: http://${options.host}:${String(options.port)}/health`,
      options.verbose
    )
    log(
      `Connect endpoint: http://${options.host}:${String(options.port)}/connect`,
      options.verbose
    )
    log(
      `Message endpoint: http://${options.host}:${String(options.port)}/message`,
      options.verbose
    )
  })

  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...', true)
    Object.keys(transports).forEach((sessionId) => {
      log(`Cleaning up transport for session: ${sessionId}`, options.verbose)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete transports[sessionId]
    })
    httpServer.close(() => {
      log('HTTP server closed', options.verbose)
      process.exit(0)
    })
  })

  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...', true)
    // Clean up all transports
    Object.keys(transports).forEach((sessionId) => {
      log(`Cleaning up transport for session: ${sessionId}`, options.verbose)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete transports[sessionId]
    })
    httpServer.close(() => {
      log('HTTP server closed', options.verbose)
      process.exit(0)
    })
  })
}
