import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { repeat } from 'lit/directives/repeat.js'
import type { Preset } from '../../presets'
import type { RollerState } from '../../roller-state'

export type PresetsLayout = 'chips' | 'list'

/** Named rolls as chips, or as a list that shows each description. */
export function presetList(
  roller: RollerState,
  presets: readonly Preset[],
  label = 'Presets',
  layout: PresetsLayout = 'chips'
): TemplateResult {
  return html`<div class="rsui-presets" data-layout=${layout} role="group" aria-label=${label}>
    ${repeat(
      presets,
      preset => `${preset.label}-${preset.notation}`,
      preset => html`<button
        type="button"
        class="rsui-preset"
        aria-pressed=${roller.notation === preset.notation ? 'true' : 'false'}
        title=${ifDefined(layout === 'chips' ? (preset.description ?? preset.notation) : undefined)}
        @click=${() => {
          roller.choose(preset)
        }}
      >
        ${
          layout === 'list'
            ? html`<code class="rsui-preset-notation">${preset.notation}</code>${
                preset.description === undefined
                  ? nothing
                  : html`<span class="rsui-preset-desc">${preset.description}</span>`
              }`
            : preset.label
        }
      </button>`
    )}
  </div>`
}
