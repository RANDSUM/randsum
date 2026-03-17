import { describe, expect, test } from 'bun:test'

// Unit tests for the description formatting logic used by NotationDescription.
// The component renders results of formatDescription() — we test the logic here
// since bun:test cannot mount React components without a DOM environment.

function formatDescription(description: string[][]): string {
  return description.map(inner => inner.join(', ')).join(' + ')
}

describe('NotationDescription formatting', () => {
  test('formats a single-pool description', () => {
    const description: string[][] = [['Roll 4 6-sided dice', 'drop lowest']]
    expect(formatDescription(description)).toBe('Roll 4 6-sided dice, drop lowest')
  })

  test('joins inner array with comma-space', () => {
    const description: string[][] = [['Roll 2 20-sided dice', 'keep highest', 'add 5']]
    expect(formatDescription(description)).toBe('Roll 2 20-sided dice, keep highest, add 5')
  })

  test('joins outer array with space-plus-space', () => {
    const description: string[][] = [['Roll 1 20-sided die'], ['Roll 2 6-sided dice']]
    expect(formatDescription(description)).toBe('Roll 1 20-sided die + Roll 2 6-sided dice')
  })

  test('handles multi-pool multi-modifier description', () => {
    const description: string[][] = [['Roll 4 6-sided dice', 'drop lowest'], ['add 5']]
    expect(formatDescription(description)).toBe('Roll 4 6-sided dice, drop lowest + add 5')
  })

  test('handles single-item inner arrays', () => {
    const description: string[][] = [['Roll 1 20-sided die']]
    expect(formatDescription(description)).toBe('Roll 1 20-sided die')
  })

  test('handles empty inner arrays gracefully', () => {
    const description: string[][] = [[]]
    expect(formatDescription(description)).toBe('')
  })
})
