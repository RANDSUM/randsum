#!/usr/bin/env node

import { parseArgs } from './cli.js'
import { startStdioServer } from './transports/stdio.js'
import { startHttpServer } from './transports/http.js'

async function main(): Promise<void> {
  try {
    const options = parseArgs()

    if (options.transport === 'stdio') {
      await startStdioServer(options)
    } else {
      startHttpServer(options)
    }
  } catch (error: unknown) {
    console.error('Server error:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${String(process.argv[1])}`) {
  void main()
}
