import type { Die } from './types'

export function D(sides: number): Die {
  return () => Math.floor(Math.random() * sides)
}
