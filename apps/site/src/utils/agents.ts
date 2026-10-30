import type { Product } from './product'

// Every way an AI agent can pick up RANDSUM. /tools/agents/ lists them in this
// order, so a new channel (another agent's plugin format, a skills registry) is
// one entry here plus its own doc page. The Claude connector and the MCP server
// are one endpoint, so the connector leads and other MCP clients get its
// `alsoFor` line rather than a card of their own; the local stdio server is a
// footnote on /tools/mcp/.
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
  // A second audience for the same install, shown under the snippet
  readonly alsoFor?: string
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
    worksWith: 'Claude.ai, Claude Desktop and mobile',
    summary:
      'Real dice in any Claude chat: roll, validate and roll_game as tools. In Settings → Connectors, add a custom connector named RANDSUM with this URL.',
    install: { lang: 'text', code: 'https://api.randsum.dev/mcp' },
    alsoFor: 'Any other MCP client (Cursor, VS Code, ChatGPT, Codex) takes the same URL.',
    href: '/tools/mcp/'
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
