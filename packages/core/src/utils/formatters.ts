/**
 * @file Formatting utilities for dice roll descriptions and notations
 * @module @randsum/core/utils/formatters
 */

import type { ComparisonOptions } from '../types'

/**
 * Collection of formatting utilities for dice rolls
 *
 * These utilities help format dice roll descriptions and notations
 * in a consistent and human-readable way.
 *
 * @namespace
 */
export const formatters = {
  /**
   * Formats an array of values into a human-readable list
   *
   * Converts an array of values into a string with proper formatting,
   * including brackets around each value and "and" before the last item.
   *
   * @param list - Array of values to format
   * @returns Formatted string representation of the list
   *
   * @example
   * // Format a list of numbers
   * formatters.humanList([1, 2, 3]); // "[1] [2] and [3]"
   *
   * @example
   * // Format a single value
   * formatters.humanList([5]); // "[5]"
   */
  humanList: (list: (string | number)[]): string => {
    return list
      .map((num, index, list) => {
        if (list.length === 1) return `[${String(num)}]`
        if (index === list.length - 1) return `and [${String(num)}]`
        return `[${String(num)}] `
      })
      .join('')
  },

  /**
   * Utilities for formatting greater than and less than comparisons
   *
   * @namespace
   */
  greaterLess: {
    /**
     * Converts comparison options to human-readable descriptions
     *
     * @param options - The comparison options to format
     * @param list - Optional existing list to append to
     * @returns Array of formatted description strings
     *
     * @example
     * // Format greater than comparison
     * formatters.greaterLess.descriptions({ greaterThan: 18 });
     * // ["greater than [18]"]
     *
     * @example
     * // Format both comparisons
     * formatters.greaterLess.descriptions({ greaterThan: 15, lessThan: 5 });
     * // ["greater than [15]", "less than [5]"]
     */
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

    /**
     * Converts comparison options to dice notation format
     *
     * @param options - The comparison options to format
     * @param list - Optional existing list to append to
     * @returns Array of formatted notation strings
     *
     * @example
     * // Format greater than comparison
     * formatters.greaterLess.notation({ greaterThan: 18 });
     * // [">18"]
     *
     * @example
     * // Format both comparisons
     * formatters.greaterLess.notation({ greaterThan: 15, lessThan: 5 });
     * // [">15", "<5"]
     */
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
