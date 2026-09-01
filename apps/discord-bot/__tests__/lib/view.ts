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
