import type { Product } from './product'

// Every way an AI agent can pick up RANDSUM. /tools/agents/ lists them in this
// order, so a new channel (another agent's plugin format, a hosted MCP
// endpoint, a skills registry) is one entry here plus its own doc page.
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
      'The fullest setup. Three skills teach Claude the notation, the odds and the spec format, and the hosted MCP server does the rolling.',
    install: {
      lang: 'bash',
      code: '/plugin marketplace add RANDSUM/randsum\n/plugin install randsum@randsum'
    },
    href: '/tools/claude-code-plugin/'
  },
  {
    id: 'mcp',
    product: 'mcp',
    name: 'MCP server',
    worksWith: 'Any MCP client',
    summary:
      'roll, validate and roll_game as tools. Hosted at api.randsum.dev/mcp for a Claude connector or any MCP client that takes a URL; also runs locally over stdio.',
    install: {
      lang: 'bash',
      code: 'claude mcp add --transport http randsum https://api.randsum.dev/mcp'
    },
    href: '/tools/mcp/'
  }
]
