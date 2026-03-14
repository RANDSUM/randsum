import type { Token } from '@randsum/notation/tokenize'

export const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'blue', // #60a5fa
  dropLowest: 'magenta', // #f060d0
  dropHighest: 'magenta', // #b858b0
  keepHighest: 'yellow', // #ffab70
  keepLowest: 'yellow', // #d4845a
  explode: 'yellow', // #e5c07b
  compound: 'yellow', // #e08040
  penetrate: 'green', // #b8d858
  reroll: 'magenta', // #c792ea
  cap: 'cyan', // #89ddff
  replace: 'green', // #c3e88d
  unique: 'cyan', // #80cbc4
  countSuccesses: 'blue', // #82aaff
  dropCondition: 'magenta', // #d860c0
  plus: 'green', // #98c379
  minus: 'green', // #6b9e52
  multiply: 'yellow', // #ffcb6b
  multiplyTotal: 'yellow', // #e8a93a
  unknown: 'red' // #f97583
}
