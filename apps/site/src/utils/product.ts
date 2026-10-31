// The product a page belongs to. Each product wears the pip R die in its own
// colour; theme.css turns <html data-product> into that page's accent.
export type Product = 'roller' | 'games' | 'spec' | 'api' | 'discord' | 'plugin' | 'app'

const PREFIXES: readonly (readonly [string, Product])[] = [
  ['/roller/', 'roller'],
  ['/games/', 'games'],
  ['/notation/', 'spec'],
  ['/spec', 'spec'],
  ['/api/', 'api'],
  ['/tools/discord-bot', 'discord'],
  // The plugin product is every agent surface: skills, the MCP server, the connector
  ['/tools/agents', 'plugin'],
  ['/tools/mcp', 'plugin'],
  ['/tools/claude-code-plugin', 'plugin'],
  ['/app/', 'app']
]

export const PRODUCT_LABELS: Readonly<Record<Product, string>> = {
  roller: 'roller',
  games: 'games',
  spec: 'spec',
  api: 'api',
  discord: 'discord bot',
  plugin: 'plugin',
  app: 'app'
}

export function productForPath(pathname: string): Product | undefined {
  return PREFIXES.find(([prefix]) => pathname.startsWith(prefix))?.[1]
}

// Where the installable Roller lives. randsum.dev/app/ is its product page.
export const APP_URL = 'https://app.randsum.dev/'

// The bot's install link, shared by every page that offers it
export const DISCORD_INSTALL_URL =
  'https://discord.com/oauth2/authorize?client_id=1290434147159904276&permissions=274877906944&scope=bot%20applications.commands'

interface ProductAction {
  readonly label: string
  readonly href: string
}

interface ProductFact {
  readonly value: string
  readonly label: string
}

export interface ProductInfo {
  readonly id: Product
  // One line in the landing stack and the hero
  readonly tagline: string
  readonly summary: string
  readonly href: string
  readonly snippet: { readonly lang: string; readonly code: string }
  readonly facts: readonly ProductFact[]
  // The hero's buttons: the first is the main one
  readonly actions: readonly [ProductAction, ...ProductAction[]]
}

// Every product, in the order the landing page stacks them
export const PRODUCTS: readonly ProductInfo[] = [
  {
    id: 'roller',
    tagline: 'Write the roll, get every step back',
    summary:
      'The dice engine. Parses any notation, rolls it, and tells you what each modifier changed and why the total is what it is.',
    href: '/roller/introduction/',
    snippet: {
      lang: 'ts',
      code: "import { roll } from '@randsum/roller'\n\nconst { total, rolls } = roll('4d6L')\nrolls[0].description // ['Roll 4 6-sided dice', 'Drop lowest']"
    },
    facts: [
      { value: '0', label: 'runtime dependencies' },
      { value: '26', label: 'modifiers in the spec' },
      { value: 'ESM', label: 'with full type declarations' }
    ],
    actions: [
      { label: 'Get started', href: '/roller/getting-started/' },
      { label: 'npm', href: 'https://www.npmjs.com/package/@randsum/roller' }
    ]
  },
  {
    id: 'games',
    tagline: 'Seven tabletop games, ready to roll',
    summary:
      'Typed rolls for D&D 5e, Blades in the Dark, Daggerheart, Fate and more, generated from open .randsum.json specs.',
    href: '/games/introduction/',
    snippet: {
      lang: 'ts',
      code: "import { roll } from '@randsum/games/fifth'\n\nconst { result } = roll({ modifier: 5, rollingWith: 'Advantage' })"
    },
    facts: [
      { value: '7', label: 'game systems' },
      { value: '1', label: 'package, one subpath each' },
      { value: 'JSON', label: 'specs you can write yourself' }
    ],
    actions: [
      { label: 'Get started', href: '/games/getting-started/' },
      { label: 'Add your own game', href: '/games/schema/contributing-a-game/' }
    ]
  },
  {
    id: 'spec',
    tagline: 'An open standard for dice notation',
    summary:
      'RANDSUM Dice Notation: one grammar, a fixed modifier order, and conformance levels any roller can implement.',
    href: '/spec/',
    snippet: {
      lang: 'text',
      code: '4d6R{1}L+2\n\nroll 4d6 → reroll 1s → drop lowest → add 2'
    },
    facts: [
      { value: '26', label: 'modifiers' },
      { value: '4', label: 'conformance levels' },
      { value: '3', label: 'pipeline stages' }
    ],
    actions: [
      { label: 'Read the spec', href: '/spec/' },
      { label: 'Getting started', href: '/notation/getting-started/' }
    ]
  },
  {
    id: 'api',
    tagline: 'Dice over HTTP, no key needed',
    summary:
      'A public REST API at api.randsum.dev: roll notation in short or long form, roll for any supported game, or draw random integers. JSON in, JSON out, from any language.',
    href: '/api/introduction/',
    snippet: {
      lang: 'bash',
      code: 'curl "https://api.randsum.dev/v1/roll?notation=4d6L"\ncurl "https://api.randsum.dev/v1/games/blades/roll?rating=3"'
    },
    facts: [
      { value: '5', label: 'endpoints under /v1' },
      { value: '0', label: 'keys or sign-ups' },
      { value: 'CORS', label: 'callable from a browser' }
    ],
    actions: [
      { label: 'Get started', href: '/api/introduction/#quick-start' },
      { label: 'Endpoint reference', href: '/api/reference/' }
    ]
  },
  {
    id: 'discord',
    tagline: 'Roll from any Discord server',
    summary:
      'Slash commands for any notation and every supported game, with each step of the roll shown in the reply.',
    href: '/tools/discord-bot/',
    snippet: { lang: 'text', code: '/roll notation:4d6L+2\n/blades dice:3' },
    facts: [
      { value: '0', label: 'setup after adding it' },
      { value: '6', label: 'games with their own command' }
    ],
    actions: [
      { label: 'Add to Discord', href: DISCORD_INSTALL_URL },
      { label: 'All commands', href: '/tools/discord-bot/#commands' }
    ]
  },
  {
    id: 'plugin',
    tagline: 'Real dice for Claude and other agents',
    summary:
      'Everything an AI agent needs to roll for real: skills for notation, odds and game specs, and the RANDSUM MCP server, as a Claude Code plugin or a Claude connector.',
    href: '/tools/claude-code-plugin/',
    snippet: {
      lang: 'bash',
      code: '/plugin marketplace add RANDSUM/randsum\n/plugin install randsum@randsum'
    },
    facts: [
      { value: '4', label: 'skills' },
      { value: '3', label: 'MCP tools' },
      { value: '1', label: 'connector URL for Claude' }
    ],
    actions: [
      { label: 'Set it up', href: '/tools/claude-code-plugin/#setup' },
      { label: 'Every agent option', href: '/tools/agents/' }
    ]
  },
  {
    id: 'app',
    tagline: 'A dice roller for your home screen',
    summary:
      'Any notation, every step shown, and your last rolls kept. Install it on your phone and it rolls offline, no account and no network.',
    href: '/app/',
    snippet: {
      lang: 'text',
      code: '4d6L    → 14   [6, 5, 3] dropped 1\n1d20+5  → 17\n2d8!    → 11   exploded on 8'
    },
    facts: [
      { value: '1', label: 'tap to roll' },
      { value: '0', label: 'network needed once installed' }
    ],
    actions: [
      { label: 'Open the app', href: APP_URL },
      { label: 'Notation guide', href: '/notation/getting-started/' }
    ]
  }
]

export function productInfo(id: Product): ProductInfo {
  const info = PRODUCTS.find(product => product.id === id)
  if (info === undefined) throw new Error(`Unknown product: ${id}`)
  return info
}

// Each product's front page, which opens with its ProductHero instead of a plain title
const HERO_PAGES: Readonly<Record<string, Product>> = {
  '/roller/introduction/': 'roller',
  '/games/introduction/': 'games',
  '/notation/introduction/': 'spec',
  '/api/introduction/': 'api',
  '/tools/discord-bot/': 'discord',
  '/tools/claude-code-plugin/': 'plugin',
  '/app/': 'app'
}

export function heroProductForPath(pathname: string): Product | undefined {
  return HERO_PAGES[pathname.endsWith('/') ? pathname : `${pathname}/`]
}
