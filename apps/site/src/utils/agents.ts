import type { Product } from './product'

// Every way an AI agent can pick up RANDSUM. /tools/agents/ lists them in this
// order, so a new channel (another agent's plugin format, a hosted MCP
// endpoint, a skills registry) is one entry here plus its own doc page.
// Every agent surface wears the plugin colour except the HTTP API, which is its
// own product.
export interface AgentChannel {
  readonly id: string
  // The product whose die colour the channel wears
  readonly product: Product
  readonly name: string
  // The clients it plugs into, shown above the name
  readonly worksWith: string
  readonly summary: string
  readonly install: { readonly lang: string; readonly code: string }
  readonly href: string
}

export const AGENT_CHANNELS: readonly AgentChannel[] = [
  {
    id: 'claude-code-plugin',
    product: 'plugin',
    name: 'Claude Code plugin',
    worksWith: 'Claude Code',
    summary:
      'The fullest setup. Four skills teach Claude to roll, code with RANDSUM, work out odds and write specs, the hosted MCP server does the rolling, and /roll lets you throw your own dice.',
    install: {
      lang: 'bash',
      code: '/plugin marketplace add RANDSUM/randsum\n/plugin install randsum@randsum'
    },
    href: '/tools/claude-code-plugin/'
  },
  {
    id: 'claude-connector',
    product: 'plugin',
    name: 'Claude connector',
    worksWith: 'Claude.ai, Desktop, mobile and any MCP client',
    summary:
      'The hosted RANDSUM MCP server: roll, validate and roll_game as tools. Add it as a custom connector in Claude, or point any MCP client that takes a URL at it.',
    install: { lang: 'text', code: 'https://api.randsum.dev/mcp' },
    href: '/tools/mcp/#hosted-server-no-install'
  },
  {
    id: 'mcp-stdio',
    product: 'plugin',
    name: 'Local MCP server',
    worksWith: 'Any MCP client that starts a command',
    summary:
      'The same server run on your machine over stdio, for offline use or clients without URL support.',
    install: { lang: 'bash', code: 'claude mcp add randsum -- bunx -y @randsum/mcp' },
    href: '/tools/mcp/#local-stdio-server'
  },
  {
    id: 'api',
    product: 'api',
    name: 'HTTP API',
    worksWith: 'Any agent with a fetch tool or a shell',
    summary:
      'No MCP needed: the dice-rolling skill falls back to it, and any agent that can make a web request gets real rolls, game results and random integers as JSON.',
    install: {
      lang: 'bash',
      code: 'curl "https://api.randsum.dev/v1/roll?notation=4d6L"'
    },
    href: '/api/introduction/'
  }
]
