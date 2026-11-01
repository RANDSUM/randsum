import { html } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { repeat } from 'lit/directives/repeat.js'
import type { Key } from '../../keys'
import type { RollerState } from '../../roller-state'

function pressed(notation: string, key: Key): 'true' | 'false' | undefined {
  if (key.action.kind !== 'modifier') return undefined
  return notation.includes(key.action.text) ? 'true' : 'false'
}

/** Dice and modifier keys. */
export function keyPad(
  roller: RollerState,
  keys: readonly Key[],
  label = 'Dice keys'
): TemplateResult {
  return html`<div class="rsui-keys" role="group" aria-label=${label}>
    ${repeat(
      keys,
      key => `${key.action.kind}-${key.label}`,
      key => html`<button
        type="button"
        class="rsui-key"
        data-kind=${key.action.kind}
        aria-pressed=${ifDefined(pressed(roller.notation, key))}
        title=${ifDefined(key.title)}
        @click=${() => {
          roller.press(key)
        }}
      >
        ${key.label}
      </button>`
    )}
  </div>`
}
