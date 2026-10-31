// Shared helpers for the components. Not a public entry.

export const cx = (...names: readonly (string | false | undefined)[]): string =>
  names.filter(Boolean).join(' ')

/** Dice and steps have no identity but their order, so each gets an id from it. */
export function withIds<T>(
  items: readonly T[],
  prefix: string
): readonly { readonly id: string; readonly item: T }[] {
  return items.map((item, n) => ({ id: `${prefix}${n}`, item }))
}
