import type { ComparisonOptions } from '../types'

export const formatters = {
  humanList: (list: (string | number)[]): string => {
    return list
      .map((num, index, list) => {
        if (list.length === 1) return `[${String(num)}]`
        if (index === list.length - 1) return `and [${String(num)}]`
        return `[${String(num)}] `
      })
      .join('')
  },

  greaterLess: {
    descriptions: (
      options: ComparisonOptions,
      list: string[] = []
    ): string[] => {
      if (options.greaterThan) {
        list.push(`greater than [${String(options.greaterThan)}]`)
      }
      if (options.lessThan) {
        list.push(`less than [${String(options.lessThan)}]`)
      }
      return list
    },

    notation: (options: ComparisonOptions, list: string[] = []): string[] => {
      if (options.greaterThan) {
        list.push(`>${String(options.greaterThan)}`)
      }
      if (options.lessThan) {
        list.push(`<${String(options.lessThan)}`)
      }
      return list
    }
  }
}
