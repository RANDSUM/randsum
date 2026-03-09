export interface GridPosition {
  readonly row: number
  readonly col: number
}

type NavigationDirection = 'up' | 'down' | 'left' | 'right'

export function navigateGrid(
  pos: GridPosition,
  direction: NavigationDirection,
  rowCount: number
): GridPosition {
  switch (direction) {
    case 'up':
      return { row: (pos.row - 1 + rowCount) % rowCount, col: pos.col }
    case 'down':
      return { row: (pos.row + 1) % rowCount, col: pos.col }
    case 'left':
    case 'right':
      return { row: pos.row, col: pos.col === 0 ? 1 : 0 }
  }
}
