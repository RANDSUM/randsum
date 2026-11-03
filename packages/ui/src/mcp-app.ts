// <randsum-mcp-app>: a RANDSUM roll inside an MCP Apps host, such as Claude.
//
// The RANDSUM MCP server (@randsum/mcp, and the connector at
// api.randsum.dev/mcp) serves dist/mcp-app.html as the ui:// resource of its
// `roll` and `roll_game` tools. The page holds this one element, which speaks
// the MCP Apps protocol to the host frame, shows the server's roll in the
// roller's readout, and rolls again by asking the host to call the same tool.
// Dice always come from the server; the page never rolls on its own.
import { css, html, LitElement, nothing } from 'lit'
import type { CSSResultGroup, PropertyDeclarations, TemplateResult } from 'lit'
import type { RollRecord } from '@randsum/roller'
import type { NotationCheck, RollResult } from './check'
import { define, freshShadowRoot } from './internal/element'
import { applyHostContext, McpHost } from './internal/mcp-host'
import type { ToolResult } from './internal/mcp-host'
import { readout } from './internal/parts/readout'
import { sheet } from './internal/styles'

export type { RollResult } from './check'

/** Where the server puts each roll's records, for this view only. */
export const RECORDS_META_KEY = 'randsum/records'

const GAME_TITLES: Readonly<Record<string, string>> = {
  blades: 'Blades in the Dark',
  daggerheart: 'Daggerheart',
  fate: 'Fate',
  fifth: 'D&D 5e',
  pbta: 'Powered by the Apocalypse',
  'root-rpg': 'Root',
  salvageunion: 'Salvage Union'
}

type Fields = Readonly<Record<string, unknown>>

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRecordList(value: unknown): value is readonly RollRecord[] {
  return (
    Array.isArray(value) &&
    value.every(item => isFields(item) && Array.isArray(item['initialRolls']))
  )
}

function text(result: ToolResult): string {
  const block = result.content?.find(item => isFields(item) && item['type'] === 'text')
  return isFields(block) && typeof block['text'] === 'string' ? block['text'] : 'The roll failed.'
}

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

/** A game's outcome in words: "failure", a table row's label, or none for a bare number. */
function outcome(value: unknown): string | undefined {
  if (typeof value === 'string') return capitalize(value)
  if (isFields(value) && typeof value['label'] === 'string') return value['label']
  return undefined
}

/** The server's tool result as the readout's RollResult, or null when it is not a roll. */
export function toRollResult(result: ToolResult): RollResult | null {
  const data = result.structuredContent
  const records = result._meta?.[RECORDS_META_KEY]
  if (data === undefined || typeof data['total'] !== 'number') return null
  const shown = isRecordList(records) ? records : []
  if (typeof data['game'] === 'string') {
    const title = GAME_TITLES[data['game']] ?? data['game']
    const said = outcome(data['result'])
    return {
      total: data['total'],
      records: shown,
      notation: shown.map(record => record.notation).join(' + ') || title,
      description: said === undefined ? title : `${title}: ${said}`
    }
  }
  return {
    total: data['total'],
    records: shown,
    notation: typeof data['notation'] === 'string' ? data['notation'] : '',
    description: typeof data['description'] === 'string' ? data['description'] : ''
  }
}

type ViewState =
  | { readonly kind: 'waiting'; readonly notation: string }
  | { readonly kind: 'rolled'; readonly result: RollResult }
  | { readonly kind: 'failed'; readonly message: string }

/**
 * Claude's host tokens, where the host sends them, for every structural
 * colour, the font and the radii; the Roller accent stays RANDSUM's. A host
 * that sends none leaves each --rsui-* token unset, so its default applies.
 * The surface is the conversation itself: the card paints no panel of its own.
 */
const hostTokens = css`
  :host {
    display: block;
    --rsui-bg: var(--color-background-primary);
    --rsui-surface: transparent;
    --rsui-raised: var(--color-background-primary);
    --rsui-subtle: var(--color-background-secondary);
    --rsui-border: var(--color-border-tertiary);
    --rsui-border-strong: var(--color-border-primary);
    --rsui-ink: var(--color-text-primary);
    --rsui-muted: var(--color-text-secondary);
    --rsui-faint: var(--color-text-tertiary);
    --rsui-valid: var(--color-text-success);
    --rsui-invalid: var(--color-text-danger);
    --rsui-exploded: var(--color-text-success);
    --rsui-disabled-bg: var(--color-background-disabled);
    --rsui-disabled-ink: var(--color-text-disabled);
    --rsui-tip-bg: var(--color-background-inverse);
    --rsui-tip-ink: var(--color-text-inverse);
    --rsui-font: var(--font-sans);
    --rsui-font-mono: var(--font-mono);
    --rsui-radius-sm: var(--border-radius-sm);
    --rsui-radius-md: var(--border-radius-md);
    --rsui-radius-lg: var(--border-radius-lg);
    --rsui-radius-xl: var(--border-radius-xl);
  }
`

export class RandsumMcpApp extends LitElement {
  static override styles: CSSResultGroup = [sheet, hostTokens]
  static override properties: PropertyDeclarations = {
    _view: { state: true },
    _busy: { state: true }
  }

  declare _view: ViewState
  declare _busy: boolean

  #host: McpHost | undefined
  readonly #tool: { name: string; args: Fields } = { name: 'roll', args: {} }

  constructor() {
    super()
    this._view = { kind: 'waiting', notation: '' }
    this._busy = false
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    freshShadowRoot(this)
    return super.createRenderRoot()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.#host !== undefined || window.parent === window) return
    this.#host = new McpHost(window.parent, {
      context: context => {
        applyHostContext(context)
        const name = context.toolInfo?.tool?.name
        if (name !== undefined) this.#tool.name = name
      },
      input: args => {
        this.#tool.args = args
        const notation = typeof args['notation'] === 'string' ? args['notation'] : ''
        if (this._view.kind === 'waiting') this._view = { kind: 'waiting', notation }
      },
      result: result => {
        this.show(result)
      },
      cancelled: () => {
        if (this._view.kind === 'waiting') this._view = { kind: 'failed', message: 'Cancelled.' }
      }
    })
    void this.#host.connect()
  }

  /** Shows a tool result: the roll, or why there is none. */
  show(result: ToolResult): void {
    const rolled = result.isError === true ? null : toRollResult(result)
    if (isFields(result.structuredContent) && typeof result.structuredContent['game'] === 'string')
      this.#tool.name = 'roll_game'
    this._view =
      rolled === null
        ? { kind: 'failed', message: text(result) }
        : { kind: 'rolled', result: rolled }
  }

  async #again(): Promise<void> {
    const host = this.#host
    if (host === undefined || this._busy) return
    this._busy = true
    try {
      const result = await host.callTool(this.#tool.name, this.#tool.args)
      this.show(result)
      if (this._view.kind === 'rolled') {
        const { notation, total, description } = this._view.result
        await host.updateModelContext(
          `The user rolled again from the RANDSUM card: ${notation} came to ${total} (${description}). This roll replaces the one above.`
        )
      }
    } catch (error) {
      this._view = {
        kind: 'failed',
        message: error instanceof Error ? error.message : String(error)
      }
    } finally {
      this._busy = false
    }
  }

  protected override render(): TemplateResult {
    return html`<div class="rsui rsui-part">${this.#body()}</div>`
  }

  #body(): TemplateResult {
    const view = this._view
    if (view.kind === 'waiting') {
      return html`<section class="rsui-readout" data-empty="" aria-label="Result" aria-busy="true">
        <p class="rsui-readout-title">Rolling${view.notation === '' ? '' : ` ${view.notation}`}…</p>
      </section>`
    }
    if (view.kind === 'failed') {
      return html`<section class="rsui-readout" data-empty="" aria-label="Result">
        <p class="rsui-readout-title">No roll</p>
        <p class="rsui-readout-hint">${view.message}</p>
      </section>`
    }
    const check: NotationCheck = { kind: 'valid', description: view.result.description }
    const actions =
      this.#host === undefined
        ? nothing
        : html`<span class="rsui-card-actions">
            <button
              type="button"
              class="rsui-quiet-button"
              ?disabled=${this._busy}
              @click=${() => void this.#again()}
            >
              Roll again
            </button>
          </span>`
    return readout({ result: view.result, check, notation: view.result.notation }, actions)
  }
}

define('randsum-mcp-app', RandsumMcpApp)

declare global {
  interface HTMLElementTagNameMap {
    'randsum-mcp-app': RandsumMcpApp
  }
}
