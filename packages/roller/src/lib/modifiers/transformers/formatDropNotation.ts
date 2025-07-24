import type { DropOptions } from '../../../types'

export function formatDropNotation({
  highest,
  lowest,
  greaterThan,
  lessThan,
  exact
}: DropOptions): string | undefined {
  const parts: string[] = []

  if (highest) {
    parts.push(highest === 1 ? 'H' : `H${highest}`)
  }

  if (lowest) {
    parts.push(lowest === 1 ? 'L' : `L${lowest}`)
  }

  const dropList: string[] = []

  if (greaterThan !== undefined) {
    dropList.push(`>${greaterThan}`)
  }

  if (lessThan !== undefined) {
    dropList.push(`<${lessThan}`)
  }

  if (exact) {
    exact.forEach(roll => dropList.push(`${roll}`))
  }

  if (dropList.length > 0) {
    parts.push(`D{${dropList.join(',')}}`)
  }

  return parts.length ? parts.join('') : undefined
}
