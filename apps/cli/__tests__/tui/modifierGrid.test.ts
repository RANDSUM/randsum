import { describe, expect, test } from 'bun:test'
import { type GridPosition, navigateGrid } from '../../src/tui/helpers/modifierGrid'

describe('navigateGrid', () => {
  test('moves down within column', () => {
    const pos: GridPosition = { row: 0, col: 0 }
    const next = navigateGrid(pos, 'down', 9)
    expect(next).toEqual({ row: 1, col: 0 })
  })

  test('wraps from bottom to top', () => {
    const pos: GridPosition = { row: 8, col: 0 }
    const next = navigateGrid(pos, 'down', 9)
    expect(next).toEqual({ row: 0, col: 0 })
  })

  test('moves up within column', () => {
    const pos: GridPosition = { row: 2, col: 1 }
    const next = navigateGrid(pos, 'up', 9)
    expect(next).toEqual({ row: 1, col: 1 })
  })

  test('wraps from top to bottom', () => {
    const pos: GridPosition = { row: 0, col: 0 }
    const next = navigateGrid(pos, 'up', 9)
    expect(next).toEqual({ row: 8, col: 0 })
  })

  test('moves right to other column', () => {
    const pos: GridPosition = { row: 3, col: 0 }
    const next = navigateGrid(pos, 'right', 9)
    expect(next).toEqual({ row: 3, col: 1 })
  })

  test('moves left to other column', () => {
    const pos: GridPosition = { row: 3, col: 1 }
    const next = navigateGrid(pos, 'left', 9)
    expect(next).toEqual({ row: 3, col: 0 })
  })

  test('wraps right from col 1 to col 0', () => {
    const pos: GridPosition = { row: 3, col: 1 }
    const next = navigateGrid(pos, 'right', 9)
    expect(next).toEqual({ row: 3, col: 0 })
  })

  test('wraps left from col 0 to col 1', () => {
    const pos: GridPosition = { row: 3, col: 0 }
    const next = navigateGrid(pos, 'left', 9)
    expect(next).toEqual({ row: 3, col: 1 })
  })
})
