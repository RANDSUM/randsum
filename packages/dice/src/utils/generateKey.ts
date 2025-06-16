/**
 * Generates a random key for internal use
 *
 * This function creates a random alphanumeric string used internally
 * for identifying dice pools and organizing roll results. The key
 * is generated using Math.random() and base-36 encoding.
 *
 * @returns A random alphanumeric string (13 characters)
 * @internal
 *
 * @example
 * generateKey() // "a1b2c3d4e5f6g"
 */
export function generateKey(): string {
  return Math.random().toString(36).substring(2, 15)
}
