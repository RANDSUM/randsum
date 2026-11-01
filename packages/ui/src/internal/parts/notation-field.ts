import { NOTATION_DOCS } from '@randsum/roller/docs'
import { html, nothing } from 'lit'
import type { TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { live } from 'lit/directives/live.js'
import { repeat } from 'lit/directives/repeat.js'
import { styleMap } from 'lit/directives/style-map.js'
import type { Token } from '@randsum/roller/tokenize'
import type { RollerState } from '../../roller-state'

const MARKS = { empty: '', valid: '✓', invalid: '✕' } as const
const MARK_LABELS = { empty: 'Empty', valid: 'Valid', invalid: 'Invalid' } as const

export interface NotationFieldOptions {
  /** The id of the line that explains the notation, read out with the field. */
  readonly statusId?: string | undefined
  readonly placeholder?: string | undefined
}

// The overlay keeps white-space: pre so it lines up with the input, so its
// template has no whitespace between the tokens: Lit would render it.
function overlay(tokens: readonly Token[]): TemplateResult {
  return html`<div class="rsui-overlay" aria-hidden="true">${repeat(
    tokens,
    token => token.start,
    token => {
      const doc = NOTATION_DOCS[token.key]
      const classes = classMap({
        'rsui-tok': true,
        'rsui-tok--doc': doc !== undefined,
        'rsui-tok--bad': token.category === 'unknown'
      })
      const style = styleMap(
        doc === undefined ? {} : { '--_tok-dark': doc.color, '--_tok-light': doc.colorLight }
      )
      return html`<span class=${classes} style=${style}>${token.text}</span>`
    }
  )}</div>`
}

/** The input, with each notation token in its modifier's colour behind it. */
export function notationField(
  roller: RollerState,
  { statusId, placeholder = '4d6L' }: NotationFieldOptions = {}
): TemplateResult {
  const { notation, tokens, check } = roller
  return html`<div class="rsui-field" data-state=${check.kind}>
    <div class="rsui-field-stack">
      ${tokens.length > 0 ? overlay(tokens) : nothing}
      <input
        class="rsui-input"
        type="text"
        .value=${live(notation)}
        placeholder=${placeholder}
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        aria-label="Dice notation"
        aria-invalid=${check.kind === 'invalid' ? 'true' : 'false'}
        aria-describedby=${ifDefined(statusId)}
        @input=${(event: Event) => {
          if (event.target instanceof HTMLInputElement) roller.edit(event.target.value)
        }}
        @keydown=${(event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            roller.roll()
          }
        }}
      />
    </div>
    ${
      check.kind === 'empty'
        ? nothing
        : html`<span class="rsui-mark" role="img" aria-label=${MARK_LABELS[check.kind]}
          >${MARKS[check.kind]}</span
        >`
    }
  </div>`
}
