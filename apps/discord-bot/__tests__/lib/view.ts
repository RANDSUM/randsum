/**
 * Test helpers for reading a Components V2 view.
 *
 * Under embeds a test could say `expect(embed.data.title).toBe('Miss')`. A
 * container has no title — it has a tree of text components — so the literal
 * translation of that assertion is
 *
 *   expect(view[0]!.toJSON().components[0]!.content).toBe('## Miss')
 *
 * which is unreadable, and brittle for the wrong reason: it breaks when a
 * separator moves, not when the text changes. These helpers flatten the tree so
 * assertions stay about content.
 */
import { ComponentType } from '../../src/utils/builders.js'
import type { APIContainerComponent } from '../../src/utils/builders.js'
import type { RollView } from '../../src/types.js'

type ContainerChild = APIContainerComponent['components'][number]

function collectText(components: readonly ContainerChild[]): string[] {
  return components.flatMap(component => {
    if (component.type === ComponentType.TextDisplay) return [component.content]
    if (component.type === ComponentType.Section) return collectText(component.components)
    return []
  })
}

/** Every text line in the view, in render order. */
export function linesOf(view: RollView): string[] {
  return view.flatMap(container => collectText(container.toJSON().components))
}

/** The whole view as one string — what most assertions want. */
export function textOf(view: RollView): string {
  return linesOf(view).join('\n')
}

/** Each container's accent colour, in order. */
export function accentsOf(view: RollView): (number | null | undefined)[] {
  return view.map(container => container.toJSON().accent_color)
}

/** Every button `custom_id` in the view — empty when no button was attached. */
export function buttonIdsOf(view: RollView): string[] {
  return view.flatMap(container =>
    container.toJSON().components.flatMap(component => {
      if (component.type !== ComponentType.Section) return []
      const accessory = component.accessory
      return accessory.type === ComponentType.Button && 'custom_id' in accessory
        ? [accessory.custom_id ?? '']
        : []
    })
  )
}

/**
 * Every node carrying a `type` — what Discord counts against the 40-component
 * cap on a message.
 */
export function componentCountOf(view: RollView): number {
  const count = (node: unknown): number => {
    if (node === null || typeof node !== 'object') return 0
    const own = 'type' in node ? 1 : 0
    return (
      own +
      Object.values(node).reduce<number>(
        (total, value) =>
          total +
          (Array.isArray(value) ? value.reduce<number>((a, v) => a + count(v), 0) : count(value)),
        0
      )
    )
  }

  return view.reduce((total, container) => total + count(container.toJSON()), 0)
}

/** Total characters across every Text Display — the ~4000 message budget. */
export function characterCountOf(view: RollView): number {
  return linesOf(view).reduce((total, line) => total + line.length, 0)
}
