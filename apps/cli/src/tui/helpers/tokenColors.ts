import type { TokenCategory } from '@randsum/roller/tokenize'

const TOKEN_COLOR_MAP: Partial<Record<TokenCategory, string>> = {
  Core: 'blue', // #60a5fa
  Pool: 'magenta', // #c792ea
  Explode: 'yellow', // #e5c07b
  Arithmetic: 'green', // #98c379
  Counting: 'blue', // #82aaff
  Order: 'cyan', // #89ddff
  Special: 'yellow', // #ffab70
  unknown: 'red' // #f97583
}

export function getTokenColor(category: string): string | undefined {
  return TOKEN_COLOR_MAP[category as TokenCategory]
}
