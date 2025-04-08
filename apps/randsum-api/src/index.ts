import { handleHealthRequest } from './routes/health'
import { handleRollRequest } from './routes/roll'
import { handleRootRequest } from './routes/root'

let PORT = 3000
if (process.env['PORT']) {
  PORT = parseInt(process.env['PORT'], 10)
}

Bun.serve({
  port: PORT,
  routes: {
    '/': handleRootRequest,
    '/roll': handleRollRequest,
    '/health': handleHealthRequest
  }
})

console.log('🎲 RANDSUM API server running at http://localhost:' + String(PORT))
