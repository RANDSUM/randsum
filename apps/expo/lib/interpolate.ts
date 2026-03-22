const VARIABLE_PATTERN = /\{(\w+)\}/g

/**
 * Replace `{varName}` placeholders in a notation string with numeric values.
 * Throws if a variable in the notation has no corresponding value in the map.
 */
export function interpolateNotation(
  notation: string,
  variables: Readonly<Record<string, number>>
): string {
  return notation.replace(VARIABLE_PATTERN, (match, name: string) => {
    const value = variables[name]
    if (value === undefined) {
      throw new Error(`Missing value for variable "${name}"`)
    }
    return String(value)
  })
}
