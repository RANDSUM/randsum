// What every Vue wrapper shares. Not a public entry.
import { h } from 'vue'
import type { VNode } from 'vue'

/**
 * Renders a custom element with every defined value set as a DOM property
 * (Vue's `.name` prefix), so arrays and booleans reach Lit unchanged.
 */
export function renderElement(
  tag: string,
  properties: Readonly<Record<string, unknown>>,
  extra: Readonly<Record<string, unknown>> = {},
  children: readonly VNode[] = []
): VNode {
  const props: Record<string, unknown> = { ...extra }
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) props[`.${key}`] = value
  }
  return h(tag, props, [...children])
}
