import type { KeepOptions } from '../../../types'
import { type NotationSchema, defineNotationSchema } from '../schema'

const keepHighestPattern = /[Kk](?![Ll])(\d+)?/
const keepLowestPattern = /[Kk][Ll](\d+)?/i

export const keepSchema: NotationSchema<KeepOptions> = defineNotationSchema<KeepOptions>({
  name: 'keep',
  priority: 21,

  pattern: /[Kk]([Ll])?(\d+)?/,

  parse: notation => {
    const keep: KeepOptions = {}

    const lowestMatch = keepLowestPattern.exec(notation)
    if (lowestMatch) {
      keep.lowest = lowestMatch[1] ? Number(lowestMatch[1]) : 1
      return { keep }
    }

    const highestMatch = keepHighestPattern.exec(notation)
    if (highestMatch) {
      keep.highest = highestMatch[1] ? Number(highestMatch[1]) : 1
      return { keep }
    }

    return {}
  },

  toNotation: options => {
    const { highest, lowest } = options
    const parts: string[] = []

    if (highest) {
      parts.push(highest === 1 ? 'K' : `K${highest}`)
    }

    if (lowest) {
      parts.push(lowest === 1 ? 'kl' : `kl${lowest}`)
    }

    return parts.length ? parts.join('') : undefined
  },

  toDescription: options => {
    const { highest, lowest } = options
    const descriptions: string[] = []

    if (highest) {
      descriptions.push(highest > 1 ? `Keep highest ${highest}` : 'Keep highest')
    }

    if (lowest) {
      descriptions.push(lowest > 1 ? `Keep lowest ${lowest}` : 'Keep lowest')
    }

    return descriptions
  }
})
