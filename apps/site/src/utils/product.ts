// The product a page belongs to. Each product wears the pip R die in its own
// colour; theme.css turns <html data-product> into that page's accent.
export type Product = 'roller' | 'games' | 'spec' | 'mcp' | 'discord' | 'plugin'

const PREFIXES: readonly (readonly [string, Product])[] = [
  ['/roller/', 'roller'],
  ['/games/', 'games'],
  ['/notation/', 'spec'],
  ['/spec', 'spec'],
  ['/tools/mcp', 'mcp'],
  ['/tools/discord-bot', 'discord'],
  ['/discord', 'discord'],
  ['/tools/claude-code-plugin', 'plugin']
]

export const PRODUCT_LABELS: Readonly<Record<Product, string>> = {
  roller: 'roller',
  games: 'games',
  spec: 'spec',
  mcp: 'mcp',
  discord: 'discord bot',
  plugin: 'plugin'
}

export function productForPath(pathname: string): Product | undefined {
  return PREFIXES.find(([prefix]) => pathname.startsWith(prefix))?.[1]
}
